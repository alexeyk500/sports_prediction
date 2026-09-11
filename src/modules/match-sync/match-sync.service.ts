import type {
  Fixture,
  FixtureStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import type { Clock } from "../../lib/time/clock.ts";
import type { MatchProvider, MatchProviderMatch } from "./match-provider.ts";
import type { MatchSyncLogger } from "./match-sync-logger.ts";
import {
  getCurrentUtcDaySyncWindow,
  isWithinHalfOpenInterval,
} from "./match-sync-time.ts";
import {
  getFixturePollingDecision,
  MATCH_POLLING_DEFAULT_BATCH_SIZE,
} from "./match-polling.ts";
import type { MatchOutboxEventType } from "./match-events.ts";

type MatchSyncPrisma = PrismaClient | Prisma.TransactionClient;

export interface MatchSyncServiceDependencies {
  prisma: PrismaClient;
  provider: MatchProvider;
  clock: Clock;
  logger: MatchSyncLogger;
  pollingBatchSize?: number;
}

export interface MatchSyncCycleResult {
  discovered: number;
  duePolled: number;
}

interface ConfiguredCompetition {
  id: string;
  providerCompetitionId: string;
  code: string;
}

export async function runMatchSyncCycle(
  dependencies: MatchSyncServiceDependencies,
): Promise<MatchSyncCycleResult> {
  const now = dependencies.clock.now();
  const window = getCurrentUtcDaySyncWindow(dependencies.clock);
  const competitions = await getConfiguredCompetitions(dependencies.prisma);

  dependencies.logger.info("match discovery cycle started", {
    utcDateKey: window.utcDateKey,
    providerDateFrom: window.providerDateFrom,
    providerDateTo: window.providerDateTo,
    configuredCompetitions: competitions.length,
  });

  const competitionByProviderId = new Map(
    competitions.map((competition) => [
      competition.providerCompetitionId,
      competition,
    ]),
  );
  const competitionByCode = new Map(
    competitions.map((competition) => [competition.code, competition]),
  );
  const discoveredMatches = (
    await dependencies.provider.listMatchesForWindow({
      fromUtc: window.startUtc,
      toUtc: window.endUtc,
    })
  ).filter(
    (match) =>
      isWithinHalfOpenInterval(
        match.kickoffAt,
        window.startUtc,
        window.endUtc,
      ) &&
      resolveCompetition(match, competitionByProviderId, competitionByCode),
  );

  for (const match of discoveredMatches) {
    const competition = resolveCompetition(
      match,
      competitionByProviderId,
      competitionByCode,
    );

    if (!competition) {
      continue;
    }

    await applyProviderMatch(dependencies, match, competition, now);
  }

  const dueFixtures = await getDueFixtures(
    dependencies,
    window.startUtc,
    window.endUtc,
  );
  const providerMatchIds = dueFixtures.map(
    (fixture) => fixture.providerFixtureId,
  );
  const matchesByProviderId = new Map<string, MatchProviderMatch>();

  for (const chunk of chunkArray(
    providerMatchIds,
    dependencies.pollingBatchSize ?? MATCH_POLLING_DEFAULT_BATCH_SIZE,
  )) {
    let matches: MatchProviderMatch[];

    try {
      matches = await dependencies.provider.getMatchesByIds(chunk);
    } catch (error) {
      dependencies.logger.error("due fixture provider batch failed", {
        providerFixtureIds: chunk,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    for (const match of matches) {
      matchesByProviderId.set(match.providerMatchId, match);
    }
  }

  for (const fixture of dueFixtures) {
    const match = matchesByProviderId.get(fixture.providerFixtureId);

    if (!match) {
      dependencies.logger.warn("provider did not return due fixture", {
        fixtureId: fixture.id,
        providerFixtureId: fixture.providerFixtureId,
      });
      continue;
    }

    const competition = resolveCompetition(
      match,
      competitionByProviderId,
      competitionByCode,
    );

    if (!competition) {
      dependencies.logger.warn("provider returned unconfigured competition", {
        providerFixtureId: match.providerMatchId,
        providerCompetitionId: match.providerCompetitionId,
        providerCompetitionCode: match.providerCompetitionCode,
      });
      continue;
    }

    await applyProviderMatch(dependencies, match, competition, now);
  }

  dependencies.logger.info("match discovery cycle completed", {
    utcDateKey: window.utcDateKey,
    discovered: discoveredMatches.length,
    duePolled: dueFixtures.length,
  });

  return {
    discovered: discoveredMatches.length,
    duePolled: dueFixtures.length,
  };
}

export async function applyProviderMatch(
  dependencies: MatchSyncServiceDependencies,
  match: MatchProviderMatch,
  competition: ConfiguredCompetition,
  now: Date,
): Promise<void> {
  await dependencies.prisma.$transaction(async (tx) => {
    const homeTeam = await upsertProviderTeam(tx, match.homeTeam);
    const awayTeam = await upsertProviderTeam(tx, match.awayTeam);

    if (homeTeam.id === awayTeam.id) {
      dependencies.logger.warn("provider match has identical teams", {
        providerFixtureId: match.providerMatchId,
        providerTeamId: homeTeam.providerTeamId,
      });
      return;
    }

    const existing = await tx.fixture.findUnique({
      where: { providerFixtureId: match.providerMatchId },
      include: { homeTeam: true, awayTeam: true },
    });

    if (
      existing &&
      (existing.homeTeam.providerTeamId !== match.homeTeam.providerTeamId ||
        existing.awayTeam.providerTeamId !== match.awayTeam.providerTeamId)
    ) {
      dependencies.logger.warn("provider fixture identity conflict", {
        fixtureId: existing.id,
        providerFixtureId: match.providerMatchId,
        existingHomeProviderTeamId: existing.homeTeam.providerTeamId,
        incomingHomeProviderTeamId: match.homeTeam.providerTeamId,
        existingAwayProviderTeamId: existing.awayTeam.providerTeamId,
        incomingAwayProviderTeamId: match.awayTeam.providerTeamId,
      });
      return;
    }

    const nextStatus = getNextFixtureStatus(existing, match);

    if (nextStatus === null) {
      await preserveProviderStatusOnly(tx, existing, match);
      logUnsafeStatus(dependencies.logger, existing, match);
      return;
    }

    if (match.status === "FINISHED" && !match.finalResult) {
      await preserveProviderStatusOnly(tx, existing, match);
      dependencies.logger.warn(
        "finished provider match is missing final score",
        {
          fixtureId: existing?.id,
          providerFixtureId: match.providerMatchId,
          providerStatus: match.providerStatus,
        },
      );
      return;
    }

    const data = {
      competitionId: competition.id,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      kickoffAt: match.kickoffAt,
      status: nextStatus,
      providerStatus: match.providerStatus,
      ...(match.status === "FINISHED" && match.finalResult
        ? {
            homeScore: match.finalResult.homeScore,
            awayScore: match.finalResult.awayScore,
            finalOutcome: match.finalResult.finalOutcome,
          }
        : {}),
    };

    const fixture = existing
      ? await tx.fixture.update({
          where: { id: existing.id },
          data,
        })
      : await tx.fixture.create({
          data: {
            providerFixtureId: match.providerMatchId,
            ...data,
          },
        });

    const events = getTransitionEvents(existing, fixture, match);

    for (const eventType of events) {
      await tx.outboxEvent.create({
        data: {
          eventType,
          aggregateType: "Fixture",
          aggregateId: fixture.id,
          occurredAt: now,
          payload: buildMatchEventPayload(eventType, fixture, match),
        },
      });
      dependencies.logger.info("match outbox event emitted", {
        fixtureId: fixture.id,
        providerFixtureId: fixture.providerFixtureId,
        eventType,
      });
    }

    dependencies.logger.info("provider match applied", {
      fixtureId: fixture.id,
      providerFixtureId: fixture.providerFixtureId,
      status: fixture.status,
      providerStatus: fixture.providerStatus,
    });
  });
}

async function getConfiguredCompetitions(
  prisma: PrismaClient,
): Promise<ConfiguredCompetition[]> {
  return prisma.competition.findMany({
    where: { isActive: true },
    select: {
      id: true,
      providerCompetitionId: true,
      code: true,
    },
    orderBy: { code: "asc" },
  });
}

function resolveCompetition(
  match: MatchProviderMatch,
  byProviderId: Map<string, ConfiguredCompetition>,
  byCode: Map<string, ConfiguredCompetition>,
): ConfiguredCompetition | null {
  return (
    byProviderId.get(match.providerCompetitionId) ??
    (match.providerCompetitionCode
      ? byCode.get(match.providerCompetitionCode)
      : undefined) ??
    null
  );
}

async function getDueFixtures(
  dependencies: MatchSyncServiceDependencies,
  startUtc: Date,
  endUtc: Date,
) {
  const now = dependencies.clock.now();
  const candidates = await dependencies.prisma.fixture.findMany({
    where: {
      kickoffAt: {
        gte: startUtc,
        lt: endUtc,
      },
      competition: { isActive: true },
      status: {
        notIn: ["FINISHED", "SETTLED", "CANCELLED"],
      },
    },
    orderBy: [{ kickoffAt: "asc" }, { id: "asc" }],
    take: 500,
  });

  return candidates.filter((fixture) => {
    const decision = getFixturePollingDecision(fixture, now);

    if (decision.anomaly === "LONG_RUNNING_UNFINISHED") {
      dependencies.logger.warn("long-running unfinished fixture", {
        fixtureId: fixture.id,
        providerFixtureId: fixture.providerFixtureId,
        kickoffAt: fixture.kickoffAt.toISOString(),
        status: fixture.status,
      });
    }

    return decision.shouldPoll;
  });
}

async function upsertProviderTeam(
  prisma: MatchSyncPrisma,
  team: MatchProviderMatch["homeTeam"],
) {
  return prisma.team.upsert({
    where: { providerTeamId: team.providerTeamId },
    update: {
      name: team.name,
      shortName: team.shortName,
    },
    create: {
      providerTeamId: team.providerTeamId,
      name: team.name,
      shortName: team.shortName,
      slug: providerTeamSlug(team.providerTeamId),
    },
  });
}

function providerTeamSlug(providerTeamId: string): string {
  const normalized = providerTeamId
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `provider-team-${normalized || "unknown"}`;
}

function getNextFixtureStatus(
  existing: Pick<Fixture, "status" | "scoringSnapshotId"> | null,
  match: MatchProviderMatch,
): FixtureStatus | null {
  switch (match.status) {
    case "SCHEDULED":
      if (
        existing?.status === "OPEN" ||
        existing?.status === "LOCKED" ||
        existing?.status === "DRAFT"
      ) {
        return existing.status;
      }

      return "DRAFT";
    case "LIVE":
      return "LIVE";
    case "FINISHED":
      return match.finalResult ? "FINISHED" : null;
    case "POSTPONED":
      return "POSTPONED";
    case "CANCELLED":
      return "CANCELLED";
    case "SUSPENDED":
      return "SUSPENDED";
    case "AWARDED":
    case "UNKNOWN":
      return null;
  }
}

async function preserveProviderStatusOnly(
  prisma: MatchSyncPrisma,
  existing: Pick<Fixture, "id"> | null,
  match: MatchProviderMatch,
): Promise<void> {
  if (!existing) {
    return;
  }

  await prisma.fixture.update({
    where: { id: existing.id },
    data: { providerStatus: match.providerStatus },
  });
}

function logUnsafeStatus(
  logger: MatchSyncLogger,
  existing: Pick<Fixture, "id"> | null,
  match: MatchProviderMatch,
): void {
  logger.warn("unsupported provider match status skipped", {
    fixtureId: existing?.id,
    providerFixtureId: match.providerMatchId,
    providerStatus: match.providerStatus,
    normalizedStatus: match.status,
  });
}

function getTransitionEvents(
  before: Pick<Fixture, "status" | "kickoffAt"> | null,
  after: Pick<Fixture, "status" | "kickoffAt">,
  match: MatchProviderMatch,
): MatchOutboxEventType[] {
  const events: MatchOutboxEventType[] = [];

  if (
    before &&
    before.kickoffAt.getTime() !== after.kickoffAt.getTime() &&
    after.status !== "CANCELLED"
  ) {
    events.push("match.rescheduled");
  }

  if (before?.status !== after.status) {
    if (after.status === "LIVE") {
      events.push("match.started");
    } else if (after.status === "FINISHED" && match.finalResult) {
      events.push("match.finished");
    } else if (after.status === "POSTPONED") {
      events.push("match.postponed");
    } else if (after.status === "CANCELLED") {
      events.push("match.cancelled");
    }
  }

  return events;
}

function buildMatchEventPayload(
  eventType: MatchOutboxEventType,
  fixture: Pick<
    Fixture,
    | "id"
    | "providerFixtureId"
    | "kickoffAt"
    | "status"
    | "providerStatus"
    | "homeScore"
    | "awayScore"
    | "finalOutcome"
  >,
  match: MatchProviderMatch,
): Prisma.InputJsonObject {
  return {
    eventType,
    fixtureId: fixture.id,
    providerFixtureId: fixture.providerFixtureId,
    providerStatus: fixture.providerStatus,
    status: fixture.status,
    kickoffAt: fixture.kickoffAt.toISOString(),
    finalResult: match.finalResult
      ? {
          homeScore: match.finalResult.homeScore,
          awayScore: match.finalResult.awayScore,
          finalOutcome: match.finalResult.finalOutcome,
        }
      : null,
  };
}

function chunkArray<T>(items: T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error("Chunk size must be a positive integer.");
  }

  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

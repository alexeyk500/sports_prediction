import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type {
  MatchProvider,
  MatchProviderMatch,
} from "@/modules/match-sync/match-provider";
import { runMatchSyncCycle } from "@/modules/match-sync/match-sync.service";
import { FixedClock } from "@/lib/time/clock";
import { createTestPrismaClient } from "../helpers/prisma-test-client";
import { uniqueTestKey, uniqueTestSlug } from "../helpers/factories";

function providerMatch(
  overrides: Partial<MatchProviderMatch> = {},
): MatchProviderMatch {
  return {
    providerMatchId: uniqueTestKey("provider_fixture"),
    providerCompetitionId: "sync-provider-competition",
    providerCompetitionCode: "SYNC",
    kickoffAt: new Date("2026-07-15T20:00:00Z"),
    status: "SCHEDULED",
    providerStatus: "TIMED",
    homeTeam: {
      providerTeamId: uniqueTestKey("provider_home"),
      name: "Home",
      shortName: "HOM",
    },
    awayTeam: {
      providerTeamId: uniqueTestKey("provider_away"),
      name: "Away",
      shortName: "AWY",
    },
    finalResult: null,
    ...overrides,
  };
}

function createProvider(matches: MatchProviderMatch[]): MatchProvider {
  return {
    listMatchesForWindow: vi.fn(async () => matches),
    getMatchesByIds: vi.fn(async (ids) =>
      matches.filter((match) => ids.includes(match.providerMatchId)),
    ),
  };
}

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

describe("match sync service", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createTestPrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("creates provider teams and fixtures idempotently without duplicate events", async () => {
    const competition = await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("sync_competition"),
        code: uniqueTestKey("SYNC").toUpperCase(),
        name: "Sync Competition",
        slug: uniqueTestSlug("sync-competition"),
      },
    });
    const match = providerMatch({
      providerCompetitionId: competition.providerCompetitionId,
      providerCompetitionCode: competition.code,
    });
    const provider = createProvider([match]);
    const dependencies = {
      prisma,
      provider,
      clock: new FixedClock("2026-07-15T12:00:00Z"),
      logger: createLogger(),
    };

    await runMatchSyncCycle(dependencies);
    await runMatchSyncCycle(dependencies);

    await expect(
      prisma.fixture.findMany({
        where: { providerFixtureId: match.providerMatchId },
      }),
    ).resolves.toHaveLength(1);
    await expect(
      prisma.team.findMany({
        where: {
          providerTeamId: {
            in: [match.homeTeam.providerTeamId, match.awayTeam.providerTeamId],
          },
        },
      }),
    ).resolves.toHaveLength(2);
    await expect(
      prisma.outboxEvent.findMany({
        where: { aggregateType: "Fixture" },
      }),
    ).resolves.toHaveLength(0);
  });

  it("emits started and finished facts only on meaningful transitions", async () => {
    const competition = await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("sync_competition"),
        code: uniqueTestKey("SYNC").toUpperCase(),
        name: "Sync Competition",
        slug: uniqueTestSlug("sync-competition"),
      },
    });
    const providerFixtureId = uniqueTestKey("provider_fixture");
    const base = providerMatch({
      providerMatchId: providerFixtureId,
      providerCompetitionId: competition.providerCompetitionId,
      providerCompetitionCode: competition.code,
    });
    const provider = createProvider([]);
    const dependencies = {
      prisma,
      provider,
      clock: new FixedClock("2026-07-15T12:00:00Z"),
      logger: createLogger(),
    };

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        { ...base, status: "LIVE", providerStatus: "IN_PLAY" },
      ],
    );
    provider.getMatchesByIds = vi.fn(async () => []);
    await runMatchSyncCycle(dependencies);

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        { ...base, status: "LIVE", providerStatus: "PAUSED" },
      ],
    );
    await runMatchSyncCycle(dependencies);

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        {
          ...base,
          status: "FINISHED",
          providerStatus: "FINISHED",
          finalResult: {
            homeScore: 2,
            awayScore: 1,
            finalOutcome: "HOME" as const,
          },
        },
      ],
    );
    await runMatchSyncCycle(dependencies);

    const fixture = await prisma.fixture.findUniqueOrThrow({
      where: { providerFixtureId },
    });
    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: fixture.id },
      orderBy: { occurredAt: "asc" },
    });

    expect(fixture.status).toBe("FINISHED");
    expect(fixture.homeScore).toBe(2);
    expect(fixture.awayScore).toBe(1);
    expect(fixture.finalOutcome).toBe("HOME");
    expect(events.map((event) => event.eventType)).toEqual([
      "match.started",
      "match.finished",
    ]);
  });

  it("preserves fixture identity across reschedule outside current business day", async () => {
    const competition = await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("sync_competition"),
        code: uniqueTestKey("SYNC").toUpperCase(),
        name: "Sync Competition",
        slug: uniqueTestSlug("sync-competition"),
      },
    });
    const providerFixtureId = uniqueTestKey("provider_fixture");
    const base = providerMatch({
      providerMatchId: providerFixtureId,
      providerCompetitionId: competition.providerCompetitionId,
      providerCompetitionCode: competition.code,
      kickoffAt: new Date("2026-07-15T20:00:00Z"),
    });
    const provider = createProvider([base]);
    const dependencies = {
      prisma,
      provider,
      clock: new FixedClock("2026-07-15T12:00:00Z"),
      logger: createLogger(),
    };

    await runMatchSyncCycle(dependencies);

    const fixtureBeforeReschedule = await prisma.fixture.findUniqueOrThrow({
      where: { providerFixtureId },
    });
    await prisma.fixture.update({
      where: { id: fixtureBeforeReschedule.id },
      data: { updatedAt: new Date("2026-07-15T19:20:00Z") },
    });
    dependencies.clock.set("2026-07-15T19:40:00Z");
    provider.listMatchesForWindow = vi.fn(async () => []);
    provider.getMatchesByIds = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        { ...base, kickoffAt: new Date("2026-07-16T20:00:00Z") },
      ],
    );
    await runMatchSyncCycle(dependencies);

    const fixtures = await prisma.fixture.findMany({
      where: { providerFixtureId },
    });
    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: fixtures[0].id },
      orderBy: { occurredAt: "asc" },
    });

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].kickoffAt.toISOString()).toBe(
      "2026-07-16T20:00:00.000Z",
    );
    expect(events.map((event) => event.eventType)).toEqual([
      "match.rescheduled",
    ]);
  });

  it("persists cancellation and does not duplicate the cancellation fact", async () => {
    const competition = await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("sync_competition"),
        code: uniqueTestKey("SYNC").toUpperCase(),
        name: "Sync Competition",
        slug: uniqueTestSlug("sync-competition"),
      },
    });
    const providerFixtureId = uniqueTestKey("provider_fixture");
    const base = providerMatch({
      providerMatchId: providerFixtureId,
      providerCompetitionId: competition.providerCompetitionId,
      providerCompetitionCode: competition.code,
      kickoffAt: new Date("2026-07-15T20:00:00Z"),
    });
    const provider = createProvider([base]);
    const dependencies = {
      prisma,
      provider,
      clock: new FixedClock("2026-07-15T12:00:00Z"),
      logger: createLogger(),
    };

    await runMatchSyncCycle(dependencies);

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        {
          ...base,
          status: "CANCELLED",
          providerStatus: "CANCELLED",
        },
      ],
    );
    await runMatchSyncCycle(dependencies);
    await runMatchSyncCycle(dependencies);

    const fixtures = await prisma.fixture.findMany({
      where: { providerFixtureId },
    });
    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: fixtures[0].id },
      orderBy: { occurredAt: "asc" },
    });

    expect(fixtures).toHaveLength(1);
    expect(fixtures[0].status).toBe("CANCELLED");
    expect(events.map((event) => event.eventType)).toEqual(["match.cancelled"]);
  });

  it("skips conflicting provider fixture identity and missing finished scores safely", async () => {
    const competition = await prisma.competition.create({
      data: {
        providerCompetitionId: uniqueTestKey("sync_competition"),
        code: uniqueTestKey("SYNC").toUpperCase(),
        name: "Sync Competition",
        slug: uniqueTestSlug("sync-competition"),
      },
    });
    const base = providerMatch({
      providerCompetitionId: competition.providerCompetitionId,
      providerCompetitionCode: competition.code,
    });
    const provider = createProvider([base]);
    const logger = createLogger();
    const dependencies = {
      prisma,
      provider,
      clock: new FixedClock("2026-07-15T12:00:00Z"),
      logger,
    };

    await runMatchSyncCycle(dependencies);

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        {
          ...base,
          homeTeam: {
            providerTeamId: uniqueTestKey("different_home"),
            name: "Different",
            shortName: "DIF",
          },
        },
      ],
    );
    await runMatchSyncCycle(dependencies);

    provider.listMatchesForWindow = vi.fn(
      async (): Promise<MatchProviderMatch[]> => [
        {
          ...base,
          status: "FINISHED",
          providerStatus: "FINISHED",
          finalResult: null,
        },
        {
          ...base,
          providerMatchId: uniqueTestKey("awarded_fixture"),
          status: "AWARDED",
          providerStatus: "AWARDED",
        },
      ],
    );
    await runMatchSyncCycle(dependencies);

    const fixture = await prisma.fixture.findUniqueOrThrow({
      where: { providerFixtureId: base.providerMatchId },
    });
    const events = await prisma.outboxEvent.findMany({
      where: { aggregateId: fixture.id },
    });

    expect(fixture.status).toBe("DRAFT");
    expect(fixture.homeScore).toBeNull();
    expect(events).toHaveLength(0);
    expect(logger.warn).toHaveBeenCalled();
  });
});

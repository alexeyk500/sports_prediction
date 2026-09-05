import { randomUUID } from "node:crypto";
import { Prisma, type AdRewardStatus, type PrismaClient } from "@prisma/client";
import { SUPPORTED_COMPETITION_CODES, type SupportedCompetitionCode } from "@/modules/fixtures/fixture.domain";
import { SCORING_VERSION } from "@/modules/predictions/scoring.domain";

let sequence = 0;
let tournamentNumber = 1;

export function uniqueTestKey(prefix: string): string {
  sequence += 1;
  return `${prefix}_${randomUUID()}_${sequence}`;
}

export function uniqueTournamentNumber(): number {
  tournamentNumber += 1;
  return (process.pid % 100_000) * 10_000 + tournamentNumber;
}

export function uniqueTelegramUserId(): bigint {
  return BigInt((process.pid % 100_000) * 1_000_000 + Date.now() % 1_000_000 + sequence++);
}

export async function createTestUser(prisma: PrismaClient) {
  return prisma.user.create({
    data: {
      telegramUserId: uniqueTelegramUserId(),
    },
  });
}

export async function createActiveTestTournament(prisma: PrismaClient) {
  return prisma.tournament.create({
    data: {
      number: uniqueTournamentNumber(),
      status: "ACTIVE",
      startsAt: new Date("2026-09-01T00:00:00.000Z"),
      endsAt: new Date("2026-09-08T00:00:00.000Z"),
      prizePoolNanoTon: 0n,
    },
  });
}

export async function createTestCompetition(
  prisma: PrismaClient,
  overrides: {
    code?: string;
    isActive?: boolean;
  } = {},
) {
  const key = uniqueTestKey("competition");
  const code = overrides.code ?? "EPL";

  if ((SUPPORTED_COMPETITION_CODES as readonly string[]).includes(code)) {
    return prisma.competition.upsert({
      where: { code },
      update: {
        isActive: overrides.isActive ?? true,
      },
      create: {
        providerCompetitionId: key,
        code,
        name: code,
        isActive: overrides.isActive ?? true,
      },
    });
  }

  return prisma.competition.create({
    data: {
      providerCompetitionId: key,
      code,
      name: key,
      isActive: overrides.isActive ?? true,
    },
  });
}

export async function createSupportedTestCompetition(
  prisma: PrismaClient,
  code: SupportedCompetitionCode = "EPL",
) {
  return createTestCompetition(prisma, { code, isActive: true });
}

export async function createTestTeams(prisma: PrismaClient) {
  const homeKey = uniqueTestKey("home_team");
  const awayKey = uniqueTestKey("away_team");

  const [homeTeam, awayTeam] = await Promise.all([
    prisma.team.create({
      data: {
        providerTeamId: homeKey,
        name: homeKey,
      },
    }),
    prisma.team.create({
      data: {
        providerTeamId: awayKey,
        name: awayKey,
      },
    }),
  ]);

  return { homeTeam, awayTeam };
}

export async function createTestFixture(
  prisma: PrismaClient,
  overrides: {
    competitionId?: string;
    status?: "DRAFT" | "OPEN" | "LOCKED" | "LIVE" | "FINISHED" | "SETTLED";
    kickoffAt?: Date;
    scoringSnapshotId?: string | null;
  } = {},
) {
  const competition =
    overrides.competitionId ??
    (await createSupportedTestCompetition(prisma)).id;
  const { homeTeam, awayTeam } = await createTestTeams(prisma);

  return prisma.fixture.create({
    data: {
      providerFixtureId: uniqueTestKey("fixture"),
      competitionId: competition,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      kickoffAt: overrides.kickoffAt ?? new Date("2026-09-05T15:00:00.000Z"),
      status: overrides.status ?? "DRAFT",
      scoringSnapshotId: overrides.scoringSnapshotId ?? null,
    },
  });
}

export async function createEligibleTestFixture(prisma: PrismaClient) {
  const competition = await createSupportedTestCompetition(prisma);
  const fixture = await createTestFixture(prisma, {
    competitionId: competition.id,
    kickoffAt: new Date("2026-09-05T15:00:00.000Z"),
  });
  const snapshot = await attachTestScoringSnapshot(prisma, fixture.id);

  return { fixture, snapshot };
}

export async function attachTestScoringSnapshot(prisma: PrismaClient, fixtureId: string) {
  const snapshot = await prisma.outcomeSnapshot.create({
    data: {
      fixtureId,
      homeRawOdds: new Prisma.Decimal("2.000000"),
      drawRawOdds: new Prisma.Decimal("3.500000"),
      awayRawOdds: new Prisma.Decimal("4.000000"),
      homeProbability: new Prisma.Decimal("0.48275862"),
      drawProbability: new Prisma.Decimal("0.27586207"),
      awayProbability: new Prisma.Decimal("0.24137931"),
      homePoints: 13,
      drawPoints: 24,
      awayPoints: 27,
      snapshotAt: new Date("2026-09-05T10:00:00.000Z"),
      scoringVersion: SCORING_VERSION,
    },
  });

  await prisma.fixture.update({
    where: { id: fixtureId },
    data: {
      scoringSnapshotId: snapshot.id,
      status: "OPEN",
    },
  });

  return snapshot;
}

export async function createTestAdReward(
  prisma: PrismaClient,
  userId: string,
  overrides: {
    status?: AdRewardStatus;
    expiresAt?: Date | null;
    consumedByPredictionId?: string | null;
  } = {},
) {
  return prisma.adReward.create({
    data: {
      userId,
      provider: "test",
      providerRewardId: uniqueTestKey("reward"),
      attemptKey: uniqueTestKey("attempt"),
      status: overrides.status ?? "VERIFIED",
      verifiedAt: overrides.status === "CREATED" ? null : new Date("2026-09-05T11:00:00.000Z"),
      expiresAt: overrides.expiresAt ?? new Date("2026-09-05T13:00:00.000Z"),
      consumedByPredictionId: overrides.consumedByPredictionId ?? null,
    },
  });
}

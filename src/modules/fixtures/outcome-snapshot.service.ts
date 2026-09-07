import {
  Prisma,
  type FixtureStatus,
  type OutcomeSnapshot,
  type PrismaClient,
} from "@prisma/client";
import type { Clock } from "@/lib/time/clock";
import { DomainError } from "@/lib/errors/domain-error";
import {
  calculatePredictionPoints,
  normalizeOneXTwoOdds,
  SCORING_VERSION,
  type RawOneXTwoOdds,
} from "@/modules/predictions/scoring.domain";
import {
  quantizeProbabilityCore,
  quantizeRawOddsCore,
} from "@/modules/predictions/scoring.core";
import { SUPPORTED_COMPETITION_CODES } from "./fixture.domain";

const supportedCompetitionCodes = new Set<string>(SUPPORTED_COMPETITION_CODES);

export interface PublishOutcomeSnapshotInput {
  fixtureId: string;
  odds: RawOneXTwoOdds;
}

export interface OutcomeSnapshotServiceDependencies {
  prisma: PrismaClient;
  clock: Clock;
}

interface LockedFixtureRow {
  id: string;
  status: FixtureStatus;
  kickoffAt: Date;
  scoringSnapshotId: string | null;
  competitionCode: string;
  competitionIsActive: boolean;
}

export async function publishOutcomeSnapshot(
  dependencies: OutcomeSnapshotServiceDependencies,
  input: PublishOutcomeSnapshotInput,
): Promise<OutcomeSnapshot> {
  const now = dependencies.clock.now();

  return dependencies.prisma.$transaction(async (tx) => {
    const fixture = await lockFixtureForSnapshotPublication(
      tx,
      input.fixtureId,
    );

    if (!fixture) {
      throw new DomainError("FIXTURE_NOT_FOUND", "Fixture not found.", {
        fixtureId: input.fixtureId,
      });
    }

    assertFixturePublishable(fixture, now);

    if (fixture.scoringSnapshotId) {
      const existing = await tx.outcomeSnapshot.findUnique({
        where: { id: fixture.scoringSnapshotId },
      });

      if (!existing) {
        throw new DomainError(
          "OUTCOME_SNAPSHOT_NOT_PUBLISHABLE",
          "Fixture points to a missing scoring snapshot.",
          {
            fixtureId: fixture.id,
            scoringSnapshotId: fixture.scoringSnapshotId,
          },
        );
      }

      return existing;
    }

    const normalized = normalizeOneXTwoOdds(input.odds);
    const homeProbability = quantizeProbability(normalized.home);
    const drawProbability = quantizeProbability(normalized.draw);
    const awayProbability = quantizeProbability(normalized.away);

    const snapshot = await tx.outcomeSnapshot.create({
      data: {
        fixtureId: fixture.id,
        homeRawOdds: quantizeRawOdds(input.odds.home),
        drawRawOdds: quantizeRawOdds(input.odds.draw),
        awayRawOdds: quantizeRawOdds(input.odds.away),
        homeProbability,
        drawProbability,
        awayProbability,
        homePoints: calculatePredictionPoints(homeProbability),
        drawPoints: calculatePredictionPoints(drawProbability),
        awayPoints: calculatePredictionPoints(awayProbability),
        snapshotAt: now,
        scoringVersion: SCORING_VERSION,
      },
    });

    await tx.fixture.update({
      where: { id: fixture.id },
      data: {
        scoringSnapshotId: snapshot.id,
        status: "OPEN",
      },
    });

    return snapshot;
  });
}

export function quantizeProbability(
  value: Prisma.Decimal.Value,
): Prisma.Decimal {
  return quantizeProbabilityCore(value);
}

export function quantizeRawOdds(value: Prisma.Decimal.Value): Prisma.Decimal {
  return quantizeRawOddsCore(value);
}

async function lockFixtureForSnapshotPublication(
  tx: Prisma.TransactionClient,
  fixtureId: string,
): Promise<LockedFixtureRow | null> {
  const rows = await tx.$queryRaw<LockedFixtureRow[]>`
    SELECT
      f.id AS "id",
      f.status AS "status",
      f."kickoffAt" AS "kickoffAt",
      f."scoringSnapshotId" AS "scoringSnapshotId",
      c.code AS "competitionCode",
      c."isActive" AS "competitionIsActive"
    FROM "Fixture" f
    INNER JOIN "Competition" c ON c.id = f."competitionId"
    WHERE f.id = ${fixtureId}::uuid
    FOR UPDATE OF f
  `;

  return rows[0] ?? null;
}

function assertFixturePublishable(
  fixture: LockedFixtureRow,
  instant: Date,
): void {
  if (!fixture.competitionIsActive) {
    throw new DomainError("COMPETITION_INACTIVE", "Competition is inactive.", {
      fixtureId: fixture.id,
      competitionCode: fixture.competitionCode,
    });
  }

  if (!supportedCompetitionCodes.has(fixture.competitionCode)) {
    throw new DomainError(
      "COMPETITION_NOT_SUPPORTED",
      "Competition is not supported.",
      {
        fixtureId: fixture.id,
        competitionCode: fixture.competitionCode,
      },
    );
  }

  if (instant.getTime() >= fixture.kickoffAt.getTime()) {
    throw new DomainError(
      "FIXTURE_LOCKED",
      "Fixture is locked for snapshot publication.",
      {
        fixtureId: fixture.id,
        kickoffAt: fixture.kickoffAt.toISOString(),
        instant: instant.toISOString(),
      },
    );
  }

  if (fixture.status !== "DRAFT" && fixture.status !== "OPEN") {
    throw new DomainError(
      "OUTCOME_SNAPSHOT_NOT_PUBLISHABLE",
      "Fixture status does not allow snapshot publication.",
      { fixtureId: fixture.id, status: fixture.status },
    );
  }
}

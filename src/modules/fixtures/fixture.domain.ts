import type { Competition, Fixture } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

export const SUPPORTED_COMPETITION_CODES = [
  "EPL",
  "LALIGA",
  "SERIE_A",
  "BUNDESLIGA",
  "LIGUE_1",
  "UCL",
  "UEL",
] as const;

export type SupportedCompetitionCode =
  (typeof SUPPORTED_COMPETITION_CODES)[number];

const supportedCompetitionCodes = new Set<string>(SUPPORTED_COMPETITION_CODES);

export interface FixtureWithCompetition extends Pick<
  Fixture,
  "id" | "status" | "kickoffAt" | "scoringSnapshotId"
> {
  competition: Pick<Competition, "code" | "isActive">;
}

export function assertFixtureEligibleForPrediction(
  fixture: FixtureWithCompetition,
  instant: Date,
): void {
  if (!fixture.competition.isActive) {
    throw new DomainError("COMPETITION_INACTIVE", "Competition is inactive.", {
      fixtureId: fixture.id,
      competitionCode: fixture.competition.code,
    });
  }

  if (!supportedCompetitionCodes.has(fixture.competition.code)) {
    throw new DomainError(
      "COMPETITION_NOT_SUPPORTED",
      "Competition is not supported.",
      {
        fixtureId: fixture.id,
        competitionCode: fixture.competition.code,
      },
    );
  }

  if (fixture.status !== "OPEN") {
    throw new DomainError(
      "FIXTURE_NOT_OPEN",
      "Fixture is not open for predictions.",
      {
        fixtureId: fixture.id,
        status: fixture.status,
      },
    );
  }

  if (instant.getTime() >= fixture.kickoffAt.getTime()) {
    throw new DomainError(
      "FIXTURE_LOCKED",
      "Fixture is locked for predictions.",
      {
        fixtureId: fixture.id,
        kickoffAt: fixture.kickoffAt.toISOString(),
        instant: instant.toISOString(),
      },
    );
  }

  if (!fixture.scoringSnapshotId) {
    throw new DomainError(
      "FIXTURE_SCORING_SNAPSHOT_MISSING",
      "Fixture does not have a published scoring snapshot.",
      { fixtureId: fixture.id },
    );
  }
}

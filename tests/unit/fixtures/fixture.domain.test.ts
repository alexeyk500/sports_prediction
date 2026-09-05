import { describe, expect, it } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";
import { assertFixtureEligibleForPrediction, type FixtureWithCompetition } from "@/modules/fixtures/fixture.domain";

const now = new Date("2026-09-05T12:00:00.000Z");

function fixture(overrides: Partial<FixtureWithCompetition> = {}): FixtureWithCompetition {
  return {
    id: "fixture-id",
    status: "OPEN",
    kickoffAt: new Date("2026-09-05T15:00:00.000Z"),
    scoringSnapshotId: "snapshot-id",
    competition: {
      code: "EPL",
      isActive: true,
    },
    ...overrides,
  };
}

describe("fixture eligibility", () => {
  it("accepts OPEN fixture before kickoff with supported active competition and snapshot", () => {
    expect(() => assertFixtureEligibleForPrediction(fixture(), now)).not.toThrow();
  });

  it("rejects non-open statuses", () => {
    for (const status of ["LOCKED", "LIVE"] as const) {
      expect(() => assertFixtureEligibleForPrediction(fixture({ status }), now)).toThrow(DomainError);
    }
  });

  it("rejects at or after kickoff", () => {
    const kickoffAt = new Date("2026-09-05T12:00:00.000Z");

    expect(() => assertFixtureEligibleForPrediction(fixture({ kickoffAt }), now)).toThrow(
      /locked/,
    );
    expect(() =>
      assertFixtureEligibleForPrediction(fixture({ kickoffAt }), new Date("2026-09-05T12:00:00.001Z")),
    ).toThrow(/locked/);
  });

  it("rejects missing scoring snapshot", () => {
    expect(() => assertFixtureEligibleForPrediction(fixture({ scoringSnapshotId: null }), now)).toThrow(
      /published scoring snapshot/,
    );
  });

  it("rejects inactive or unsupported competition", () => {
    expect(() =>
      assertFixtureEligibleForPrediction(
        fixture({ competition: { code: "EPL", isActive: false } }),
        now,
      ),
    ).toThrow(/inactive/);
    expect(() =>
      assertFixtureEligibleForPrediction(
        fixture({ competition: { code: "MLS", isActive: true } }),
        now,
      ),
    ).toThrow(/not supported/);
  });
});

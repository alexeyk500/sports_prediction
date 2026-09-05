import { describe, expect, it } from "vitest";
import { DomainError } from "@/lib/errors/domain-error";
import { assertTournamentUsableForPrediction, isTournamentActiveAt } from "@/modules/tournaments/tournament.domain";

describe("tournament domain", () => {
  it("recognizes an active tournament at an instant", () => {
    expect(
      isTournamentActiveAt(
        {
          status: "ACTIVE",
          startsAt: new Date("2026-09-01T00:00:00.000Z"),
          endsAt: new Date("2026-09-08T00:00:00.000Z"),
        },
        new Date("2026-09-05T12:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("rejects wrong tournament status for prediction workflow", () => {
    expect(() =>
      assertTournamentUsableForPrediction({
        id: "tournament-id",
        status: "FINALIZING",
      }),
    ).toThrow(DomainError);
  });
});

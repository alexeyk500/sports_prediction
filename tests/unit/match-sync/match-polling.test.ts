import { describe, expect, it } from "vitest";
import { getFixturePollingDecision } from "@/modules/match-sync/match-polling";

describe("match polling cadence", () => {
  const now = new Date("2026-09-11T12:00:00Z");

  it("does not dedicate poll more than 30 minutes before kickoff", () => {
    expect(
      getFixturePollingDecision(
        {
          kickoffAt: new Date("2026-09-11T12:31:00Z"),
          status: "OPEN",
          updatedAt: new Date("2026-09-11T11:00:00Z"),
        },
        now,
      ).shouldPoll,
    ).toBe(false);
  });

  it("polls every 10 minutes inside the 30 minute pre-kickoff window", () => {
    expect(
      getFixturePollingDecision(
        {
          kickoffAt: new Date("2026-09-11T12:20:00Z"),
          status: "OPEN",
          updatedAt: new Date("2026-09-11T11:49:59Z"),
        },
        now,
      ),
    ).toMatchObject({ shouldPoll: true, intervalMs: 600_000 });
  });

  it("polls every 5 minutes after kickoff before provider reports live", () => {
    expect(
      getFixturePollingDecision(
        {
          kickoffAt: new Date("2026-09-11T11:55:00Z"),
          status: "LOCKED",
          updatedAt: new Date("2026-09-11T11:54:59Z"),
        },
        now,
      ),
    ).toMatchObject({ shouldPoll: true, intervalMs: 300_000 });
  });

  it("stops normal polling for finished and cancelled fixtures", () => {
    for (const status of ["FINISHED", "SETTLED", "CANCELLED"] as const) {
      expect(
        getFixturePollingDecision(
          {
            kickoffAt: new Date("2026-09-11T10:00:00Z"),
            status,
            updatedAt: new Date("2026-09-11T10:00:00Z"),
          },
          now,
        ).shouldPoll,
      ).toBe(false);
    }
  });

  it("moves long-running unfinished live fixtures to anomaly 30-minute cadence", () => {
    expect(
      getFixturePollingDecision(
        {
          kickoffAt: new Date("2026-09-11T07:00:00Z"),
          status: "LIVE",
          updatedAt: new Date("2026-09-11T11:29:59Z"),
        },
        now,
      ),
    ).toEqual({
      shouldPoll: true,
      intervalMs: 1_800_000,
      anomaly: "LONG_RUNNING_UNFINISHED",
    });
  });
});

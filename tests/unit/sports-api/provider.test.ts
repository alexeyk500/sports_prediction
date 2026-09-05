import { describe, expect, it } from "vitest";
import { InMemorySportsProvider } from "@/lib/sports-api/in-memory-sports-provider";

describe("SportsProvider abstraction", () => {
  it("returns internal DTOs without exposing raw provider payloads", async () => {
    const provider = new InMemorySportsProvider({
      fixtures: [
        {
          providerFixtureId: "fixture-1",
          providerCompetitionId: "competition-1",
          providerHomeTeamId: "team-home",
          providerAwayTeamId: "team-away",
          kickoffAt: new Date("2026-09-05T15:00:00.000Z"),
          providerStatus: "NS",
        },
      ],
    });

    await expect(
      provider.listUpcomingFixtures(
        new Date("2026-09-05T00:00:00.000Z"),
        new Date("2026-09-06T00:00:00.000Z"),
      ),
    ).resolves.toEqual([
      {
        providerFixtureId: "fixture-1",
        providerCompetitionId: "competition-1",
        providerHomeTeamId: "team-home",
        providerAwayTeamId: "team-away",
        kickoffAt: new Date("2026-09-05T15:00:00.000Z"),
        providerStatus: "NS",
      },
    ]);
  });
});

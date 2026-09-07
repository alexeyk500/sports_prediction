import { describe, expect, it } from "vitest";
import {
  calculateAroundMeWindow,
  mergeLeaderboardEntries,
  normalizeLeaderboardLimit,
} from "@/modules/tournaments/cup-read.service";
import type { CupLeaderboardEntryDto } from "@/modules/tournaments/cup-read.service";

function entry(userId: string, rank: number): CupLeaderboardEntryDto {
  return {
    userId,
    rank,
    displayName: `User ${rank}`,
    avatarUrl: null,
    correct: 0,
    wrong: 0,
    totalPredictions: 0,
    points: 0,
    isCurrentUser: false,
    telegramUrl: null,
  };
}

describe("Cup leaderboard domain helpers", () => {
  it("uses a Top 50 default page size without requiring the full leaderboard", () => {
    expect(normalizeLeaderboardLimit(undefined)).toBe(50);
  });

  it("builds Around Me window for current user ranked #800 of 1000", () => {
    expect(calculateAroundMeWindow(1_000, 800, 4)).toEqual({
      startRank: 796,
      endRank: 804,
    });
  });

  it("keeps Around Me window inside the start of the leaderboard", () => {
    expect(calculateAroundMeWindow(1_000, 1, 4)).toEqual({
      startRank: 1,
      endRank: 9,
    });
  });

  it("keeps Around Me window inside the end of the leaderboard", () => {
    expect(calculateAroundMeWindow(1_000, 1_000, 4)).toEqual({
      startRank: 992,
      endRank: 1_000,
    });
  });

  it("appends All Players pages without duplicate rows", () => {
    expect(
      mergeLeaderboardEntries(
        [entry("a", 1), entry("b", 2)],
        [entry("b", 2), entry("c", 3)],
      ),
    ).toEqual([entry("a", 1), entry("b", 2), entry("c", 3)]);
  });
});

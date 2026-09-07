import { describe, expect, it } from "vitest";
import {
  mergeCupLeaderboardRows,
  toCupLeaderboardRowModel,
} from "@/components/CupScreen/CurrentCupView/CupLeaderboard/leaderboard-types";
import type { CupLeaderboardRowDto } from "@/lib/api/types";

function dto(userId: string, rank: number, isCurrentUser = false): CupLeaderboardRowDto {
  return {
    userId,
    rank,
    displayName: `User ${rank}`,
    avatarUrl: null,
    correct: 1,
    wrong: 2,
    totalPredictions: 3,
    points: 4,
    isCurrentUser,
    telegramUrl: null,
  };
}

describe("Cup leaderboard presentation helpers", () => {
  it("maps backend current-user flag without computing rank on the client", () => {
    expect(toCupLeaderboardRowModel(dto("current", 12, true))).toMatchObject({
      id: "current",
      rank: 12,
      playerName: "User 12",
      correctPredictions: 1,
      wrongPredictions: 2,
      predictionsCount: 3,
      points: 4,
      isCurrentUser: true,
    });
  });

  it("appends All Players pages without dropping previous rows or adding duplicates", () => {
    const firstPage = [toCupLeaderboardRowModel(dto("a", 1)), toCupLeaderboardRowModel(dto("b", 2))];
    const secondPage = [toCupLeaderboardRowModel(dto("b", 2)), toCupLeaderboardRowModel(dto("c", 3))];

    expect(mergeCupLeaderboardRows(firstPage, secondPage).map((row) => row.id)).toEqual(["a", "b", "c"]);
  });
});

import { describe, expect, it } from "vitest";
import {
  AROUND_ME_RADIUS,
  createTopModeState,
  shouldLoadNextAllPage,
} from "@/components/CupScreen/CurrentCupView/CupLeaderboard/useCupLeaderboard";
import type { CupLeaderboardPageResponse } from "@/lib/api/types";

function page(
  input: {
    cupId?: string;
    nextCursor?: string | null;
    totalParticipants?: number;
  } = {},
): CupLeaderboardPageResponse {
  return {
    items: [
      {
        userId: input.cupId ?? "user-1",
        rank: 1,
        displayName: "User 1",
        avatarUrl: null,
        correct: 2,
        wrong: 1,
        totalPredictions: 3,
        points: 42,
        isCurrentUser: true,
        telegramUrl: null,
      },
    ],
    nextCursor: input.nextCursor ?? null,
    totalParticipants: input.totalParticipants ?? 1,
  };
}

describe("Cup leaderboard loading state", () => {
  it("maps Top mode from parent-provided store data", () => {
    const state = createTopModeState(
      page({ nextCursor: null, totalParticipants: 55 }),
    );

    expect(state).toMatchObject({
      isLoaded: true,
      nextCursor: null,
      totalParticipants: 55,
    });
    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toMatchObject({
      id: "user-1",
      rank: 1,
      points: 42,
      isCurrentUser: true,
    });
  });

  it("uses empty Top state while parent data is loading", () => {
    expect(createTopModeState(null)).toMatchObject({
      rows: [],
      totalParticipants: 0,
      nextCursor: null,
      isLoaded: false,
    });
  });

  it("replaces Top state when parent data changes", () => {
    const first = createTopModeState(page({ cupId: "first" }));
    const second = createTopModeState(page({ cupId: "second" }));

    expect(first.rows[0]?.id).toBe("first");
    expect(second.rows[0]?.id).toBe("second");
  });

  it("allows one All pagination request per cursor", () => {
    expect(
      shouldLoadNextAllPage({
        activeMode: "all",
        nextCursor: "50",
        loadingNextCursor: null,
        loadingMode: null,
      }),
    ).toBe(true);
    expect(
      shouldLoadNextAllPage({
        activeMode: "all",
        nextCursor: "50",
        loadingNextCursor: "50",
        loadingMode: null,
      }),
    ).toBe(false);
  });

  it("does not paginate outside All mode or while another mode is loading", () => {
    expect(
      shouldLoadNextAllPage({
        activeMode: "top",
        nextCursor: "50",
        loadingNextCursor: null,
        loadingMode: null,
      }),
    ).toBe(false);
    expect(
      shouldLoadNextAllPage({
        activeMode: "all",
        nextCursor: "50",
        loadingNextCursor: null,
        loadingMode: "around-me",
      }),
    ).toBe(false);
  });

  it("keeps Around Me radius at four", () => {
    expect(AROUND_ME_RADIUS).toBe(4);
  });
});

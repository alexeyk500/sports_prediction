import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import { selectOutcome } from "@/components/MatchesScreen/matches-actions";
import { PREDICTION_OUTCOME_ORDER } from "@/components/MatchesScreen/matches-outcomes";
import type { PredictionDto, TodayFixtureDto } from "@/lib/api/types";

const fixture: TodayFixtureDto = {
  id: "fixture-1",
  kickoffAt: "2026-09-05T15:00:00.000Z",
  competition: {
    id: "competition-1",
    code: "EPL",
    name: "Premier League",
    slug: "premier-league",
  },
  homeTeam: {
    id: "team-1",
    name: "Arsenal",
    slug: "arsenal",
    shortName: null,
  },
  awayTeam: {
    id: "team-2",
    name: "Chelsea",
    slug: "chelsea",
    shortName: null,
  },
  status: "OPEN",
  winningOutcome: null,
  outcomes: {
    home: { points: 13 },
    draw: { points: 24 },
    away: { points: 27 },
  },
};

const editablePrediction: PredictionDto = {
  id: "prediction-1",
  fixtureId: "fixture-1",
  selectedOutcome: "HOME",
  slotType: "FREE",
  potentialPoints: 13,
  earnedPoints: 0,
  resultStatus: "PENDING",
  kickoffAt: "2026-09-05T15:00:00.000Z",
  editable: true,
  fixture,
};

describe("Matches screen outcome actions", () => {
  it("keeps domain outcome order independent of document direction", () => {
    expect(PREDICTION_OUTCOME_ORDER).toEqual(["HOME", "DRAW", "AWAY"]);
  });

  it("creates a free prediction when no prediction exists", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
        canSubmitPrediction: true,
        createIdempotencyKey: () => "idem-1",
      }),
    ).resolves.toEqual({ status: "created" });
    expect(createPrediction).toHaveBeenCalledWith({
      fixtureId: "fixture-1",
      selectedOutcome: "HOME",
      idempotencyKey: "idem-1",
    });
    expect(updatePrediction).not.toHaveBeenCalled();
  });

  it("patches an existing editable prediction", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "DRAW",
        existingPrediction: editablePrediction,
        canSubmitPrediction: true,
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toEqual({ status: "updated" });
    expect(updatePrediction).toHaveBeenCalledWith({
      predictionId: "prediction-1",
      selectedOutcome: "DRAW",
    });
    expect(cancelPrediction).not.toHaveBeenCalled();
    expect(createPrediction).not.toHaveBeenCalled();
  });

  it("cancels an existing editable prediction when selected outcome is clicked again", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
        existingPrediction: editablePrediction,
        canSubmitPrediction: true,
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toEqual({ status: "cancelled" });
    expect(cancelPrediction).toHaveBeenCalledWith({
      predictionId: "prediction-1",
    });
    expect(updatePrediction).not.toHaveBeenCalled();
    expect(createPrediction).not.toHaveBeenCalled();
  });

  it("does not call API for locked prediction", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "AWAY",
        existingPrediction: { ...editablePrediction, editable: false },
        canSubmitPrediction: true,
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toMatchObject({ status: "locked" });
    expect(cancelPrediction).not.toHaveBeenCalled();
    expect(createPrediction).not.toHaveBeenCalled();
    expect(updatePrediction).not.toHaveBeenCalled();
  });

  it("surfaces rewarded-required placeholder state", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockRejectedValue(
      new ApiClientError(
        {
          code: "REWARDED_AD_REQUIRED",
          message: "Rewarded ad is required.",
          details: {},
        },
        429,
      ),
    );
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
        canSubmitPrediction: true,
        createIdempotencyKey: () => "idem-1",
      }),
    ).resolves.toMatchObject({ status: "reward-required" });
  });

  it("does not call API when presentation state blocks mutation", async () => {
    const cancelPrediction = vi.fn().mockResolvedValue({});
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { cancelPrediction, createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
        existingPrediction: editablePrediction,
        canSubmitPrediction: false,
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toEqual({ status: "blocked" });
    expect(cancelPrediction).not.toHaveBeenCalled();
    expect(createPrediction).not.toHaveBeenCalled();
    expect(updatePrediction).not.toHaveBeenCalled();
  });
});

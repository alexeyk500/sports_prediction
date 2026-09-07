import { describe, expect, it, vi } from "vitest";
import { ApiClientError } from "@/lib/api/client";
import { selectOutcome } from "@/components/PredictScreen/predict-actions";
import { PREDICTION_OUTCOME_ORDER } from "@/components/PredictScreen/predict-outcomes";
import type { PredictionDto } from "@/lib/api/types";

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
};

describe("Predict screen outcome actions", () => {
  it("keeps domain outcome order independent of document direction", () => {
    expect(PREDICTION_OUTCOME_ORDER).toEqual(["HOME", "DRAW", "AWAY"]);
  });

  it("creates a free prediction when no prediction exists", async () => {
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
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
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "DRAW",
        existingPrediction: editablePrediction,
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toEqual({ status: "updated" });
    expect(updatePrediction).toHaveBeenCalledWith({
      predictionId: "prediction-1",
      selectedOutcome: "DRAW",
    });
    expect(createPrediction).not.toHaveBeenCalled();
  });

  it("does not call API for locked prediction", async () => {
    const createPrediction = vi.fn().mockResolvedValue({});
    const updatePrediction = vi.fn().mockResolvedValue({});

    await expect(
      selectOutcome({
        apiClient: { createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "AWAY",
        existingPrediction: { ...editablePrediction, editable: false },
        createIdempotencyKey: () => "unused",
      }),
    ).resolves.toMatchObject({ status: "locked" });
    expect(createPrediction).not.toHaveBeenCalled();
    expect(updatePrediction).not.toHaveBeenCalled();
  });

  it("surfaces rewarded-required placeholder state", async () => {
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
        apiClient: { createPrediction, updatePrediction },
        fixtureId: "fixture-1",
        selectedOutcome: "HOME",
        createIdempotencyKey: () => "idem-1",
      }),
    ).resolves.toMatchObject({ status: "reward-required" });
  });
});

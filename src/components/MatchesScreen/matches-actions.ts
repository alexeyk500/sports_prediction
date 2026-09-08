"use client";

import { ApiClientError, type ApiClient } from "@/lib/api/client";
import type { PredictionDto, PredictionOutcome } from "@/lib/api/types";

export type MatchesActionResult =
  | { status: "created" | "updated" }
  | { status: "reward-required" }
  | { status: "locked" };

export interface SelectOutcomeInput {
  apiClient: Pick<ApiClient, "createPrediction" | "updatePrediction">;
  fixtureId: string;
  selectedOutcome: PredictionOutcome;
  existingPrediction?: PredictionDto;
  createIdempotencyKey: () => string;
}

export async function selectOutcome(
  input: SelectOutcomeInput,
): Promise<MatchesActionResult> {
  if (input.existingPrediction) {
    if (!input.existingPrediction.editable) {
      return { status: "locked" };
    }

    try {
      await input.apiClient.updatePrediction({
        predictionId: input.existingPrediction.id,
        selectedOutcome: input.selectedOutcome,
      });

      return { status: "updated" };
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "PREDICTION_LOCKED"
      ) {
        return { status: "locked" };
      }

      throw error;
    }
  }

  try {
    await input.apiClient.createPrediction({
      fixtureId: input.fixtureId,
      selectedOutcome: input.selectedOutcome,
      idempotencyKey: input.createIdempotencyKey(),
    });

    return { status: "created" };
  } catch (error) {
    if (
      error instanceof ApiClientError &&
      error.code === "REWARDED_AD_REQUIRED"
    ) {
      return { status: "reward-required" };
    }

    throw error;
  }
}

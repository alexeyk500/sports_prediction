import type { PredictionOutcome, PredictionSlotType } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

export const FREE_PREDICTION_LIMIT = 3;
export const REWARDED_PREDICTION_LIMIT = 5;
export const DAILY_PREDICTION_LIMIT = FREE_PREDICTION_LIMIT + REWARDED_PREDICTION_LIMIT;

export interface DailyPredictionUsageState {
  freeUsed: number;
  rewardedUsed: number;
}

export function resolvePredictionSlotType(
  usage: DailyPredictionUsageState,
  hasAdReward: boolean,
): PredictionSlotType {
  const totalUsed = usage.freeUsed + usage.rewardedUsed;

  if (usage.freeUsed < FREE_PREDICTION_LIMIT) {
    return "FREE";
  }

  if (totalUsed >= DAILY_PREDICTION_LIMIT || usage.rewardedUsed >= REWARDED_PREDICTION_LIMIT) {
    throw new DomainError(
      "DAILY_PREDICTION_LIMIT_REACHED",
      "Daily prediction limit reached.",
      { ...usage },
    );
  }

  if (!hasAdReward) {
    throw new DomainError("REWARDED_AD_REQUIRED", "Rewarded ad is required.", { ...usage });
  }

  return "REWARDED";
}

export function getSnapshotValuesForOutcome(
  snapshot: {
    homeProbability: unknown;
    drawProbability: unknown;
    awayProbability: unknown;
    homePoints: number;
    drawPoints: number;
    awayPoints: number;
  },
  selectedOutcome: PredictionOutcome,
) {
  switch (selectedOutcome) {
    case "HOME":
      return {
        probabilityAtPrediction: snapshot.homeProbability,
        potentialPoints: snapshot.homePoints,
      };
    case "DRAW":
      return {
        probabilityAtPrediction: snapshot.drawProbability,
        potentialPoints: snapshot.drawPoints,
      };
    case "AWAY":
      return {
        probabilityAtPrediction: snapshot.awayProbability,
        potentialPoints: snapshot.awayPoints,
      };
  }
}

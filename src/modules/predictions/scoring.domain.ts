import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";
import {
  calculatePredictionPointsCore,
  MAX_PREDICTION_POINTS,
  MIN_PREDICTION_POINTS,
  normalizeOneXTwoOddsCore,
  SCORING_NUMERATOR,
  SCORING_VERSION,
  type NormalizedOneXTwoProbabilitiesCore,
  type RawOneXTwoOddsCore,
  ScoringInputError,
} from "./scoring.core";

export {
  MAX_PREDICTION_POINTS,
  MIN_PREDICTION_POINTS,
  SCORING_NUMERATOR,
  SCORING_VERSION,
};

export type RawOneXTwoOdds = RawOneXTwoOddsCore;

export type NormalizedOneXTwoProbabilities = NormalizedOneXTwoProbabilitiesCore;

export function calculatePredictionPoints(
  probability: Prisma.Decimal.Value,
): number {
  try {
    return calculatePredictionPointsCore(probability);
  } catch (error) {
    throw mapScoringError(error);
  }
}

export function normalizeOneXTwoOdds(
  odds: RawOneXTwoOdds,
): NormalizedOneXTwoProbabilities {
  try {
    return normalizeOneXTwoOddsCore(odds);
  } catch (error) {
    throw mapScoringError(error);
  }
}

function mapScoringError(error: unknown): Error {
  if (error instanceof ScoringInputError) {
    return new DomainError(error.code, error.message);
  }

  return error instanceof Error
    ? error
    : new Error("Unexpected scoring error.");
}

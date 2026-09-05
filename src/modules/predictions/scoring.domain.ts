import { Prisma } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

export const SCORING_VERSION = "v1";
export const MIN_PREDICTION_POINTS = 7;
export const MAX_PREDICTION_POINTS = 50;
export const SCORING_NUMERATOR = new Prisma.Decimal("6.5");

export interface RawOneXTwoOdds {
  home: Prisma.Decimal.Value;
  draw: Prisma.Decimal.Value;
  away: Prisma.Decimal.Value;
}

export interface NormalizedOneXTwoProbabilities {
  home: Prisma.Decimal;
  draw: Prisma.Decimal;
  away: Prisma.Decimal;
}

export function calculatePredictionPoints(probability: Prisma.Decimal.Value): number {
  const normalizedProbability = parseProbability(probability);
  const rawPoints = SCORING_NUMERATOR.div(normalizedProbability).round().toNumber();
  const clampedPoints = Math.min(MAX_PREDICTION_POINTS, Math.max(MIN_PREDICTION_POINTS, rawPoints));

  return Math.round(clampedPoints);
}

export function normalizeOneXTwoOdds(odds: RawOneXTwoOdds): NormalizedOneXTwoProbabilities {
  const homeOdds = parsePositiveDecimal(odds.home, "home odds");
  const drawOdds = parsePositiveDecimal(odds.draw, "draw odds");
  const awayOdds = parsePositiveDecimal(odds.away, "away odds");

  const homeImplied = new Prisma.Decimal(1).div(homeOdds);
  const drawImplied = new Prisma.Decimal(1).div(drawOdds);
  const awayImplied = new Prisma.Decimal(1).div(awayOdds);
  const impliedTotal = homeImplied.plus(drawImplied).plus(awayImplied);

  if (impliedTotal.lte(0)) {
    throw new DomainError("INVALID_ODDS", "Implied probability total must be greater than zero.");
  }

  return {
    home: homeImplied.div(impliedTotal),
    draw: drawImplied.div(impliedTotal),
    away: awayImplied.div(impliedTotal),
  };
}

function parseProbability(probability: Prisma.Decimal.Value): Prisma.Decimal {
  const decimal = parsePositiveDecimal(probability, "probability");

  if (decimal.gt(1)) {
    throw new DomainError("INVALID_PROBABILITY", "Probability must be less than or equal to 1.");
  }

  return decimal;
}

function parsePositiveDecimal(value: Prisma.Decimal.Value, fieldName: string): Prisma.Decimal {
  let decimal: Prisma.Decimal;

  try {
    decimal = new Prisma.Decimal(value);
  } catch {
    throw new DomainError(
      fieldName === "probability" ? "INVALID_PROBABILITY" : "INVALID_ODDS",
      `${fieldName} must be a valid decimal.`,
    );
  }

  if (!decimal.isFinite()) {
    throw new DomainError(
      fieldName === "probability" ? "INVALID_PROBABILITY" : "INVALID_ODDS",
      `${fieldName} must be finite.`,
    );
  }

  if (decimal.lte(0)) {
    throw new DomainError(
      fieldName === "probability" ? "INVALID_PROBABILITY" : "INVALID_ODDS",
      `${fieldName} must be greater than zero.`,
    );
  }

  return decimal;
}

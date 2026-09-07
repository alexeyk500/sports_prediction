export type DomainErrorCode =
  | "NO_ACTIVE_TOURNAMENT"
  | "TOURNAMENT_NOT_ACTIVE"
  | "FIXTURE_NOT_FOUND"
  | "FIXTURE_NOT_OPEN"
  | "FIXTURE_NOT_IN_DAILY_POOL"
  | "FIXTURE_LOCKED"
  | "FIXTURE_SCORING_SNAPSHOT_MISSING"
  | "COMPETITION_NOT_SUPPORTED"
  | "COMPETITION_INACTIVE"
  | "OUTCOME_SNAPSHOT_NOT_PUBLISHABLE"
  | "PREDICTION_NOT_FOUND"
  | "PREDICTION_LOCKED"
  | "PREDICTION_ALREADY_EXISTS"
  | "FREE_PREDICTION_LIMIT_REACHED"
  | "DAILY_PREDICTION_LIMIT_REACHED"
  | "REWARDED_AD_REQUIRED"
  | "INVALID_AD_REWARD"
  | "AD_REWARD_ALREADY_CONSUMED"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_ODDS"
  | "INVALID_PROBABILITY";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: DomainErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "DomainError";
    this.code = code;
    this.details = details;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

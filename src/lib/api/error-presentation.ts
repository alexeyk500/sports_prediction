import { ApiClientError } from "./client";
import { translate, type TranslationKey } from "@/lib/i18n/i18n";
import type { SupportedLocale } from "@/lib/i18n/locales";

const apiErrorKeys: Partial<Record<string, TranslationKey>> = {
  MISSING_TELEGRAM_INIT_DATA: "errors.missingTelegramInitData",
  NETWORK_ERROR: "errors.network",
  INVALID_API_RESPONSE: "errors.invalidApiResponse",
  PREDICTION_LOCKED: "errors.PREDICTION_LOCKED",
  DAILY_PREDICTION_LIMIT_REACHED: "errors.DAILY_PREDICTION_LIMIT_REACHED",
  FREE_PREDICTION_LIMIT_REACHED: "errors.FREE_PREDICTION_LIMIT_REACHED",
  REWARDED_AD_REQUIRED: "errors.REWARDED_AD_REQUIRED",
  AD_REWARD_NOT_ELIGIBLE: "errors.AD_REWARD_NOT_ELIGIBLE",
  FIXTURE_NOT_IN_DAILY_POOL: "errors.FIXTURE_NOT_IN_DAILY_POOL",
  FIXTURE_NOT_FOUND: "errors.FIXTURE_NOT_FOUND",
  FIXTURE_NOT_OPEN: "errors.FIXTURE_NOT_OPEN",
  FIXTURE_LOCKED: "errors.FIXTURE_LOCKED",
  FIXTURE_SCORING_SNAPSHOT_MISSING: "errors.FIXTURE_SCORING_SNAPSHOT_MISSING",
  COMPETITION_NOT_SUPPORTED: "errors.COMPETITION_NOT_SUPPORTED",
  COMPETITION_INACTIVE: "errors.COMPETITION_INACTIVE",
  PREDICTION_ALREADY_EXISTS: "errors.PREDICTION_ALREADY_EXISTS",
  PREDICTION_NOT_FOUND: "errors.PREDICTION_NOT_FOUND",
  INVALID_AD_REWARD: "errors.INVALID_AD_REWARD",
  AD_REWARD_ALREADY_CONSUMED: "errors.AD_REWARD_ALREADY_CONSUMED",
  IDEMPOTENCY_CONFLICT: "errors.IDEMPOTENCY_CONFLICT",
  PRIZE_ENTITLEMENT_NOT_FOUND: "errors.PRIZE_ENTITLEMENT_NOT_FOUND",
  PRIZE_NOT_READY_TO_CLAIM: "errors.PRIZE_NOT_READY_TO_CLAIM",
  PRIZE_CLAIM_ALREADY_EXISTS: "errors.PRIZE_CLAIM_ALREADY_EXISTS",
  PRIZE_CLAIM_READ_ONLY: "errors.PRIZE_CLAIM_READ_ONLY",
  INVALID_TRC20_ADDRESS: "errors.INVALID_TRC20_ADDRESS",
};

export function messageForApiError(
  error: unknown,
  locale: SupportedLocale,
  options: { includeDiagnostics?: boolean } = {},
): string {
  if (!(error instanceof ApiClientError)) {
    return translate(locale, "errors.generic");
  }

  const includeDiagnostics =
    options.includeDiagnostics ?? process.env.NODE_ENV === "development";

  if (includeDiagnostics) {
    return `${error.code}${error.endpoint ? ` at ${error.endpoint}` : ""}: ${error.message}`;
  }

  return translate(locale, apiErrorKeys[error.code] ?? "errors.generic");
}

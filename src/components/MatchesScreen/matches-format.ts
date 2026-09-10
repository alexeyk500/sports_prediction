import type { PredictionDto, PredictionOutcome } from "@/lib/api/types";
import type { useTranslation } from "@/lib/i18n/use-translation";
import type { MatchCardStatusIntent } from "./MatchCardShared/match-card-presentation";
import type { KnownFixtureStatus, RewardFlowStatus } from "./matches-types";

export function outcomeLabel(
  t: ReturnType<typeof useTranslation>["t"],
  outcome: PredictionOutcome,
): string {
  return t(`matches.outcomes.${outcome}`);
}

export function slotLabel(
  t: ReturnType<typeof useTranslation>["t"],
  slotType: PredictionDto["slotType"],
): string {
  return t(`matches.slot.${slotType}`);
}

export function fixtureStatusLabel(
  t: ReturnType<typeof useTranslation>["t"],
  status: string,
): string {
  return isKnownFixtureStatus(status)
    ? t(`matches.fixtureStatus.${status}`)
    : status;
}

export function matchCardStatusLabel(
  t: ReturnType<typeof useTranslation>["t"],
  intent: MatchCardStatusIntent,
): string | null {
  if (intent === "NONE") {
    return null;
  }

  return t(`matches.statusIntent.${intent}`);
}

export function rewardFlowStatusLabel(
  t: ReturnType<typeof useTranslation>["t"],
  status?: RewardFlowStatus,
): string {
  switch (status) {
    case "required":
      return t("matches.reward.status.required");
    case "preloading":
      return t("matches.reward.status.preloading");
    case "ready":
      return t("matches.reward.status.ready");
    case "showing":
      return t("matches.reward.status.showing");
    case "confirming":
      return t("matches.reward.status.confirming");
    case "failed":
      return t("matches.reward.status.failed");
    case "rejected":
      return t("matches.reward.status.rejected");
    case "timeout":
      return t("matches.reward.status.timeout");
    case undefined:
      return t("matches.reward.body");
  }
}

function isKnownFixtureStatus(status: string): status is KnownFixtureStatus {
  return ["DRAFT", "OPEN", "LOCKED", "LIVE", "FINISHED", "SETTLED"].includes(
    status,
  );
}

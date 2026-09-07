import type { PredictionDto, PredictionOutcome } from "@/lib/api/types";
import type { useTranslation } from "@/lib/i18n/use-translation";
import type { KnownFixtureStatus } from "./predict-types";

export function outcomeLabel(t: ReturnType<typeof useTranslation>["t"], outcome: PredictionOutcome): string {
  return t(`predict.outcomes.${outcome}`);
}

export function slotLabel(t: ReturnType<typeof useTranslation>["t"], slotType: PredictionDto["slotType"]): string {
  return t(`predict.slot.${slotType}`);
}

export function fixtureStatusLabel(t: ReturnType<typeof useTranslation>["t"], status: string): string {
  return isKnownFixtureStatus(status) ? t(`predict.fixtureStatus.${status}`) : status;
}

function isKnownFixtureStatus(status: string): status is KnownFixtureStatus {
  return ["DRAFT", "OPEN", "LOCKED", "LIVE", "FINISHED", "SETTLED"].includes(status);
}

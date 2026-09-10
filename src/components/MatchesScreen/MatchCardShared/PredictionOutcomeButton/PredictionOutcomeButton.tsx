import type React from "react";
import type { PredictionOutcome, TodayFixtureDto } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import TrophyValue from "../TrophyValue/TrophyValue";
import {
  outcomeDisplayLabel,
  pointsForOutcome,
  trophyAriaValues,
} from "../match-card-presentation";
import styles from "./PredictionOutcomeButton.module.css";

interface IPredictionOutcomeButtonProps {
  fixture: TodayFixtureDto;
  outcome: PredictionOutcome;
  selected: boolean;
  disabled: boolean;
  result?: "success" | "wrong";
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
  outcomeLabel: string;
}

const PredictionOutcomeButton: React.FC<IPredictionOutcomeButtonProps> = ({
  fixture,
  outcome,
  selected,
  disabled,
  result,
  onSelectOutcome,
  outcomeLabel,
}) => {
  const { t, locale } = useTranslation();
  const points = pointsForOutcome(fixture, outcome);
  const className =
    result === "success"
      ? styles.successOutcome
      : result === "wrong"
        ? styles.wrongOutcome
        : selected
          ? styles.selectedOutcome
          : styles.outcomeButton;

  return (
    <button
      type="button"
      className={className}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={t("matches.aria.selectOutcome", {
        outcome: outcomeLabel,
        trophyValue: t("common.trophyCount", trophyAriaValues(locale, points)),
        homeTeam: fixture.homeTeam.name,
        awayTeam: fixture.awayTeam.name,
      })}
      data-outcome={outcome}
      onClick={() => {
        if (disabled) {
          return;
        }

        void onSelectOutcome(fixture.id, outcome);
      }}
    >
      <span className={styles.outcomeCode}>{outcomeDisplayLabel(outcome)}</span>
      <TrophyValue value={points} />
    </button>
  );
};

export default PredictionOutcomeButton;

import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { formatKickoffTime } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeagueBadge from "../../MatchCardShared/LeagueBadge/LeagueBadge";
import MatchCardAmbientBackground from "../../MatchCardShared/MatchCardAmbientBackground/MatchCardAmbientBackground";
import PredictionOutcomeButton from "../../MatchCardShared/PredictionOutcomeButton/PredictionOutcomeButton";
import TeamIdentity from "../../MatchCardShared/TeamIdentity/TeamIdentity";
import TrophyValue from "../../MatchCardShared/TrophyValue/TrophyValue";
import {
  deriveMatchCardState,
  getCompetitionBadge,
  getTeamBadge,
} from "../../MatchCardShared/match-card-presentation";
import {
  matchCardStatusLabel,
  outcomeLabel,
  slotLabel,
} from "../../matches-format";
import { PREDICTION_OUTCOME_ORDER } from "../../matches-outcomes";
import styles from "./MyPickCard.module.css";

interface IMyPickCardProps {
  prediction: PredictionDto;
  fixture?: TodayFixtureDto;
  pending: boolean;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const MyPickCard: React.FC<IMyPickCardProps> = ({
  prediction,
  fixture,
  pending,
  onSelectOutcome,
}) => {
  const { t, locale } = useTranslation();
  const homeBadge = fixture ? getTeamBadge(fixture.homeTeam) : undefined;
  const awayBadge = fixture ? getTeamBadge(fixture.awayTeam) : undefined;
  const cardState = fixture
    ? deriveMatchCardState({
        fixture,
        prediction,
        pending,
        rewardRequired: false,
      })
    : null;
  const statusLabel = cardState
    ? (matchCardStatusLabel(t, cardState.statusIntent) ??
      t("matches.status.editable"))
    : prediction.editable
      ? t("matches.status.editable")
      : t("matches.status.locked");

  return (
    <article className={styles.fixtureCard}>
      <MatchCardAmbientBackground
        homeLogoUrl={homeBadge?.logoUrl}
        awayLogoUrl={awayBadge?.logoUrl}
        className={styles.ambientLayer}
      />
      <div className={styles.fixtureCardContent}>
        <div className={styles.fixtureMeta}>
          {fixture ? (
            <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
          ) : (
            <span dir="auto">{t("matches.status.fixtureFallback")}</span>
          )}
          <time dateTime={prediction.kickoffAt}>
            {formatKickoffTime(locale, prediction.kickoffAt)}
          </time>
        </div>
        {fixture && homeBadge && awayBadge ? (
          <div className={styles.matchup}>
            <TeamIdentity badge={homeBadge} name={fixture.homeTeam.name} />
            <span className={styles.versus}>VS</span>
            <TeamIdentity badge={awayBadge} name={fixture.awayTeam.name} />
          </div>
        ) : null}
        <div className={styles.pickRow}>
          <strong>{outcomeLabel(t, prediction.selectedOutcome)}</strong>
          <TrophyValue value={prediction.potentialPoints} />
          <span>{slotLabel(t, prediction.slotType)}</span>
          <span>{statusLabel}</span>
        </div>
        {fixture && cardState ? (
          <div className={styles.outcomes}>
            {PREDICTION_OUTCOME_ORDER.map((outcome) => (
              <PredictionOutcomeButton
                key={outcome}
                fixture={fixture}
                outcome={outcome}
                selected={cardState.selectedOutcome === outcome}
                disabled={!cardState.canSubmitPrediction}
                result={cardState.outcomeResults[outcome]}
                onSelectOutcome={onSelectOutcome}
                outcomeLabel={outcomeLabel(t, outcome)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default MyPickCard;

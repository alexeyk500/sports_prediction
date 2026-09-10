import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { formatKickoffTime } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeagueBadge from "../../../MatchCardShared/LeagueBadge/LeagueBadge";
import MatchCardAmbientBackground from "../../../MatchCardShared/MatchCardAmbientBackground/MatchCardAmbientBackground";
import PredictionOutcomeButton from "../../../MatchCardShared/PredictionOutcomeButton/PredictionOutcomeButton";
import TeamIdentity from "../../../MatchCardShared/TeamIdentity/TeamIdentity";
import {
  deriveMatchCardState,
  getCompetitionBadge,
  getTeamBadge,
} from "../../../MatchCardShared/match-card-presentation";
import { PREDICTION_OUTCOME_ORDER } from "../../../matches-outcomes";
import type { RewardFlowPresentation } from "../../../matches-types";
import {
  matchCardStatusLabel,
  rewardFlowStatusLabel,
} from "../../../matches-format";
import styles from "./MatchCard.module.css";

interface IMatchCardProps {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardRequired: boolean;
  rewardFlow?: RewardFlowPresentation;
  onStartReward: (fixtureId: string) => Promise<void>;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
  outcomeLabel: (outcome: PredictionOutcome) => string;
}

const MatchCard: React.FC<IMatchCardProps> = ({
  fixture,
  prediction,
  pending,
  rewardRequired,
  rewardFlow,
  onStartReward,
  onSelectOutcome,
  outcomeLabel,
}) => {
  const { t, locale } = useTranslation();
  const homeBadge = getTeamBadge(fixture.homeTeam);
  const awayBadge = getTeamBadge(fixture.awayTeam);
  const cardState = deriveMatchCardState({
    fixture,
    prediction,
    pending,
    rewardRequired,
  });
  const statusLabel = matchCardStatusLabel(t, cardState.statusIntent);

  return (
    <article className={styles.fixtureCard}>
      <MatchCardAmbientBackground
        homeLogoUrl={homeBadge.logoUrl}
        awayLogoUrl={awayBadge.logoUrl}
        className={styles.ambientLayer}
      />
      <div className={styles.fixtureCardContent}>
        <div className={styles.fixtureMeta}>
          <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
          <time dateTime={fixture.kickoffAt}>
            {formatKickoffTime(locale, fixture.kickoffAt)}
          </time>
        </div>
        <div className={styles.matchup}>
          <TeamIdentity badge={homeBadge} name={fixture.homeTeam.name} />
          <span className={styles.versus}>VS</span>
          <TeamIdentity badge={awayBadge} name={fixture.awayTeam.name} />
        </div>
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
              outcomeLabel={outcomeLabel(outcome)}
            />
          ))}
        </div>
        <div className={styles.fixtureStatus} data-ui="match-card-status-slot">
          {statusLabel ? (
            <span className={styles.statusBadge}>{statusLabel}</span>
          ) : null}
        </div>
        {rewardRequired ? (
          <div className={styles.rewardPlaceholder}>
            <strong>{t("matches.reward.title")}</strong>
            <span>{rewardFlowStatusLabel(t, rewardFlow?.status)}</span>
            <button
              className={styles.rewardButton}
              type="button"
              disabled={
                rewardFlow !== undefined &&
                ![
                  "required",
                  "ready",
                  "failed",
                  "rejected",
                  "timeout",
                ].includes(rewardFlow.status)
              }
              onClick={() => void onStartReward(fixture.id)}
            >
              {t("matches.reward.start")}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default MatchCard;

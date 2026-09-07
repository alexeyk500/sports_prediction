import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { formatKickoffTime } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeagueBadge from "../../../MatchCardShared/LeagueBadge/LeagueBadge";
import PredictionOutcomeButton from "../../../MatchCardShared/PredictionOutcomeButton/PredictionOutcomeButton";
import TeamIdentity from "../../../MatchCardShared/TeamIdentity/TeamIdentity";
import {
  getCompetitionBadge,
  getTeamBadge,
} from "../../../MatchCardShared/match-card-presentation";
import { PREDICTION_OUTCOME_ORDER } from "../../../predict-outcomes";
import LockIcon from "./LockIcon/LockIcon";
import styles from "./MatchCard.module.css";

interface IMatchCardProps {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardRequired: boolean;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
  fixtureStatusLabel: (status: string) => string;
  outcomeLabel: (outcome: PredictionOutcome) => string;
}

const MatchCard: React.FC<IMatchCardProps> = ({
  fixture,
  prediction,
  pending,
  rewardRequired,
  onSelectOutcome,
  fixtureStatusLabel,
  outcomeLabel,
}) => {
  const { t, locale } = useTranslation();
  const editable = prediction ? prediction.editable : true;
  const showLockedStatus = prediction !== undefined && !editable;
  const showFixtureStatus =
    prediction === undefined && fixture.status !== "OPEN";
  const showStatusRow = showLockedStatus || showFixtureStatus || pending;

  return (
    <article className={styles.fixtureCard}>
      <div className={styles.fixtureMeta}>
        <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
        <time dateTime={fixture.kickoffAt}>
          {formatKickoffTime(locale, fixture.kickoffAt)}
        </time>
      </div>
      <div className={styles.matchup}>
        <TeamIdentity
          badge={getTeamBadge(fixture.homeTeam)}
          name={fixture.homeTeam.name}
        />
        <span className={styles.versus}>VS</span>
        <TeamIdentity
          badge={getTeamBadge(fixture.awayTeam)}
          name={fixture.awayTeam.name}
        />
      </div>
      <div className={styles.outcomes}>
        {PREDICTION_OUTCOME_ORDER.map((outcome) => (
          <PredictionOutcomeButton
            key={outcome}
            fixture={fixture}
            outcome={outcome}
            selected={prediction?.selectedOutcome === outcome}
            disabled={pending || !editable}
            onSelectOutcome={onSelectOutcome}
            outcomeLabel={outcomeLabel(outcome)}
          />
        ))}
      </div>
      {showStatusRow ? (
        <div className={styles.fixtureStatus}>
          {showLockedStatus ? (
            <span className={styles.statusItem}>
              <LockIcon />
              <span>{t("predict.status.lockedAfterKickoff")}</span>
            </span>
          ) : null}
          {showFixtureStatus ? (
            <span>{fixtureStatusLabel(fixture.status)}</span>
          ) : null}
          {pending ? <span>{t("predict.status.saving")}</span> : null}
        </div>
      ) : null}
      {rewardRequired ? (
        <div className={styles.rewardPlaceholder}>
          <strong>{t("predict.reward.title")}</strong>
          <span>{t("predict.reward.body")}</span>
        </div>
      ) : null}
    </article>
  );
};

export default MatchCard;

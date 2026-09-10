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
  getCompetitionBadge,
  getTeamBadge,
} from "../../../MatchCardShared/match-card-presentation";
import { PREDICTION_OUTCOME_ORDER } from "../../../matches-outcomes";
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
  const homeBadge = getTeamBadge(fixture.homeTeam);
  const awayBadge = getTeamBadge(fixture.awayTeam);

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
                <span>{t("matches.status.lockedAfterKickoff")}</span>
              </span>
            ) : null}
            {showFixtureStatus ? (
              <span className={styles.statusBadge}>
                {fixtureStatusLabel(fixture.status)}
              </span>
            ) : null}
            {pending ? (
              <span className={styles.statusBadge}>
                {t("matches.status.saving")}
              </span>
            ) : null}
          </div>
        ) : null}
        {rewardRequired ? (
          <div className={styles.rewardPlaceholder}>
            <strong>{t("matches.reward.title")}</strong>
            <span>{t("matches.reward.body")}</span>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default MatchCard;

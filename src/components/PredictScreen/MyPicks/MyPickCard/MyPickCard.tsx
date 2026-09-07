import type React from "react";
import type {
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { formatKickoffTime } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeagueBadge from "../../MatchCardShared/LeagueBadge/LeagueBadge";
import PredictionOutcomeButton from "../../MatchCardShared/PredictionOutcomeButton/PredictionOutcomeButton";
import TeamIdentity from "../../MatchCardShared/TeamIdentity/TeamIdentity";
import TrophyValue from "../../MatchCardShared/TrophyValue/TrophyValue";
import {
  getCompetitionBadge,
  getTeamBadge,
} from "../../MatchCardShared/match-card-presentation";
import { outcomeLabel, slotLabel } from "../../predict-format";
import { PREDICTION_OUTCOME_ORDER } from "../../predict-outcomes";
import styles from "./MyPickCard.module.css";

interface IMyPickCardProps {
  prediction: PredictionDto;
  fixture?: TodayFixtureDto;
  onSelectOutcome: (
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ) => Promise<void>;
}

const MyPickCard: React.FC<IMyPickCardProps> = ({
  prediction,
  fixture,
  onSelectOutcome,
}) => {
  const { t, locale } = useTranslation();

  return (
    <article className={styles.fixtureCard}>
      <div className={styles.fixtureMeta}>
        {fixture ? (
          <LeagueBadge badge={getCompetitionBadge(fixture.competition)} />
        ) : (
          <span dir="auto">{t("predict.status.fixtureFallback")}</span>
        )}
        <time dateTime={prediction.kickoffAt}>
          {formatKickoffTime(locale, prediction.kickoffAt)}
        </time>
      </div>
      {fixture ? (
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
      ) : null}
      <div className={styles.pickRow}>
        <strong>{outcomeLabel(t, prediction.selectedOutcome)}</strong>
        <TrophyValue value={prediction.potentialPoints} />
        <span>{slotLabel(t, prediction.slotType)}</span>
        <span>
          {prediction.editable
            ? t("predict.status.editable")
            : t("predict.status.locked")}
        </span>
      </div>
      {fixture && prediction.editable ? (
        <div className={styles.outcomes}>
          {PREDICTION_OUTCOME_ORDER.map((outcome) => (
            <PredictionOutcomeButton
              key={outcome}
              fixture={fixture}
              outcome={outcome}
              selected={prediction.selectedOutcome === outcome}
              disabled={false}
              onSelectOutcome={onSelectOutcome}
              outcomeLabel={outcomeLabel(t, outcome)}
            />
          ))}
        </div>
      ) : null}
    </article>
  );
};

export default MyPickCard;

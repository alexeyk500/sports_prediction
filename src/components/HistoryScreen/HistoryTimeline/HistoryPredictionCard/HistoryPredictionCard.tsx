import type React from "react";
import Image from "next/image";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import type {
  CupHistoryPredictionDto,
  PredictionOutcome,
} from "@/lib/api/types";
import {
  getCompetitionAssetUrl,
  getTeamAssetUrl,
} from "@/lib/assets/football-assets";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatHistoryKickoff } from "../../history-format";
import styles from "./HistoryPredictionCard.module.css";

interface IHistoryPredictionCardProps {
  prediction: CupHistoryPredictionDto;
  timeZone: string;
}

const HistoryPredictionCard: React.FC<IHistoryPredictionCardProps> = ({
  prediction,
  timeZone,
}) => {
  const { t, locale } = useTranslation();
  const statusClassName = statusClassFor(prediction.resultStatus);
  const rewardValue =
    prediction.resultStatus === "PENDING"
      ? prediction.potentialPoints
      : prediction.earnedPoints;

  return (
    <article className={styles.historyItem}>
      <span className={statusClassName} aria-hidden="true">
        <StatusIcon status={prediction.resultStatus} />
      </span>
      <div className={styles.card}>
        <div className={styles.metaRow}>
          <span className={styles.league}>
            <Badge
              label={prediction.competition.name}
              logoUrl={getCompetitionAssetUrl(prediction.competition.slug)}
              size="small"
            />
            <span dir="auto">{prediction.competition.name}</span>
          </span>
          <time dateTime={prediction.kickoffAt}>
            {formatHistoryKickoff(locale, prediction.kickoffAt, timeZone)}
          </time>
        </div>
        <div className={styles.matchRow}>
          <Team
            name={prediction.homeTeam.name}
            logoUrl={getTeamAssetUrl(prediction.homeTeam.slug)}
          />
          <strong className={styles.score}>{scoreLabel(prediction)}</strong>
          <Team
            name={prediction.awayTeam.name}
            logoUrl={getTeamAssetUrl(prediction.awayTeam.slug)}
            align="end"
          />
        </div>
        <div className={styles.pickRow}>
          <div className={styles.pickText}>
            <span>
              {t("history.card.yourPick", {
                pick: outcomeDisplayLabel(prediction.selectedOutcome),
              })}
            </span>
            <span>{t("history.card.marketFullTime")}</span>
          </div>
          <span className={statusClassName}>
            {t(`history.status.${prediction.resultStatus}`)}
          </span>
          <span className={styles.reward}>
            <span>
              {prediction.resultStatus === "INCORRECT" ? null : "+"}
              {formatLocalizedNumber(locale, rewardValue)}
            </span>
            <TrophyIcon className={styles.trophyIcon} />
          </span>
        </div>
      </div>
    </article>
  );
};

export default HistoryPredictionCard;

interface IBadgeProps {
  label: string;
  logoUrl?: string;
  size: "small" | "large";
}

const Badge: React.FC<IBadgeProps> = ({ label, logoUrl, size }) => {
  const className = size === "large" ? styles.badgeLarge : styles.badgeSmall;
  const imageSize = size === "large" ? 40 : 25;

  return (
    <span className={className}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          aria-hidden="true"
          width={imageSize}
          height={imageSize}
        />
      ) : (
        initials(label)
      )}
    </span>
  );
};

interface ITeamProps {
  name: string;
  logoUrl?: string;
  align?: "start" | "end";
}

const Team: React.FC<ITeamProps> = ({ name, logoUrl, align = "start" }) => {
  const className = align === "end" ? styles.teamEnd : styles.team;

  return (
    <span className={className}>
      <Badge label={name} logoUrl={logoUrl} size="large" />
      <span dir="auto">{name}</span>
    </span>
  );
};

interface IStatusIconProps {
  status: CupHistoryPredictionDto["resultStatus"];
}

const StatusIcon: React.FC<IStatusIconProps> = ({ status }) => {
  if (status === "CORRECT") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m9.2 15.4-3.1-3.1-1.8 1.8 4.9 4.9 10.5-10.5-1.8-1.8-8.7 8.7Z" />
      </svg>
    );
  }

  if (status === "INCORRECT") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="m7 5.4-1.6 1.6 5 5-5 5 1.6 1.6 5-5 5 5 1.6-1.6-5-5 5-5L17 5.4l-5 5-5-5Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm1 3v3.4l2.4 1.4-1 1.7-3.4-2V9h2Z" />
    </svg>
  );
};

function statusClassFor(
  status: CupHistoryPredictionDto["resultStatus"],
): string {
  switch (status) {
    case "CORRECT":
      return styles.statusCorrect;
    case "INCORRECT":
      return styles.statusWrong;
    case "PENDING":
      return styles.statusPending;
  }
}

function scoreLabel(prediction: CupHistoryPredictionDto): string {
  if (
    prediction.resultStatus !== "PENDING" &&
    prediction.homeScore !== null &&
    prediction.awayScore !== null
  ) {
    return `${prediction.homeScore} : ${prediction.awayScore}`;
  }

  return "VS";
}

function outcomeDisplayLabel(outcome: PredictionOutcome): "1" | "X" | "2" {
  switch (outcome) {
    case "HOME":
      return "1";
    case "DRAW":
      return "X";
    case "AWAY":
      return "2";
  }
}

function initials(label: string): string {
  const words = label
    .replace(/[^A-Za-z0-9А-Яа-яЁё\u0600-\u06FF ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "?";
  }

  return words.length === 1
    ? words[0].slice(0, 2).toUpperCase()
    : `${words[0][0]}${words.at(-1)?.[0] ?? ""}`.toUpperCase();
}

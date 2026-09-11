import type React from "react";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import type { BootstrapResponse } from "@/lib/api/types";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatHistoryDateRange } from "../history-format";
import styles from "./HistoryHero.module.css";

interface IHistoryHeroProps {
  tournament: NonNullable<BootstrapResponse["currentTournament"]>;
  rank: number | null;
  cupReward: number;
  correct: number;
  wrong: number;
}

const HistoryHero: React.FC<IHistoryHeroProps> = ({
  tournament,
  rank,
  cupReward,
  correct,
  wrong,
}) => {
  const { t, locale } = useTranslation();

  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <div>
          <h2>{t("cup.weeklyCup")}</h2>
          <p>
            {formatHistoryDateRange(
              locale,
              tournament.startsAt,
              tournament.endsAt,
            )}
          </p>
        </div>
        <div className={styles.heroMetrics}>
          <div>
            <span className={styles.metricLabel}>{t("history.position")}</span>
            <strong className={styles.rank}>
              {rank === null
                ? t("cup.unavailable")
                : t("history.rank", {
                    rank: formatLocalizedNumber(locale, rank),
                  })}
            </strong>
          </div>
          <div className={styles.cupsBlock}>
            <span className={styles.cupValue}>
              <TrophyIcon className={styles.trophyIcon} />
              <span>{formatLocalizedNumber(locale, cupReward)}</span>
              <TrophyIcon className={styles.trophyIcon} />
            </span>
            <span className={styles.settledStats}>
              {t("history.correctWrong", {
                correct: formatLocalizedNumber(locale, correct),
                wrong: formatLocalizedNumber(locale, wrong),
              })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistoryHero;

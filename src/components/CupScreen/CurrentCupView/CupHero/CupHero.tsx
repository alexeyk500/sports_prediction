import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import ClockIcon from "./ClockIcon";
import {
  formatCountdown,
  formatDateRange,
  formatEndDate,
  formatNanoTon,
} from "./cup-hero-format";
import styles from "./CupHero.module.css";

interface ICupHeroProps {
  tournament: NonNullable<BootstrapResponse["currentTournament"]>;
  nowMs: number;
  timeZone: string;
}

const CupHero: React.FC<ICupHeroProps> = ({ tournament, nowMs, timeZone }) => {
  const { t, locale } = useTranslation();
  const endsAt = new Date(tournament.endsAt);

  return (
    <section className={styles.hero}>
      <div className={styles.heroTitleRow}>
        <div>
          <h2>{t("cup.weeklyCup")}</h2>
          <p>
            {formatDateRange(
              locale,
              tournament.startsAt,
              tournament.endsAt,
              timeZone,
            )}
          </p>
        </div>
      </div>
      <div className={styles.heroMetrics}>
        <div className={styles.countdownBlock}>
          <ClockIcon className={styles.metricIcon} />
          <div>
            <strong>
              {formatCountdown(t, Math.max(0, endsAt.getTime() - nowMs))}
            </strong>
            <span>
              {t("cup.ends", {
                date: formatEndDate(locale, tournament.endsAt, timeZone),
              })}
            </span>
          </div>
        </div>
        <div className={styles.prizeBlock}>
          <span>{t("cup.prizePool")}</span>
          <strong>{formatNanoTon(locale, tournament.prizePoolNanoTon)}</strong>
        </div>
      </div>
    </section>
  );
};

export default CupHero;

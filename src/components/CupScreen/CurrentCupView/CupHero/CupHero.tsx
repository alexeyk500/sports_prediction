import { useState } from "react";
import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import ClockIcon from "./ClockIcon";
import {
  formatCountdown,
  formatDateRange,
  formatEndDate,
} from "./cup-hero-format";
import { calculatePrizePool } from "../../prize-format";
import styles from "./CupHero.module.css";

interface ICupHeroProps {
  tournament: NonNullable<BootstrapResponse["currentTournament"]>;
}

const CupHero: React.FC<ICupHeroProps> = ({ tournament }) => {
  const { t, locale } = useTranslation();
  const [mountedAtMs] = useState(() => Date.now());
  const endsAt = new Date(tournament.endsAt);

  return (
    <section className={styles.hero}>
      <div className={styles.heroTitleRow}>
        <div>
          <h2>{t("cup.weeklyCup")}</h2>
          <p>
            {formatDateRange(locale, tournament.startsAt, tournament.endsAt)}
          </p>
        </div>
      </div>
      <div className={styles.heroMetrics}>
        <div className={styles.countdownBlock}>
          <ClockIcon className={styles.metricIcon} />
          <div>
            <strong>
              {formatCountdown(t, Math.max(0, endsAt.getTime() - mountedAtMs))}
            </strong>
            <span>
              {t("cup.ends", {
                date: formatEndDate(locale, tournament.endsAt),
              })}
            </span>
          </div>
        </div>
        <div className={styles.prizeBlock}>
          <span>{t("cup.prizePool")}</span>
          <strong>
            {tournament.prizeDistribution.length === 0
              ? t("cup.unavailable")
              : calculatePrizePool(tournament.prizeDistribution) +
                " " +
                tournament.prizeCurrency}
          </strong>
        </div>
      </div>
    </section>
  );
};

export default CupHero;

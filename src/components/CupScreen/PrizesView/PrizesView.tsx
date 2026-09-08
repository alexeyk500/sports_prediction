import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import PeopleIcon from "@/assets/icons/PeopleIcon";
import PrizeIcon from "@/assets/icons/PrizeIcon";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  calculatePrizePool,
  formatPrizeAmount,
  formatPrizeRange,
  getOtherPrizeTiers,
  getMaxRewardedRank,
} from "../prize-format";
import type { PrizeDistributionTier } from "../prize-types";
import PrizePodium from "./PrizePodium/PrizePodium";
import styles from "./PrizesView.module.css";

interface IPrizesViewProps {
  tournament: NonNullable<BootstrapResponse["currentTournament"]>;
}

const PrizesView: React.FC<IPrizesViewProps> = ({ tournament }) => {
  const { t } = useTranslation();
  const distribution = tournament.prizeDistribution;
  const maxRewardedRank = getMaxRewardedRank(distribution);
  const pool = distribution.length
    ? calculatePrizePool(distribution) + " " + tournament.prizeCurrency
    : t("cup.unavailable");

  return (
    <section className={styles.stack}>
      <section className={styles.poolCard}>
        <div className={styles.poolIcon}>
          <TrophyIcon />
        </div>
        <div className={styles.poolCopy}>
          <span>{t("cup.prizePool")}</span>
          <strong>{pool}</strong>
          <small>
            {maxRewardedRank === null
              ? t("cup.prizes.noRewardedPlayers")
              : t("cup.prizes.topPlayersRewarded", { rank: maxRewardedRank })}
          </small>
        </div>
      </section>

      {distribution.length === 0 ? (
        <section className={styles.emptyState}>
          <p>{t("cup.prizes.emptyDistribution")}</p>
        </section>
      ) : (
        <>
          <PrizePodium
            currency={tournament.prizeCurrency}
            distribution={distribution}
          />
          <section className={styles.otherSection}>
            <h2>{t("cup.prizes.other")}</h2>
            <div className={styles.tierList}>
              {getOtherPrizeTiers(distribution).map((tier) => (
                <PrizeTier
                  key={
                    String(tier.fromRank) +
                    "-" +
                    String(tier.toRank) +
                    "-" +
                    tier.amount
                  }
                  tier={tier}
                  currency={tournament.prizeCurrency}
                />
              ))}
            </div>
          </section>
          <div className={styles.infoBlock}>
            <PrizeIcon className={styles.giftIcon} />
            <span>
              {t("cup.prizes.info", {
                rank: maxRewardedRank ?? 0,
                currency: tournament.prizeCurrency,
              })}
            </span>
          </div>
        </>
      )}
    </section>
  );
};

interface IPrizeTierProps {
  tier: PrizeDistributionTier;
  currency: string;
}

const PrizeTier: React.FC<IPrizeTierProps> = ({ tier, currency }) => {
  const { t } = useTranslation();

  return (
    <article className={styles.tierCard}>
      <PeopleIcon />
      <div>
        <span>
          {formatPrizeRange(tier, (key, values) =>
            t(
              key === "single"
                ? "cup.prizes.singlePlace"
                : "cup.prizes.rangePlace",
              values,
            ),
          )}
        </span>
        <strong>
          {formatPrizeAmount(tier.amount, currency) +
            " " +
            t("cup.prizes.each")}
        </strong>
      </div>
      <span className={styles.chevron} aria-hidden="true">
        ›
      </span>
    </article>
  );
};

export default PrizesView;

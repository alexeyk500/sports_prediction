import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import { findPrizeTierForRank, formatPrizeAmount } from "../../prize-format";
import type { PrizeDistributionTier } from "../../prize-types";
import styles from "./PrizePodium.module.css";

interface IPrizePodiumProps {
  currency: string;
  distribution: readonly PrizeDistributionTier[];
}

interface IPodiumSlot {
  rank: 1 | 2 | 3;
  className: "silver" | "gold" | "bronze";
}

const slots: readonly IPodiumSlot[] = [
  { rank: 2, className: "silver" },
  { rank: 1, className: "gold" },
  { rank: 3, className: "bronze" },
];

const PrizePodium: React.FC<IPrizePodiumProps> = ({
  currency,
  distribution,
}) => {
  const { t } = useTranslation();

  return (
    <section
      className={styles.section}
      aria-label={t("cup.prizes.topThreeAria")}
    >
      <div className={styles.stage}>
        {slots.map((slot) => {
          const tier = findPrizeTierForRank(distribution, slot.rank);

          return (
            <div
              className={styles.slot + " " + styles[slot.className]}
              key={slot.rank}
            >
              <strong>
                {tier ? formatPrizeAmount(tier.amount, currency) : "—"}
              </strong>
              <span>{t("cup.prizes.singlePlace", { rank: slot.rank })}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default PrizePodium;

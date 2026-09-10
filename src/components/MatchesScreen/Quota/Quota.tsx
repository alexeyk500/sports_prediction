import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./Quota.module.css";

interface IQuotaProps {
  predictionCount: number;
  usage: BootstrapResponse["dailyPredictionUsage"];
}

const Quota: React.FC<IQuotaProps> = ({ predictionCount, usage }) => {
  const { t, locale } = useTranslation();
  const displayedTotalUsed = Math.min(
    Math.max(usage.totalUsed, predictionCount),
    usage.totalLimit,
  );
  const displayedFreeUsed = Math.min(usage.freeLimit, displayedTotalUsed);
  const displayedRewardedUsed = Math.min(
    usage.rewardedLimit,
    Math.max(usage.rewardedUsed, displayedTotalUsed - usage.freeLimit),
  );
  const slots = Array.from({ length: usage.totalLimit }, (_, index) => ({
    isUsed: index < displayedTotalUsed,
  }));
  const freeSlots = slots.slice(0, usage.freeLimit);
  const rewardedSlots = slots.slice(usage.freeLimit);
  const values = {
    freeUsed: formatLocalizedNumber(locale, displayedFreeUsed),
    freeLimit: formatLocalizedNumber(locale, usage.freeLimit),
    rewardedUsed: formatLocalizedNumber(locale, displayedRewardedUsed),
    rewardedLimit: formatLocalizedNumber(locale, usage.rewardedLimit),
    totalUsed: formatLocalizedNumber(locale, displayedTotalUsed),
    totalLimit: formatLocalizedNumber(locale, usage.totalLimit),
  };

  return (
    <section className={styles.quota}>
      <div className={styles.quotaHeader}>
        <h2>{t("matches.quota.title")}</h2>
        <strong>
          {t("matches.quota.totalShort", {
            used: values.totalUsed,
            limit: values.totalLimit,
          })}
        </strong>
      </div>
      <div className={styles.quotaSlots} aria-hidden="true">
        <span className={styles.slotGroup}>
          {freeSlots.map((slot, index) => (
            <span
              key={`free-${index}`}
              className={slot.isUsed ? styles.freeSlotUsed : styles.slotUnused}
            />
          ))}
        </span>
        <span className={styles.slotDivider} />
        <span className={styles.slotGroup}>
          {rewardedSlots.map((slot, index) => (
            <span
              key={`rewarded-${index}`}
              className={
                slot.isUsed ? styles.rewardedSlotUsed : styles.slotUnused
              }
            />
          ))}
        </span>
      </div>
      <div className={styles.quotaLabels}>
        <span>
          {t("matches.quota.freeCompact", {
            used: values.freeUsed,
            limit: values.freeLimit,
          })}
        </span>
        <span>
          {t("matches.quota.rewardedCompact", {
            used: values.rewardedUsed,
            limit: values.rewardedLimit,
          })}
        </span>
      </div>
    </section>
  );
};

export default Quota;

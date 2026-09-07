import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import VideoIcon from "./VideoIcon/VideoIcon";
import styles from "./Quota.module.css";

interface IQuotaProps {
  usage: BootstrapResponse["dailyPredictionUsage"];
}

const Quota: React.FC<IQuotaProps> = ({ usage }) => {
  const { t, locale } = useTranslation();
  const freeSlots = Array.from(
    { length: usage.freeLimit },
    (_, index) => index < usage.freeUsed,
  );
  const rewardedSlots = Array.from(
    { length: usage.rewardedLimit },
    (_, index) => index < usage.rewardedUsed,
  );
  const showRewardCta =
    usage.freeUsed >= usage.freeLimit &&
    usage.rewardedUsed < usage.rewardedLimit;
  const values = {
    freeUsed: formatLocalizedNumber(locale, usage.freeUsed),
    freeLimit: formatLocalizedNumber(locale, usage.freeLimit),
    rewardedUsed: formatLocalizedNumber(locale, usage.rewardedUsed),
    rewardedLimit: formatLocalizedNumber(locale, usage.rewardedLimit),
    totalUsed: formatLocalizedNumber(locale, usage.totalUsed),
    totalLimit: formatLocalizedNumber(locale, usage.totalLimit),
  };

  return (
    <section className={styles.quota}>
      <div className={styles.quotaHeader}>
        <h2>{t("predict.quota.title")}</h2>
        <strong>
          {t("predict.quota.totalShort", {
            used: values.totalUsed,
            limit: values.totalLimit,
          })}
        </strong>
      </div>
      <div className={styles.quotaSlots} aria-hidden="true">
        <span className={styles.slotGroup}>
          {freeSlots.map((isUsed, index) => (
            <span
              key={`free-${index}`}
              className={isUsed ? styles.freeSlotUsed : styles.slotUnused}
            />
          ))}
        </span>
        <span className={styles.slotDivider} />
        <span className={styles.slotGroup}>
          {rewardedSlots.map((isUsed, index) => (
            <span
              key={`rewarded-${index}`}
              className={isUsed ? styles.rewardedSlotUsed : styles.slotUnused}
            />
          ))}
        </span>
      </div>
      <div className={styles.quotaLabels}>
        <span>
          {t("predict.quota.freeCompact", {
            used: values.freeUsed,
            limit: values.freeLimit,
          })}
        </span>
        <span>
          {t("predict.quota.rewardedCompact", {
            used: values.rewardedUsed,
            limit: values.rewardedLimit,
          })}
        </span>
      </div>
      {showRewardCta ? (
        <button
          className={styles.rewardCta}
          type="button"
          disabled
          aria-disabled="true"
        >
          <VideoIcon />
          <span>{t("predict.reward.cta")}</span>
          <strong>{t("predict.reward.plusOne")}</strong>
        </button>
      ) : null}
    </section>
  );
};

export default Quota;

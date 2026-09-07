import type React from "react";
import { formatBusinessDate, formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./TodayContextRow.module.css";

interface ITodayContextRowProps {
  businessDate: string | null;
  matchCount: number;
}

const TodayContextRow: React.FC<ITodayContextRowProps> = ({
  businessDate,
  matchCount,
}) => {
  const { t, locale } = useTranslation();
  const dateLabel = businessDate
    ? formatBusinessDate(locale, businessDate)
    : "";

  return (
    <div className={styles.todayRow}>
      <strong>
        {dateLabel
          ? t("predict.today.labelWithDate", { date: dateLabel })
          : t("predict.today.label")}
      </strong>
      <span>
        {t("predict.today.matchCount", {
          count: formatLocalizedNumber(locale, matchCount),
        })}
      </span>
    </div>
  );
};

export default TodayContextRow;

import type React from "react";
import type { CupHistoryDayDto } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import HistoryDay from "./HistoryDay/HistoryDay";
import styles from "./HistoryTimeline.module.css";

interface IHistoryTimelineProps {
  days: CupHistoryDayDto[];
  currentBusinessDate: string;
  timeZone: string;
}

const HistoryTimeline: React.FC<IHistoryTimelineProps> = ({
  days,
  currentBusinessDate,
  timeZone,
}) => {
  const { t } = useTranslation();

  if (days.length === 0) {
    return (
      <section className={styles.emptyState}>
        <strong>{t("history.empty.title")}</strong>
        <span>{t("history.empty.body")}</span>
      </section>
    );
  }

  return (
    <section className={styles.timeline} aria-label={t("history.timeline")}>
      {days.map((day) => (
        <HistoryDay
          key={day.businessDate}
          day={day}
          currentBusinessDate={currentBusinessDate}
          timeZone={timeZone}
        />
      ))}
    </section>
  );
};

export default HistoryTimeline;

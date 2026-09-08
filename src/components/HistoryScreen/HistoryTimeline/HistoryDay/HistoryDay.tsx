import type React from "react";
import type { CupHistoryDayDto } from "@/lib/api/types";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { formatHistoryDayTitle } from "../../history-format";
import HistoryPredictionCard from "../HistoryPredictionCard/HistoryPredictionCard";
import styles from "./HistoryDay.module.css";

interface IHistoryDayProps {
  day: CupHistoryDayDto;
  currentBusinessDate: string;
  timeZone: string;
}

const HistoryDay: React.FC<IHistoryDayProps> = ({
  day,
  currentBusinessDate,
  timeZone,
}) => {
  const { t, locale } = useTranslation();

  return (
    <section className={styles.day}>
      <div className={styles.dayHeader}>
        <h2>
          {formatHistoryDayTitle(
            t,
            locale,
            day.businessDate,
            currentBusinessDate,
          )}
        </h2>
        <span>
          {t("history.matchCount", {
            count: formatLocalizedNumber(locale, day.predictions.length),
          })}
        </span>
      </div>
      <div className={styles.entries}>
        {day.predictions.map((prediction) => (
          <HistoryPredictionCard
            key={prediction.id}
            prediction={prediction}
            timeZone={timeZone}
          />
        ))}
      </div>
    </section>
  );
};

export default HistoryDay;

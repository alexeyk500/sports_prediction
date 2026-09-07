import type React from "react";
import { TrophyIcon } from "@/assets/icons/TrophyIcon";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { ICupHistoryItemModel } from "./cup-history-types";
import { CupHistoryItem } from "./CupHistoryItem/CupHistoryItem";
import styles from "./CupHistoryView.module.css";

interface ICupHistoryViewProps {
  items: ICupHistoryItemModel[];
}

const CupHistoryView: React.FC<ICupHistoryViewProps> = ({ items }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.historyStack}>
      <h2>{t("cup.pastCups")}</h2>
      {items.length > 0 ? (
        <div className={styles.historyList}>
          {items.map((item) => (
            <CupHistoryItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className={styles.historyEmpty}>
          <TrophyIcon className={styles.emptyIcon} />
          <strong>{t("cup.empty.historyTitle")}</strong>
          <span>{t("cup.empty.historyBody")}</span>
        </div>
      )}
    </section>
  );
};

export { CupHistoryView };

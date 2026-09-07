import type React from "react";
import type { ICupHistoryItemModel } from "../cup-history-types";
import styles from "./CupHistoryItem.module.css";

interface ICupHistoryItemProps {
  item: ICupHistoryItemModel;
}

const CupHistoryItem: React.FC<ICupHistoryItemProps> = ({ item }) => {
  const content = (
    <>
      <div className={styles.summary}>
        <span>{item.dateRangeLabel}</span>
        <strong>{item.title}</strong>
        <span>{item.participantCountLabel}</span>
      </div>
      <div className={styles.result}>
        <span>{item.userResultLabel}</span>
        {item.userPointsLabel ? <strong>{item.userPointsLabel}</strong> : null}
      </div>
      {item.href ? <span className={styles.chevron} aria-hidden="true">›</span> : null}
    </>
  );

  if (item.href) {
    return (
      <a className={styles.item} href={item.href}>
        {content}
      </a>
    );
  }

  return <article className={styles.item}>{content}</article>;
};

export default CupHistoryItem;

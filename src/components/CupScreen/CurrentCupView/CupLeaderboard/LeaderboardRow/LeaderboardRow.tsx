import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { ICupLeaderboardRowModel } from "../leaderboard-types";
import styles from "./LeaderboardRow.module.css";

interface ILeaderboardRowProps {
  row: ICupLeaderboardRowModel;
  pinned?: boolean;
}

const LeaderboardRow: React.FC<ILeaderboardRowProps> = ({
  row,
  pinned = false,
}) => {
  const { t } = useTranslation();
  const rowClassName =
    pinned || row.isCurrentUser ? styles.pinnedRow : styles.row;

  return (
    <div
      className={rowClassName}
      data-current-user={row.isCurrentUser ? "true" : undefined}
    >
      <span>{row.rank}</span>
      <span className={styles.playerCell}>
        {row.telegramUrl ? (
          <a href={row.telegramUrl}>{row.playerName}</a>
        ) : (
          <span className={styles.playerName}>{row.playerName}</span>
        )}
        {row.isCurrentUser ? (
          <span className={styles.youBadge}>{t("cup.you")}</span>
        ) : null}
      </span>
      <span className={styles.centeredText}>
        {row.correctPredictions} / {row.wrongPredictions}
      </span>

      <span className={styles.centeredText}>{row.points}</span>
    </div>
  );
};

export default LeaderboardRow;

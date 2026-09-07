import type React from "react";
import type { ICupLeaderboardRowModel } from "../leaderboard-types";
import styles from "./LeaderboardRow.module.css";

interface ILeaderboardRowProps {
  row: ICupLeaderboardRowModel;
  pinned?: boolean;
}

const LeaderboardRow: React.FC<ILeaderboardRowProps> = ({ row, pinned = false }) => {
  return (
    <div className={pinned ? styles.pinnedRow : styles.row}>
      <span>{row.rank}</span>
      {row.telegramUrl ? (
        <a href={row.telegramUrl}>{row.playerName}</a>
      ) : (
        <span className={styles.playerName}>{row.playerName}</span>
      )}
      <span>
        {row.correctPredictions} / {row.wrongPredictions}
      </span>
      <strong>{row.points}</strong>
    </div>
  );
};

export { LeaderboardRow };

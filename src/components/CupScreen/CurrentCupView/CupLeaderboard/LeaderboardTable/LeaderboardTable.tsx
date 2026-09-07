import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeaderboardEmptyState from "../LeaderboardEmptyState/LeaderboardEmptyState";
import LeaderboardRow from "../LeaderboardRow/LeaderboardRow";
import type { ICupLeaderboardRowModel } from "../leaderboard-types";
import styles from "./LeaderboardTable.module.css";

interface ILeaderboardTableProps {
  rows: ICupLeaderboardRowModel[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}

const SKELETON_ROWS = ["first", "second", "third", "fourth", "fifth"];

const LeaderboardTable: React.FC<ILeaderboardTableProps> = ({
  rows,
  isLoading,
  errorMessage,
  onRetry,
}) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className={styles.rows} aria-busy="true" aria-label={t("cup.leaderboardStates.loading")}>
        {SKELETON_ROWS.map((row) => (
          <div key={row} className={styles.skeletonRow} />
        ))}
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.errorState}>
        <p>{errorMessage}</p>
        <button type="button" onClick={onRetry}>
          {t("cup.leaderboardStates.retry")}
        </button>
      </div>
    );
  }

  if (rows.length === 0) {
    return <LeaderboardEmptyState />;
  }

  return (
    <div className={styles.rows}>
      {rows.map((row) => (
        <LeaderboardRow key={row.id} row={row} />
      ))}
    </div>
  );
};

export default LeaderboardTable;

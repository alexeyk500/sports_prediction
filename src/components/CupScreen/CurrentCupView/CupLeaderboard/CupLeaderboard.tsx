import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeaderboardEmptyState from "./LeaderboardEmptyState/LeaderboardEmptyState";
import LeaderboardRow from "./LeaderboardRow/LeaderboardRow";
import type { ICupLeaderboardRowModel } from "./leaderboard-types";
import styles from "./CupLeaderboard.module.css";

interface ICupLeaderboardProps {
  rows: ICupLeaderboardRowModel[];
  pinnedCurrentUserRow: ICupLeaderboardRowModel | null;
}

const CupLeaderboard: React.FC<ICupLeaderboardProps> = ({ rows, pinnedCurrentUserRow }) => {
  const { t } = useTranslation();

  return (
    <section className={styles.leaderboard}>
      <h2>{t("cup.leaderboard")}</h2>
      <div className={styles.leaderboardHeader} aria-hidden="true">
        <span>{t("cup.columns.rank")}</span>
        <span>{t("cup.columns.player")}</span>
        <span>{t("cup.columns.correctWrong")}</span>
        <span>{t("cup.columns.points")}</span>
      </div>
      {rows.length > 0 ? (
        <div className={styles.rows}>
          {rows.map((row) => (
            <LeaderboardRow key={row.id} row={row} />
          ))}
        </div>
      ) : (
        <LeaderboardEmptyState />
      )}
      {pinnedCurrentUserRow ? <LeaderboardRow row={pinnedCurrentUserRow} pinned /> : null}
    </section>
  );
};

export default CupLeaderboard;

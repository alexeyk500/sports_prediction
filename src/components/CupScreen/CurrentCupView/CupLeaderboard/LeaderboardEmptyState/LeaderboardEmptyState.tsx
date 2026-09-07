import type React from "react";
import TrophyIcon from "@/assets/icons/TrophyIcon";
import { useTranslation } from "@/lib/i18n/use-translation";
import styles from "./LeaderboardEmptyState.module.css";

const LeaderboardEmptyState: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.emptyLeaderboard}>
      <TrophyIcon className={styles.emptyIcon} />
      <strong>{t("cup.empty.leaderboardTitle")}</strong>
      <span>{t("cup.empty.leaderboardBody")}</span>
    </div>
  );
};

export default LeaderboardEmptyState;

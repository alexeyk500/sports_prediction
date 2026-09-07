import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { CupLeaderboardMode } from "../leaderboard-types";
import styles from "./LeaderboardModeTabs.module.css";

interface ILeaderboardModeTabsProps {
  activeMode: CupLeaderboardMode;
  onChange: (mode: CupLeaderboardMode) => void;
}

const MODES: CupLeaderboardMode[] = ["top", "around-me", "all"];

const LeaderboardModeTabs: React.FC<ILeaderboardModeTabsProps> = ({ activeMode, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.tabs} role="tablist" aria-label={t("cup.leaderboardModes.ariaLabel")}>
      {MODES.map((mode) => (
        <button
          key={mode}
          className={mode === activeMode ? styles.activeTab : styles.tab}
          type="button"
          role="tab"
          aria-selected={mode === activeMode}
          onClick={() => onChange(mode)}
        >
          {t(`cup.leaderboardModes.${mode}`)}
        </button>
      ))}
    </div>
  );
};

export default LeaderboardModeTabs;

import type React from "react";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { CupTab } from "../cup-types";
import styles from "./CupModeTabs.module.css";

interface ICupModeTabsProps {
  activeTab: CupTab;
  onChange: (tab: CupTab) => void;
}

const CupModeTabs: React.FC<ICupModeTabsProps> = ({ activeTab, onChange }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.tabs} role="tablist" aria-label={t("cup.tabs.ariaLabel")}>
      <button
        className={activeTab === "current" ? styles.activeTab : styles.tab}
        type="button"
        role="tab"
        aria-selected={activeTab === "current"}
        onClick={() => onChange("current")}
      >
        {t("cup.tabs.current")}
      </button>
      <button
        className={activeTab === "history" ? styles.activeTab : styles.tab}
        type="button"
        role="tab"
        aria-selected={activeTab === "history"}
        onClick={() => onChange("history")}
      >
        {t("cup.tabs.history")}
      </button>
    </div>
  );
};

export default CupModeTabs;

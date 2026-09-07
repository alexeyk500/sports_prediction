import type React from "react";
import { formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { ActiveTab } from "../predict-types";
import styles from "./PredictTabs.module.css";

interface IPredictTabsProps {
  activeTab: ActiveTab;
  predictionCount: number;
  onChange: (tab: ActiveTab) => void;
}

const PredictTabs: React.FC<IPredictTabsProps> = ({
  activeTab,
  predictionCount,
  onChange,
}) => {
  const { t, locale } = useTranslation();

  return (
    <div
      className={styles.tabs}
      role="tablist"
      aria-label={t("predict.tabs.ariaLabel")}
    >
      <button
        className={activeTab === "available" ? styles.activeTab : styles.tab}
        type="button"
        role="tab"
        aria-selected={activeTab === "available"}
        onClick={() => onChange("available")}
      >
        {t("predict.tabs.available")}
      </button>
      <button
        className={activeTab === "my-picks" ? styles.activeTab : styles.tab}
        type="button"
        role="tab"
        aria-selected={activeTab === "my-picks"}
        onClick={() => onChange("my-picks")}
      >
        <span>{t("predict.tabs.myPicks")}</span>
        {predictionCount > 0 ? (
          <span className={styles.tabCount}>
            {formatLocalizedNumber(locale, predictionCount)}
          </span>
        ) : null}
      </button>
    </div>
  );
};

export default PredictTabs;

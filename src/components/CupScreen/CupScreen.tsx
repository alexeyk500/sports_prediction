"use client";

import { useCallback, useState } from "react";
import type React from "react";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTranslation } from "@/lib/i18n/use-translation";
import CupHeader from "./CupHeader/CupHeader";
import CupModeTabs from "./CupModeTabs/CupModeTabs";
import CurrentCupView from "./CurrentCupView/CurrentCupView";
import type {
  LoadCupLeaderboardAroundMe,
  LoadCupLeaderboardPage,
} from "./CurrentCupView/CupLeaderboard/leaderboard-types";
import PrizesView from "./PrizesView/PrizesView";
import type { CupTab } from "./cup-types";
import { useCupTopLeaderboard } from "./hooks/useCupTopLeaderboard";
import styles from "./CupScreen.module.css";

interface ICupScreenProps {
  onOpenMatches: () => void;
}

const CupScreen: React.FC<ICupScreenProps> = ({ onOpenMatches }) => {
  const { t } = useTranslation();
  const { bootstrap, isLoading, errorMessage, apiClient } = useBootstrap();
  const [activeTab, setActiveTab] = useState<CupTab>("current");
  const cupId = bootstrap?.currentTournament?.id ?? null;
  const topLeaderboard = useCupTopLeaderboard(cupId, apiClient);
  const loadLeaderboardPage = useCallback<LoadCupLeaderboardPage>(
    (input) => apiClient.getCupLeaderboard(input),
    [apiClient],
  );
  const loadLeaderboardAroundMe = useCallback<LoadCupLeaderboardAroundMe>(
    (input) => apiClient.getCupLeaderboardAroundMe(input),
    [apiClient],
  );

  if (isLoading) {
    return <main className={styles.centerState}>{t("cup.loading")}</main>;
  }

  if (!bootstrap) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>{t("navigation.cup")}</h1>
          <p>{errorMessage ?? t("cup.empty.noCurrentCup")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topArea}>
        <CupHeader />
        {errorMessage ? (
          <div className={styles.errorBanner}>{errorMessage}</div>
        ) : null}
        <CupModeTabs activeTab={activeTab} onChange={setActiveTab} />
      </div>
      <div className={styles.scrollArea} data-ui="cup-scroll-area">
        {activeTab === "current" ? (
          <CurrentCupView
            tournament={bootstrap.currentTournament}
            cup={bootstrap.cup}
            businessTimezone={bootstrap.businessTimezone}
            topLeaderboard={topLeaderboard.data}
            isTopLeaderboardLoading={topLeaderboard.isLoading}
            topLeaderboardError={topLeaderboard.errorMessage}
            retryTopLeaderboard={topLeaderboard.retry}
            loadLeaderboardPage={loadLeaderboardPage}
            loadLeaderboardAroundMe={loadLeaderboardAroundMe}
            onOpenMatches={onOpenMatches}
          />
        ) : bootstrap.currentTournament ? (
          <PrizesView tournament={bootstrap.currentTournament} />
        ) : (
          <section className={styles.statePanel}>
            {t("cup.empty.noCurrentCup")}
          </section>
        )}
      </div>
    </main>
  );
};

export default CupScreen;

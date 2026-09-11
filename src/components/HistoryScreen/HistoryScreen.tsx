"use client";

import type React from "react";
import { useBootstrap } from "@/hooks/useBootstrap";
import { useTranslation } from "@/lib/i18n/use-translation";
import HistoryHero from "./HistoryHero/HistoryHero";
import HistoryTimeline from "./HistoryTimeline/HistoryTimeline";
import { useCupHistory } from "./hooks/useCupHistory";
import styles from "./HistoryScreen.module.css";

const HistoryScreen: React.FC = () => {
  const { t } = useTranslation();
  const { bootstrap, isLoading, errorMessage, apiClient } = useBootstrap();
  const cupId = bootstrap?.currentTournament?.id ?? null;
  const history = useCupHistory(cupId, apiClient);
  const historyErrorMessage = history.errorMessage;

  if (isLoading || (cupId && history.isLoading && !history.data)) {
    return <main className={styles.centerState}>{t("history.loading")}</main>;
  }

  if (!bootstrap?.currentTournament) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>{t("history.title")}</h1>
          <p>{errorMessage ?? t("cup.empty.noCurrentCup")}</p>
        </section>
      </main>
    );
  }

  const currentUserRow = bootstrap.cup?.currentUserRow ?? null;

  return (
    <main className={styles.screen}>
      <div className={styles.scrollArea} data-ui="history-scroll-area">
        <header className={styles.header}>
          <h1>{t("history.title")}</h1>
          <p>{t("history.subtitle")}</p>
        </header>
        {errorMessage || historyErrorMessage ? (
          <div className={styles.errorBanner}>
            {errorMessage ?? historyErrorMessage}
          </div>
        ) : null}
        <HistoryHero
          tournament={bootstrap.currentTournament}
          rank={currentUserRow?.rank ?? null}
          cupReward={currentUserRow?.points ?? 0}
          correct={currentUserRow?.correct ?? 0}
          wrong={currentUserRow?.wrong ?? 0}
        />
        <HistoryTimeline
          days={history.data?.days ?? []}
          currentUtcDateKey={bootstrap.dailyPredictionUsage.businessDate}
        />
      </div>
    </main>
  );
};

export default HistoryScreen;

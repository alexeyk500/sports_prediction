"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { ApiClient, ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { BootstrapResponse, CupHistoryResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import HistoryHero from "./HistoryHero/HistoryHero";
import HistoryTimeline from "./HistoryTimeline/HistoryTimeline";
import styles from "./HistoryScreen.module.css";

interface IHistoryState {
  bootstrap: BootstrapResponse | null;
  history: CupHistoryResponse | null;
}

const HistoryScreen: React.FC = () => {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [state, setState] = useState<IHistoryState>({
    bootstrap,
    history: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    const nextBootstrap = await apiClient.getBootstrap();
    setBootstrap(nextBootstrap);

    if (!nextBootstrap.currentTournament) {
      setState({ bootstrap: nextBootstrap, history: null });
      return;
    }

    const history = await apiClient.getCupHistory({
      cupId: nextBootstrap.currentTournament.id,
    });

    setState({ bootstrap: nextBootstrap, history });
  }, [apiClient, setBootstrap]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- History is a navigation tab that loads its current Cup data on mount.
    load()
      .catch((error: unknown) => {
        logHistoryLoadError(error);
        setErrorMessage(messageForApiError(error, locale));
      })
      .finally(() => setIsLoading(false));
  }, [load, locale]);

  if (isLoading) {
    return <main className={styles.centerState}>{t("history.loading")}</main>;
  }

  if (!state.bootstrap?.currentTournament) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>{t("history.title")}</h1>
          <p>{errorMessage ?? t("cup.empty.noCurrentCup")}</p>
        </section>
      </main>
    );
  }

  const currentUserRow = state.bootstrap.cup?.currentUserRow ?? null;

  return (
    <main className={styles.screen}>
      <div className={styles.scrollArea} data-ui="history-scroll-area">
        <header className={styles.header}>
          <h1>{t("history.title")}</h1>
          <p>{t("history.subtitle")}</p>
        </header>
        {errorMessage ? (
          <div className={styles.errorBanner}>{errorMessage}</div>
        ) : null}
        <HistoryHero
          tournament={state.bootstrap.currentTournament}
          timeZone={state.bootstrap.businessTimezone}
          rank={currentUserRow?.rank ?? null}
          cupReward={currentUserRow?.points ?? 0}
          correct={currentUserRow?.correct ?? 0}
          wrong={currentUserRow?.wrong ?? 0}
        />
        <HistoryTimeline
          days={state.history?.days ?? []}
          currentBusinessDate={
            state.bootstrap.dailyPredictionUsage.businessDate
          }
          timeZone={state.bootstrap.businessTimezone}
        />
      </div>
    </main>
  );
};

export default HistoryScreen;

function logHistoryLoadError(error: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error instanceof ApiClientError) {
    console.error("History load failed", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error(
    "History load failed",
    error instanceof Error ? error.message : error,
  );
}

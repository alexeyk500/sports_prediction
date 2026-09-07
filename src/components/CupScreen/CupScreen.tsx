"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { ApiClient, ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import CupHeader from "./CupHeader/CupHeader";
import CupHistoryView from "./CupHistoryView/CupHistoryView";
import CupModeTabs from "./CupModeTabs/CupModeTabs";
import CurrentCupView from "./CurrentCupView/CurrentCupView";
import type { ICupHistoryItemModel } from "./CupHistoryView/cup-history-types";
import type { CupTab } from "./cup-types";
import styles from "./CupScreen.module.css";

const EMPTY_HISTORY_ITEMS: ICupHistoryItemModel[] = [];

interface ICupScreenProps {
  onMakePrediction: () => void;
}

const CupScreen: React.FC<ICupScreenProps> = ({ onMakePrediction }) => {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [activeTab, setActiveTab] = useState<CupTab>("current");
  const [isBootstrapping, setIsBootstrapping] = useState(!bootstrap);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);

  const load = useCallback(async () => {
    setErrorMessage(null);
    const nextBootstrap = await apiClient.getBootstrap();
    setBootstrap(nextBootstrap);
  }, [apiClient, setBootstrap]);

  useEffect(() => {
    if (bootstrap) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client bootstrap fetch synchronizes with backend API.
    load()
      .catch((error: unknown) => {
        logCupLoadError(error);
        setErrorMessage(messageForApiError(error, locale));
      })
      .finally(() => setIsBootstrapping(false));
  }, [bootstrap, load, locale]);

  useEffect(() => {
    if (!bootstrap) {
      return;
    }

    const interval = window.setInterval(() => {
      setClockTick((current) => current + 1);
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [bootstrap]);

  const nowMs = useMemo(() => {
    if (!bootstrap) {
      return 0;
    }

    const serverTimeMs = Date.parse(bootstrap.serverTime);

    if (Number.isNaN(serverTimeMs)) {
      const fallbackMs = Date.parse(bootstrap.currentTournament?.endsAt ?? "");
      return Number.isNaN(fallbackMs) ? 0 : fallbackMs;
    }

    return serverTimeMs + clockTick * 30_000;
  }, [bootstrap, clockTick]);

  if (isBootstrapping) {
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
            bootstrap={bootstrap}
            nowMs={nowMs}
            cup={bootstrap.cup}
            apiClient={apiClient}
            onMakePrediction={onMakePrediction}
          />
        ) : (
          <CupHistoryView items={EMPTY_HISTORY_ITEMS} />
        )}
      </div>
    </main>
  );
};

export default CupScreen;

function logCupLoadError(error: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error instanceof ApiClientError) {
    console.error("Cup bootstrap failed", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error(
    "Cup bootstrap failed",
    error instanceof Error ? error.message : error,
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { PredictionDto, PredictionOutcome, TodayFixtureDto } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData, initializeTelegramWebApp } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import FixtureList from "./FixtureList/FixtureList";
import Header from "./Header/Header";
import MyPicks from "./MyPicks/MyPicks";
import PredictTabs from "./PredictTabs/PredictTabs";
import Quota from "./Quota/Quota";
import TodayContextRow from "./TodayContextRow/TodayContextRow";
import { selectOutcome, type PredictActionResult } from "./predict-actions";
import { logPredictLoadError } from "./predict-log";
import type { ActiveTab } from "./predict-types";
import styles from "./PredictScreen.module.css";

interface IPredictState {
  fixtures: TodayFixtureDto[];
  predictions: PredictionDto[];
  businessDate: string | null;
}

const PredictScreen: React.FC = () => {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [state, setState] = useState<IPredictState>({ fixtures: [], predictions: [], businessDate: null });
  const [activeTab, setActiveTab] = useState<ActiveTab>("available");
  const [isLoading, setIsLoading] = useState(true);
  const [pendingFixtureId, setPendingFixtureId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rewardPromptFixtureId, setRewardPromptFixtureId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMessage(null);
    const [nextBootstrap, fixtures, predictions] = await Promise.all([
      apiClient.getBootstrap(),
      apiClient.getTodayFixtures(),
      apiClient.getTodayPredictions(),
    ]);

    setBootstrap(nextBootstrap);
    setState({
      fixtures: fixtures.fixtures,
      predictions: predictions.predictions,
      businessDate: fixtures.businessDate,
    });
  }, [apiClient, setBootstrap]);

  useEffect(() => {
    initializeTelegramWebApp();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client bootstrap fetch synchronizes with backend API.
    load()
      .catch((error: unknown) => {
        logPredictLoadError(error);
        setErrorMessage(messageForApiError(error, locale));
      })
      .finally(() => setIsLoading(false));
  }, [load, locale]);

  const predictionsByFixture = useMemo(
    () => new Map(state.predictions.map((prediction) => [prediction.fixtureId, prediction])),
    [state.predictions],
  );
  const visibleMatchCount = activeTab === "available" ? state.fixtures.length : state.predictions.length;

  async function handleOutcome(fixtureId: string, selectedOutcome: PredictionOutcome): Promise<void> {
    if (pendingFixtureId) {
      return;
    }

    setPendingFixtureId(fixtureId);
    setErrorMessage(null);
    setRewardPromptFixtureId(null);

    try {
      const result = await selectOutcome({
        apiClient,
        fixtureId,
        selectedOutcome,
        existingPrediction: predictionsByFixture.get(fixtureId),
        createIdempotencyKey: () => crypto.randomUUID(),
      });

      await handleActionResult(result, fixtureId);
    } catch (error) {
      setErrorMessage(messageForApiError(error, locale));
    } finally {
      setPendingFixtureId(null);
    }
  }

  async function handleActionResult(result: PredictActionResult, fixtureId: string): Promise<void> {
    if (result.status === "reward-required") {
      setRewardPromptFixtureId(fixtureId);
      return;
    }

    if (result.status === "locked") {
      setErrorMessage(t("errors.PREDICTION_LOCKED"));
      await refreshPredictionsOnly();
      return;
    }

    await load();
  }

  async function refreshPredictionsOnly(): Promise<void> {
    const predictions = await apiClient.getTodayPredictions();
    setState((current) => ({
      ...current,
      predictions: predictions.predictions,
    }));
  }

  if (isLoading) {
    return <main className={styles.centerState}>{t("predict.loading")}</main>;
  }

  if (!bootstrap) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>{t("predict.title")}</h1>
          <p>{errorMessage ?? t("predict.authRequired")}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topArea}>
        <Header bootstrap={bootstrap} />
        {errorMessage ? <div className={styles.errorBanner}>{errorMessage}</div> : null}
        <Quota usage={bootstrap.dailyPredictionUsage} />
        <PredictTabs activeTab={activeTab} predictionCount={state.predictions.length} onChange={setActiveTab} />
        <TodayContextRow businessDate={state.businessDate} matchCount={visibleMatchCount} />
      </div>
      <div className={styles.scrollArea} data-ui="predict-scroll-area">
        {activeTab === "available" ? (
          <FixtureList
            fixtures={state.fixtures}
            predictionsByFixture={predictionsByFixture}
            pendingFixtureId={pendingFixtureId}
            rewardPromptFixtureId={rewardPromptFixtureId}
            onSelectOutcome={handleOutcome}
          />
        ) : (
          <MyPicks predictions={state.predictions} fixtures={state.fixtures} onSelectOutcome={handleOutcome} />
        )}
      </div>
    </main>
  );
};

export default PredictScreen;

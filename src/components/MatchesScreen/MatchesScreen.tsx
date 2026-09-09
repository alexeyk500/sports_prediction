"use client";

import { useEffect, useMemo, useState } from "react";
import type React from "react";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { PredictionOutcome } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { initializeTelegramWebApp } from "@/lib/telegram/client";
import FixtureList from "./FixtureList/FixtureList";
import Header from "./Header/Header";
import MyPicks from "./MyPicks/MyPicks";
import MatchesTabs from "./MatchesTabs/MatchesTabs";
import Quota from "./Quota/Quota";
import TodayContextRow from "./TodayContextRow/TodayContextRow";
import { useMatchesData } from "./hooks/useMatchesData";
import { selectOutcome, type MatchesActionResult } from "./matches-actions";
import type { ActiveTab } from "./matches-types";
import styles from "./MatchesScreen.module.css";

const MatchesScreen: React.FC = () => {
  const { t, locale } = useTranslation();
  const {
    bootstrap,
    data,
    isLoading,
    errorMessage,
    apiClient,
    refresh,
    refreshPredictionsOnly,
  } = useMatchesData();
  const [activeTab, setActiveTab] = useState<ActiveTab>("available");
  const [pendingFixtureId, setPendingFixtureId] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(
    null,
  );
  const [rewardPromptFixtureId, setRewardPromptFixtureId] = useState<
    string | null
  >(null);

  useEffect(() => {
    initializeTelegramWebApp();
  }, []);

  const predictionsByFixture = useMemo(
    () =>
      new Map(
        data.predictions.map((prediction) => [
          prediction.fixtureId,
          prediction,
        ]),
      ),
    [data.predictions],
  );
  const visibleMatchCount =
    activeTab === "available" ? data.fixtures.length : data.predictions.length;

  async function handleOutcome(
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
  ): Promise<void> {
    if (pendingFixtureId) {
      return;
    }

    setPendingFixtureId(fixtureId);
    setActionErrorMessage(null);
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
      setActionErrorMessage(messageForApiError(error, locale));
    } finally {
      setPendingFixtureId(null);
    }
  }

  async function handleActionResult(
    result: MatchesActionResult,
    fixtureId: string,
  ): Promise<void> {
    if (result.status === "reward-required") {
      setRewardPromptFixtureId(fixtureId);
      return;
    }

    if (result.status === "locked") {
      setActionErrorMessage(t("errors.PREDICTION_LOCKED"));
      await refreshPredictionsOnly();
      return;
    }

    await refresh();
  }

  if (isLoading) {
    return <main className={styles.centerState}>{t("matches.loading")}</main>;
  }

  if (!bootstrap) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>{t("matches.title")}</h1>
          <p>
            {actionErrorMessage ?? errorMessage ?? t("matches.authRequired")}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.screen}>
      <div className={styles.topArea}>
        <Header bootstrap={bootstrap} />
        {actionErrorMessage || errorMessage ? (
          <div className={styles.errorBanner}>
            {actionErrorMessage ?? errorMessage}
          </div>
        ) : null}
        <Quota usage={bootstrap.dailyPredictionUsage} />
        <MatchesTabs
          activeTab={activeTab}
          predictionCount={data.predictions.length}
          onChange={setActiveTab}
        />
        <TodayContextRow
          businessDate={data.businessDate}
          matchCount={visibleMatchCount}
        />
      </div>
      <div className={styles.scrollArea} data-ui="matches-scroll-area">
        {activeTab === "available" ? (
          <FixtureList
            fixtures={data.fixtures}
            predictionsByFixture={predictionsByFixture}
            pendingFixtureId={pendingFixtureId}
            rewardPromptFixtureId={rewardPromptFixtureId}
            onSelectOutcome={handleOutcome}
          />
        ) : (
          <MyPicks
            predictions={data.predictions}
            fixtures={data.fixtures}
            onSelectOutcome={handleOutcome}
          />
        )}
      </div>
    </main>
  );
};

export default MatchesScreen;

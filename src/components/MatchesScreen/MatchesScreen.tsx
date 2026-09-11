"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type {
  MonetagRewardSessionDto,
  PredictionOutcome,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  isMonetagRewardedInterstitialTimeout,
  preloadMonetagRewardedInterstitial,
  showMonetagRewardedInterstitial,
} from "@/lib/monetag/rewarded-interstitial";
import { initializeTelegramWebApp } from "@/lib/telegram/client";
import FixtureList from "./FixtureList/FixtureList";
import Header from "./Header/Header";
import MyPicks from "./MyPicks/MyPicks";
import MatchesTabs from "./MatchesTabs/MatchesTabs";
import Quota from "./Quota/Quota";
import TodayContextRow from "./TodayContextRow/TodayContextRow";
import { deriveMatchCardState } from "./MatchCardShared/match-card-presentation";
import { useMatchesData } from "./hooks/useMatchesData";
import { selectOutcome, type MatchesActionResult } from "./matches-actions";
import type { ActiveTab } from "./matches-types";
import styles from "./MatchesScreen.module.css";

const REWARD_PRELOAD_MAX_ATTEMPTS = 3;
const REWARD_PRELOAD_RETRY_DELAY_MS = 750;

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
  const [rewardFlow, setRewardFlow] = useState<{
    fixtureId: string;
    selectedOutcome: PredictionOutcome;
    status:
      | "required"
      | "preloading"
      | "ready"
      | "showing"
      | "confirming"
      | "failed"
      | "rejected"
      | "timeout";
    session?: MonetagRewardSessionDto;
  } | null>(null);
  const rewardFlowInFlightRef = useRef(false);
  const rewardFlowGenerationRef = useRef(0);

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
  const fixturesById = useMemo(
    () => new Map(data.fixtures.map((fixture) => [fixture.id, fixture])),
    [data.fixtures],
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

    const fixture = fixturesById.get(fixtureId);
    const existingPrediction = predictionsByFixture.get(fixtureId);
    const canSubmitPrediction = fixture
      ? deriveMatchCardState({
          fixture,
          prediction: existingPrediction,
          pending: false,
          rewardRequired: rewardPromptFixtureId === fixtureId,
        }).canSubmitPrediction
      : false;

    if (!canSubmitPrediction) {
      return;
    }

    const rewardFlowGeneration = closeRewardFlow();

    setPendingFixtureId(fixtureId);
    setActionErrorMessage(null);

    try {
      const result = await selectOutcome({
        apiClient,
        fixtureId,
        selectedOutcome,
        existingPrediction,
        canSubmitPrediction,
        createIdempotencyKey: () => crypto.randomUUID(),
      });

      await handleActionResult(
        result,
        fixtureId,
        selectedOutcome,
        rewardFlowGeneration,
      );
    } catch (error) {
      setActionErrorMessage(messageForApiError(error, locale));
    } finally {
      setPendingFixtureId(null);
    }
  }

  async function handleActionResult(
    result: MatchesActionResult,
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
    rewardFlowGeneration: number,
  ): Promise<void> {
    if (result.status === "blocked") {
      return;
    }

    if (result.status === "reward-required") {
      setRewardPromptFixtureId(fixtureId);
      setRewardFlow({
        fixtureId,
        selectedOutcome,
        status: "required",
      });
      void preloadRewardFlow(fixtureId, selectedOutcome, rewardFlowGeneration);
      return;
    }

    if (result.status === "locked") {
      setActionErrorMessage(t("errors.PREDICTION_LOCKED"));
      await refreshPredictionsOnly();
      return;
    }

    await refresh();
  }

  async function handleStartReward(fixtureId: string): Promise<void> {
    if (rewardFlow?.fixtureId && rewardFlow.fixtureId !== fixtureId) {
      return;
    }

    if (!rewardFlow) {
      return;
    }

    if (
      ["required", "failed", "rejected", "timeout"].includes(rewardFlow.status)
    ) {
      await preloadRewardFlow(fixtureId, rewardFlow.selectedOutcome);
      return;
    }

    if (rewardFlowInFlightRef.current) {
      return;
    }

    if (rewardFlow.status !== "ready" || !rewardFlow.session) {
      return;
    }

    rewardFlowInFlightRef.current = true;
    try {
      await showPreparedReward(
        fixtureId,
        rewardFlow.selectedOutcome,
        rewardFlow.session,
      );
    } finally {
      rewardFlowInFlightRef.current = false;
    }
  }

  async function showPreparedReward(
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
    session: MonetagRewardSessionDto,
  ): Promise<void> {
    try {
      setActionErrorMessage(null);
      setRewardFlow({ fixtureId, selectedOutcome, status: "showing" });
      await showMonetagRewardedInterstitial(session);
      setRewardFlow({ fixtureId, selectedOutcome, status: "confirming" });

      const confirmedSession = await apiClient.confirmMonetagRewardSession({
        adRewardId: session.adRewardId,
      });

      if (confirmedSession.status === "VERIFIED") {
        await submitRewardedPrediction(
          fixtureId,
          selectedOutcome,
          confirmedSession.adRewardId,
        );
        return;
      }

      setRewardFlow({ fixtureId, selectedOutcome, status: "rejected" });
    } catch (error) {
      console.warn("monetag_reward_flow_failed", {
        fixtureId,
        error: error instanceof Error ? error.message : "unknown",
      });
      setRewardFlow({ fixtureId, selectedOutcome, status: "failed" });
      if (error instanceof ApiClientError) {
        setActionErrorMessage(messageForApiError(error, locale));
      }
    }
  }

  async function preloadRewardFlow(
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
    rewardFlowGeneration: number = rewardFlowGenerationRef.current,
  ): Promise<MonetagRewardSessionDto | null> {
    if (rewardFlowInFlightRef.current) {
      return null;
    }

    rewardFlowInFlightRef.current = true;

    try {
      return await prepareRewardFlow(
        fixtureId,
        selectedOutcome,
        () => rewardFlowGeneration !== rewardFlowGenerationRef.current,
      );
    } finally {
      rewardFlowInFlightRef.current = false;
    }
  }

  function closeRewardFlow(): number {
    rewardFlowGenerationRef.current += 1;
    rewardFlowInFlightRef.current = false;
    setRewardPromptFixtureId(null);
    setRewardFlow(null);
    return rewardFlowGenerationRef.current;
  }

  async function prepareRewardFlow(
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
    isCancelled: () => boolean = () => false,
  ): Promise<MonetagRewardSessionDto | null> {
    for (let attempt = 1; attempt <= REWARD_PRELOAD_MAX_ATTEMPTS; attempt++) {
      if (isCancelled()) {
        return null;
      }

      try {
        setActionErrorMessage(null);
        setRewardFlow({ fixtureId, selectedOutcome, status: "preloading" });

        const session = await apiClient.createMonetagRewardSession({
          fixtureId,
          selectedOutcome,
        });

        if (isCancelled()) {
          return null;
        }

        if (session.status === "VERIFIED") {
          await submitRewardedPrediction(
            fixtureId,
            selectedOutcome,
            session.adRewardId,
          );
          return null;
        }

        await preloadMonetagRewardedInterstitial(session);

        if (isCancelled()) {
          return null;
        }

        setRewardFlow({ fixtureId, selectedOutcome, status: "ready", session });
        return session;
      } catch (error) {
        if (isCancelled()) {
          return null;
        }

        const isTimeout = isMonetagRewardedInterstitialTimeout(error);

        console.warn("monetag_reward_prepare_failed", {
          fixtureId,
          attempt,
          attempts: REWARD_PRELOAD_MAX_ATTEMPTS,
          error: error instanceof Error ? error.message : "unknown",
        });

        if (isTimeout && attempt < REWARD_PRELOAD_MAX_ATTEMPTS) {
          await delay(REWARD_PRELOAD_RETRY_DELAY_MS);
          if (isCancelled()) {
            return null;
          }
          continue;
        }

        setRewardFlow({
          fixtureId,
          selectedOutcome,
          status: isTimeout ? "timeout" : "failed",
        });
        if (error instanceof ApiClientError) {
          setActionErrorMessage(messageForApiError(error, locale));
        }
        return null;
      }
    }

    return null;
  }

  async function submitRewardedPrediction(
    fixtureId: string,
    selectedOutcome: PredictionOutcome,
    adRewardId: string,
  ): Promise<void> {
    setPendingFixtureId(fixtureId);

    try {
      await apiClient.createPrediction({
        fixtureId,
        selectedOutcome,
        adRewardId,
        idempotencyKey: crypto.randomUUID(),
      });

      setRewardPromptFixtureId(null);
      setRewardFlow(null);
      await refresh();
    } catch (error) {
      setActionErrorMessage(messageForApiError(error, locale));
    } finally {
      setPendingFixtureId(null);
    }
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
        <Quota
          predictionCount={data.predictions.length}
          usage={bootstrap.dailyPredictionUsage}
        />
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
            rewardFlow={rewardFlow}
            onStartReward={handleStartReward}
            onSelectOutcome={handleOutcome}
          />
        ) : (
          <MyPicks
            predictions={data.predictions}
            fixtures={data.fixtures}
            pendingFixtureId={pendingFixtureId}
            onSelectOutcome={handleOutcome}
          />
        )}
      </div>
    </main>
  );
};

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export default MatchesScreen;

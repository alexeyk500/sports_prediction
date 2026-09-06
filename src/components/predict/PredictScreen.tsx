"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClient, ApiClientError } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type {
  BootstrapResponse,
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { formatBusinessDate, formatLocalizedNumber } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData, initializeTelegramWebApp } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { MatchCard, MyPickCard } from "./MatchCard";
import { selectOutcome, type PredictActionResult } from "./predict-actions";
import styles from "./PredictScreen.module.css";

type ActiveTab = "available" | "my-picks";
type KnownFixtureStatus = "DRAFT" | "OPEN" | "LOCKED" | "LIVE" | "FINISHED" | "SETTLED";

interface PredictState {
  fixtures: TodayFixtureDto[];
  predictions: PredictionDto[];
  businessDate: string | null;
}

export function PredictScreen() {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const { t, locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [state, setState] = useState<PredictState>({ fixtures: [], predictions: [], businessDate: null });
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
        <div className={styles.tabs} role="tablist" aria-label={t("predict.tabs.ariaLabel")}>
          <button
            className={activeTab === "available" ? styles.activeTab : styles.tab}
            type="button"
            role="tab"
            aria-selected={activeTab === "available"}
            onClick={() => setActiveTab("available")}
          >
            {t("predict.tabs.available")}
          </button>
          <button
            className={activeTab === "my-picks" ? styles.activeTab : styles.tab}
            type="button"
            role="tab"
            aria-selected={activeTab === "my-picks"}
            onClick={() => setActiveTab("my-picks")}
          >
            <span>{t("predict.tabs.myPicks")}</span>
            {state.predictions.length > 0 ? (
              <span className={styles.tabCount}>{formatLocalizedNumber(locale, state.predictions.length)}</span>
            ) : null}
          </button>
        </div>
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
}

function Header({ bootstrap }: { bootstrap: BootstrapResponse }) {
  const { t } = useTranslation();
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <section className={styles.header}>
      <div>
        <h1>{t("predict.title")}</h1>
        <p className={styles.subtitle}>{t("predict.subtitle")}</p>
      </div>
      {isDevelopment ? (
        <div className={styles.userBadge} dir="auto">
          {bootstrap.user.firstName ??
            bootstrap.user.username ??
            t("common.userFallback", { id: bootstrap.user.telegramUserId })}
        </div>
      ) : null}
    </section>
  );
}

function Quota({ usage }: { usage: BootstrapResponse["dailyPredictionUsage"] }) {
  const { t, locale } = useTranslation();
  const freeSlots = Array.from({ length: usage.freeLimit }, (_, index) => index < usage.freeUsed);
  const rewardedSlots = Array.from({ length: usage.rewardedLimit }, (_, index) => index < usage.rewardedUsed);
  const showRewardCta = usage.freeUsed >= usage.freeLimit && usage.rewardedUsed < usage.rewardedLimit;
  const values = {
    freeUsed: formatLocalizedNumber(locale, usage.freeUsed),
    freeLimit: formatLocalizedNumber(locale, usage.freeLimit),
    rewardedUsed: formatLocalizedNumber(locale, usage.rewardedUsed),
    rewardedLimit: formatLocalizedNumber(locale, usage.rewardedLimit),
    totalUsed: formatLocalizedNumber(locale, usage.totalUsed),
    totalLimit: formatLocalizedNumber(locale, usage.totalLimit),
  };

  return (
    <section className={styles.quota}>
      <div className={styles.quotaHeader}>
        <h2>{t("predict.quota.title")}</h2>
        <strong>{t("predict.quota.totalShort", { used: values.totalUsed, limit: values.totalLimit })}</strong>
      </div>
      <div className={styles.quotaSlots} aria-hidden="true">
        <span className={styles.slotGroup}>
          {freeSlots.map((isUsed, index) => (
            <span key={`free-${index}`} className={isUsed ? styles.freeSlotUsed : styles.slotUnused} />
          ))}
        </span>
        <span className={styles.slotDivider} />
        <span className={styles.slotGroup}>
          {rewardedSlots.map((isUsed, index) => (
            <span key={`rewarded-${index}`} className={isUsed ? styles.rewardedSlotUsed : styles.slotUnused} />
          ))}
        </span>
      </div>
      <div className={styles.quotaLabels}>
        <span>{t("predict.quota.freeCompact", { used: values.freeUsed, limit: values.freeLimit })}</span>
        <span>{t("predict.quota.rewardedCompact", { used: values.rewardedUsed, limit: values.rewardedLimit })}</span>
      </div>
      {showRewardCta ? (
        <button className={styles.rewardCta} type="button" disabled aria-disabled="true">
          <VideoIcon />
          <span>{t("predict.reward.cta")}</span>
          <strong>{t("predict.reward.plusOne")}</strong>
        </button>
      ) : null}
    </section>
  );
}

function TodayContextRow({ businessDate, matchCount }: { businessDate: string | null; matchCount: number }) {
  const { t, locale } = useTranslation();
  const dateLabel = businessDate ? formatBusinessDate(locale, businessDate) : "";

  return (
    <div className={styles.todayRow}>
      <strong>{dateLabel ? t("predict.today.labelWithDate", { date: dateLabel }) : t("predict.today.label")}</strong>
      <span>{t("predict.today.matchCount", { count: formatLocalizedNumber(locale, matchCount) })}</span>
    </div>
  );
}

function VideoIcon() {
  return (
    <svg className={styles.rewardCtaIcon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h8A2.5 2.5 0 0 1 17 6.5v1.23l2.27-1.36A1.15 1.15 0 0 1 21 7.35v9.3a1.15 1.15 0 0 1-1.73.98L17 16.27v1.23a2.5 2.5 0 0 1-2.5 2.5h-8A2.5 2.5 0 0 1 4 17.5v-11Zm5.4 2.15a.9.9 0 0 0-1.4.75v5.2a.9.9 0 0 0 1.4.75l3.9-2.6a.9.9 0 0 0 0-1.5l-3.9-2.6Z" />
    </svg>
  );
}

function FixtureList({
  fixtures,
  predictionsByFixture,
  pendingFixtureId,
  rewardPromptFixtureId,
  onSelectOutcome,
}: {
  fixtures: TodayFixtureDto[];
  predictionsByFixture: Map<string, PredictionDto>;
  pendingFixtureId: string | null;
  rewardPromptFixtureId: string | null;
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
}) {
  const { t } = useTranslation();

  if (fixtures.length === 0) {
    return <section className={styles.statePanel}>{t("predict.empty.available")}</section>;
  }

  return (
    <section className={styles.fixtureList}>
      {fixtures.map((fixture) => (
        <FixtureCard
          key={fixture.id}
          fixture={fixture}
          prediction={predictionsByFixture.get(fixture.id)}
          pending={pendingFixtureId === fixture.id}
          rewardRequired={rewardPromptFixtureId === fixture.id}
          onSelectOutcome={onSelectOutcome}
        />
      ))}
    </section>
  );
}

function FixtureCard({
  fixture,
  prediction,
  pending,
  rewardRequired,
  onSelectOutcome,
}: {
  fixture: TodayFixtureDto;
  prediction?: PredictionDto;
  pending: boolean;
  rewardRequired: boolean;
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
}) {
  const { t } = useTranslation();

  return (
    <MatchCard
      fixture={fixture}
      prediction={prediction}
      pending={pending}
      rewardRequired={rewardRequired}
      onSelectOutcome={onSelectOutcome}
      fixtureStatusLabel={(status) => fixtureStatusLabel(t, status)}
      outcomeLabel={(outcome) => outcomeLabel(t, outcome)}
    />
  );
}

function MyPicks({
  predictions,
  fixtures,
  onSelectOutcome,
}: {
  predictions: PredictionDto[];
  fixtures: TodayFixtureDto[];
  onSelectOutcome: (fixtureId: string, selectedOutcome: PredictionOutcome) => Promise<void>;
}) {
  const { t } = useTranslation();
  const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  if (predictions.length === 0) {
    return <section className={styles.statePanel}>{t("predict.empty.myPicks")}</section>;
  }

  return (
    <section className={styles.fixtureList}>
      {predictions.map((prediction) => {
        const fixture = fixturesById.get(prediction.fixtureId);

        return (
          <MyPickCard
            key={prediction.id}
            prediction={prediction}
            fixture={fixture}
            onSelectOutcome={onSelectOutcome}
            outcomeLabel={(outcome) => outcomeLabel(t, outcome)}
            slotLabel={(slotType) => slotLabel(t, slotType)}
          />
        );
      })}
    </section>
  );
}

function outcomeLabel(t: ReturnType<typeof useTranslation>["t"], outcome: PredictionOutcome): string {
  return t(`predict.outcomes.${outcome}`);
}

function slotLabel(t: ReturnType<typeof useTranslation>["t"], slotType: PredictionDto["slotType"]): string {
  return t(`predict.slot.${slotType}`);
}

function fixtureStatusLabel(t: ReturnType<typeof useTranslation>["t"], status: string): string {
  return isKnownFixtureStatus(status) ? t(`predict.fixtureStatus.${status}`) : status;
}

function isKnownFixtureStatus(status: string): status is KnownFixtureStatus {
  return ["DRAFT", "OPEN", "LOCKED", "LIVE", "FINISHED", "SETTLED"].includes(status);
}

function logPredictLoadError(error: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error instanceof ApiClientError) {
    console.error("Predict bootstrap failed", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error("Predict bootstrap failed", error instanceof Error ? error.message : error);
}

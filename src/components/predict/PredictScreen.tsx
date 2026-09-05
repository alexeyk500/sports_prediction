"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiClient, ApiClientError } from "@/lib/api/client";
import type {
  BootstrapResponse,
  PredictionDto,
  PredictionOutcome,
  TodayFixtureDto,
} from "@/lib/api/types";
import { getTelegramInitData, initializeTelegramWebApp } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { selectOutcome, type PredictActionResult } from "./predict-actions";
import styles from "./PredictScreen.module.css";

type ActiveTab = "available" | "my-picks";

interface PredictState {
  fixtures: TodayFixtureDto[];
  predictions: PredictionDto[];
}

const outcomeLabels: Record<PredictionOutcome, string> = {
  HOME: "HOME",
  DRAW: "DRAW",
  AWAY: "AWAY",
};

export function PredictScreen() {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [state, setState] = useState<PredictState>({ fixtures: [], predictions: [] });
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
    });
  }, [apiClient, setBootstrap]);

  useEffect(() => {
    initializeTelegramWebApp();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial client bootstrap fetch synchronizes with backend API.
    load()
      .catch((error: unknown) => {
        logPredictLoadError(error);
        setErrorMessage(messageForError(error));
      })
      .finally(() => setIsLoading(false));
  }, [load]);

  const predictionsByFixture = useMemo(
    () => new Map(state.predictions.map((prediction) => [prediction.fixtureId, prediction])),
    [state.predictions],
  );

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
      setErrorMessage(messageForError(error));
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
      setErrorMessage(result.message);
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
    return <main className={styles.centerState}>Loading today&apos;s matches...</main>;
  }

  if (!bootstrap) {
    return (
      <main className={styles.centerState}>
        <section className={styles.statePanel}>
          <h1>Predict</h1>
          <p>{errorMessage ?? "Authentication is required."}</p>
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
        <div className={styles.tabs} role="tablist" aria-label="Predict views">
          <button
            className={activeTab === "available" ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => setActiveTab("available")}
          >
            Available
          </button>
          <button
            className={activeTab === "my-picks" ? styles.activeTab : styles.tab}
            type="button"
            onClick={() => setActiveTab("my-picks")}
          >
            My Picks
          </button>
        </div>
      </div>
      <div className={styles.scrollArea}>
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
  return (
    <section className={styles.header}>
      <div>
        <p className={styles.kicker}>Weekly Cup</p>
        <h1>Predict</h1>
      </div>
      <div className={styles.userBadge}>
        {bootstrap.user.firstName ?? bootstrap.user.username ?? `User ${bootstrap.user.telegramUserId}`}
      </div>
    </section>
  );
}

function Quota({ usage }: { usage: BootstrapResponse["dailyPredictionUsage"] }) {
  return (
    <section className={styles.quota}>
      <span>Free predictions: {usage.freeUsed} / {usage.freeLimit}</span>
      <span>Rewarded predictions: {usage.rewardedUsed} / {usage.rewardedLimit}</span>
      <span>Total: {usage.totalUsed} / {usage.totalLimit}</span>
    </section>
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
  if (fixtures.length === 0) {
    return <section className={styles.statePanel}>No available matches today.</section>;
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
  const editable = prediction ? prediction.editable : true;

  return (
    <article className={styles.fixtureCard}>
      <div className={styles.fixtureMeta}>
        <span>{fixture.competition.name}</span>
        <time dateTime={fixture.kickoffAt}>{formatKickoff(fixture.kickoffAt)}</time>
      </div>
      <div className={styles.teams}>
        <span>{fixture.homeTeam.name}</span>
        <span>{fixture.awayTeam.name}</span>
      </div>
      <div className={styles.outcomes}>
        {(["HOME", "DRAW", "AWAY"] as const).map((outcome) => (
          <button
            key={outcome}
            type="button"
            className={prediction?.selectedOutcome === outcome ? styles.selectedOutcome : styles.outcomeButton}
            disabled={pending || !editable}
            onClick={() => void onSelectOutcome(fixture.id, outcome)}
          >
            <span>{outcomeLabels[outcome]}</span>
            <strong>{pointsForOutcome(fixture, outcome)} pts</strong>
          </button>
        ))}
      </div>
      <div className={styles.fixtureStatus}>
        {prediction ? (
          <span>{editable ? `Selected ${prediction.selectedOutcome}` : "Locked after kickoff"}</span>
        ) : (
          <span>{fixture.status}</span>
        )}
        {pending ? <span>Saving...</span> : null}
      </div>
      {rewardRequired ? (
        <div className={styles.rewardPlaceholder}>
          <strong>Watch ad to unlock prediction</strong>
          <span>Rewarded ads are not connected in this development stage.</span>
        </div>
      ) : null}
    </article>
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
  const fixturesById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));

  if (predictions.length === 0) {
    return <section className={styles.statePanel}>No picks yet.</section>;
  }

  return (
    <section className={styles.fixtureList}>
      {predictions.map((prediction) => {
        const fixture = fixturesById.get(prediction.fixtureId);

        return (
          <article key={prediction.id} className={styles.fixtureCard}>
            <div className={styles.fixtureMeta}>
              <span>{fixture?.competition.name ?? "Fixture"}</span>
              <time dateTime={prediction.kickoffAt}>{formatKickoff(prediction.kickoffAt)}</time>
            </div>
            <div className={styles.pickRow}>
              <strong>{prediction.selectedOutcome}</strong>
              <span>{prediction.potentialPoints} pts</span>
              <span>{prediction.slotType}</span>
              <span>{prediction.editable ? "Editable" : "Locked"}</span>
            </div>
            {fixture && prediction.editable ? (
              <div className={styles.outcomes}>
                {(["HOME", "DRAW", "AWAY"] as const).map((outcome) => (
                  <button
                    key={outcome}
                    type="button"
                    className={prediction.selectedOutcome === outcome ? styles.selectedOutcome : styles.outcomeButton}
                    onClick={() => void onSelectOutcome(fixture.id, outcome)}
                  >
                    <span>{outcome}</span>
                    <strong>{pointsForOutcome(fixture, outcome)} pts</strong>
                  </button>
                ))}
              </div>
            ) : null}
          </article>
        );
      })}
    </section>
  );
}

function pointsForOutcome(fixture: TodayFixtureDto, outcome: PredictionOutcome): number {
  switch (outcome) {
    case "HOME":
      return fixture.outcomes.home.points;
    case "DRAW":
      return fixture.outcomes.draw.points;
    case "AWAY":
      return fixture.outcomes.away.points;
  }
}

function formatKickoff(kickoffAt: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(kickoffAt));
}

function messageForError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (process.env.NODE_ENV === "development") {
      return `${error.code}${error.endpoint ? ` at ${error.endpoint}` : ""}: ${error.message}`;
    }

    if (error.code === "MISSING_TELEGRAM_INIT_DATA") {
      return "Open this app in Telegram or configure development initData.";
    }

    return error.message;
  }

  return "Something went wrong.";
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

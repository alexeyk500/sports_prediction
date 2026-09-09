"use client";

import { useCallback, useEffect, useMemo } from "react";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type {
  BootstrapResponse,
  TodayFixturesResponse,
  TodayPredictionsResponse,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { getTelegramInitData } from "@/lib/telegram/client";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import { useMatchesStore } from "@/stores/matches-store";
import { logMatchesLoadError } from "../matches-log";

interface IMatchesDataLoader {
  getBootstrap: ApiClient["getBootstrap"];
  getTodayFixtures: ApiClient["getTodayFixtures"];
  getTodayPredictions: ApiClient["getTodayPredictions"];
}

interface ILoadMatchesDataOnceInput {
  apiClient: IMatchesDataLoader;
  beginMatchesDataLoad: () => boolean;
  setBootstrap: (bootstrap: BootstrapResponse | null) => void;
  setMatchesData: (data: {
    fixtures: TodayFixturesResponse["fixtures"];
    predictions: TodayPredictionsResponse["predictions"];
    businessDate: string;
  }) => void;
  failMatchesDataLoad: (error: unknown) => void;
}

export function useMatchesData() {
  const { locale } = useTranslation();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const bootstrap = useBootstrapStore((store) => store.bootstrap);
  const setBootstrap = useBootstrapStore((store) => store.setBootstrap);
  const status = useMatchesStore((store) => store.status);
  const data = useMatchesStore((store) => store.data);
  const error = useMatchesStore((store) => store.error);
  const beginMatchesDataLoad = useMatchesStore(
    (store) => store.beginMatchesDataLoad,
  );
  const setMatchesData = useMatchesStore((store) => store.setMatchesData);
  const failMatchesDataLoad = useMatchesStore(
    (store) => store.failMatchesDataLoad,
  );
  const setTodayPredictions = useMatchesStore(
    (store) => store.setTodayPredictions,
  );

  const refresh = useCallback(
    () =>
      loadMatchesDataOnce({
        apiClient,
        beginMatchesDataLoad,
        setBootstrap,
        setMatchesData,
        failMatchesDataLoad,
      }),
    [
      apiClient,
      beginMatchesDataLoad,
      failMatchesDataLoad,
      setBootstrap,
      setMatchesData,
    ],
  );

  const refreshPredictionsOnly = useCallback(async () => {
    const predictions = await apiClient.getTodayPredictions();
    setTodayPredictions(predictions.predictions);
  }, [apiClient, setTodayPredictions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const errorMessage = error ? messageForApiError(error, locale) : null;

  return {
    bootstrap,
    data,
    isLoading: status === "loading" && data.businessDate === null,
    errorMessage,
    apiClient,
    refresh,
    refreshPredictionsOnly,
  };
}

export async function loadMatchesDataOnce({
  apiClient,
  beginMatchesDataLoad,
  setBootstrap,
  setMatchesData,
  failMatchesDataLoad,
}: ILoadMatchesDataOnceInput): Promise<void> {
  if (!beginMatchesDataLoad()) {
    return;
  }

  try {
    const [nextBootstrap, fixtures, predictions] = await Promise.all([
      apiClient.getBootstrap(),
      apiClient.getTodayFixtures(),
      apiClient.getTodayPredictions(),
    ]);

    setBootstrap(nextBootstrap);
    setMatchesData({
      fixtures: fixtures.fixtures,
      predictions: predictions.predictions,
      businessDate: fixtures.businessDate,
    });
  } catch (error: unknown) {
    logMatchesLoadError(error);
    failMatchesDataLoad(error);
  }
}

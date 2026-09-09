"use client";

import { useCallback, useEffect } from "react";
import type { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import type { CupHistoryResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBootstrapStore } from "@/stores/bootstrap-store";

interface ICupHistoryLoader {
  getCupHistory: ApiClient["getCupHistory"];
}

interface ILoadCupHistoryOnceInput {
  cupId: string | null | undefined;
  apiClient: ICupHistoryLoader;
  beginCupHistoryLoad: (cupId: string) => boolean;
  setCupHistory: (cupId: string, data: CupHistoryResponse) => void;
  failCupHistoryLoad: (cupId: string, error: unknown) => void;
}

export function useCupHistory(
  cupId: string | null | undefined,
  apiClient: ApiClient,
) {
  const { locale } = useTranslation();
  const state = useBootstrapStore((store) =>
    cupId ? store.historyByCupId[cupId] : undefined,
  );
  const beginCupHistoryLoad = useBootstrapStore(
    (store) => store.beginCupHistoryLoad,
  );
  const setCupHistory = useBootstrapStore((store) => store.setCupHistory);
  const failCupHistoryLoad = useBootstrapStore(
    (store) => store.failCupHistoryLoad,
  );

  const load = useCallback(
    () =>
      loadCupHistoryOnce({
        cupId,
        apiClient,
        beginCupHistoryLoad,
        setCupHistory,
        failCupHistoryLoad,
      }),
    [apiClient, beginCupHistoryLoad, cupId, failCupHistoryLoad, setCupHistory],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retry = useCallback(() => {
    void load();
  }, [load]);

  const errorMessage = state?.error
    ? messageForApiError(state.error, locale)
    : null;

  return {
    data: state?.data ?? null,
    isLoading: state?.status === "loading",
    errorMessage,
    retry,
  };
}

export async function loadCupHistoryOnce({
  cupId,
  apiClient,
  beginCupHistoryLoad,
  setCupHistory,
  failCupHistoryLoad,
}: ILoadCupHistoryOnceInput): Promise<void> {
  if (!cupId || !beginCupHistoryLoad(cupId)) {
    return;
  }

  try {
    const history = await apiClient.getCupHistory({ cupId });
    setCupHistory(cupId, history);
  } catch (error: unknown) {
    failCupHistoryLoad(cupId, error);
  }
}

"use client";

import { useCallback, useEffect } from "react";
import type { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import { useTranslation } from "@/lib/i18n/use-translation";
import { useBootstrapStore } from "@/stores/bootstrap-store";
import type { CupLeaderboardPageResponse } from "@/lib/api/types";

const TOP_LEADERBOARD_LIMIT = 50;

interface ICupTopLeaderboardLoader {
  getCupLeaderboard: ApiClient["getCupLeaderboard"];
}

interface ILoadCupTopLeaderboardOnceInput {
  cupId: string | null | undefined;
  apiClient: ICupTopLeaderboardLoader;
  beginCupTopLeaderboardLoad: (cupId: string) => boolean;
  setCupTopLeaderboard: (
    cupId: string,
    data: CupLeaderboardPageResponse,
  ) => void;
  failCupTopLeaderboardLoad: (cupId: string, error: unknown) => void;
}

export function useCupTopLeaderboard(
  cupId: string | null | undefined,
  apiClient: ApiClient,
) {
  const { locale } = useTranslation();
  const state = useBootstrapStore((store) =>
    cupId ? store.topLeaderboardByCupId[cupId] : undefined,
  );
  const beginCupTopLeaderboardLoad = useBootstrapStore(
    (store) => store.beginCupTopLeaderboardLoad,
  );
  const setCupTopLeaderboard = useBootstrapStore(
    (store) => store.setCupTopLeaderboard,
  );
  const failCupTopLeaderboardLoad = useBootstrapStore(
    (store) => store.failCupTopLeaderboardLoad,
  );

  const load = useCallback(
    () =>
      loadCupTopLeaderboardOnce({
        cupId,
        apiClient,
        beginCupTopLeaderboardLoad,
        setCupTopLeaderboard,
        failCupTopLeaderboardLoad,
      }),
    [
      apiClient,
      beginCupTopLeaderboardLoad,
      cupId,
      failCupTopLeaderboardLoad,
      setCupTopLeaderboard,
    ],
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

export async function loadCupTopLeaderboardOnce({
  cupId,
  apiClient,
  beginCupTopLeaderboardLoad,
  setCupTopLeaderboard,
  failCupTopLeaderboardLoad,
}: ILoadCupTopLeaderboardOnceInput): Promise<void> {
  if (!cupId || !beginCupTopLeaderboardLoad(cupId)) {
    return;
  }

  try {
    const topLeaderboard = await apiClient.getCupLeaderboard({
      cupId,
      mode: "top",
      limit: TOP_LEADERBOARD_LIMIT,
    });
    setCupTopLeaderboard(cupId, topLeaderboard);
  } catch (error: unknown) {
    failCupTopLeaderboardLoad(cupId, error);
  }
}

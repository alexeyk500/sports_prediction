import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { messageForApiError } from "@/lib/api/error-presentation";
import type {
  CupLeaderboardPageResponse,
  SupportedLocale,
} from "@/lib/api/types";
import {
  mergeCupLeaderboardRows,
  toCupLeaderboardRowModel,
  type CupLeaderboardMode,
  type ICupLeaderboardModeState,
  type LoadCupLeaderboardAroundMe,
  type LoadCupLeaderboardPage,
} from "./leaderboard-types";

const PAGE_SIZE = 50;
export const AROUND_ME_RADIUS = 4;
type CupLeaderboardLazyMode = Exclude<CupLeaderboardMode, "top">;

interface IUseCupLeaderboardInput {
  cupId: string;
  activeMode: CupLeaderboardMode;
  initialTop: CupLeaderboardPageResponse | null;
  isInitialTopLoading: boolean;
  initialTopError: string | null;
  retryInitialTop: () => void;
  loadPage: LoadCupLeaderboardPage;
  loadAroundMe: LoadCupLeaderboardAroundMe;
  locale: SupportedLocale;
}

export function useCupLeaderboard({
  cupId,
  activeMode,
  initialTop,
  isInitialTopLoading,
  initialTopError,
  retryInitialTop,
  loadPage,
  loadAroundMe,
  locale,
}: IUseCupLeaderboardInput) {
  const [modeState, setModeState] = useState<
    Record<CupLeaderboardLazyMode, ICupLeaderboardModeState>
  >(() => createLazyModeState());
  const [loadingMode, setLoadingMode] = useState<CupLeaderboardLazyMode | null>(
    null,
  );
  const [loadingNextCursor, setLoadingNextCursor] = useState<string | null>(
    null,
  );
  const [errorMessages, setErrorMessages] = useState<
    Record<CupLeaderboardLazyMode, string | null>
  >({
    "around-me": null,
    all: null,
  });
  const topModeState = useMemo(
    () => createTopModeState(initialTop),
    [initialTop],
  );
  const currentModeState =
    activeMode === "top" ? topModeState : modeState[activeMode];
  const errorMessage =
    activeMode === "top" ? initialTopError : errorMessages[activeMode];
  const isInitialLoading =
    activeMode === "top"
      ? isInitialTopLoading
      : loadingMode === activeMode && !currentModeState.isLoaded;
  const isLoadingNextPage =
    activeMode === "all" &&
    loadingNextCursor !== null &&
    loadingNextCursor === currentModeState.nextCursor;

  /* eslint-disable react-hooks/set-state-in-effect -- reset leaderboard query state when bootstrap provides a different Cup identity. */
  useEffect(() => {
    setModeState(createLazyModeState());
    setLoadingMode(null);
    setLoadingNextCursor(null);
    setErrorMessages({
      "around-me": null,
      all: null,
    });
  }, [cupId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const loadMode = useCallback(
    async (mode: CupLeaderboardLazyMode) => {
      setLoadingMode(mode);
      setModeError(setErrorMessages, mode, null);

      try {
        if (mode === "around-me") {
          const response = await loadAroundMe({
            cupId,
            radius: AROUND_ME_RADIUS,
          });

          setModeState((current) => ({
            ...current,
            [mode]: {
              rows: response.items.map(toCupLeaderboardRowModel),
              totalParticipants: response.totalParticipants,
              nextCursor: null,
              isLoaded: true,
            },
          }));
          return;
        }

        const response = await loadPage({
          cupId,
          mode,
          limit: PAGE_SIZE,
        });

        setModeState((current) => ({
          ...current,
          [mode]: {
            rows: response.items.map(toCupLeaderboardRowModel),
            totalParticipants: response.totalParticipants,
            nextCursor: response.nextCursor,
            isLoaded: true,
          },
        }));
      } catch (error: unknown) {
        setModeError(setErrorMessages, mode, messageForApiError(error, locale));
      } finally {
        setLoadingMode((current) => (current === mode ? null : current));
      }
    },
    [cupId, loadAroundMe, loadPage, locale],
  );

  useEffect(() => {
    if (activeMode === "top" || currentModeState.isLoaded) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- leaderboard query hook starts the active lazy request when its query identity changes.
    void loadMode(activeMode);
  }, [activeMode, currentModeState.isLoaded, loadMode]);

  const loadNextAllPage = useCallback(async () => {
    if (
      !shouldLoadNextAllPage({
        activeMode,
        nextCursor: modeState.all.nextCursor,
        loadingNextCursor,
        loadingMode,
      })
    ) {
      return;
    }

    const cursor = modeState.all.nextCursor;

    setLoadingNextCursor(cursor);
    setModeError(setErrorMessages, "all", null);

    try {
      const response = await loadPage({
        cupId,
        mode: "all",
        limit: PAGE_SIZE,
        cursor,
      });
      const nextRows = response.items.map(toCupLeaderboardRowModel);

      setModeState((current) => ({
        ...current,
        all: {
          rows: mergeCupLeaderboardRows(current.all.rows, nextRows),
          totalParticipants: response.totalParticipants,
          nextCursor: response.nextCursor,
          isLoaded: true,
        },
      }));
    } catch (error: unknown) {
      setModeError(setErrorMessages, "all", messageForApiError(error, locale));
    } finally {
      setLoadingNextCursor((current) => (current === cursor ? null : current));
    }
  }, [
    activeMode,
    cupId,
    loadPage,
    loadingNextCursor,
    loadingMode,
    locale,
    modeState.all.nextCursor,
  ]);

  const retry = useCallback(() => {
    if (activeMode === "top") {
      retryInitialTop();
      return;
    }

    void loadMode(activeMode);
  }, [activeMode, loadMode, retryInitialTop]);

  return useMemo(
    () => ({
      currentModeState,
      errorMessage,
      isInitialLoading,
      isLoadingNextPage,
      loadNextAllPage,
      retry,
    }),
    [
      currentModeState,
      errorMessage,
      isInitialLoading,
      isLoadingNextPage,
      loadNextAllPage,
      retry,
    ],
  );
}

function setModeError(
  setErrorMessages: Dispatch<
    SetStateAction<Record<CupLeaderboardLazyMode, string | null>>
  >,
  mode: CupLeaderboardLazyMode,
  errorMessage: string | null,
): void {
  setErrorMessages((current) => ({
    ...current,
    [mode]: errorMessage,
  }));
}

export function createTopModeState(
  initialTop: CupLeaderboardPageResponse | null,
): ICupLeaderboardModeState {
  if (!initialTop) {
    return createEmptyModeState();
  }

  return {
    rows: initialTop.items.map(toCupLeaderboardRowModel),
    totalParticipants: initialTop.totalParticipants,
    nextCursor: initialTop.nextCursor,
    isLoaded: true,
  };
}

function createLazyModeState(): Record<
  CupLeaderboardLazyMode,
  ICupLeaderboardModeState
> {
  return {
    "around-me": createEmptyModeState(),
    all: createEmptyModeState(),
  };
}

export function shouldLoadNextAllPage(input: {
  activeMode: CupLeaderboardMode;
  nextCursor: string | null;
  loadingNextCursor: string | null;
  loadingMode: CupLeaderboardLazyMode | null;
}): boolean {
  return (
    input.activeMode === "all" &&
    input.nextCursor !== null &&
    input.loadingNextCursor !== input.nextCursor &&
    input.loadingMode === null
  );
}

function createEmptyModeState(): ICupLeaderboardModeState {
  return {
    rows: [],
    totalParticipants: 0,
    nextCursor: null,
    isLoaded: false,
  };
}

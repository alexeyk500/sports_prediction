import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import { ApiClient } from "@/lib/api/client";
import { messageForApiError } from "@/lib/api/error-presentation";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeaderboardModeTabs from "./LeaderboardModeTabs/LeaderboardModeTabs";
import LeaderboardTable from "./LeaderboardTable/LeaderboardTable";
import {
  mergeCupLeaderboardRows,
  toCupLeaderboardRowModel,
  type CupLeaderboardMode,
  type ICupLeaderboardModeState,
} from "./leaderboard-types";
import styles from "./CupLeaderboard.module.css";

interface ICupLeaderboardProps {
  cupId: string;
  apiClient: ApiClient;
}

const PAGE_SIZE = 50;
const AROUND_ME_RADIUS = 4;

const CupLeaderboard: React.FC<ICupLeaderboardProps> = ({
  cupId,
  apiClient,
}) => {
  const { t, locale } = useTranslation();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<CupLeaderboardMode>("top");
  const [modeState, setModeState] = useState<
    Record<CupLeaderboardMode, ICupLeaderboardModeState>
  >({
    top: createEmptyModeState(),
    "around-me": createEmptyModeState(),
    all: createEmptyModeState(),
  });
  const [loadingMode, setLoadingMode] = useState<CupLeaderboardMode | null>(
    null,
  );
  const [isLoadingNextPage, setIsLoadingNextPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const currentModeState = modeState[activeMode];
  const isInitialLoading =
    loadingMode === activeMode && !currentModeState.isLoaded;

  const loadMode = useCallback(
    async (mode: CupLeaderboardMode, force = false) => {
      if (!force && modeState[mode].isLoaded) {
        setErrorMessage(null);
        return;
      }

      setLoadingMode(mode);
      setErrorMessage(null);

      try {
        if (mode === "around-me") {
          const response = await apiClient.getCupLeaderboardAroundMe({
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

        const response = await apiClient.getCupLeaderboard({
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
        setErrorMessage(messageForApiError(error, locale));
      } finally {
        setLoadingMode((current) => (current === mode ? null : current));
      }
    },
    [apiClient, cupId, locale, modeState],
  );

  const loadNextAllPage = useCallback(async () => {
    const allState = modeState.all;

    if (
      activeMode !== "all" ||
      !allState.nextCursor ||
      isLoadingNextPage ||
      loadingMode
    ) {
      return;
    }

    setIsLoadingNextPage(true);
    setErrorMessage(null);

    try {
      const response = await apiClient.getCupLeaderboard({
        cupId,
        mode: "all",
        limit: PAGE_SIZE,
        cursor: allState.nextCursor,
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
      setErrorMessage(messageForApiError(error, locale));
    } finally {
      setIsLoadingNextPage(false);
    }
  }, [
    activeMode,
    apiClient,
    cupId,
    isLoadingNextPage,
    loadingMode,
    locale,
    modeState.all,
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leaderboard modes load independently from the Cup bootstrap request.
    void loadMode(activeMode);
  }, [activeMode, loadMode]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (
      activeMode !== "all" ||
      !target ||
      !currentModeState.nextCursor ||
      errorMessage
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          void loadNextAllPage();
        }
      },
      { rootMargin: "260px 0px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [activeMode, currentModeState.nextCursor, errorMessage, loadNextAllPage]);

  const modeTitle = useMemo(() => {
    if (activeMode === "around-me") {
      return t("cup.leaderboardStates.aroundTitle");
    }

    return t("cup.leaderboard");
  }, [activeMode, t]);
  const modeSubtitle = useMemo(() => {
    if (activeMode !== "around-me" || currentModeState.rows.length === 0) {
      return null;
    }

    const firstRank = currentModeState.rows[0]?.rank;
    const lastRank = currentModeState.rows.at(-1)?.rank;

    return firstRank && lastRank
      ? t("cup.leaderboardStates.aroundSubtitle", {
          start: firstRank,
          end: lastRank,
        })
      : null;
  }, [activeMode, currentModeState.rows, t]);

  return (
    <section className={styles.stack} aria-label={t("cup.leaderboard")}>
      <LeaderboardModeTabs activeMode={activeMode} onChange={setActiveMode} />
      <div className={styles.leaderboard}>
        <div className={styles.heading}>
          <h2>{modeTitle}</h2>
          {modeSubtitle ? <p>{modeSubtitle}</p> : null}
        </div>
        <div className={styles.leaderboardHeader} aria-hidden="true">
          <span>{t("cup.columns.rank")}</span>
          <span>{t("cup.columns.player")}</span>
          <span>{t("cup.columns.correctWrong")}</span>
          <span>{t("cup.columns.points")}</span>
        </div>
        <LeaderboardTable
          rows={currentModeState.rows}
          isLoading={isInitialLoading}
          errorMessage={errorMessage}
          onRetry={() => void loadMode(activeMode, true)}
        />
        {activeMode === "all" && currentModeState.rows.length > 0 ? (
          <div className={styles.paginationState}>
            {isLoadingNextPage ? (
              <span>{t("cup.leaderboardStates.loadingMore")}</span>
            ) : null}
            {!isLoadingNextPage && currentModeState.nextCursor ? (
              <button type="button" onClick={() => void loadNextAllPage()}>
                {t("cup.leaderboardStates.loadMore")}
              </button>
            ) : null}
            {!isLoadingNextPage && !currentModeState.nextCursor ? (
              <span>{t("cup.leaderboardStates.end")}</span>
            ) : null}
            <div
              ref={loadMoreRef}
              className={styles.loadSentinel}
              aria-hidden="true"
            />
          </div>
        ) : null}
        {activeMode === "around-me" && currentModeState.rows.length > 0 ? (
          <button
            className={styles.fullLeaderboardButton}
            type="button"
            onClick={() => setActiveMode("all")}
          >
            {t("cup.leaderboardStates.viewFull")}
          </button>
        ) : null}
      </div>
    </section>
  );
};

export default CupLeaderboard;

function createEmptyModeState(): ICupLeaderboardModeState {
  return {
    rows: [],
    totalParticipants: 0,
    nextCursor: null,
    isLoaded: false,
  };
}

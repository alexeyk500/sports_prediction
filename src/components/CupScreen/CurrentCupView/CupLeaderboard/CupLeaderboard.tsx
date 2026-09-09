import { useEffect, useMemo, useRef, useState } from "react";
import type React from "react";
import type { CupLeaderboardPageResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import LeaderboardModeTabs from "./LeaderboardModeTabs/LeaderboardModeTabs";
import LeaderboardTable from "./LeaderboardTable/LeaderboardTable";
import type {
  CupLeaderboardMode,
  LoadCupLeaderboardAroundMe,
  LoadCupLeaderboardPage,
} from "./leaderboard-types";
import styles from "./CupLeaderboard.module.css";
import { useCupLeaderboard } from "./useCupLeaderboard";

interface ICupLeaderboardProps {
  cupId: string;
  initialTop: CupLeaderboardPageResponse | null;
  isInitialTopLoading: boolean;
  initialTopError: string | null;
  retryInitialTop: () => void;
  loadPage: LoadCupLeaderboardPage;
  loadAroundMe: LoadCupLeaderboardAroundMe;
}

const CupLeaderboard: React.FC<ICupLeaderboardProps> = ({
  cupId,
  initialTop,
  isInitialTopLoading,
  initialTopError,
  retryInitialTop,
  loadPage,
  loadAroundMe,
}) => {
  const { t, locale } = useTranslation();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [activeMode, setActiveMode] = useState<CupLeaderboardMode>("top");
  const {
    currentModeState,
    errorMessage,
    isInitialLoading,
    isLoadingNextPage,
    loadNextAllPage,
    retry,
  } = useCupLeaderboard({
    cupId,
    activeMode,
    initialTop,
    isInitialTopLoading,
    initialTopError,
    retryInitialTop,
    loadPage,
    loadAroundMe,
    locale,
  });

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
          onRetry={retry}
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

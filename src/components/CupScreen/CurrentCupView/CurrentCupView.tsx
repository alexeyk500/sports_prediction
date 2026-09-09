import type React from "react";
import type {
  BootstrapResponse,
  CupLeaderboardPageResponse,
} from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import CupHero from "./CupHero/CupHero";
import CupLeaderboard from "./CupLeaderboard/CupLeaderboard";
import {
  toCupLeaderboardRowModel,
  type LoadCupLeaderboardAroundMe,
  type LoadCupLeaderboardPage,
} from "./CupLeaderboard/leaderboard-types";
import CupParticipantsStrip from "./CupParticipantsStrip/CupParticipantsStrip";
import UserCupPosition from "./UserCupPosition/UserCupPosition";
import styles from "./CurrentCupView.module.css";

interface ICurrentCupViewProps {
  tournament: BootstrapResponse["currentTournament"];
  cup: BootstrapResponse["cup"];
  businessTimezone: string;
  topLeaderboard: CupLeaderboardPageResponse | null;
  isTopLeaderboardLoading: boolean;
  topLeaderboardError: string | null;
  retryTopLeaderboard: () => void;
  loadLeaderboardPage: LoadCupLeaderboardPage;
  loadLeaderboardAroundMe: LoadCupLeaderboardAroundMe;
  onOpenMatches: () => void;
}

const CurrentCupView: React.FC<ICurrentCupViewProps> = ({
  tournament,
  cup,
  businessTimezone,
  topLeaderboard,
  isTopLeaderboardLoading,
  topLeaderboardError,
  retryTopLeaderboard,
  loadLeaderboardPage,
  loadLeaderboardAroundMe,
  onOpenMatches,
}) => {
  const { t } = useTranslation();
  const currentUserRow = cup?.currentUserRow
    ? toCupLeaderboardRowModel(cup.currentUserRow)
    : null;

  if (!tournament || !cup) {
    return (
      <section className={styles.statePanel}>
        {t("cup.empty.noCurrentCup")}
      </section>
    );
  }

  return (
    <section className={styles.currentStack}>
      <CupHero tournament={tournament} timeZone={businessTimezone} />
      <CupParticipantsStrip
        participantCountLabel={
          cup ? String(cup.participantCount) : t("cup.unavailable")
        }
      />
      <UserCupPosition row={currentUserRow} onOpenMatches={onOpenMatches} />
      <CupLeaderboard
        cupId={tournament.id}
        initialTop={topLeaderboard}
        isInitialTopLoading={isTopLeaderboardLoading}
        initialTopError={topLeaderboardError}
        retryInitialTop={retryTopLeaderboard}
        loadPage={loadLeaderboardPage}
        loadAroundMe={loadLeaderboardAroundMe}
      />
    </section>
  );
};

export default CurrentCupView;

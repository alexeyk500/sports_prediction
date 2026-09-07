import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import CupHero from "./CupHero/CupHero";
import CupLeaderboard from "./CupLeaderboard/CupLeaderboard";
import CupParticipantsStrip from "./CupParticipantsStrip/CupParticipantsStrip";
import UserCupPosition from "./UserCupPosition/UserCupPosition";
import styles from "./CurrentCupView.module.css";

interface ICurrentCupViewProps {
  bootstrap: BootstrapResponse;
  nowMs: number;
  cup: BootstrapResponse["cup"];
  onMakePrediction: () => void;
}

const CurrentCupView: React.FC<ICurrentCupViewProps> = ({
  bootstrap,
  nowMs,
  cup,
  onMakePrediction,
}) => {
  const { t } = useTranslation();
  const tournament = bootstrap.currentTournament;
  const currentUserRow = cup?.pinnedCurrentUserRow ?? cup?.leaderboardRows.find((row) => row.isCurrentUser) ?? null;

  if (!tournament) {
    return <section className={styles.statePanel}>{t("cup.empty.noCurrentCup")}</section>;
  }

  return (
    <section className={styles.currentStack}>
      <CupHero tournament={tournament} nowMs={nowMs} timeZone={bootstrap.businessTimezone} />
      <CupParticipantsStrip participantCountLabel={cup ? String(cup.participantCount) : t("cup.unavailable")} />
      <UserCupPosition row={currentUserRow} onMakePrediction={onMakePrediction} />
      <CupLeaderboard rows={cup?.leaderboardRows ?? []} pinnedCurrentUserRow={cup?.pinnedCurrentUserRow ?? null} />
    </section>
  );
};

export default CurrentCupView;

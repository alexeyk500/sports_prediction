import type React from "react";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import { CupHero } from "./CupHero/CupHero";
import { CupLeaderboard } from "./CupLeaderboard/CupLeaderboard";
import type { ICupLeaderboardRowModel } from "./CupLeaderboard/leaderboard-types";
import { CupParticipantsStrip } from "./CupParticipantsStrip/CupParticipantsStrip";
import { UserCupPosition } from "./UserCupPosition/UserCupPosition";
import styles from "./CurrentCupView.module.css";

interface ICurrentCupViewProps {
  bootstrap: BootstrapResponse;
  nowMs: number;
  leaderboardRows: ICupLeaderboardRowModel[];
  pinnedCurrentUserRow: ICupLeaderboardRowModel | null;
  participantCountLabel: string;
  onMakePrediction: () => void;
}

const CurrentCupView: React.FC<ICurrentCupViewProps> = ({
  bootstrap,
  nowMs,
  leaderboardRows,
  pinnedCurrentUserRow,
  participantCountLabel,
  onMakePrediction,
}) => {
  const { t } = useTranslation();
  const tournament = bootstrap.currentTournament;

  if (!tournament) {
    return <section className={styles.statePanel}>{t("cup.empty.noCurrentCup")}</section>;
  }

  return (
    <section className={styles.currentStack}>
      <CupHero tournament={tournament} nowMs={nowMs} timeZone={bootstrap.businessTimezone} />
      <CupParticipantsStrip participantCountLabel={participantCountLabel} />
      <UserCupPosition onMakePrediction={onMakePrediction} />
      <CupLeaderboard rows={leaderboardRows} pinnedCurrentUserRow={pinnedCurrentUserRow} />
    </section>
  );
};

export { CurrentCupView };

import type React from "react";
import type { ApiClient } from "@/lib/api/client";
import type { BootstrapResponse } from "@/lib/api/types";
import { useTranslation } from "@/lib/i18n/use-translation";
import CupHero from "./CupHero/CupHero";
import CupLeaderboard from "./CupLeaderboard/CupLeaderboard";
import { toCupLeaderboardRowModel } from "./CupLeaderboard/leaderboard-types";
import CupParticipantsStrip from "./CupParticipantsStrip/CupParticipantsStrip";
import UserCupPosition from "./UserCupPosition/UserCupPosition";
import styles from "./CurrentCupView.module.css";

interface ICurrentCupViewProps {
  bootstrap: BootstrapResponse;
  nowMs: number;
  cup: BootstrapResponse["cup"];
  apiClient: ApiClient;
  onMakePrediction: () => void;
}

const CurrentCupView: React.FC<ICurrentCupViewProps> = ({
  bootstrap,
  nowMs,
  cup,
  apiClient,
  onMakePrediction,
}) => {
  const { t } = useTranslation();
  const tournament = bootstrap.currentTournament;
  const currentUserRow = cup?.currentUserRow
    ? toCupLeaderboardRowModel(cup.currentUserRow)
    : null;

  if (!tournament) {
    return (
      <section className={styles.statePanel}>
        {t("cup.empty.noCurrentCup")}
      </section>
    );
  }

  return (
    <section className={styles.currentStack}>
      <CupHero
        tournament={tournament}
        nowMs={nowMs}
        timeZone={bootstrap.businessTimezone}
      />
      <CupParticipantsStrip
        participantCountLabel={
          cup ? String(cup.participantCount) : t("cup.unavailable")
        }
      />
      <UserCupPosition
        row={currentUserRow}
        onMakePrediction={onMakePrediction}
      />
      <CupLeaderboard
        key={tournament.id}
        cupId={tournament.id}
        apiClient={apiClient}
      />
    </section>
  );
};

export default CurrentCupView;

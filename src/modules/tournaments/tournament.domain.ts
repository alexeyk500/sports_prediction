import type { Tournament, TournamentStatus } from "@prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

export function assertTournamentUsableForPrediction(
  tournament: Pick<Tournament, "id" | "status">,
): void {
  if (tournament.status !== "ACTIVE") {
    throw new DomainError("TOURNAMENT_NOT_ACTIVE", "Tournament is not active.", {
      tournamentId: tournament.id,
      status: tournament.status,
    });
  }
}

export function isTournamentActiveAt(
  tournament: Pick<Tournament, "status" | "startsAt" | "endsAt">,
  instant: Date,
): boolean {
  return (
    tournament.status === "ACTIVE" &&
    tournament.startsAt.getTime() <= instant.getTime() &&
    instant.getTime() < tournament.endsAt.getTime()
  );
}

export const PREDICTION_USABLE_TOURNAMENT_STATUSES = ["ACTIVE"] satisfies TournamentStatus[];

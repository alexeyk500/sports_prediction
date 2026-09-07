import type { CupLeaderboardRowDto } from "@/lib/api/types";

export type CupLeaderboardMode = "top" | "around-me" | "all";

export interface ICupLeaderboardRowModel {
  id: string;
  rank: number;
  playerName: string;
  correctPredictions: number;
  wrongPredictions: number;
  predictionsCount: number;
  points: number;
  isCurrentUser: boolean;
  telegramUrl: string | null;
}

export interface ICupLeaderboardModeState {
  rows: ICupLeaderboardRowModel[];
  totalParticipants: number;
  nextCursor: string | null;
  isLoaded: boolean;
}

export function toCupLeaderboardRowModel(dto: CupLeaderboardRowDto): ICupLeaderboardRowModel {
  return {
    id: dto.userId,
    rank: dto.rank,
    playerName: dto.displayName,
    correctPredictions: dto.correct,
    wrongPredictions: dto.wrong,
    predictionsCount: dto.totalPredictions,
    points: dto.points,
    isCurrentUser: dto.isCurrentUser,
    telegramUrl: dto.telegramUrl,
  };
}

export function mergeCupLeaderboardRows(
  currentRows: ICupLeaderboardRowModel[],
  nextRows: ICupLeaderboardRowModel[],
): ICupLeaderboardRowModel[] {
  const seenIds = new Set(currentRows.map((row) => row.id));
  const uniqueNextRows = nextRows.filter((row) => {
    if (seenIds.has(row.id)) {
      return false;
    }

    seenIds.add(row.id);
    return true;
  });

  return [...currentRows, ...uniqueNextRows];
}

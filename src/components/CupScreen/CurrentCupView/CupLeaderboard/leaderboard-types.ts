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

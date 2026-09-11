export type PredictionOutcome = "HOME" | "DRAW" | "AWAY";
export type SupportedLocale = "en" | "ru" | "de" | "es" | "ar";
export type AppearanceMode = "system" | "light" | "dark";
export type PrizeCurrency = "USDT" | "TON";
export type PrizePayoutStatus =
  "READY_TO_CLAIM" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "PAID" | "REJECTED";

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

export interface UserSettingsDto {
  locale: SupportedLocale;
  appearance: AppearanceMode;
}

export interface BootstrapResponse {
  user: {
    id: string;
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    languageCode: string | null;
  };
  currentTournament: {
    id: string;
    number: number;
    startsAt: string;
    endsAt: string;
    prizeCurrency: PrizeCurrency;
    prizeDistribution: PrizeDistributionTierDto[];
  } | null;
  dailyPredictionUsage: DailyPredictionUsageDto;
  settings: UserSettingsDto;
  rating: {
    rating: number;
    league: string;
    qualifiedCupsCount: number;
  } | null;
  cup: CurrentCupSummaryDto | null;
  serverTime: string;
  businessTimezone: string;
}

export interface PrizeDistributionTierDto {
  fromRank: number;
  toRank: number;
  amount: string;
}

export interface PrizePayoutSummaryDto {
  totalWon: string;
  pending: string;
  paid: string;
  asset: "USDT";
}

export interface PrizePayoutCardDto {
  entitlementId: string;
  claimId: string | null;
  cupId: string;
  cupNumber: number;
  finalPlacement: number;
  amount: string;
  asset: "USDT";
  network: "TRC20";
  status: PrizePayoutStatus;
  walletAddress: string | null;
  maskedWalletAddress: string | null;
  transactionHash: string | null;
  transactionUrl: string | null;
  actionRequiredMessage: string | null;
  rejectionReason: string | null;
  settledAt: string;
  claimedAt: string | null;
  paidAt: string | null;
  updatedAt: string;
}

export interface PrizePayoutsResponse {
  summary: PrizePayoutSummaryDto;
  items: PrizePayoutCardDto[];
}

export interface CupLeaderboardRowDto {
  userId: string;
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  correct: number;
  wrong: number;
  totalPredictions: number;
  points: number;
  isCurrentUser: boolean;
  telegramUrl: string | null;
}

export interface CurrentCupSummaryDto {
  participantCount: number;
  currentUserRow: CupLeaderboardRowDto | null;
}

export type CupLeaderboardModeDto = "top" | "all";

export interface CupLeaderboardPageResponse {
  items: CupLeaderboardRowDto[];
  nextCursor: string | null;
  totalParticipants: number;
}

export interface CupAroundMeLeaderboardResponse {
  items: CupLeaderboardRowDto[];
  currentUserRank: number | null;
  totalParticipants: number;
}

export interface CupHistoryResponse {
  cupId: string;
  days: CupHistoryDayDto[];
}

export interface CupHistoryDayDto {
  businessDate: string;
  predictions: CupHistoryPredictionDto[];
}

export interface CupHistoryPredictionDto {
  id: string;
  fixtureId: string;
  selectedOutcome: PredictionOutcome;
  slotType: "FREE" | "REWARDED";
  potentialPoints: number;
  earnedPoints: number;
  resultStatus: "PENDING" | "CORRECT" | "INCORRECT";
  kickoffAt: string;
  competition: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  homeScore: number | null;
  awayScore: number | null;
}

export interface DailyPredictionUsageDto {
  businessDate: string;
  freeUsed: number;
  freeLimit: number;
  rewardedUsed: number;
  rewardedLimit: number;
  totalUsed: number;
  totalLimit: number;
}

export interface TodayFixturesResponse {
  businessDate: string;
  fixtures: TodayFixtureDto[];
}

export interface TodayFixtureDto {
  id: string;
  kickoffAt: string;
  competition: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  status: string;
  winningOutcome: PredictionOutcome | null;
  outcomes: Record<Lowercase<PredictionOutcome>, { points: number }>;
}

export interface TodayPredictionsResponse {
  businessDate: string;
  predictions: PredictionDto[];
}

export interface PredictionDto {
  id: string;
  fixtureId: string;
  selectedOutcome: PredictionOutcome;
  slotType: "FREE" | "REWARDED";
  potentialPoints: number;
  earnedPoints: number;
  resultStatus: "PENDING" | "CORRECT" | "INCORRECT";
  kickoffAt: string;
  editable: boolean;
  fixture: PredictionFixtureContextDto;
}

export interface PredictionFixtureContextDto {
  id: string;
  kickoffAt: string;
  status: string;
  winningOutcome: PredictionOutcome | null;
  competition: {
    id: string;
    code: string;
    name: string;
    slug: string;
  };
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
  };
  outcomes: Record<Lowercase<PredictionOutcome>, { points: number }>;
}

export interface PredictionMutationResponse {
  predictionId: string;
  userId: string;
  tournamentId: string;
  fixtureId: string;
  outcomeSnapshotId: string;
  selectedOutcome: PredictionOutcome;
  slotType: "FREE" | "REWARDED";
  probabilityAtPrediction: string;
  potentialPoints: number;
}

export interface CancelPredictionResponse {
  predictionId: string;
  userId: string;
  tournamentId: string;
  fixtureId: string;
  slotType: "FREE" | "REWARDED";
}

export interface MonetagRewardSessionDto {
  adRewardId: string;
  ymid: string;
  zoneId: string;
  requestVar: "matches_extra_prediction";
  status: "CREATED" | "VERIFIED" | "CONSUMED" | "EXPIRED" | "REJECTED";
  expiresAt: string;
}

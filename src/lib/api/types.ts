export type PredictionOutcome = "HOME" | "DRAW" | "AWAY";
export type SupportedLocale = "en" | "ru" | "de" | "es" | "ar";
export type AppearanceMode = "system" | "light" | "dark";

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
    prizePoolNanoTon: string;
  } | null;
  dailyPredictionUsage: DailyPredictionUsageDto;
  settings: UserSettingsDto;
  rating: {
    rating: number;
    league: string;
    qualifiedCupsCount: number;
  } | null;
  serverTime: string;
  businessTimezone: string;
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
    logoUrl: string | null;
  };
  homeTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    logoUrl: string | null;
  };
  awayTeam: {
    id: string;
    name: string;
    slug: string;
    shortName: string | null;
    logoUrl: string | null;
  };
  status: string;
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

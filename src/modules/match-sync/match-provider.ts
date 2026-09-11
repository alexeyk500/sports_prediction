import type { PredictionOutcome } from "@prisma/client";

export type NormalizedProviderMatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED"
  | "SUSPENDED"
  | "AWARDED"
  | "UNKNOWN";

export interface MatchProviderCompetition {
  providerCompetitionId: string;
  code: string | null;
}

export interface MatchProviderTeam {
  providerTeamId: string;
  name: string;
  shortName: string | null;
}

export interface MatchProviderFinalResult {
  homeScore: number;
  awayScore: number;
  finalOutcome: PredictionOutcome;
}

export interface MatchProviderMatch {
  providerMatchId: string;
  providerCompetitionId: string;
  providerCompetitionCode: string | null;
  kickoffAt: Date;
  status: NormalizedProviderMatchStatus;
  providerStatus: string;
  homeTeam: MatchProviderTeam;
  awayTeam: MatchProviderTeam;
  finalResult: MatchProviderFinalResult | null;
}

export interface MatchProviderListWindowInput {
  fromUtc: Date;
  toUtc: Date;
}

export interface MatchProvider {
  listMatchesForWindow(
    input: MatchProviderListWindowInput,
  ): Promise<MatchProviderMatch[]>;
  getMatchesByIds(providerMatchIds: string[]): Promise<MatchProviderMatch[]>;
}

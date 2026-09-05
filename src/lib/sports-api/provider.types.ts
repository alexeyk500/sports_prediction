import type { PredictionOutcome } from "@prisma/client";

export interface ProviderCompetition {
  providerCompetitionId: string;
  code: string;
  name: string;
  country?: string | null;
  logoUrl?: string | null;
}

export interface ProviderTeam {
  providerTeamId: string;
  name: string;
  shortName?: string | null;
  country?: string | null;
  logoUrl?: string | null;
}

export interface ProviderFixture {
  providerFixtureId: string;
  providerCompetitionId: string;
  providerHomeTeamId: string;
  providerAwayTeamId: string;
  kickoffAt: Date;
  providerStatus?: string | null;
}

export interface ProviderOneXTwoOdds {
  providerFixtureId: string;
  home: string;
  draw: string;
  away: string;
  snapshotAt: Date;
}

export interface ProviderFixtureResult {
  providerFixtureId: string;
  providerStatus: string;
  homeScore: number;
  awayScore: number;
  finalOutcome: PredictionOutcome;
}

export interface SportsProvider {
  listCompetitions(): Promise<ProviderCompetition[]>;
  listTeams(): Promise<ProviderTeam[]>;
  listUpcomingFixtures(from: Date, to: Date): Promise<ProviderFixture[]>;
  getOneXTwoOdds(providerFixtureId: string): Promise<ProviderOneXTwoOdds | null>;
  getFixtureResult(providerFixtureId: string): Promise<ProviderFixtureResult | null>;
}

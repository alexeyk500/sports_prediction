import type {
  ProviderCompetition,
  ProviderFixture,
  ProviderFixtureResult,
  ProviderOneXTwoOdds,
  ProviderTeam,
  SportsProvider,
} from "./provider.types";

export class InMemorySportsProvider implements SportsProvider {
  constructor(
    private readonly data: {
      competitions?: ProviderCompetition[];
      teams?: ProviderTeam[];
      fixtures?: ProviderFixture[];
      odds?: ProviderOneXTwoOdds[];
      results?: ProviderFixtureResult[];
    } = {},
  ) {}

  async listCompetitions(): Promise<ProviderCompetition[]> {
    return [...(this.data.competitions ?? [])];
  }

  async listTeams(): Promise<ProviderTeam[]> {
    return [...(this.data.teams ?? [])];
  }

  async listUpcomingFixtures(from: Date, to: Date): Promise<ProviderFixture[]> {
    return (this.data.fixtures ?? []).filter(
      (fixture) => fixture.kickoffAt >= from && fixture.kickoffAt < to,
    );
  }

  async getOneXTwoOdds(providerFixtureId: string): Promise<ProviderOneXTwoOdds | null> {
    return this.data.odds?.find((odds) => odds.providerFixtureId === providerFixtureId) ?? null;
  }

  async getFixtureResult(providerFixtureId: string): Promise<ProviderFixtureResult | null> {
    return (
      this.data.results?.find((result) => result.providerFixtureId === providerFixtureId) ?? null
    );
  }
}

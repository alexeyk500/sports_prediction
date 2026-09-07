import { describe, expect, it } from "vitest";
import {
  buildFootballAssetsManifest,
  competitionAssetLogoUrl,
  slugifyAssetName,
  summarizeFootballAssetsManifest,
  teamAssetLogoUrl,
  type ProviderLeagueInput,
  type ProviderTeamInput,
  type SupportedCompetitionSeed,
} from "@/lib/sports-api/assets/asset-discovery";

const requestedCompetitions: SupportedCompetitionSeed[] = [
  {
    goalsteryCode: "EPL",
    name: "Premier League",
    providerSearchName: "Premier League",
    providerCountry: "England",
    providerType: "League",
  },
  {
    goalsteryCode: "UCL",
    name: "UEFA Champions League",
    providerSearchName: "UEFA Champions League",
    providerCountry: "World",
    providerType: "Cup",
  },
];

const providerLeagues: ProviderLeagueInput[] = [
  {
    goalsteryCode: "EPL",
    goalsteryName: "Premier League",
    providerLeagueId: 39,
    providerName: "Premier League",
    providerCountry: "England",
    providerType: "League",
    providerLogoSourceUrl: "https://provider.example/leagues/39.png",
    availableForSeason: true,
  },
  {
    goalsteryCode: "UCL",
    goalsteryName: "UEFA Champions League",
    providerLeagueId: 2,
    providerName: "UEFA Champions League",
    providerCountry: "World",
    providerType: "Cup",
    providerLogoSourceUrl: "https://provider.example/leagues/2.png",
    availableForSeason: true,
  },
];

describe("football asset discovery manifest logic", () => {
  it("generates lowercase ASCII kebab-case slugs", () => {
    expect(slugifyAssetName("Paris Saint-Germain")).toBe("paris-saint-germain");
    expect(slugifyAssetName("Atlético de Madrid")).toBe("atletico-de-madrid");
    expect(slugifyAssetName("UEFA Europa League")).toBe("uefa-europa-league");
    expect(slugifyAssetName("Brighton & Hove Albion")).toBe(
      "brighton-and-hove-albion",
    );
  });

  it("deduplicates a provider team across competitions", () => {
    const manifest = buildManifest([
      team("EPL", 50, "Arsenal"),
      team("UCL", 50, "Arsenal"),
      team("UCL", 541, "Real Madrid"),
    ]);

    expect(manifest.teams.map((entry) => entry.slug)).toEqual([
      "arsenal",
      "real-madrid",
    ]);
    expect(
      manifest.teams
        .find((entry) => entry.slug === "arsenal")
        ?.competitions.sort(),
    ).toEqual(["EPL", "UCL"]);
    expect(
      summarizeFootballAssetsManifest(manifest).competitionMemberships,
    ).toBe(3);
  });

  it("does not use provider IDs as filenames", () => {
    const manifest = buildManifest([team("EPL", 42, "Manchester City")]);

    expect(manifest.teams[0]?.asset.logoUrl).toBe(
      "/assets/teams/manchester-city.webp",
    );
    expect(manifest.teams[0]?.asset.logoUrl).not.toContain("/42.webp");
  });

  it("keeps provider name separate from reviewed canonical name", () => {
    const manifest = buildManifest([
      team("EPL", 85, "Paris Saint Germain", {
        canonicalName: "Paris Saint-Germain",
        canonicalSlug: "paris-saint-germain",
      }),
    ]);

    expect(manifest.teams[0]).toMatchObject({
      name: "Paris Saint-Germain",
      slug: "paris-saint-germain",
      provider: {
        teamId: 85,
        name: "Paris Saint Germain",
      },
    });
  });

  it("detects slug collisions across different provider team IDs", () => {
    const manifest = buildManifest([
      team("EPL", 1, "Inter"),
      team("UCL", 2, "Inter", {
        canonicalName: "Inter",
        canonicalSlug: "inter",
      }),
    ]);

    expect(manifest.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "error",
          code: "TEAM_SLUG_COLLISION",
        }),
      ]),
    );
  });

  it("detects duplicate competition code and slug", () => {
    const manifest = buildFootballAssetsManifest({
      season: 2026,
      generatedAt: "2026-09-06T00:00:00.000Z",
      requestedCompetitions: [
        ...requestedCompetitions,
        {
          goalsteryCode: "EPL",
          name: "Premier League",
          providerSearchName: "Premier League",
          providerCountry: "England",
          providerType: "League",
        },
        {
          goalsteryCode: "EPL_DUPLICATE_SLUG",
          name: "Premier League",
          providerSearchName: "Premier League",
          providerCountry: "England",
          providerType: "League",
        },
      ],
      providerLeagues,
      providerTeams: [],
    });

    expect(manifest.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "DUPLICATE_COMPETITION_CODE",
          severity: "error",
        }),
        expect.objectContaining({
          code: "DUPLICATE_COMPETITION_SLUG",
          severity: "error",
        }),
      ]),
    );
  });

  it("detects missing IDs", () => {
    const manifest = buildFootballAssetsManifest({
      season: 2026,
      generatedAt: "2026-09-06T00:00:00.000Z",
      requestedCompetitions,
      providerLeagues: [
        { ...providerLeagues[0], providerLeagueId: null },
        providerLeagues[1],
      ],
      providerTeams: [team("EPL", null, "Unknown FC")],
    });

    expect(manifest.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "MISSING_LEAGUE_ID",
          severity: "error",
        }),
        expect.objectContaining({ code: "MISSING_TEAM_ID", severity: "error" }),
      ]),
    );
  });

  it("generates future asset logo URLs from reviewed slugs", () => {
    expect(competitionAssetLogoUrl("premier-league")).toBe(
      "/assets/competitions/premier-league.webp",
    );
    expect(teamAssetLogoUrl("arsenal")).toBe("/assets/teams/arsenal.webp");
  });

  it("keeps provider logo source separate from Goalstery logoUrl", () => {
    const manifest = buildManifest([team("EPL", 50, "Arsenal")]);

    expect(manifest.teams[0]?.provider.logoSourceUrl).toBe(
      "https://provider.example/teams/50.png",
    );
    expect(manifest.teams[0]?.asset.logoUrl).toBe("/assets/teams/arsenal.webp");
    expect(manifest.teams[0]?.asset.logoUrl).not.toBe(
      manifest.teams[0]?.provider.logoSourceUrl,
    );
  });
});

function buildManifest(providerTeams: ProviderTeamInput[]) {
  return buildFootballAssetsManifest({
    season: 2026,
    generatedAt: "2026-09-06T00:00:00.000Z",
    requestedCompetitions,
    providerLeagues,
    providerTeams,
  });
}

function team(
  competitionCode: string,
  providerTeamId: number | null,
  providerName: string,
  overrides: Partial<ProviderTeamInput> = {},
): ProviderTeamInput {
  return {
    competitionCode,
    providerTeamId,
    providerName,
    providerLogoSourceUrl:
      providerTeamId === null
        ? null
        : `https://provider.example/teams/${providerTeamId.toString()}.png`,
    ...overrides,
  };
}

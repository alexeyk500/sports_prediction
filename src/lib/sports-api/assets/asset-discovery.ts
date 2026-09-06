export const API_FOOTBALL_ASSET_DISCOVERY_SEASON = 2026;
export const API_FOOTBALL_ASSET_MANIFEST_PATH = "data/football-assets.manifest.json";

export interface SupportedCompetitionSeed {
  goalsteryCode: string;
  name: string;
  providerSearchName: string;
  providerCountry: string;
  providerType: "League" | "Cup";
}

export const SUPPORTED_ASSET_DISCOVERY_COMPETITIONS: SupportedCompetitionSeed[] = [
  {
    goalsteryCode: "EPL",
    name: "Premier League",
    providerSearchName: "Premier League",
    providerCountry: "England",
    providerType: "League",
  },
  {
    goalsteryCode: "LALIGA",
    name: "La Liga",
    providerSearchName: "La Liga",
    providerCountry: "Spain",
    providerType: "League",
  },
  {
    goalsteryCode: "SERIE_A",
    name: "Serie A",
    providerSearchName: "Serie A",
    providerCountry: "Italy",
    providerType: "League",
  },
  {
    goalsteryCode: "BUNDESLIGA",
    name: "Bundesliga",
    providerSearchName: "Bundesliga",
    providerCountry: "Germany",
    providerType: "League",
  },
  {
    goalsteryCode: "LIGUE_1",
    name: "Ligue 1",
    providerSearchName: "Ligue 1",
    providerCountry: "France",
    providerType: "League",
  },
  {
    goalsteryCode: "UCL",
    name: "UEFA Champions League",
    providerSearchName: "UEFA Champions League",
    providerCountry: "World",
    providerType: "Cup",
  },
  {
    goalsteryCode: "UEL",
    name: "UEFA Europa League",
    providerSearchName: "UEFA Europa League",
    providerCountry: "World",
    providerType: "Cup",
  },
];

export interface ProviderLeagueInput {
  goalsteryCode: string;
  goalsteryName: string;
  providerLeagueId: number | null;
  providerName: string | null;
  providerCountry: string | null;
  providerType: string | null;
  providerLogoSourceUrl: string | null;
  availableForSeason: boolean;
}

export interface ProviderTeamInput {
  competitionCode: string;
  providerTeamId: number | null;
  providerName: string | null;
  providerLogoSourceUrl: string | null;
  canonicalName?: string;
  canonicalSlug?: string;
}

export interface FootballAssetsManifest {
  schemaVersion: 1;
  provider: "api-football";
  season: number;
  generatedAt: string;
  competitions: FootballAssetsManifestCompetition[];
  teams: FootballAssetsManifestTeam[];
  warnings: ManifestIssue[];
}

export interface FootballAssetsManifestCompetition {
  goalsteryCode: string;
  name: string;
  slug: string;
  provider: {
    leagueId: number | null;
    name: string | null;
    country: string | null;
    type: string | null;
    logoSourceUrl: string | null;
    availableForSeason: boolean;
  };
  asset: {
    logoUrl: string;
  };
  teams: string[];
}

export interface FootballAssetsManifestTeam {
  name: string;
  slug: string;
  provider: {
    teamId: number;
    name: string;
    logoSourceUrl: string | null;
  };
  asset: {
    logoUrl: string;
  };
  competitions: string[];
}

export interface ManifestIssue {
  severity: "warning" | "error";
  code:
    | "DUPLICATE_COMPETITION_CODE"
    | "DUPLICATE_COMPETITION_SLUG"
    | "MISSING_LEAGUE_ID"
    | "MISSING_TEAM_ID"
    | "MISSING_PROVIDER_LOGO_SOURCE"
    | "TEAM_SLUG_COLLISION"
    | "PROVIDER_TEAM_NAME_CONFLICT";
  message: string;
  details?: Record<string, unknown>;
}

export interface ManifestSummary {
  competitionsDiscovered: number;
  competitionsRequested: number;
  uniqueTeams: number;
  competitionMemberships: number;
  teamsInMultipleCompetitions: Array<{ slug: string; name: string; competitions: string[] }>;
  missingLogoSources: number;
  slugCollisions: number;
  warnings: number;
  errors: number;
  competitionBreakdown: Array<{ code: string; name: string; teams: number; availableForSeason: boolean }>;
}

export function slugifyAssetName(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();

  return ascii || "asset";
}

export function competitionAssetLogoUrl(slug: string): string {
  return `/assets/competitions/${slug}.webp`;
}

export function teamAssetLogoUrl(slug: string): string {
  return `/assets/teams/${slug}.webp`;
}

export function buildFootballAssetsManifest(input: {
  season: number;
  generatedAt: string;
  requestedCompetitions: SupportedCompetitionSeed[];
  providerLeagues: ProviderLeagueInput[];
  providerTeams: ProviderTeamInput[];
}): FootballAssetsManifest {
  const warnings: ManifestIssue[] = [];
  const seenCompetitionCodes = new Set<string>();
  const seenCompetitionSlugs = new Map<string, string>();

  const teamsByProviderId = new Map<number, FootballAssetsManifestTeam>();
  const teamSlugToProviderId = new Map<string, number>();
  const teamMembershipsByCompetition = new Map<string, Set<string>>();

  for (const competition of input.requestedCompetitions) {
    if (seenCompetitionCodes.has(competition.goalsteryCode)) {
      warnings.push({
        severity: "error",
        code: "DUPLICATE_COMPETITION_CODE",
        message: `Duplicate competition code ${competition.goalsteryCode}.`,
        details: { goalsteryCode: competition.goalsteryCode },
      });
    }
    seenCompetitionCodes.add(competition.goalsteryCode);

    const slug = slugifyAssetName(competition.name);
    const existingCode = seenCompetitionSlugs.get(slug);
    if (existingCode && existingCode !== competition.goalsteryCode) {
      warnings.push({
        severity: "error",
        code: "DUPLICATE_COMPETITION_SLUG",
        message: `Duplicate competition slug ${slug}.`,
        details: { slug, competitionCodes: [existingCode, competition.goalsteryCode] },
      });
    }
    seenCompetitionSlugs.set(slug, competition.goalsteryCode);
  }

  const providerLeaguesByCode = new Map(input.providerLeagues.map((league) => [league.goalsteryCode, league]));

  for (const team of input.providerTeams) {
    if (team.providerTeamId === null) {
      warnings.push({
        severity: "error",
        code: "MISSING_TEAM_ID",
        message: `Provider team ID is missing for ${team.providerName ?? "unknown team"}.`,
        details: { competitionCode: team.competitionCode, providerName: team.providerName },
      });
      continue;
    }

    const providerName = team.providerName?.trim();
    if (!providerName) {
      warnings.push({
        severity: "error",
        code: "MISSING_TEAM_ID",
        message: `Provider team name is missing for team ID ${team.providerTeamId}.`,
        details: { competitionCode: team.competitionCode, providerTeamId: team.providerTeamId },
      });
      continue;
    }

    const canonicalName = team.canonicalName?.trim() || providerName;
    const slug = team.canonicalSlug?.trim() || slugifyAssetName(canonicalName);
    const existingProviderIdForSlug = teamSlugToProviderId.get(slug);
    if (existingProviderIdForSlug !== undefined && existingProviderIdForSlug !== team.providerTeamId) {
      warnings.push({
        severity: "error",
        code: "TEAM_SLUG_COLLISION",
        message: `Team slug ${slug} maps to multiple provider team IDs.`,
        details: {
          slug,
          providerTeamIds: [existingProviderIdForSlug, team.providerTeamId],
          providerName,
        },
      });
    }
    teamSlugToProviderId.set(slug, team.providerTeamId);

    const existingTeam = teamsByProviderId.get(team.providerTeamId);
    if (existingTeam) {
      if (existingTeam.provider.name !== providerName) {
        warnings.push({
          severity: "warning",
          code: "PROVIDER_TEAM_NAME_CONFLICT",
          message: `Provider team ID ${team.providerTeamId} has conflicting names.`,
          details: {
            providerTeamId: team.providerTeamId,
            names: [existingTeam.provider.name, providerName],
          },
        });
      }

      if (!existingTeam.competitions.includes(team.competitionCode)) {
        existingTeam.competitions.push(team.competitionCode);
      }
    } else {
      teamsByProviderId.set(team.providerTeamId, {
        name: canonicalName,
        slug,
        provider: {
          teamId: team.providerTeamId,
          name: providerName,
          logoSourceUrl: team.providerLogoSourceUrl,
        },
        asset: {
          logoUrl: teamAssetLogoUrl(slug),
        },
        competitions: [team.competitionCode],
      });
    }

    if (!team.providerLogoSourceUrl) {
      warnings.push({
        severity: "warning",
        code: "MISSING_PROVIDER_LOGO_SOURCE",
        message: `Provider logo source is missing for team ${providerName}.`,
        details: { competitionCode: team.competitionCode, providerTeamId: team.providerTeamId },
      });
    }

    const memberships = teamMembershipsByCompetition.get(team.competitionCode) ?? new Set<string>();
    memberships.add(slug);
    teamMembershipsByCompetition.set(team.competitionCode, memberships);
  }

  const competitions = input.requestedCompetitions.map((competition) => {
    const providerLeague = providerLeaguesByCode.get(competition.goalsteryCode);
    const slug = slugifyAssetName(competition.name);

    if (!providerLeague?.providerLeagueId) {
      warnings.push({
        severity: "error",
        code: "MISSING_LEAGUE_ID",
        message: `Provider league ID is missing for ${competition.name}.`,
        details: { goalsteryCode: competition.goalsteryCode, name: competition.name },
      });
    }

    if (!providerLeague?.providerLogoSourceUrl) {
      warnings.push({
        severity: "warning",
        code: "MISSING_PROVIDER_LOGO_SOURCE",
        message: `Provider logo source is missing for competition ${competition.name}.`,
        details: { goalsteryCode: competition.goalsteryCode },
      });
    }

    return {
      goalsteryCode: competition.goalsteryCode,
      name: competition.name,
      slug,
      provider: {
        leagueId: providerLeague?.providerLeagueId ?? null,
        name: providerLeague?.providerName ?? null,
        country: providerLeague?.providerCountry ?? null,
        type: providerLeague?.providerType ?? null,
        logoSourceUrl: providerLeague?.providerLogoSourceUrl ?? null,
        availableForSeason: providerLeague?.availableForSeason ?? false,
      },
      asset: {
        logoUrl: competitionAssetLogoUrl(slug),
      },
      teams: Array.from(teamMembershipsByCompetition.get(competition.goalsteryCode) ?? []).sort(),
    } satisfies FootballAssetsManifestCompetition;
  });

  return {
    schemaVersion: 1,
    provider: "api-football",
    season: input.season,
    generatedAt: input.generatedAt,
    competitions,
    teams: Array.from(teamsByProviderId.values()).sort((first, second) => first.slug.localeCompare(second.slug)),
    warnings,
  };
}

export function summarizeFootballAssetsManifest(manifest: FootballAssetsManifest): ManifestSummary {
  const teamsInMultipleCompetitions = manifest.teams
    .filter((team) => team.competitions.length > 1)
    .map((team) => ({
      slug: team.slug,
      name: team.name,
      competitions: [...team.competitions].sort(),
    }))
    .sort((first, second) => first.slug.localeCompare(second.slug));

  return {
    competitionsDiscovered: manifest.competitions.filter((competition) => competition.provider.leagueId !== null).length,
    competitionsRequested: manifest.competitions.length,
    uniqueTeams: manifest.teams.length,
    competitionMemberships: manifest.competitions.reduce((total, competition) => total + competition.teams.length, 0),
    teamsInMultipleCompetitions,
    missingLogoSources: manifest.warnings.filter((warning) => warning.code === "MISSING_PROVIDER_LOGO_SOURCE").length,
    slugCollisions: manifest.warnings.filter((warning) => warning.code === "TEAM_SLUG_COLLISION").length,
    warnings: manifest.warnings.filter((warning) => warning.severity === "warning").length,
    errors: manifest.warnings.filter((warning) => warning.severity === "error").length,
    competitionBreakdown: manifest.competitions.map((competition) => ({
      code: competition.goalsteryCode,
      name: competition.name,
      teams: competition.teams.length,
      availableForSeason: competition.provider.availableForSeason,
    })),
  };
}

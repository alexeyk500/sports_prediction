import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  API_FOOTBALL_ASSET_DISCOVERY_SEASON,
  API_FOOTBALL_ASSET_MANIFEST_PATH,
  SUPPORTED_ASSET_DISCOVERY_COMPETITIONS,
  buildFootballAssetsManifest,
  summarizeFootballAssetsManifest,
} from "../src/lib/sports-api/assets/asset-discovery.ts";

const apiKey = process.env.API_FOOTBALL_KEY;
const baseUrl = (process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io").replace(/\/+$/, "");

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run football asset discovery with NODE_ENV=production.");
  process.exit(1);
}

if (!apiKey) {
  console.error("API_FOOTBALL_KEY is required for football asset discovery.");
  console.error("Add it to your local .env. The key will not be written to the manifest or logs.");
  process.exit(1);
}

try {
  const manifest = await discoverFootballAssets();
  const manifestPath = path.resolve(process.cwd(), API_FOOTBALL_ASSET_MANIFEST_PATH);

  await mkdir(path.dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  printSummary(manifest);
  console.log(`Manifest written: ${API_FOOTBALL_ASSET_MANIFEST_PATH}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown football asset discovery error.";
  console.error(message);
  process.exit(1);
}

async function discoverFootballAssets() {
  const providerLeagues = [];
  const providerTeams = [];

  for (const competition of SUPPORTED_ASSET_DISCOVERY_COMPETITIONS) {
    const league = await resolveLeague(competition);
    providerLeagues.push(league);

    if (!league.providerLeagueId) {
      continue;
    }

    const teams = await fetchTeamsForLeague(competition.goalsteryCode, league.providerLeagueId);
    providerTeams.push(...teams);
  }

  return buildFootballAssetsManifest({
    season: API_FOOTBALL_ASSET_DISCOVERY_SEASON,
    generatedAt: new Date().toISOString(),
    requestedCompetitions: SUPPORTED_ASSET_DISCOVERY_COMPETITIONS,
    providerLeagues,
    providerTeams,
  });
}

async function resolveLeague(competition) {
  const payload = await fetchApiFootball("/leagues", {
    search: competition.providerSearchName,
  });

  const matches = Array.isArray(payload.response) ? payload.response : [];
  const exactMatch =
    matches.find((candidate) => isExpectedLeague(candidate, competition, true)) ??
    matches.find((candidate) => isExpectedLeague(candidate, competition, false));

  if (!exactMatch) {
    return {
      goalsteryCode: competition.goalsteryCode,
      goalsteryName: competition.name,
      providerLeagueId: null,
      providerName: null,
      providerCountry: null,
      providerType: null,
      providerLogoSourceUrl: null,
      availableForSeason: false,
    };
  }

  return {
    goalsteryCode: competition.goalsteryCode,
    goalsteryName: competition.name,
    providerLeagueId: numberOrNull(exactMatch.league?.id),
    providerName: stringOrNull(exactMatch.league?.name),
    providerCountry: stringOrNull(exactMatch.country?.name),
    providerType: stringOrNull(exactMatch.league?.type),
    providerLogoSourceUrl: stringOrNull(exactMatch.league?.logo),
    availableForSeason: hasSeason(exactMatch, API_FOOTBALL_ASSET_DISCOVERY_SEASON),
  };
}

function isExpectedLeague(candidate, competition, requireType) {
  const candidateName = stringOrNull(candidate.league?.name);
  const country = stringOrNull(candidate.country?.name);
  const type = stringOrNull(candidate.league?.type);

  return (
    candidateName?.toLowerCase() === competition.providerSearchName.toLowerCase() &&
    country?.toLowerCase() === competition.providerCountry.toLowerCase() &&
    (!requireType || type === competition.providerType)
  );
}

function hasSeason(candidate, season) {
  const seasons = Array.isArray(candidate.seasons) ? candidate.seasons : [];
  return seasons.some((entry) => Number(entry?.year) === season);
}

async function fetchTeamsForLeague(competitionCode, leagueId) {
  const payload = await fetchApiFootball("/teams", {
    league: String(leagueId),
    season: String(API_FOOTBALL_ASSET_DISCOVERY_SEASON),
  });

  const teams = Array.isArray(payload.response) ? payload.response : [];
  return teams.map((entry) => ({
    competitionCode,
    providerTeamId: numberOrNull(entry.team?.id),
    providerName: stringOrNull(entry.team?.name),
    providerLogoSourceUrl: stringOrNull(entry.team?.logo),
  }));
}

async function fetchApiFootball(endpoint, params) {
  const url = new URL(`${baseUrl}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Football request failed for ${endpoint}: HTTP ${response.status}.`);
  }

  const payload = await response.json();
  if (payload?.errors && Object.keys(payload.errors).length > 0) {
    throw new Error(`API-Football returned an error for ${endpoint}.`);
  }

  return payload;
}

function numberOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function printSummary(manifest) {
  const summary = summarizeFootballAssetsManifest(manifest);

  console.log("Football asset discovery complete.");
  console.log(`Season: ${manifest.season}`);
  console.log("Provider: API-Football");
  console.log(`Competitions discovered: ${summary.competitionsDiscovered} / ${summary.competitionsRequested}`);
  console.log(`Unique teams: ${summary.uniqueTeams}`);
  console.log(`Competition memberships: ${summary.competitionMemberships}`);
  console.log(`Teams appearing in multiple competitions: ${summary.teamsInMultipleCompetitions.length}`);
  console.log(`Missing logo sources: ${summary.missingLogoSources}`);
  console.log(`Slug collisions: ${summary.slugCollisions}`);
  console.log(`Warnings: ${summary.warnings}`);
  console.log(`Errors: ${summary.errors}`);
  console.table(
    summary.competitionBreakdown.map((competition) => ({
      competition: competition.name,
      code: competition.code,
      teams: competition.teams,
      availableForSeason: competition.availableForSeason,
    })),
  );

  if (summary.teamsInMultipleCompetitions.length > 0) {
    console.log("Teams in multiple supported competitions:");
    console.table(
      summary.teamsInMultipleCompetitions.map((team) => ({
        team: team.name,
        slug: team.slug,
        competitions: team.competitions.join(", "),
      })),
    );
  }
}

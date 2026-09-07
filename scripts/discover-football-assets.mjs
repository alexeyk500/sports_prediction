import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  API_FOOTBALL_ASSET_DISCOVERY_SEASON,
  SUPPORTED_ASSET_DISCOVERY_COMPETITIONS,
  slugifyAssetName,
} from "../src/lib/sports-api/assets/asset-discovery.ts";
import {
  FOOTBALL_ASSETS_MANIFEST_PATH,
  resolveCompetitionAssetIdentity,
  resolveTeamAssetIdentity,
  validateFootballAssetsManifest,
} from "../src/lib/sports-api/assets/asset-manifest.ts";

const apiKey = process.env.API_FOOTBALL_KEY;
const baseUrl = (
  process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io"
).replace(/\/+$/, "");
const DISCOVERY_REPORT_PATH = "data/football-assets-discovery-report.json";
const assetManifest = loadCanonicalManifest();

if (process.env.NODE_ENV === "production") {
  console.error(
    "Refusing to run football asset discovery with NODE_ENV=production.",
  );
  process.exit(1);
}

if (!apiKey) {
  console.error("API_FOOTBALL_KEY is required for football asset discovery.");
  console.error(
    "Add it to your local .env. The key will not be written to the manifest or logs.",
  );
  process.exit(1);
}

try {
  const report = await discoverFootballAssets();
  const reportPath = path.resolve(process.cwd(), DISCOVERY_REPORT_PATH);

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  printSummary(report);
  console.log(`Discovery report written: ${DISCOVERY_REPORT_PATH}`);
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown football asset discovery error.";
  console.error(message);
  process.exit(1);
}

async function discoverFootballAssets() {
  const report = {
    schemaVersion: 1,
    provider: "api-football",
    season: API_FOOTBALL_ASSET_DISCOVERY_SEASON,
    generatedAt: new Date().toISOString(),
    competitions: [],
    teams: [],
  };

  for (const competition of SUPPORTED_ASSET_DISCOVERY_COMPETITIONS) {
    const league = await resolveLeague(competition);
    const competitionIdentity = league.providerLeagueId
      ? resolveCompetitionAssetIdentity(assetManifest, league.providerLeagueId)
      : null;

    report.competitions.push({
      goalsteryCode: competition.goalsteryCode,
      providerLeagueId: league.providerLeagueId,
      providerName: league.providerName,
      canonicalName:
        competitionIdentity?.status === "mapped"
          ? competitionIdentity.canonicalName
          : null,
      slug:
        competitionIdentity?.status === "mapped"
          ? competitionIdentity.slug
          : null,
      candidateSlug: slugifyAssetName(competition.name),
      status: competitionIdentity?.status ?? "unmapped",
      availableForSeason: league.availableForSeason,
    });

    if (!league.providerLeagueId) {
      continue;
    }

    const teams = await fetchTeamsForLeague(
      competition.goalsteryCode,
      league.providerLeagueId,
    );
    for (const team of teams) {
      const identity = team.providerTeamId
        ? resolveTeamAssetIdentity(assetManifest, team.providerTeamId)
        : null;
      report.teams.push({
        competitionCode: team.competitionCode,
        providerTeamId: team.providerTeamId,
        providerName: team.providerName,
        canonicalName:
          identity?.status === "mapped" ? identity.canonicalName : null,
        slug: identity?.status === "mapped" ? identity.slug : null,
        candidateSlug: team.providerName
          ? slugifyAssetName(team.providerName)
          : null,
        status: identity?.status ?? "unmapped",
      });
    }
  }

  return report;
}

async function resolveLeague(competition) {
  const payload = await fetchApiFootball("/leagues", {
    search: competition.providerSearchName,
  });

  const matches = Array.isArray(payload.response) ? payload.response : [];
  const exactMatch =
    matches.find((candidate) =>
      isExpectedLeague(candidate, competition, true),
    ) ??
    matches.find((candidate) =>
      isExpectedLeague(candidate, competition, false),
    );

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
    availableForSeason: hasSeason(
      exactMatch,
      API_FOOTBALL_ASSET_DISCOVERY_SEASON,
    ),
  };
}

function isExpectedLeague(candidate, competition, requireType) {
  const candidateName = stringOrNull(candidate.league?.name);
  const country = stringOrNull(candidate.country?.name);
  const type = stringOrNull(candidate.league?.type);

  return (
    candidateName?.toLowerCase() ===
      competition.providerSearchName.toLowerCase() &&
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
    throw new Error(
      `API-Football request failed for ${endpoint}: HTTP ${response.status}.`,
    );
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
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function loadCanonicalManifest() {
  try {
    const manifest = JSON.parse(
      readFileSync(FOOTBALL_ASSETS_MANIFEST_PATH, "utf8"),
    );
    const validation = validateFootballAssetsManifest(manifest);
    if (!validation.valid) {
      throw new Error(
        `Canonical football assets manifest is invalid: ${JSON.stringify(validation.issues)}`,
      );
    }

    return manifest;
  } catch (error) {
    throw new Error(
      `Football asset discovery requires ${FOOTBALL_ASSETS_MANIFEST_PATH}. Build/review it before discovery comparison.`,
      { cause: error },
    );
  }
}

function printSummary(report) {
  const uniqueMappedTeams = new Set(
    report.teams
      .filter(
        (team) => team.providerTeamId !== null && team.status === "mapped",
      )
      .map((team) => team.providerTeamId),
  );
  const uniqueUnmappedTeams = new Set(
    report.teams
      .filter(
        (team) => team.providerTeamId !== null && team.status === "unmapped",
      )
      .map((team) => team.providerTeamId),
  );

  console.log("Football asset discovery complete.");
  console.log(`Season: ${report.season}`);
  console.log("Provider: API-Football");
  console.log(
    `Competitions discovered: ${report.competitions.filter((competition) => competition.providerLeagueId !== null).length} / ${report.competitions.length}`,
  );
  console.log(
    `Mapped competitions: ${report.competitions.filter((competition) => competition.status === "mapped").length}`,
  );
  console.log(
    `Unmapped competitions: ${report.competitions.filter((competition) => competition.status === "unmapped").length}`,
  );
  console.log(`Mapped unique teams: ${uniqueMappedTeams.size}`);
  console.log(`Unmapped unique teams: ${uniqueUnmappedTeams.size}`);
  console.table(
    report.competitions.map((competition) => ({
      competition: competition.providerName,
      code: competition.goalsteryCode,
      leagueId: competition.providerLeagueId,
      status: competition.status,
      availableForSeason: competition.availableForSeason,
    })),
  );
}

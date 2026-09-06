import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import {
  SUPPORTED_ASSET_DISCOVERY_COMPETITIONS,
  competitionAssetLogoUrl,
  teamAssetLogoUrl,
} from "../src/lib/sports-api/assets/asset-discovery.ts";
import {
  FOOTBALL_ASSETS_MANIFEST_PATH,
  resolveCompetitionAssetIdentity,
  resolveTeamAssetIdentity,
  validateFootballAssetsManifest,
} from "../src/lib/sports-api/assets/asset-manifest.ts";

const API_FOOTBALL_ASSET_DOWNLOAD_SEASON = 2024;
const DOWNLOAD_REPORT_PATH = "data/football-assets-download-report.json";
const API_FOOTBALL_MIN_REQUEST_INTERVAL_MS = 6500;
const API_FOOTBALL_RATE_LIMIT_RETRY_MS = 65000;
const apiKey = process.env.API_FOOTBALL_KEY;
const baseUrl = (process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io").replace(/\/+$/, "");
const assetManifest = loadCanonicalManifest();
let lastApiFootballRequestAt = 0;

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run football asset download with NODE_ENV=production.");
  process.exit(1);
}

if (!apiKey) {
  console.error("API_FOOTBALL_KEY is required for football asset download.");
  console.error("Add it to your local .env. The key will not be written to reports or logs.");
  process.exit(1);
}

try {
  const report = await downloadFootballAssets();
  const reportPath = path.resolve(process.cwd(), DOWNLOAD_REPORT_PATH);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  printSummary(report);
  console.log(`Download report written: ${DOWNLOAD_REPORT_PATH}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown football asset download error.";
  console.error(message);
  process.exit(1);
}

async function downloadFootballAssets() {
  const report = {
    schemaVersion: 1,
    provider: "api-football",
    season: API_FOOTBALL_ASSET_DOWNLOAD_SEASON,
    generatedAt: new Date().toISOString(),
    format: "webp",
    competitions: [],
    teams: [],
    unmappedCompetitions: [],
    unmappedTeams: [],
    warnings: [],
  };

  const teamByProviderId = new Map();
  const teamSlugToProviderId = new Map();
  const competitionSlugToCode = new Map();

  await mkdir(path.resolve(process.cwd(), "public/assets/competitions"), { recursive: true });
  await mkdir(path.resolve(process.cwd(), "public/assets/teams"), { recursive: true });

  for (const competition of SUPPORTED_ASSET_DISCOVERY_COMPETITIONS) {
    const league = await resolveLeague(competition);
    if (!league.providerLeagueId) {
      report.warnings.push({
        severity: "error",
        code: "MISSING_LEAGUE_ID",
        message: `Provider league ID is missing for ${competition.name}.`,
        details: { goalsteryCode: competition.goalsteryCode },
      });
      report.unmappedCompetitions.push({
        goalsteryCode: competition.goalsteryCode,
        providerName: league.providerName,
        providerLeagueId: null,
        reason: "missing_provider_league_id",
      });
      continue;
    }

    const competitionIdentity = resolveCompetitionAssetIdentity(assetManifest, league.providerLeagueId);
    if (competitionIdentity.status === "unmapped") {
      report.unmappedCompetitions.push({
        goalsteryCode: competition.goalsteryCode,
        providerName: league.providerName,
        providerLeagueId: league.providerLeagueId,
        reason: "provider_league_not_in_manifest",
      });
      report.warnings.push({
        severity: "warning",
        code: "UNMAPPED_COMPETITION",
        message: `Provider league ${league.providerLeagueId} is not mapped in canonical asset manifest.`,
        details: { goalsteryCode: competition.goalsteryCode, providerLeagueId: league.providerLeagueId },
      });
      continue;
    }

    const competitionSlug = competitionIdentity.slug;
    const existingCompetitionCode = competitionSlugToCode.get(competitionSlug);
    if (existingCompetitionCode && existingCompetitionCode !== competition.goalsteryCode) {
      report.warnings.push({
        severity: "error",
        code: "DUPLICATE_COMPETITION_SLUG",
        message: `Competition slug ${competitionSlug} is used by multiple competitions.`,
        details: { slug: competitionSlug, codes: [existingCompetitionCode, competition.goalsteryCode] },
      });
      continue;
    }
    competitionSlugToCode.set(competitionSlug, competition.goalsteryCode);

    const competitionEntry = {
      goalsteryCode: competition.goalsteryCode,
      name: competition.name,
      slug: competitionSlug,
      provider: {
        leagueId: league.providerLeagueId,
        name: league.providerName,
        country: league.providerCountry,
        type: league.providerType,
        logoSourceUrl: league.providerLogoSourceUrl,
      },
      asset: {
        filename: `${competitionSlug}.webp`,
        logoUrl: competitionAssetLogoUrl(competitionSlug),
        localPath: `public/assets/competitions/${competitionSlug}.webp`,
      },
      teamsDiscovered: 0,
      downloadStatus: "pending",
      error: null,
    };

    if (!league.providerLogoSourceUrl) {
      competitionEntry.downloadStatus = "missing_logo";
      competitionEntry.error = "Missing provider logo URL.";
      report.warnings.push({
        severity: "warning",
        code: "MISSING_LOGO_URL",
        message: `Provider logo URL is missing for ${competition.name}.`,
        details: { goalsteryCode: competition.goalsteryCode, leagueId: league.providerLeagueId },
      });
    } else {
      const downloadResult = await downloadAndNormalizeImage({
        sourceUrl: league.providerLogoSourceUrl,
        localPath: competitionEntry.asset.localPath,
      });
      competitionEntry.downloadStatus = downloadResult.status;
      competitionEntry.error = downloadResult.error;
      if (downloadResult.status === "failed") {
        report.warnings.push({
          severity: "error",
          code: "FAILED_DOWNLOAD",
          message: `Failed to download competition logo for ${competition.name}.`,
          details: { goalsteryCode: competition.goalsteryCode, sourceUrl: league.providerLogoSourceUrl },
        });
      }
    }

    const providerTeams = await fetchTeamsForLeague(competition.goalsteryCode, league.providerLeagueId);
    competitionEntry.teamsDiscovered = providerTeams.length;
    report.competitions.push(competitionEntry);

    for (const team of providerTeams) {
      if (!team.providerTeamId) {
        report.warnings.push({
          severity: "error",
          code: "MISSING_TEAM_ID",
          message: `Provider team ID is missing for ${team.providerName ?? "unknown team"}.`,
          details: { competitionCode: competition.goalsteryCode },
        });
        continue;
      }

      if (!team.providerName) {
        report.warnings.push({
          severity: "error",
          code: "MISSING_TEAM_NAME",
          message: `Provider team name is missing for team ID ${team.providerTeamId}.`,
          details: { competitionCode: competition.goalsteryCode, teamId: team.providerTeamId },
        });
        continue;
      }

      const teamIdentity = resolveTeamAssetIdentity(assetManifest, team.providerTeamId);
      if (teamIdentity.status === "unmapped") {
        report.unmappedTeams.push({
          competitionCode: competition.goalsteryCode,
          providerTeamId: team.providerTeamId,
          providerName: team.providerName,
          candidateSlug: null,
          reason: "provider_team_not_in_manifest",
        });
        report.warnings.push({
          severity: "warning",
          code: "UNMAPPED_TEAM",
          message: `Provider team ${team.providerTeamId} is not mapped in canonical asset manifest.`,
          details: { competitionCode: competition.goalsteryCode, providerTeamId: team.providerTeamId },
        });
        continue;
      }

      const teamSlug = teamIdentity.slug;
      const existingProviderId = teamSlugToProviderId.get(teamSlug);
      if (existingProviderId !== undefined && existingProviderId !== team.providerTeamId) {
        report.warnings.push({
          severity: "error",
          code: "TEAM_SLUG_COLLISION",
          message: `Team slug ${teamSlug} maps to multiple provider team IDs.`,
          details: { slug: teamSlug, providerTeamIds: [existingProviderId, team.providerTeamId] },
        });
        continue;
      }
      teamSlugToProviderId.set(teamSlug, team.providerTeamId);

      const existingTeam = teamByProviderId.get(team.providerTeamId);
      if (existingTeam) {
        if (!existingTeam.competitions.includes(competition.goalsteryCode)) {
          existingTeam.competitions.push(competition.goalsteryCode);
        }
        existingTeam.skippedDuplicateCount += 1;
        continue;
      }

      const teamEntry = {
        name: team.providerName,
        slug: teamSlug,
        provider: {
          teamId: team.providerTeamId,
          name: team.providerName,
          logoSourceUrl: team.providerLogoSourceUrl,
        },
        asset: {
          filename: `${teamSlug}.webp`,
          logoUrl: teamAssetLogoUrl(teamSlug),
          localPath: `public/assets/teams/${teamSlug}.webp`,
        },
        competitions: [competition.goalsteryCode],
        downloadStatus: "pending",
        skippedDuplicateCount: 0,
        error: null,
      };

      if (!team.providerLogoSourceUrl) {
        teamEntry.downloadStatus = "missing_logo";
        teamEntry.error = "Missing provider logo URL.";
        report.warnings.push({
          severity: "warning",
          code: "MISSING_LOGO_URL",
          message: `Provider logo URL is missing for ${team.providerName}.`,
          details: { competitionCode: competition.goalsteryCode, teamId: team.providerTeamId },
        });
      } else {
        const downloadResult = await downloadAndNormalizeImage({
          sourceUrl: team.providerLogoSourceUrl,
          localPath: teamEntry.asset.localPath,
        });
        teamEntry.downloadStatus = downloadResult.status;
        teamEntry.error = downloadResult.error;
        if (downloadResult.status === "failed") {
          report.warnings.push({
            severity: "error",
            code: "FAILED_DOWNLOAD",
            message: `Failed to download team logo for ${team.providerName}.`,
            details: { teamId: team.providerTeamId, sourceUrl: team.providerLogoSourceUrl },
          });
        }
      }

      teamByProviderId.set(team.providerTeamId, teamEntry);
    }
  }

  report.teams = Array.from(teamByProviderId.values()).sort((first, second) => first.slug.localeCompare(second.slug));
  return report;
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
      providerLeagueId: null,
      providerName: null,
      providerCountry: null,
      providerType: null,
      providerLogoSourceUrl: null,
    };
  }

  return {
    providerLeagueId: numberOrNull(exactMatch.league?.id),
    providerName: stringOrNull(exactMatch.league?.name),
    providerCountry: stringOrNull(exactMatch.country?.name),
    providerType: stringOrNull(exactMatch.league?.type),
    providerLogoSourceUrl: stringOrNull(exactMatch.league?.logo),
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

async function fetchTeamsForLeague(competitionCode, leagueId) {
  const payload = await fetchApiFootball("/teams", {
    league: String(leagueId),
    season: String(API_FOOTBALL_ASSET_DOWNLOAD_SEASON),
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

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await throttleApiFootballRequest();

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`API-Football request failed for ${endpoint}: HTTP ${response.status}.`);
    }

    const payload = await response.json();
    if (!payload?.errors || Object.keys(payload.errors).length === 0) {
      return payload;
    }

    if (payload.errors.rateLimit && attempt < 3) {
      console.log(`API-Football rate limit reached. Waiting ${API_FOOTBALL_RATE_LIMIT_RETRY_MS / 1000}s before retry.`);
      await sleep(API_FOOTBALL_RATE_LIMIT_RETRY_MS);
      continue;
    }

    throw new Error(`API-Football returned an error for ${endpoint}: ${JSON.stringify(payload.errors)}`);
  }

  throw new Error(`API-Football request failed for ${endpoint}.`);
}

async function throttleApiFootballRequest() {
  const elapsed = Date.now() - lastApiFootballRequestAt;
  if (elapsed < API_FOOTBALL_MIN_REQUEST_INTERVAL_MS) {
    await sleep(API_FOOTBALL_MIN_REQUEST_INTERVAL_MS - elapsed);
  }
  lastApiFootballRequestAt = Date.now();
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function downloadAndNormalizeImage(input) {
  try {
    const response = await fetch(input.sourceUrl);
    if (!response.ok) {
      return { status: "failed", error: `Image download failed with HTTP ${response.status}.` };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return { status: "failed", error: `Invalid image content-type: ${contentType || "missing"}.` };
    }

    const source = Buffer.from(await response.arrayBuffer());
    if (source.length === 0) {
      return { status: "failed", error: "Image response was empty." };
    }

    const output = await sharp(source, { animated: false }).webp({ quality: 92, lossless: false }).toBuffer();
    if (output.length === 0) {
      return { status: "failed", error: "Normalized image was empty." };
    }

    await mkdir(path.dirname(path.resolve(process.cwd(), input.localPath)), { recursive: true });
    await writeFile(path.resolve(process.cwd(), input.localPath), output);
    await assertImageFile(path.resolve(process.cwd(), input.localPath));

    return { status: "downloaded", error: null };
  } catch (error) {
    return {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown image download error.",
    };
  }
}

async function assertImageFile(filePath) {
  const fileStat = await stat(filePath);
  if (fileStat.size <= 0) {
    throw new Error("Downloaded image file has zero size.");
  }

  const file = await readFile(filePath);
  const metadata = await sharp(file).metadata();
  if (!metadata.format) {
    throw new Error("Downloaded file is not a valid image.");
  }
}

function numberOrNull(value) {
  return Number.isInteger(value) ? value : null;
}

function stringOrNull(value) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function loadCanonicalManifest() {
  try {
    const manifest = JSON.parse(readFileSync(FOOTBALL_ASSETS_MANIFEST_PATH, "utf8"));
    const validation = validateFootballAssetsManifest(manifest);
    if (!validation.valid) {
      throw new Error(`Canonical football assets manifest is invalid: ${JSON.stringify(validation.issues)}`);
    }

    return manifest;
  } catch (error) {
    throw new Error(
      `Football asset download requires ${FOOTBALL_ASSETS_MANIFEST_PATH}. Build/review it before downloading assets.`,
      { cause: error },
    );
  }
}

function printSummary(report) {
  const downloadedCompetitions = report.competitions.filter((competition) => competition.downloadStatus === "downloaded");
  const failedCompetitions = report.competitions.filter((competition) => competition.downloadStatus === "failed");
  const downloadedTeams = report.teams.filter((team) => team.downloadStatus === "downloaded");
  const failedTeams = report.teams.filter((team) => team.downloadStatus === "failed");
  const missingTeamLogos = report.teams.filter((team) => team.downloadStatus === "missing_logo");
  const skippedDuplicateTeams = report.teams.reduce((total, team) => total + team.skippedDuplicateCount, 0);
  const slugCollisions = report.warnings.filter((warning) => warning.code === "TEAM_SLUG_COLLISION").length;

  console.log("Football asset download complete.");
  console.log(`Season: ${report.season}`);
  console.log("Provider: API-Football");
  console.log(`Competitions discovered: ${report.competitions.length}`);
  console.log(`Competition logos downloaded: ${downloadedCompetitions.length}`);
  console.log(`Competition logos failed: ${failedCompetitions.length}`);
  console.log(`Teams discovered: ${report.competitions.reduce((total, competition) => total + competition.teamsDiscovered, 0)}`);
  console.log(`Unique teams: ${report.teams.length}`);
  console.log(`Team logos downloaded: ${downloadedTeams.length}`);
  console.log(`Skipped duplicate team memberships: ${skippedDuplicateTeams}`);
  console.log(`Team logos failed: ${failedTeams.length}`);
  console.log(`Team logos missing source URL: ${missingTeamLogos.length}`);
  console.log(`Slug collisions: ${slugCollisions}`);
  console.log(`Unmapped competitions: ${report.unmappedCompetitions.length}`);
  console.log(`Unmapped teams: ${report.unmappedTeams.length}`);
  console.table(
    report.competitions.map((competition) => ({
      competition: competition.name,
      code: competition.goalsteryCode,
      leagueId: competition.provider.leagueId,
      teams: competition.teamsDiscovered,
      logo: competition.downloadStatus,
    })),
  );
}

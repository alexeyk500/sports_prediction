import { existsSync } from "node:fs";

export const FOOTBALL_ASSETS_MANIFEST_PATH =
  "data/football-assets.manifest.json";
export const FOOTBALL_ASSETS_DOWNLOAD_REPORT_PATH =
  "data/football-assets-download-report.json";

export interface CanonicalFootballAssetsManifest {
  version: 1;
  provider: "api-football";
  competitions: CanonicalCompetitionAssetIdentity[];
  teams: CanonicalTeamAssetIdentity[];
}

export interface CanonicalCompetitionAssetIdentity {
  provider: "api-football";
  providerLeagueId: number;
  providerName: string;
  canonicalName: string;
  slug: string;
}

export interface CanonicalTeamAssetIdentity {
  provider: "api-football";
  providerTeamId: number;
  providerName: string;
  canonicalName: string;
  slug: string;
}

export interface AssetManifestIssue {
  severity: "error" | "warning";
  code:
    | "INVALID_VERSION"
    | "INVALID_PROVIDER"
    | "MISSING_PROVIDER_ID"
    | "DUPLICATE_PROVIDER_ID"
    | "DUPLICATE_SLUG"
    | "MALFORMED_SLUG"
    | "MISSING_CANONICAL_NAME"
    | "MISSING_PROVIDER_NAME"
    | "MISSING_LOCAL_ASSET";
  message: string;
  details?: Record<string, unknown>;
}

export type AssetIdentityResolution =
  | { status: "mapped"; canonicalName: string; slug: string }
  | { status: "unmapped"; provider: "api-football"; providerId: number };

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveTeamAssetIdentity(
  manifest: CanonicalFootballAssetsManifest,
  providerTeamId: number,
): AssetIdentityResolution {
  const team = manifest.teams.find(
    (entry) =>
      entry.provider === "api-football" &&
      entry.providerTeamId === providerTeamId,
  );

  return team
    ? { status: "mapped", canonicalName: team.canonicalName, slug: team.slug }
    : {
        status: "unmapped",
        provider: "api-football",
        providerId: providerTeamId,
      };
}

export function resolveCompetitionAssetIdentity(
  manifest: CanonicalFootballAssetsManifest,
  providerLeagueId: number,
): AssetIdentityResolution {
  const competition = manifest.competitions.find(
    (entry) =>
      entry.provider === "api-football" &&
      entry.providerLeagueId === providerLeagueId,
  );

  return competition
    ? {
        status: "mapped",
        canonicalName: competition.canonicalName,
        slug: competition.slug,
      }
    : {
        status: "unmapped",
        provider: "api-football",
        providerId: providerLeagueId,
      };
}

export function teamAssetPath(slug: string): string {
  return `public/assets/teams/${slug}.webp`;
}

export function competitionAssetPath(slug: string): string {
  return `public/assets/competitions/${slug}.webp`;
}

export function validateFootballAssetsManifest(
  manifest: unknown,
  options: { checkLocalAssets?: boolean } = {},
): { valid: boolean; issues: AssetManifestIssue[] } {
  const issues: AssetManifestIssue[] = [];

  if (!isObject(manifest)) {
    return {
      valid: false,
      issues: [
        {
          severity: "error",
          code: "INVALID_VERSION",
          message: "Manifest must be an object.",
        },
      ],
    };
  }

  if (manifest.version !== 1) {
    issues.push({
      severity: "error",
      code: "INVALID_VERSION",
      message: "Manifest version must be 1.",
    });
  }

  if (manifest.provider !== "api-football") {
    issues.push({
      severity: "error",
      code: "INVALID_PROVIDER",
      message: "Manifest provider must be api-football.",
    });
  }

  const competitions = Array.isArray(manifest.competitions)
    ? manifest.competitions
    : [];
  const teams = Array.isArray(manifest.teams) ? manifest.teams : [];

  validateEntries({
    entityType: "competition",
    entries: competitions,
    providerIdField: "providerLeagueId",
    assetPathForSlug: competitionAssetPath,
    checkLocalAssets: options.checkLocalAssets ?? false,
    issues,
  });
  validateEntries({
    entityType: "team",
    entries: teams,
    providerIdField: "providerTeamId",
    assetPathForSlug: teamAssetPath,
    checkLocalAssets: options.checkLocalAssets ?? false,
    issues,
  });

  return {
    valid: issues.every((issue) => issue.severity !== "error"),
    issues,
  };
}

export function createCanonicalManifestFromDownloadReport(
  report: unknown,
): CanonicalFootballAssetsManifest {
  if (!isObject(report)) {
    throw new Error("Download report must be an object.");
  }

  const competitions = Array.isArray(report.competitions)
    ? report.competitions
    : [];
  const teams = Array.isArray(report.teams) ? report.teams : [];

  return {
    version: 1,
    provider: "api-football",
    competitions: competitions.map((entry) => {
      if (!isObject(entry) || !isObject(entry.provider)) {
        throw new Error("Malformed competition entry in download report.");
      }

      return {
        provider: "api-football",
        providerLeagueId: requiredNumber(
          entry.provider.leagueId,
          "providerLeagueId",
        ),
        providerName: requiredString(entry.provider.name, "providerName"),
        canonicalName: requiredString(entry.name, "canonicalName"),
        slug: requiredString(entry.slug, "slug"),
      };
    }),
    teams: teams.map((entry) => {
      if (!isObject(entry) || !isObject(entry.provider)) {
        throw new Error("Malformed team entry in download report.");
      }

      return {
        provider: "api-football",
        providerTeamId: requiredNumber(entry.provider.teamId, "providerTeamId"),
        providerName: requiredString(entry.provider.name, "providerName"),
        canonicalName: requiredString(entry.name, "canonicalName"),
        slug: requiredString(entry.slug, "slug"),
      };
    }),
  };
}

function validateEntries(input: {
  entityType: "competition" | "team";
  entries: unknown[];
  providerIdField: "providerLeagueId" | "providerTeamId";
  assetPathForSlug: (slug: string) => string;
  checkLocalAssets: boolean;
  issues: AssetManifestIssue[];
}): void {
  const providerIds = new Map<number, unknown>();
  const slugs = new Map<string, unknown>();

  for (const entry of input.entries) {
    if (!isObject(entry)) {
      input.issues.push({
        severity: "error",
        code: "MISSING_PROVIDER_ID",
        message: `Malformed ${input.entityType} manifest entry.`,
      });
      continue;
    }

    if (entry.provider !== "api-football") {
      input.issues.push({
        severity: "error",
        code: "INVALID_PROVIDER",
        message: `${input.entityType} provider must be api-football.`,
        details: { entry },
      });
    }

    const providerId = entry[input.providerIdField];
    if (typeof providerId !== "number" || !Number.isInteger(providerId)) {
      input.issues.push({
        severity: "error",
        code: "MISSING_PROVIDER_ID",
        message: `${input.entityType} provider ID is missing.`,
        details: { entry },
      });
    } else if (providerIds.has(providerId)) {
      input.issues.push({
        severity: "error",
        code: "DUPLICATE_PROVIDER_ID",
        message: `Duplicate ${input.entityType} provider ID ${providerId}.`,
        details: { providerId },
      });
    } else {
      providerIds.set(providerId, entry);
    }

    if (
      typeof entry.providerName !== "string" ||
      entry.providerName.trim().length === 0
    ) {
      input.issues.push({
        severity: "error",
        code: "MISSING_PROVIDER_NAME",
        message: `${input.entityType} providerName is missing.`,
        details: { entry },
      });
    }

    if (
      typeof entry.canonicalName !== "string" ||
      entry.canonicalName.trim().length === 0
    ) {
      input.issues.push({
        severity: "error",
        code: "MISSING_CANONICAL_NAME",
        message: `${input.entityType} canonicalName is missing.`,
        details: { entry },
      });
    }

    const slug = entry.slug;
    if (typeof slug !== "string" || slug.trim().length === 0) {
      input.issues.push({
        severity: "error",
        code: "MALFORMED_SLUG",
        message: `${input.entityType} slug is missing.`,
        details: { entry },
      });
      continue;
    }

    if (!slugPattern.test(slug)) {
      input.issues.push({
        severity: "error",
        code: "MALFORMED_SLUG",
        message: `${input.entityType} slug must be lowercase ASCII kebab-case.`,
        details: { slug },
      });
    }

    if (slugs.has(slug)) {
      input.issues.push({
        severity: "error",
        code: "DUPLICATE_SLUG",
        message: `Duplicate ${input.entityType} slug ${slug}.`,
        details: { slug },
      });
    } else {
      slugs.set(slug, entry);
    }

    if (input.checkLocalAssets && !existsSync(input.assetPathForSlug(slug))) {
      input.issues.push({
        severity: "warning",
        code: "MISSING_LOCAL_ASSET",
        message: `Local ${input.entityType} asset is missing for slug ${slug}.`,
        details: { slug, path: input.assetPathForSlug(slug) },
      });
    }
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Download report field ${field} is required.`);
  }

  return value;
}

function requiredNumber(value: unknown, field: string): number {
  if (!Number.isInteger(value)) {
    throw new Error(`Download report field ${field} is required.`);
  }

  return value as number;
}

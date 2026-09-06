import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type CanonicalFootballAssetsManifest,
  createCanonicalManifestFromDownloadReport,
  resolveCompetitionAssetIdentity,
  resolveTeamAssetIdentity,
  validateFootballAssetsManifest,
} from "@/lib/sports-api/assets/asset-manifest";

describe("football assets canonical manifest", () => {
  it("resolves existing provider IDs to stable canonical identities", () => {
    const manifest = manifestFixture();

    expect(resolveTeamAssetIdentity(manifest, 157)).toEqual({
      status: "mapped",
      canonicalName: "Bayern München",
      slug: "bayern-munchen",
    });
    expect(resolveCompetitionAssetIdentity(manifest, 39)).toEqual({
      status: "mapped",
      canonicalName: "Premier League",
      slug: "premier-league",
    });
  });

  it("keeps slug stable when provider name changes", () => {
    const manifest = manifestFixture();
    const changedProviderName = {
      ...manifest,
      teams: manifest.teams.map((team) =>
        team.providerTeamId === 157 ? { ...team, providerName: "Bayern Munich" } : team,
      ),
    };

    expect(resolveTeamAssetIdentity(changedProviderName, 157)).toEqual({
      status: "mapped",
      canonicalName: "Bayern München",
      slug: "bayern-munchen",
    });
  });

  it("returns explicit unmapped result for unknown provider teams", () => {
    expect(resolveTeamAssetIdentity(manifestFixture(), 999999)).toEqual({
      status: "unmapped",
      provider: "api-football",
      providerId: 999999,
    });
  });

  it("rejects duplicate provider IDs and duplicate slugs", () => {
    const manifest = manifestFixture();
    const invalid = {
      ...manifest,
      teams: [
        ...manifest.teams,
        {
          provider: "api-football",
          providerTeamId: 157,
          providerName: "Duplicate Provider ID",
          canonicalName: "Different Team",
          slug: "arsenal",
        },
      ],
    };

    expect(validateFootballAssetsManifest(invalid).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "DUPLICATE_PROVIDER_ID", severity: "error" }),
        expect.objectContaining({ code: "DUPLICATE_SLUG", severity: "error" }),
      ]),
    );
  });

  it("rejects malformed slugs and missing names", () => {
    const manifest = {
      version: 1,
      provider: "api-football",
      competitions: [
        {
          provider: "api-football",
          providerLeagueId: 39,
          providerName: "",
          canonicalName: "Premier League",
          slug: "Premier League",
        },
      ],
      teams: [],
    };

    expect(validateFootballAssetsManifest(manifest).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_PROVIDER_NAME", severity: "error" }),
        expect.objectContaining({ code: "MALFORMED_SLUG", severity: "error" }),
      ]),
    );
  });

  it("creates canonical manifest from an operational download report", () => {
    const manifest = createCanonicalManifestFromDownloadReport({
      competitions: [
        {
          name: "Premier League",
          slug: "premier-league",
          provider: { leagueId: 39, name: "Premier League" },
          downloadStatus: "downloaded",
          generatedAt: "transient",
        },
      ],
      teams: [
        {
          name: "Manchester United",
          slug: "manchester-united",
          provider: { teamId: 33, name: "Manchester United" },
          downloadStatus: "downloaded",
          error: null,
        },
      ],
    });

    expect(manifest).toEqual({
      version: 1,
      provider: "api-football",
      competitions: [
        {
          provider: "api-football",
          providerLeagueId: 39,
          providerName: "Premier League",
          canonicalName: "Premier League",
          slug: "premier-league",
        },
      ],
      teams: [
        {
          provider: "api-football",
          providerTeamId: 33,
          providerName: "Manchester United",
          canonicalName: "Manchester United",
          slug: "manchester-united",
        },
      ],
    });
  });

  it("keeps seed and download tooling pointed at canonical manifest", () => {
    const seedScript = readFileSync("scripts/seed-dev.mjs", "utf8");
    const downloadScript = readFileSync("scripts/download-football-assets.mjs", "utf8");

    expect(seedScript).toContain("data/football-assets.manifest.json");
    expect(seedScript).not.toContain("data/football-assets-download-report.json");
    expect(downloadScript).toContain("FOOTBALL_ASSETS_MANIFEST_PATH");
    expect(downloadScript).toContain("resolveTeamAssetIdentity");
    expect(downloadScript).not.toContain("loadExistingDownloadReport");
  });
});

function manifestFixture(): CanonicalFootballAssetsManifest {
  return {
    version: 1,
    provider: "api-football",
    competitions: [
      {
        provider: "api-football",
        providerLeagueId: 39,
        providerName: "Premier League",
        canonicalName: "Premier League",
        slug: "premier-league",
      },
    ],
    teams: [
      {
        provider: "api-football",
        providerTeamId: 42,
        providerName: "Arsenal",
        canonicalName: "Arsenal",
        slug: "arsenal",
      },
      {
        provider: "api-football",
        providerTeamId: 157,
        providerName: "Bayern München",
        canonicalName: "Bayern München",
        slug: "bayern-munchen",
      },
    ],
  };
}

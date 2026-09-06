import { readFile, writeFile } from "node:fs/promises";
import {
  FOOTBALL_ASSETS_DOWNLOAD_REPORT_PATH,
  FOOTBALL_ASSETS_MANIFEST_PATH,
  createCanonicalManifestFromDownloadReport,
  validateFootballAssetsManifest,
} from "../src/lib/sports-api/assets/asset-manifest.ts";

try {
  const report = JSON.parse(await readFile(FOOTBALL_ASSETS_DOWNLOAD_REPORT_PATH, "utf8"));
  const manifest = createCanonicalManifestFromDownloadReport(report);
  const validation = validateFootballAssetsManifest(manifest, { checkLocalAssets: true });

  if (validation.issues.some((issue) => issue.severity === "error")) {
    console.error("Cannot build canonical football assets manifest because validation failed.");
    console.error(JSON.stringify(validation.issues, null, 2));
    process.exit(1);
  }

  await writeFile(FOOTBALL_ASSETS_MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Canonical football assets manifest written: ${FOOTBALL_ASSETS_MANIFEST_PATH}`);
  console.log(`Competitions: ${manifest.competitions.length}`);
  console.log(`Teams: ${manifest.teams.length}`);
  console.log(`Warnings: ${validation.issues.filter((issue) => issue.severity === "warning").length}`);
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown football assets manifest build error.";
  console.error(message);
  process.exit(1);
}

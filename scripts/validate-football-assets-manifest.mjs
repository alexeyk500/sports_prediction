import { readFile } from "node:fs/promises";
import {
  FOOTBALL_ASSETS_MANIFEST_PATH,
  validateFootballAssetsManifest,
} from "../src/lib/sports-api/assets/asset-manifest.ts";

try {
  const manifest = JSON.parse(
    await readFile(FOOTBALL_ASSETS_MANIFEST_PATH, "utf8"),
  );
  const validation = validateFootballAssetsManifest(manifest, {
    checkLocalAssets: true,
  });
  const errors = validation.issues.filter(
    (issue) => issue.severity === "error",
  );
  const warnings = validation.issues.filter(
    (issue) => issue.severity === "warning",
  );

  console.log("Football assets manifest validation complete.");
  console.log(`Valid: ${validation.valid}`);
  console.log(`Errors: ${errors.length}`);
  console.log(`Warnings: ${warnings.length}`);

  if (validation.issues.length > 0) {
    console.log(JSON.stringify(validation.issues, null, 2));
  }

  if (errors.length > 0) {
    process.exit(1);
  }
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : "Unknown football assets manifest validation error.";
  console.error(message);
  process.exit(1);
}

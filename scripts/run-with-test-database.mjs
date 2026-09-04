import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL is required for test database commands.");
  process.exit(1);
}

let databaseName;

try {
  databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, "");
} catch {
  console.error("TEST_DATABASE_URL must be a valid PostgreSQL connection URL.");
  process.exit(1);
}

if (!databaseName.endsWith("_test")) {
  console.error(`Refusing to run test database command against non-test database: ${databaseName}`);
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node --env-file=.env scripts/run-with-test-database.mjs <command> [...args]");
  process.exit(1);
}

const localBinary = join(process.cwd(), "node_modules", ".bin", command);
const executable = existsSync(localBinary) ? localBinary : command;

const result = spawnSync(executable, args, {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: testDatabaseUrl,
  },
});

process.exit(result.status ?? 1);

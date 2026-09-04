import pg from "pg";

const { Client } = pg;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const developmentDatabaseUrl = process.env.DATABASE_URL;

if (!testDatabaseUrl) {
  console.error("TEST_DATABASE_URL is required to reset the test database.");
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
  console.error(`Refusing to reset non-test database: ${databaseName}`);
  process.exit(1);
}

if (developmentDatabaseUrl && testDatabaseUrl === developmentDatabaseUrl) {
  console.error("Refusing to reset because TEST_DATABASE_URL equals DATABASE_URL.");
  process.exit(1);
}

const client = new Client({ connectionString: testDatabaseUrl });

try {
  await client.connect();
  await client.query("DROP SCHEMA IF EXISTS public CASCADE");
  await client.query("CREATE SCHEMA public");
  await client.query("GRANT ALL ON SCHEMA public TO public");
} finally {
  await client.end();
}

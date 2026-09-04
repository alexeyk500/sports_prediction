import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = assertDatabaseUrl();
const adapter = new PrismaPg(databaseUrl);
const prisma = new PrismaClient({ adapter });

describe("test database migrations", () => {
  beforeAll(() => {
    const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

    if (!databaseName.endsWith("_test")) {
      throw new Error(`Integration tests must run against a test database, got: ${databaseName}`);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("runs against migrated PostgreSQL test database", async () => {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    const tableNames = tables.map((table) => table.table_name);

    expect(tableNames).toContain("User");
    expect(tableNames).toContain("Prediction");
    expect(tableNames).toContain("DailyPredictionUsage");
    expect(tableNames).toContain("_prisma_migrations");
  });

  it("has manual CHECK constraints from DB_SCHEMA.md", async () => {
    const constraints = await prisma.$queryRaw<Array<{ conname: string }>>`
      SELECT conname
      FROM pg_constraint
      WHERE contype = 'c'
      ORDER BY conname
    `;
    const names = constraints.map((constraint) => constraint.conname);

    expect(names).toContain("DailyPredictionUsage_freeUsed_range_check");
    expect(names).toContain("DailyPredictionUsage_rewardedUsed_range_check");
    expect(names).toContain("DailyPredictionUsage_totalUsed_limit_check");
    expect(names).toContain("Prediction_potentialPoints_range_check");
    expect(names).toContain("Tournament_startsAt_before_endsAt_check");
  });
});

function assertDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  return databaseUrl;
}

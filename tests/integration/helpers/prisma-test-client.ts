import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

export function requireTestDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for integration tests.");
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");

  if (!databaseName.endsWith("_test")) {
    throw new Error(
      `Integration tests must run against a test database, got: ${databaseName}`,
    );
  }

  return databaseUrl;
}

export function createTestPrismaClient(
  databaseUrl = requireTestDatabaseUrl(),
): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg(databaseUrl),
  });
}

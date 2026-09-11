import { createPrismaClient } from "../lib/prisma/client.ts";
import { systemClock } from "../lib/time/clock.ts";
import { FootballDataOrgProvider } from "../lib/sports-api/football-data-org-provider.ts";
import { MATCH_DISCOVERY_INTERVAL_MS } from "../modules/match-sync/match-polling.ts";
import { runMatchSyncCycle } from "../modules/match-sync/match-sync.service.ts";
import { consoleMatchSyncLogger } from "../modules/match-sync/match-sync-logger.ts";

const SHUTDOWN_GRACE_MS = 15_000;

export async function runMatchesWorker(): Promise<void> {
  const prisma = createPrismaClient();
  const logger = consoleMatchSyncLogger;
  const apiToken = process.env.FOOTBALL_DATA_API_TOKEN;

  if (!apiToken) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is required for worker:matches.");
  }

  const provider = new FootballDataOrgProvider({
    apiToken,
    logger,
    requestsPerMinute: parsePositiveInteger(
      process.env.FOOTBALL_DATA_REQUESTS_PER_MINUTE,
      10,
    ),
    idsChunkSize: parsePositiveInteger(
      process.env.FOOTBALL_DATA_MATCH_IDS_CHUNK_SIZE,
      50,
    ),
  });

  let stopping = false;
  let running = false;
  let timer: NodeJS.Timeout | null = null;

  const scheduleNext = () => {
    if (stopping) {
      return;
    }

    timer = setTimeout(() => {
      void runCycle();
    }, MATCH_DISCOVERY_INTERVAL_MS);
  };

  const runCycle = async () => {
    if (running || stopping) {
      return;
    }

    running = true;

    try {
      await runMatchSyncCycle({
        prisma,
        provider,
        clock: systemClock,
        logger,
      });
    } catch (error) {
      logger.error("match sync cycle failed", {
        ...serializeWorkerError(error),
      });
    } finally {
      running = false;
      scheduleNext();
    }
  };

  const shutdown = async (signal: NodeJS.Signals) => {
    if (stopping) {
      return;
    }

    stopping = true;
    logger.info("worker shutdown requested", { signal });

    if (timer) {
      clearTimeout(timer);
    }

    const startedAt = Date.now();

    while (running && Date.now() - startedAt < SHUTDOWN_GRACE_MS) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await prisma.$disconnect();
    logger.info("worker shutdown completed", { signal });
    process.exit(0);
  };

  process.on("SIGTERM", (signal) => {
    void shutdown(signal);
  });
  process.on("SIGINT", (signal) => {
    void shutdown(signal);
  });

  logger.info("worker started", {
    discoveryIntervalMs: MATCH_DISCOVERY_INTERVAL_MS,
  });

  await runCycle();
}

function serializeWorkerError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const knownError = error as Error & {
    code?: string;
    meta?: unknown;
    clientVersion?: string;
  };

  return {
    name: error.name,
    message: error.message,
    code: knownError.code,
    meta: knownError.meta,
    clientVersion: knownError.clientVersion,
    stack: error.stack,
  };
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

import type { FixtureStatus } from "@prisma/client";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;

export const MATCH_DISCOVERY_INTERVAL_MS = 30 * MINUTE_MS;
export const MATCH_POLLING_DEFAULT_BATCH_SIZE = 50;

export interface FixturePollingState {
  kickoffAt: Date;
  status: FixtureStatus;
  updatedAt: Date;
}

export interface PollingDecision {
  shouldPoll: boolean;
  intervalMs: number | null;
  anomaly: "LONG_RUNNING_UNFINISHED" | null;
}

export function getFixturePollingDecision(
  fixture: FixturePollingState,
  now: Date,
): PollingDecision {
  if (fixture.status === "FINISHED" || fixture.status === "SETTLED") {
    return { shouldPoll: false, intervalMs: null, anomaly: null };
  }

  if (fixture.status === "CANCELLED") {
    return { shouldPoll: false, intervalMs: null, anomaly: null };
  }

  const msUntilKickoff = fixture.kickoffAt.getTime() - now.getTime();
  const msSinceKickoff = now.getTime() - fixture.kickoffAt.getTime();

  if (fixture.status === "LIVE") {
    if (msSinceKickoff > 4 * HOUR_MS) {
      return {
        shouldPoll: isDue(fixture.updatedAt, now, 30 * MINUTE_MS),
        intervalMs: 30 * MINUTE_MS,
        anomaly: "LONG_RUNNING_UNFINISHED",
      };
    }

    return {
      shouldPoll: isDue(fixture.updatedAt, now, 10 * MINUTE_MS),
      intervalMs: 10 * MINUTE_MS,
      anomaly: null,
    };
  }

  if (fixture.status === "SUSPENDED" || fixture.status === "POSTPONED") {
    return {
      shouldPoll: isDue(fixture.updatedAt, now, 30 * MINUTE_MS),
      intervalMs: 30 * MINUTE_MS,
      anomaly: null,
    };
  }

  if (msUntilKickoff > 30 * MINUTE_MS) {
    return { shouldPoll: false, intervalMs: null, anomaly: null };
  }

  const intervalMs = msSinceKickoff >= 0 ? 5 * MINUTE_MS : 10 * MINUTE_MS;

  return {
    shouldPoll: isDue(fixture.updatedAt, now, intervalMs),
    intervalMs,
    anomaly: null,
  };
}

function isDue(lastCheckedAt: Date, now: Date, intervalMs: number): boolean {
  return now.getTime() - lastCheckedAt.getTime() >= intervalMs;
}

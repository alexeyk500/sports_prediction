import {
  getUtcDayRange,
  getUtcDateKey,
  type UtcDateKey,
} from "../../lib/time/utc-day.ts";
import type { Clock } from "../../lib/time/clock.ts";

export interface UtcDaySyncWindow {
  utcDateKey: UtcDateKey;
  startUtc: Date;
  endUtc: Date;
  providerDateFrom: string;
  providerDateTo: string;
}

export function getCurrentUtcDaySyncWindow(clock: Clock): UtcDaySyncWindow {
  const utcDateKey = getUtcDateKey(clock.now());
  const { startUtc, endUtc } = getUtcDayRange(utcDateKey);

  return {
    utcDateKey,
    startUtc,
    endUtc,
    providerDateFrom: utcDateKey,
    providerDateTo: utcDateKey,
  };
}

export function isWithinHalfOpenInterval(
  instant: Date,
  startUtc: Date,
  endUtc: Date,
): boolean {
  const timestamp = instant.getTime();

  return timestamp >= startUtc.getTime() && timestamp < endUtc.getTime();
}

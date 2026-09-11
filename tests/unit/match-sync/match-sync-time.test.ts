import { describe, expect, it } from "vitest";
import { FixedClock } from "@/lib/time/clock";
import { getCurrentUtcDaySyncWindow } from "@/modules/match-sync/match-sync-time";

describe("match sync UTC-day window", () => {
  it("uses a single UTC date for provider discovery", () => {
    const window = getCurrentUtcDaySyncWindow(
      new FixedClock("2026-07-15T12:00:00Z"),
    );

    expect(window.utcDateKey).toBe("2026-07-15");
    expect(window.startUtc.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(window.endUtc.toISOString()).toBe("2026-07-16T00:00:00.000Z");
    expect(window.providerDateFrom).toBe("2026-07-15");
    expect(window.providerDateTo).toBe("2026-07-15");
  });
});

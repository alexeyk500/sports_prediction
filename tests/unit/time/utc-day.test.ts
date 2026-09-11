import { describe, expect, it } from "vitest";
import {
  getUtcDateKey,
  getUtcDayRange,
  isInstantInUtcDate,
} from "@/lib/time/utc-day";
import { FixedClock } from "@/lib/time/clock";

describe("FixedClock", () => {
  it("returns deterministic copies of the configured instant", () => {
    const clock = new FixedClock("2026-09-04T12:00:00.000Z");
    const first = clock.now();

    first.setUTCFullYear(2030);

    expect(clock.now().toISOString()).toBe("2026-09-04T12:00:00.000Z");
  });

  it("can be advanced deterministically", () => {
    const clock = new FixedClock("2026-09-04T12:00:00.000Z");

    clock.advanceBy(1_500);

    expect(clock.now().toISOString()).toBe("2026-09-04T12:00:01.500Z");
  });
});

describe("UTC day semantics", () => {
  it("uses UTC calendar date keys without DST adjustments", () => {
    expect(getUtcDateKey(new Date("2026-01-15T23:30:00.000Z"))).toBe(
      "2026-01-15",
    );
    expect(getUtcDateKey(new Date("2026-07-15T23:30:00.000Z"))).toBe(
      "2026-07-15",
    );
  });

  it("uses lower-inclusive and upper-exclusive UTC day boundaries", () => {
    const range = getUtcDayRange("2026-09-11");

    expect(range.startUtc.toISOString()).toBe("2026-09-11T00:00:00.000Z");
    expect(range.endUtc.toISOString()).toBe("2026-09-12T00:00:00.000Z");
    expect(
      isInstantInUtcDate(new Date("2026-09-11T00:00:00.000Z"), "2026-09-11"),
    ).toBe(true);
    expect(
      isInstantInUtcDate(new Date("2026-09-11T23:59:59.999Z"), "2026-09-11"),
    ).toBe(true);
    expect(
      isInstantInUtcDate(new Date("2026-09-12T00:00:00.000Z"), "2026-09-11"),
    ).toBe(false);
  });

  it("treats former UK DST transition dates like ordinary UTC days", () => {
    expect(getUtcDayRange("2026-03-29")).toEqual({
      startUtc: new Date("2026-03-29T00:00:00.000Z"),
      endUtc: new Date("2026-03-30T00:00:00.000Z"),
    });
    expect(getUtcDayRange("2026-10-25")).toEqual({
      startUtc: new Date("2026-10-25T00:00:00.000Z"),
      endUtc: new Date("2026-10-26T00:00:00.000Z"),
    });
  });

  it("is independent of the host timezone", () => {
    const originalTimeZone = process.env.TZ;

    try {
      const results: string[] = [];

      for (const timeZone of ["UTC", "Europe/London", "America/New_York"]) {
        process.env.TZ = timeZone;
        results.push(getUtcDateKey(new Date("2026-07-15T23:30:00.000Z")));
        results.push(getUtcDayRange("2026-07-15").startUtc.toISOString());
      }

      expect(results).toEqual([
        "2026-07-15",
        "2026-07-15T00:00:00.000Z",
        "2026-07-15",
        "2026-07-15T00:00:00.000Z",
        "2026-07-15",
        "2026-07-15T00:00:00.000Z",
      ]);
    } finally {
      process.env.TZ = originalTimeZone;
    }
  });
});

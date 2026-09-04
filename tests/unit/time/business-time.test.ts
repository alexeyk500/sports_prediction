import { describe, expect, it } from "vitest";
import {
  getBusinessDate,
  getBusinessDayRangeUtc,
  isInstantInBusinessDate,
} from "@/lib/time/business-time";
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

describe("Europe/London business time", () => {
  it("returns the London date for a winter GMT instant", () => {
    expect(getBusinessDate(new Date("2026-01-15T12:00:00.000Z"))).toBe("2026-01-15");
  });

  it("returns the London date for a summer BST instant", () => {
    expect(getBusinessDate(new Date("2026-07-15T23:30:00.000Z"))).toBe("2026-07-16");
  });

  it("handles the GMT to BST transition day", () => {
    const range = getBusinessDayRangeUtc("2026-03-29");

    expect(range.startUtc.toISOString()).toBe("2026-03-29T00:00:00.000Z");
    expect(range.endUtc.toISOString()).toBe("2026-03-29T23:00:00.000Z");
    expect(isInstantInBusinessDate(new Date("2026-03-29T00:30:00.000Z"), "2026-03-29")).toBe(
      true,
    );
    expect(isInstantInBusinessDate(new Date("2026-03-29T23:00:00.000Z"), "2026-03-29")).toBe(
      false,
    );
  });

  it("handles the BST to GMT transition day", () => {
    const range = getBusinessDayRangeUtc("2026-10-25");

    expect(range.startUtc.toISOString()).toBe("2026-10-24T23:00:00.000Z");
    expect(range.endUtc.toISOString()).toBe("2026-10-26T00:00:00.000Z");
    expect(isInstantInBusinessDate(new Date("2026-10-25T23:59:59.000Z"), "2026-10-25")).toBe(
      true,
    );
    expect(isInstantInBusinessDate(new Date("2026-10-26T00:00:00.000Z"), "2026-10-25")).toBe(
      false,
    );
  });

  it("treats London 23:59:59 as the same business date", () => {
    expect(getBusinessDate(new Date("2026-09-04T22:59:59.000Z"))).toBe("2026-09-04");
  });

  it("treats London 00:00:00 as the next business date", () => {
    expect(getBusinessDate(new Date("2026-09-03T23:00:00.000Z"))).toBe("2026-09-04");
  });

  it("returns UTC day boundaries for GMT and BST days without fixed offsets", () => {
    expect(getBusinessDayRangeUtc("2026-01-15")).toEqual({
      startUtc: new Date("2026-01-15T00:00:00.000Z"),
      endUtc: new Date("2026-01-16T00:00:00.000Z"),
    });
    expect(getBusinessDayRangeUtc("2026-07-15")).toEqual({
      startUtc: new Date("2026-07-14T23:00:00.000Z"),
      endUtc: new Date("2026-07-15T23:00:00.000Z"),
    });
  });
});

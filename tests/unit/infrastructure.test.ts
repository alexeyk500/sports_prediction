import { describe, expect, it } from "vitest";

describe("infrastructure configuration", () => {
  it("does not use a configurable business timezone", () => {
    expect(process.env.BUSINESS_TIMEZONE).toBeUndefined();
  });
});

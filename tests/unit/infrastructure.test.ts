import { describe, expect, it } from "vitest";

describe("infrastructure configuration", () => {
  it("uses Europe/London as the documented business timezone", () => {
    expect(process.env.BUSINESS_TIMEZONE ?? "Europe/London").toBe(
      "Europe/London",
    );
  });
});

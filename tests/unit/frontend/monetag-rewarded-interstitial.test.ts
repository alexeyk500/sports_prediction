import { describe, expect, it, vi } from "vitest";
import type { MonetagRewardSessionDto } from "@/lib/api/types";

const mock = vi.hoisted(() => ({
  createAdHandler: vi.fn(),
  adHandler: vi.fn<(options?: unknown) => Promise<void>>(),
}));

vi.mock("monetag-tg-sdk", () => ({
  default: mock.createAdHandler,
}));

describe("Monetag rewarded interstitial adapter", () => {
  it("uses one main-zone handler and the same ymid/requestVar for preload and show", async () => {
    mock.adHandler.mockResolvedValue(undefined);
    mock.createAdHandler.mockReturnValue(mock.adHandler);
    const {
      preloadMonetagRewardedInterstitial,
      showMonetagRewardedInterstitial,
    } = await import("@/lib/monetag/rewarded-interstitial");
    const session: MonetagRewardSessionDto = {
      adRewardId: "reward-1",
      ymid: "opaque-ymid",
      zoneId: "1234567",
      requestVar: "matches_extra_prediction",
      status: "CREATED",
      expiresAt: "2026-09-10T12:00:00.000Z",
    };

    await preloadMonetagRewardedInterstitial(session);
    await showMonetagRewardedInterstitial(session);

    expect(mock.createAdHandler).toHaveBeenCalledTimes(1);
    expect(mock.createAdHandler).toHaveBeenCalledWith(1234567);
    expect(mock.adHandler).toHaveBeenNthCalledWith(1, {
      type: "preload",
      timeout: 5,
      ymid: "opaque-ymid",
      requestVar: "matches_extra_prediction",
    });
    expect(mock.adHandler).toHaveBeenNthCalledWith(2, {
      ymid: "opaque-ymid",
      requestVar: "matches_extra_prediction",
    });
    expect(mock.adHandler.mock.calls[1]?.[0]).not.toHaveProperty("timeout");
  });
});

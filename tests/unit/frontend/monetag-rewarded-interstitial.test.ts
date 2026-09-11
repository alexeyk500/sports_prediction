import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MonetagRewardSessionDto } from "@/lib/api/types";

const mock = vi.hoisted(() => ({
  createAdHandler: vi.fn(),
  adHandler: vi.fn<(options?: unknown) => Promise<void>>(),
}));

vi.mock("monetag-tg-sdk", () => ({
  default: mock.createAdHandler,
}));

describe("Monetag rewarded interstitial adapter", () => {
  beforeEach(() => {
    vi.resetModules();
    mock.createAdHandler.mockReset();
    mock.adHandler.mockReset();
  });

  it("uses one main-zone handler and the same ymid/requestVar for preload and show", async () => {
    mock.adHandler.mockResolvedValue(undefined);
    mock.createAdHandler.mockReturnValue(mock.adHandler);
    const {
      isMonetagRewardedInterstitialTimeout,
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
    expect(isMonetagRewardedInterstitialTimeout(new Error("Timeout"))).toBe(
      true,
    );
    expect(
      isMonetagRewardedInterstitialTimeout({
        error: "Timeout",
        event: "handler",
        zone_id: 11769225,
      }),
    ).toBe(true);
    expect(
      isMonetagRewardedInterstitialTimeout(new Error("Network error")),
    ).toBe(false);
  });

  it("supports two independent preload/show lifecycles with fresh ymid values", async () => {
    mock.adHandler.mockResolvedValue(undefined);
    mock.createAdHandler.mockReturnValue(mock.adHandler);
    const {
      preloadMonetagRewardedInterstitial,
      showMonetagRewardedInterstitial,
    } = await import("@/lib/monetag/rewarded-interstitial");
    const firstSession: MonetagRewardSessionDto = {
      adRewardId: "reward-1",
      ymid: "opaque-ymid-1",
      zoneId: "1234567",
      requestVar: "matches_extra_prediction",
      status: "CREATED",
      expiresAt: "2026-09-10T12:00:00.000Z",
    };
    const secondSession: MonetagRewardSessionDto = {
      ...firstSession,
      adRewardId: "reward-2",
      ymid: "opaque-ymid-2",
    };

    await preloadMonetagRewardedInterstitial(firstSession);
    await showMonetagRewardedInterstitial(firstSession);
    await preloadMonetagRewardedInterstitial(secondSession);
    await showMonetagRewardedInterstitial(secondSession);

    expect(mock.createAdHandler).toHaveBeenCalledTimes(1);
    expect(mock.adHandler).toHaveBeenNthCalledWith(1, {
      type: "preload",
      timeout: 5,
      ymid: "opaque-ymid-1",
      requestVar: "matches_extra_prediction",
    });
    expect(mock.adHandler).toHaveBeenNthCalledWith(2, {
      ymid: "opaque-ymid-1",
      requestVar: "matches_extra_prediction",
    });
    expect(mock.adHandler).toHaveBeenNthCalledWith(3, {
      type: "preload",
      timeout: 5,
      ymid: "opaque-ymid-2",
      requestVar: "matches_extra_prediction",
    });
    expect(mock.adHandler).toHaveBeenNthCalledWith(4, {
      ymid: "opaque-ymid-2",
      requestVar: "matches_extra_prediction",
    });
  });
});

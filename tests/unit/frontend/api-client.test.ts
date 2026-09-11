import { describe, expect, it } from "vitest";
import { ApiClient, ApiClientError } from "@/lib/api/client";

describe("frontend API client", () => {
  it("attaches Telegram initData and parses successful JSON", async () => {
    let receivedHeaders: Headers | undefined;
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async (_input, init) => {
        receivedHeaders = new Headers(init?.headers);
        return Response.json({ ok: true });
      },
    });

    await expect(client.getBootstrap()).resolves.toEqual({ ok: true });
    expect(receivedHeaders?.get("X-Telegram-Init-Data")).toBe(
      "signed-init-data",
    );
  });

  it("maps API error envelope to typed client error", async () => {
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async () =>
        Response.json(
          {
            error: {
              code: "PREDICTION_LOCKED",
              message: "Prediction is locked.",
              details: {},
            },
          },
          { status: 423 },
        ),
    });

    await expect(client.getTodayPredictions()).rejects.toMatchObject({
      code: "PREDICTION_LOCKED",
      status: 423,
    } satisfies Partial<ApiClientError>);
  });

  it("rejects missing Telegram initData before network call", async () => {
    let calls = 0;
    const client = new ApiClient({
      getTelegramInitData: () => null,
      fetchImpl: async () => {
        calls += 1;
        return Response.json({});
      },
    });

    await expect(client.getBootstrap()).rejects.toMatchObject({
      code: "MISSING_TELEGRAM_INIT_DATA",
      status: 401,
    } satisfies Partial<ApiClientError>);
    expect(calls).toBe(0);
  });

  it("requests Cup leaderboard modes with cursor pagination parameters", async () => {
    const requestedUrls: string[] = [];
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async (input) => {
        requestedUrls.push(String(input));
        return Response.json({
          items: [],
          nextCursor: null,
          totalParticipants: 0,
        });
      },
    });

    await client.getCupLeaderboard({
      cupId: "cup-1",
      mode: "all",
      limit: 50,
      cursor: "50",
    });
    await client.getCupLeaderboardAroundMe({
      cupId: "cup-1",
      radius: 4,
    });

    expect(requestedUrls).toEqual([
      "/api/cups/cup-1/leaderboard?mode=all&limit=50&cursor=50",
      "/api/cups/cup-1/leaderboard/me?radius=4",
    ]);
  });

  it("requests prize payouts and submits only wallet address for claims", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async (input, init) => {
        requests.push({
          url: String(input),
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });

        return Response.json({ ok: true });
      },
    });

    await client.getPrizePayouts();
    await client.submitPrizeClaim({
      entitlementId: "entitlement-1",
      walletAddress: `T${"A".repeat(33)}`,
    });

    expect(requests).toEqual([
      { url: "/api/prizes-payouts", body: null },
      {
        url: "/api/prizes-payouts/entitlement-1/claim",
        body: { walletAddress: `T${"A".repeat(33)}` },
      },
    ]);
  });

  it("creates, reads and confirms Monetag reward sessions through authenticated API", async () => {
    const requests: Array<{ url: string; body: unknown }> = [];
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async (input, init) => {
        requests.push({
          url: String(input),
          body: init?.body ? JSON.parse(String(init.body)) : null,
        });

        return Response.json({
          adRewardId: "reward-1",
          ymid: "opaque-ymid",
          zoneId: "1234567",
          requestVar: "matches_extra_prediction",
          status: "CREATED",
          expiresAt: "2026-09-10T12:00:00.000Z",
        });
      },
    });

    await client.createMonetagRewardSession({
      fixtureId: "fixture-1",
      selectedOutcome: "AWAY",
    });
    await client.getMonetagRewardSession({ adRewardId: "reward-1" });
    await client.confirmMonetagRewardSession({ adRewardId: "reward-1" });

    expect(requests).toEqual([
      {
        url: "/api/ad-rewards/monetag/sessions",
        body: { fixtureId: "fixture-1", selectedOutcome: "AWAY" },
      },
      {
        url: "/api/ad-rewards/monetag/sessions/reward-1",
        body: null,
      },
      {
        url: "/api/ad-rewards/monetag/sessions/reward-1/confirm",
        body: null,
      },
    ]);
  });

  it("cancels prediction through authenticated API", async () => {
    const requests: Array<{ method: string | undefined; url: string }> = [];
    const client = new ApiClient({
      getTelegramInitData: () => "signed-init-data",
      fetchImpl: async (input, init) => {
        requests.push({
          method: init?.method,
          url: String(input),
        });

        return Response.json({
          predictionId: "prediction-1",
          userId: "user-1",
          tournamentId: "tournament-1",
          fixtureId: "fixture-1",
          slotType: "FREE",
        });
      },
    });

    await client.cancelPrediction({ predictionId: "prediction-1" });

    expect(requests).toEqual([
      {
        method: "DELETE",
        url: "/api/predictions/prediction-1",
      },
    ]);
  });
});

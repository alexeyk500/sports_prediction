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
    expect(receivedHeaders?.get("X-Telegram-Init-Data")).toBe("signed-init-data");
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
});

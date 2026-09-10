"use client";

import type {
  ApiErrorEnvelope,
  BootstrapResponse,
  CupAroundMeLeaderboardResponse,
  CupHistoryResponse,
  CupLeaderboardModeDto,
  CupLeaderboardPageResponse,
  MonetagRewardSessionDto,
  PredictionMutationResponse,
  PredictionOutcome,
  PrizePayoutCardDto,
  PrizePayoutsResponse,
  TodayFixturesResponse,
  TodayPredictionsResponse,
  UserSettingsDto,
} from "./types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly endpoint?: string;

  constructor(
    error: ApiErrorEnvelope["error"],
    status: number,
    endpoint?: string,
  ) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.status = status;
    this.details = error.details;
    this.endpoint = endpoint;
  }
}

export interface ApiClientOptions {
  getTelegramInitData: () => string | null;
  fetchImpl?: typeof fetch;
}

export class ApiClient {
  readonly #getTelegramInitData: () => string | null;
  readonly #fetch: typeof fetch;

  constructor(options: ApiClientOptions) {
    this.#getTelegramInitData = options.getTelegramInitData;
    this.#fetch = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  getBootstrap(): Promise<BootstrapResponse> {
    return this.request("/api/bootstrap");
  }

  getTodayFixtures(): Promise<TodayFixturesResponse> {
    return this.request("/api/fixtures/today");
  }

  getTodayPredictions(): Promise<TodayPredictionsResponse> {
    return this.request("/api/predictions/today");
  }

  createMonetagRewardSession(input: {
    fixtureId: string;
    selectedOutcome: PredictionOutcome;
  }): Promise<MonetagRewardSessionDto> {
    return this.request("/api/ad-rewards/monetag/sessions", {
      method: "POST",
      body: input,
    });
  }

  getMonetagRewardSession(input: {
    adRewardId: string;
  }): Promise<MonetagRewardSessionDto> {
    return this.request(`/api/ad-rewards/monetag/sessions/${input.adRewardId}`);
  }

  confirmMonetagRewardSession(input: {
    adRewardId: string;
  }): Promise<MonetagRewardSessionDto> {
    return this.request(
      `/api/ad-rewards/monetag/sessions/${input.adRewardId}/confirm`,
      {
        method: "POST",
      },
    );
  }

  getCupLeaderboard(input: {
    cupId: string;
    mode: CupLeaderboardModeDto;
    limit?: number;
    cursor?: string | null;
  }): Promise<CupLeaderboardPageResponse> {
    const searchParams = new URLSearchParams({
      mode: input.mode,
    });

    if (input.limit !== undefined) {
      searchParams.set("limit", String(input.limit));
    }

    if (input.cursor) {
      searchParams.set("cursor", input.cursor);
    }

    return this.request(
      `/api/cups/${input.cupId}/leaderboard?${searchParams.toString()}`,
    );
  }

  getCupLeaderboardAroundMe(input: {
    cupId: string;
    radius?: number;
  }): Promise<CupAroundMeLeaderboardResponse> {
    const searchParams = new URLSearchParams();

    if (input.radius !== undefined) {
      searchParams.set("radius", String(input.radius));
    }

    const queryString = searchParams.toString();

    return this.request(
      `/api/cups/${input.cupId}/leaderboard/me${queryString ? `?${queryString}` : ""}`,
    );
  }

  getCupHistory(input: { cupId: string }): Promise<CupHistoryResponse> {
    return this.request(`/api/cups/${input.cupId}/history`);
  }

  getSettings(): Promise<UserSettingsDto> {
    return this.request("/api/settings");
  }

  getPrizePayouts(): Promise<PrizePayoutsResponse> {
    return this.request("/api/prizes-payouts");
  }

  submitPrizeClaim(input: {
    entitlementId: string;
    walletAddress: string;
  }): Promise<PrizePayoutCardDto> {
    return this.request(`/api/prizes-payouts/${input.entitlementId}/claim`, {
      method: "POST",
      body: {
        walletAddress: input.walletAddress,
      },
    });
  }

  updateSettings(input: Partial<UserSettingsDto>): Promise<UserSettingsDto> {
    return this.request("/api/settings", {
      method: "PATCH",
      body: input,
    });
  }

  createPrediction(input: {
    fixtureId: string;
    selectedOutcome: PredictionOutcome;
    adRewardId?: string;
    idempotencyKey: string;
  }): Promise<PredictionMutationResponse> {
    return this.request("/api/predictions", {
      method: "POST",
      headers: {
        "Idempotency-Key": input.idempotencyKey,
      },
      body: {
        fixtureId: input.fixtureId,
        selectedOutcome: input.selectedOutcome,
        adRewardId: input.adRewardId,
      },
    });
  }

  updatePrediction(input: {
    predictionId: string;
    selectedOutcome: PredictionOutcome;
  }): Promise<PredictionMutationResponse> {
    return this.request(`/api/predictions/${input.predictionId}`, {
      method: "PATCH",
      body: {
        selectedOutcome: input.selectedOutcome,
      },
    });
  }

  private async request<TResponse>(
    path: string,
    init: {
      method?: string;
      headers?: Record<string, string>;
      body?: unknown;
    } = {},
  ): Promise<TResponse> {
    const initData = this.#getTelegramInitData();

    if (!initData) {
      throw new ApiClientError(
        {
          code: "MISSING_TELEGRAM_INIT_DATA",
          message: "Telegram initData is required.",
          details: {},
        },
        401,
        path,
      );
    }

    let response: Response;

    try {
      response = await this.#fetch(path, {
        method: init.method ?? "GET",
        headers: {
          "X-Telegram-Init-Data": initData,
          ...(init.body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
          ...init.headers,
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
    } catch (error) {
      const apiError = new ApiClientError(
        {
          code: "NETWORK_ERROR",
          message: "Network request failed.",
          details: { endpoint: path },
        },
        0,
        path,
      );

      logApiClientError(apiError, error);
      throw apiError;
    }

    const payload = await parseJsonResponse(response, path);

    if (!response.ok) {
      const apiError = toApiClientError(payload, response.status, path);

      logApiClientError(apiError);
      throw apiError;
    }

    return payload as TResponse;
  }
}

export function toApiClientError(
  payload: unknown,
  status: number,
  endpoint?: string,
): ApiClientError {
  if (isApiErrorEnvelope(payload)) {
    return new ApiClientError(payload.error, status, endpoint);
  }

  return new ApiClientError(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected API response.",
      details: {},
    },
    status,
    endpoint,
  );
}

async function parseJsonResponse(
  response: Response,
  endpoint: string,
): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch (error) {
    const apiError = new ApiClientError(
      {
        code: "INVALID_API_RESPONSE",
        message: "API response was not valid JSON.",
        details: { endpoint },
      },
      response.status,
      endpoint,
    );

    logApiClientError(apiError, error);
    throw apiError;
  }
}

function logApiClientError(error: ApiClientError, cause?: unknown): void {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (isExpectedControlFlowError(error)) {
    console.info("API request completed with controlled domain response", {
      endpoint: error.endpoint,
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return;
  }

  console.error("API request failed", {
    endpoint: error.endpoint,
    status: error.status,
    code: error.code,
    message: error.message,
    cause: cause instanceof Error ? cause.message : undefined,
  });
}

function isExpectedControlFlowError(error: ApiClientError): boolean {
  return error.code === "REWARDED_AD_REQUIRED";
}

function isApiErrorEnvelope(payload: unknown): payload is ApiErrorEnvelope {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "code" in payload.error &&
    "message" in payload.error
  );
}

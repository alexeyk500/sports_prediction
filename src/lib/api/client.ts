"use client";

import type {
  ApiErrorEnvelope,
  BootstrapResponse,
  PredictionMutationResponse,
  PredictionOutcome,
  TodayFixturesResponse,
  TodayPredictionsResponse,
} from "./types";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(error: ApiErrorEnvelope["error"], status: number) {
    super(error.message);
    this.name = "ApiClientError";
    this.code = error.code;
    this.status = status;
    this.details = error.details;
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
    this.#fetch = options.fetchImpl ?? fetch;
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
      );
    }

    const response = await this.#fetch(path, {
      method: init.method ?? "GET",
      headers: {
        "X-Telegram-Init-Data": initData,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    const payload = (await response.json()) as unknown;

    if (!response.ok) {
      throw toApiClientError(payload, response.status);
    }

    return payload as TResponse;
  }
}

export function toApiClientError(payload: unknown, status: number): ApiClientError {
  if (isApiErrorEnvelope(payload)) {
    return new ApiClientError(payload.error, status);
  }

  return new ApiClientError(
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected API response.",
      details: {},
    },
    status,
  );
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

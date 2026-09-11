import { z } from "zod";
import type { MatchProviderMatch } from "../../modules/match-sync/match-provider.ts";
import type { MatchSyncLogger } from "../../modules/match-sync/match-sync-logger.ts";
import { isWithinHalfOpenInterval } from "../../modules/match-sync/match-sync-time.ts";

const FOOTBALL_DATA_ORG_BASE_URL = "https://api.football-data.org/v4";
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_RATE_LIMIT_BACKOFF_MS = 60_000;
const DEFAULT_REQUESTS_PER_MINUTE = 10;
const DEFAULT_IDS_CHUNK_SIZE = 50;

type FetchLike = typeof fetch;

export interface FootballDataOrgProviderConfig {
  apiToken: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  rateLimitBackoffMs?: number;
  requestsPerMinute?: number;
  idsChunkSize?: number;
  fetchImpl?: FetchLike;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => Date;
  logger: MatchSyncLogger;
}

export interface FootballDataOrgRateLimitTelemetry {
  requestsAvailable: number | null;
  requestCounterResetSeconds: number | null;
  retryAfterMs: number | null;
  apiVersion: string | null;
  authenticatedClient: string | null;
}

export class FootballDataOrgRequestError extends Error {
  readonly status: number | null;
  readonly retryable: boolean;

  constructor(
    message: string,
    input: { status: number | null; retryable: boolean },
  ) {
    super(message);
    this.name = "FootballDataOrgRequestError";
    this.status = input.status;
    this.retryable = input.retryable;
  }
}

export class FootballDataOrgProvider {
  #apiToken: string;
  #baseUrl: string;
  #timeoutMs: number;
  #maxRetries: number;
  #rateLimitBackoffMs: number;
  #requestsPerMinute: number;
  #idsChunkSize: number;
  #fetchImpl: FetchLike;
  #sleep: (milliseconds: number) => Promise<void>;
  #now: () => Date;
  #logger: MatchSyncLogger;
  #cooldownUntil: Date | null = null;
  #requestTimestamps: number[] = [];

  constructor(config: FootballDataOrgProviderConfig) {
    if (!config.apiToken) {
      throw new Error("FOOTBALL_DATA_API_TOKEN is required.");
    }

    this.#apiToken = config.apiToken;
    this.#baseUrl = config.baseUrl ?? FOOTBALL_DATA_ORG_BASE_URL;
    this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.#maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.#rateLimitBackoffMs =
      config.rateLimitBackoffMs ?? DEFAULT_RATE_LIMIT_BACKOFF_MS;
    this.#requestsPerMinute =
      config.requestsPerMinute ?? DEFAULT_REQUESTS_PER_MINUTE;
    this.#idsChunkSize = config.idsChunkSize ?? DEFAULT_IDS_CHUNK_SIZE;
    this.#fetchImpl = config.fetchImpl ?? fetch;
    this.#sleep = config.sleep ?? defaultSleep;
    this.#now = config.now ?? (() => new Date());
    this.#logger = config.logger;
  }

  async listMatchesForWindow(input: {
    fromUtc: Date;
    toUtc: Date;
  }): Promise<MatchProviderMatch[]> {
    const { dateFrom, dateTo } = getProviderDateRange(
      input.fromUtc,
      input.toUtc,
    );
    const payload = await this.#requestJson("/matches", {
      dateFrom,
      dateTo,
    });

    return parseMatchListPayload(payload, this.#logger).filter((match) =>
      isWithinHalfOpenInterval(match.kickoffAt, input.fromUtc, input.toUtc),
    );
  }

  async getMatchesByIds(
    providerMatchIds: string[],
  ): Promise<MatchProviderMatch[]> {
    const matches: MatchProviderMatch[] = [];
    const validProviderMatchIds = providerMatchIds.filter((providerMatchId) => {
      const isValid = /^\d+$/.test(providerMatchId);

      if (!isValid) {
        this.#logger.warn(
          "football-data.org invalid provider match id skipped",
          {
            providerMatchId,
          },
        );
      }

      return isValid;
    });

    for (const chunk of chunkArray(validProviderMatchIds, this.#idsChunkSize)) {
      if (chunk.length === 0) {
        continue;
      }

      const payload = await this.#requestJson("/matches", {
        ids: chunk.join(","),
      });

      matches.push(...parseMatchListPayload(payload, this.#logger));
    }

    return matches;
  }

  async #requestJson(
    path: string,
    query: Record<string, string>,
  ): Promise<unknown> {
    let attempt = 0;

    while (true) {
      try {
        await this.#waitForProviderBudget();
        const response = await this.#sendRequest(path, query);
        const telemetry = parseFootballDataOrgRateLimitHeaders(
          response.headers,
        );

        this.#logger.info("football-data.org response telemetry", {
          path,
          status: response.status,
          requestsAvailable: telemetry.requestsAvailable,
          requestCounterResetSeconds: telemetry.requestCounterResetSeconds,
          apiVersion: telemetry.apiVersion,
          authenticatedClient: telemetry.authenticatedClient,
        });

        if (response.status === 429) {
          const cooldownMs =
            telemetry.retryAfterMs ??
            resetSecondsToMilliseconds(telemetry.requestCounterResetSeconds) ??
            this.#rateLimitBackoffMs;
          this.#activateCooldown(cooldownMs);
          throw new FootballDataOrgRequestError(
            "football-data.org rate limited",
            {
              status: response.status,
              retryable: true,
            },
          );
        }

        if (!response.ok) {
          throw new FootballDataOrgRequestError(
            `football-data.org request failed with HTTP ${response.status}`,
            {
              status: response.status,
              retryable: response.status >= 500,
            },
          );
        }

        return response.json();
      } catch (error) {
        const requestError = normalizeRequestError(error);

        if (!requestError.retryable || attempt >= this.#maxRetries) {
          this.#logger.error("football-data.org request failed", {
            path,
            status: requestError.status,
            retryable: requestError.retryable,
            attempts: attempt + 1,
            message: requestError.message,
          });
          throw requestError;
        }

        const backoffMs = getRetryBackoffMs(attempt);
        this.#logger.warn("football-data.org request retry scheduled", {
          path,
          status: requestError.status,
          attempt: attempt + 1,
          backoffMs,
        });
        await this.#sleep(backoffMs);
        attempt += 1;
      }
    }
  }

  async #sendRequest(
    path: string,
    query: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(`${this.#baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);

    try {
      this.#recordRequestForBudget();
      return await this.#fetchImpl(url, {
        headers: {
          "X-Auth-Token": this.#apiToken,
          "User-Agent": "Goalstery worker:matches",
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async #waitForProviderBudget(): Promise<void> {
    const now = this.#now().getTime();

    if (this.#cooldownUntil && this.#cooldownUntil.getTime() > now) {
      const cooldownMs = this.#cooldownUntil.getTime() - now;
      this.#logger.warn("football-data.org cooldown active", { cooldownMs });
      await this.#sleep(cooldownMs);
      this.#cooldownUntil = null;
      this.#logger.info("football-data.org cooldown recovered");
    }

    this.#requestTimestamps = this.#requestTimestamps.filter(
      (timestamp) => now - timestamp < 60_000,
    );

    if (this.#requestTimestamps.length >= this.#requestsPerMinute) {
      const waitMs = 60_000 - (now - this.#requestTimestamps[0]);
      this.#logger.warn("football-data.org local request budget wait", {
        waitMs,
      });
      await this.#sleep(waitMs);
      this.#requestTimestamps = [];
    }
  }

  #recordRequestForBudget(): void {
    this.#requestTimestamps.push(this.#now().getTime());
  }

  #activateCooldown(milliseconds: number): void {
    this.#cooldownUntil = new Date(this.#now().getTime() + milliseconds);
    this.#logger.warn("football-data.org rate-limit cooldown activated", {
      cooldownMs: milliseconds,
    });
  }
}

const footballDataOrgTeamSchema = z.object({
  id: z.number().int(),
  name: z.string().nullable().optional(),
  shortName: z.string().nullable().optional(),
});

const footballDataOrgMatchSchema = z.object({
  id: z.number().int(),
  utcDate: z.string(),
  status: z.string(),
  competition: z.object({
    id: z.number().int(),
    code: z.string().nullable().optional(),
  }),
  homeTeam: footballDataOrgTeamSchema,
  awayTeam: footballDataOrgTeamSchema,
  score: z
    .object({
      winner: z.string().nullable().optional(),
      fullTime: z
        .object({
          home: z.number().int().nullable().optional(),
          away: z.number().int().nullable().optional(),
        })
        .nullable()
        .optional(),
    })
    .nullable()
    .optional(),
});

const footballDataOrgMatchListSchema = z.object({
  matches: z.array(z.unknown()),
});

export function parseFootballDataOrgRateLimitHeaders(
  headers: Headers,
): FootballDataOrgRateLimitTelemetry {
  return {
    requestsAvailable: parseNullableInteger(headers.get("X-RequestsAvailable")),
    requestCounterResetSeconds: parseNullableInteger(
      headers.get("X-RequestCounter-Reset"),
    ),
    retryAfterMs: parseRetryAfterMs(headers.get("Retry-After"), new Date()),
    apiVersion: headers.get("X-API-Version"),
    authenticatedClient: headers.get("X-Authenticated-Client"),
  };
}

function parseMatchListPayload(
  payload: unknown,
  logger: MatchSyncLogger,
): MatchProviderMatch[] {
  const listResult = footballDataOrgMatchListSchema.safeParse(payload);

  if (!listResult.success) {
    throw new FootballDataOrgRequestError(
      "football-data.org match list response is malformed",
      { status: null, retryable: false },
    );
  }

  return listResult.data.matches.flatMap((rawMatch) => {
    const matchResult = footballDataOrgMatchSchema.safeParse(rawMatch);

    if (!matchResult.success) {
      logger.warn("football-data.org malformed match skipped", {
        issues: matchResult.error.issues.map((issue) => issue.path.join(".")),
      });
      return [];
    }

    const normalized = normalizeFootballDataOrgMatch(matchResult.data);

    if (!normalized) {
      logger.warn("football-data.org unsafe match skipped", {
        providerFixtureId: String(matchResult.data.id),
        providerStatus: matchResult.data.status,
      });
      return [];
    }

    return [normalized];
  });
}

type FootballDataOrgMatch = z.infer<typeof footballDataOrgMatchSchema>;

function normalizeFootballDataOrgMatch(
  match: FootballDataOrgMatch,
): MatchProviderMatch | null {
  const kickoffAt = new Date(match.utcDate);

  if (Number.isNaN(kickoffAt.getTime())) {
    return null;
  }

  const homeTeam = normalizeTeam(match.homeTeam);
  const awayTeam = normalizeTeam(match.awayTeam);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  return {
    providerMatchId: String(match.id),
    providerCompetitionId: String(match.competition.id),
    providerCompetitionCode: match.competition.code ?? null,
    kickoffAt,
    status: normalizeFootballDataOrgStatus(match.status),
    providerStatus: match.status,
    homeTeam,
    awayTeam,
    finalResult: extractFinalResult(match),
  };
}

function normalizeTeam(team: FootballDataOrgMatch["homeTeam"]) {
  const name = normalizeNullableString(team.name) ?? `Team ${team.id}`;

  return {
    providerTeamId: String(team.id),
    name,
    shortName: normalizeNullableString(team.shortName),
  };
}

export function normalizeFootballDataOrgStatus(
  status: string,
): MatchProviderMatch["status"] {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "SCHEDULED";
    case "IN_PLAY":
    case "PAUSED":
    case "EXTRA_TIME":
    case "PENALTY_SHOOTOUT":
      return "LIVE";
    case "FINISHED":
      return "FINISHED";
    case "POSTPONED":
      return "POSTPONED";
    case "CANCELLED":
      return "CANCELLED";
    case "SUSPENDED":
      return "SUSPENDED";
    case "AWARDED":
      return "AWARDED";
    default:
      return "UNKNOWN";
  }
}

function extractFinalResult(
  match: FootballDataOrgMatch,
): MatchProviderMatch["finalResult"] {
  if (match.status !== "FINISHED") {
    return null;
  }

  const homeScore = match.score?.fullTime?.home;
  const awayScore = match.score?.fullTime?.away;
  const winner = match.score?.winner;

  if (
    typeof homeScore !== "number" ||
    typeof awayScore !== "number" ||
    (winner !== "HOME_TEAM" && winner !== "AWAY_TEAM" && winner !== "DRAW")
  ) {
    return null;
  }

  return {
    homeScore,
    awayScore,
    finalOutcome:
      winner === "HOME_TEAM"
        ? "HOME"
        : winner === "AWAY_TEAM"
          ? "AWAY"
          : "DRAW",
  };
}

function getProviderDateRange(
  fromUtc: Date,
  toUtc: Date,
): { dateFrom: string; dateTo: string } {
  const inclusiveEnd = new Date(toUtc.getTime() - 1);

  return {
    dateFrom: fromUtc.toISOString().slice(0, 10),
    dateTo: inclusiveEnd.toISOString().slice(0, 10),
  };
}

function parseNullableInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : null;
}

function parseRetryAfterMs(value: string | null, now: Date): number | null {
  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000;
  }

  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - now.getTime());
  }

  return null;
}

function resetSecondsToMilliseconds(seconds: number | null): number | null {
  return seconds === null ? null : Math.max(0, seconds * 1_000);
}

function normalizeNullableString(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRequestError(error: unknown): FootballDataOrgRequestError {
  if (error instanceof FootballDataOrgRequestError) {
    return error;
  }

  if (error instanceof Error) {
    return new FootballDataOrgRequestError(error.message, {
      status: null,
      retryable: true,
    });
  }

  return new FootballDataOrgRequestError("Unknown football-data.org error", {
    status: null,
    retryable: true,
  });
}

function getRetryBackoffMs(attempt: number): number {
  return [1_000, 2_500, 5_000][attempt] ?? 5_000;
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

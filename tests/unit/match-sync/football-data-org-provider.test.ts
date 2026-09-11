import { describe, expect, it, vi } from "vitest";
import {
  FootballDataOrgProvider,
  FootballDataOrgRequestError,
  normalizeFootballDataOrgStatus,
  parseFootballDataOrgRateLimitHeaders,
} from "@/lib/sports-api/football-data-org-provider";
import { FixedClock } from "@/lib/time/clock";

function createLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function match(overrides: Record<string, unknown> = {}) {
  return {
    id: 100,
    utcDate: "2026-07-15T22:30:00Z",
    status: "TIMED",
    competition: { id: 2021, code: "PL" },
    homeTeam: { id: 1, name: "Arsenal", shortName: "ARS", crest: null },
    awayTeam: { id: 2, name: "Chelsea", shortName: "CHE", crest: null },
    score: {
      winner: null,
      fullTime: { home: null, away: null },
    },
    ...overrides,
  };
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...init.headers },
    ...init,
  });
}

describe("football-data.org status normalization", () => {
  it("maps all documented statuses into worker statuses", () => {
    expect(normalizeFootballDataOrgStatus("SCHEDULED")).toBe("SCHEDULED");
    expect(normalizeFootballDataOrgStatus("TIMED")).toBe("SCHEDULED");
    expect(normalizeFootballDataOrgStatus("IN_PLAY")).toBe("LIVE");
    expect(normalizeFootballDataOrgStatus("PAUSED")).toBe("LIVE");
    expect(normalizeFootballDataOrgStatus("EXTRA_TIME")).toBe("LIVE");
    expect(normalizeFootballDataOrgStatus("PENALTY_SHOOTOUT")).toBe("LIVE");
    expect(normalizeFootballDataOrgStatus("FINISHED")).toBe("FINISHED");
    expect(normalizeFootballDataOrgStatus("POSTPONED")).toBe("POSTPONED");
    expect(normalizeFootballDataOrgStatus("CANCELLED")).toBe("CANCELLED");
    expect(normalizeFootballDataOrgStatus("SUSPENDED")).toBe("SUSPENDED");
    expect(normalizeFootballDataOrgStatus("AWARDED")).toBe("AWARDED");
    expect(normalizeFootballDataOrgStatus("FUTURE_STATUS")).toBe("UNKNOWN");
  });
});

describe("FootballDataOrgProvider", () => {
  it("injects X-Auth-Token and filters the exact UTC day window", async () => {
    const fetchImpl = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        void input;
        void init;

        return jsonResponse({
          matches: [
            match({ id: 1, utcDate: "2026-07-14T23:59:59Z" }),
            match({ id: 2, utcDate: "2026-07-15T00:00:00Z" }),
            match({ id: 3, utcDate: "2026-07-15T23:59:59Z" }),
            match({ id: 4, utcDate: "2026-07-16T00:00:00Z" }),
          ],
        });
      },
    );
    const provider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl,
      logger: createLogger(),
      sleep: async () => {},
    });

    const matches = await provider.listMatchesForWindow({
      fromUtc: new Date("2026-07-15T00:00:00Z"),
      toUtc: new Date("2026-07-16T00:00:00Z"),
    });
    const [requestedInput, requestedInit] = fetchImpl.mock.calls[0];
    const requestedUrl = new URL(String(requestedInput));

    expect(requestedUrl.pathname).toBe("/v4/matches");
    expect(requestedUrl.searchParams.get("dateFrom")).toBe("2026-07-15");
    expect(requestedUrl.searchParams.get("dateTo")).toBe("2026-07-15");
    expect(
      ((requestedInit as RequestInit).headers as Record<string, string>)[
        "X-Auth-Token"
      ],
    ).toBe("secret-token");
    expect(matches.map((item) => item.providerMatchId)).toEqual(["2", "3"]);
  });

  it("extracts final score only when FINISHED has complete full-time result", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        matches: [
          match({
            id: 1,
            status: "FINISHED",
            score: { winner: "HOME_TEAM", fullTime: { home: 2, away: 1 } },
          }),
          match({
            id: 2,
            status: "FINISHED",
            score: { winner: "DRAW", fullTime: { home: null, away: null } },
          }),
        ],
      }),
    );
    const provider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl,
      logger: createLogger(),
      sleep: async () => {},
    });

    const matches = await provider.getMatchesByIds(["1", "2"]);

    expect(matches[0].finalResult).toEqual({
      homeScore: 2,
      awayScore: 1,
      finalOutcome: "HOME",
    });
    expect(matches[1].finalResult).toBeNull();
  });

  it("batches ids requests and maps returned matches without relying on order", async () => {
    const fetchImpl = vi.fn(async (input) => {
      const ids = new URL(String(input)).searchParams.get("ids");

      return jsonResponse({
        matches:
          ids === "1,2"
            ? [match({ id: 2 }), match({ id: 1 })]
            : [match({ id: 3 })],
      });
    });
    const provider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl,
      logger: createLogger(),
      idsChunkSize: 2,
      sleep: async () => {},
    });

    const matches = await provider.getMatchesByIds(["1", "2", "3"]);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(matches.map((item) => item.providerMatchId)).toEqual([
      "2",
      "1",
      "3",
    ]);
  });

  it("skips non-numeric ids before using football-data.org ids filter", async () => {
    const logger = createLogger();
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      void input;

      return jsonResponse({
        matches: [match({ id: 123 })],
      });
    });
    const provider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl,
      logger,
      sleep: async () => {},
    });

    await provider.getMatchesByIds(["dev-fixture", "123"]);

    const [requestedInput] = fetchImpl.mock.calls[0];
    const requestedUrl = new URL(String(requestedInput));
    expect(requestedUrl.searchParams.get("ids")).toBe("123");
    expect(logger.warn).toHaveBeenCalledWith(
      "football-data.org invalid provider match id skipped",
      { providerMatchId: "dev-fixture" },
    );
  });

  it("parses rate-limit headers", () => {
    const headers = new Headers({
      "X-RequestsAvailable": "7",
      "X-RequestCounter-Reset": "12",
      "X-API-Version": "v4",
      "X-Authenticated-Client": "goalstery",
      "Retry-After": "3",
    });

    expect(parseFootballDataOrgRateLimitHeaders(headers)).toEqual({
      requestsAvailable: 7,
      requestCounterResetSeconds: 12,
      retryAfterMs: 3_000,
      apiVersion: "v4",
      authenticatedClient: "goalstery",
    });
  });

  it("honors 429 cooldown and retries without exposing the token in logs", async () => {
    const sleeps: number[] = [];
    const logger = createLogger();
    const clock = new FixedClock("2026-09-11T12:00:00Z");
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(
          { message: "rate limited" },
          { status: 429, headers: { "Retry-After": "2" } },
        ),
      )
      .mockResolvedValueOnce(jsonResponse({ matches: [match({ id: 1 })] }));
    const provider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl,
      logger,
      now: () => clock.now(),
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds);
        clock.advanceBy(milliseconds);
      },
    });

    const matches = await provider.getMatchesByIds(["1"]);

    expect(matches).toHaveLength(1);
    expect(
      sleeps.reduce((sum, value) => sum + value, 0),
    ).toBeGreaterThanOrEqual(2_000);
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(
      "secret-token",
    );
  });

  it("retries 5xx but not 403", async () => {
    const retryingFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, { status: 502 }))
      .mockResolvedValueOnce(jsonResponse({ matches: [match()] }));
    const retryingProvider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl: retryingFetch,
      logger: createLogger(),
      sleep: async () => {},
    });

    await expect(retryingProvider.getMatchesByIds(["1"])).resolves.toHaveLength(
      1,
    );
    expect(retryingFetch).toHaveBeenCalledTimes(2);

    const forbiddenFetch = vi.fn(async () => jsonResponse({}, { status: 403 }));
    const forbiddenProvider = new FootballDataOrgProvider({
      apiToken: "secret-token",
      fetchImpl: forbiddenFetch,
      logger: createLogger(),
      sleep: async () => {},
    });

    await expect(
      forbiddenProvider.getMatchesByIds(["1"]),
    ).rejects.toBeInstanceOf(FootballDataOrgRequestError);
    expect(forbiddenFetch).toHaveBeenCalledTimes(1);
  });
});

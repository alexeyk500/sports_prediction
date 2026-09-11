# football-data.org v4 — integration instructions for `worker:matches`

This document is implementation guidance for the first `MatchProvider` adapter.

Official provider documentation is authoritative if it conflicts with examples in this file.

## 1. Provider

- Product: football-data.org
- API version: v4
- Base URL: `https://api.football-data.org/v4`
- Official docs:
  - API docs: https://docs.football-data.org/general/v4/
  - Match resource: https://docs.football-data.org/general/v4/match.html
  - Competition resource: https://docs.football-data.org/general/v4/competition.html
  - Lookup tables / headers / filters: https://docs.football-data.org/general/v4/lookup_tables.html
  - API policies / throttling / UTC defaults: https://docs.football-data.org/general/v4/policies.html
  - Errors: https://docs.football-data.org/general/v4/errors.html
  - Pricing / plan limits: https://www.football-data.org/pricing

Do not scrape football-data.org web pages. Use only the documented v4 API.

## 2. Authentication

Authenticated API requests use the HTTP header:

```http
X-Auth-Token: <token>
```

The token must come from environment/config through the repository's existing secret/config mechanism. Never hardcode it, commit it, log it, return it from an endpoint, or include it in error payloads.

If there is no existing env name, introduce a clear server-only name such as:

```env
FOOTBALL_DATA_API_TOKEN=...
```

Reuse an existing equivalent if one already exists.

## 3. Required remote data

The adapter needs only the provider fields required by Goalstery:

### Match identity / schedule

- `match.id` — stable provider match ID
- `match.utcDate` — scheduled kickoff as UTC timestamp
- `match.status`
- `match.lastUpdated` — provider-side update timestamp if useful for diagnostics
- `match.competition.id`
- `match.competition.code`
- `match.season.id` only if the existing local model needs it
- `match.matchday` / `match.stage` only if existing local schema already uses them

### Teams

For `homeTeam` and `awayTeam`:

- `id`
- `name`
- `shortName`
- `crest`

`tla` may be consumed if the existing Team model already has an appropriate field, but it is not required by this task.

### Final result

From `score`:

- `score.winner`
- `score.fullTime.home`
- `score.fullTime.away`

Persist only Goalstery's approved minimum final result:

```text
homeScore
awayScore
winner = HOME | DRAW | AWAY
```

Do not persist lineups, bookings, substitutions, goals, statistics, half-time score, extra-time breakdown or penalty details for this task.

## 4. Do not unfold deep match data

football-data.org v4 folds deep information in match list responses by default and supports `X-Unfold-*` headers for expanding it.

`worker:matches` does not need deep data. Do not send:

```text
X-Unfold-Lineups: true
X-Unfold-Bookings: true
X-Unfold-Subs: true
X-Unfold-Goals: true
```

Keep list responses minimal.

## 5. Match discovery endpoint

Prefer the global match list endpoint for discovery instead of one request per league:

```http
GET /v4/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

The provider also supports a single `date=YYYY-MM-DD` filter, but Goalstery business-day semantics require special handling described below.

The global endpoint returns matches from competitions accessible to the authenticated account. After fetching, filter the response against the configured Goalstery leagues read from PostgreSQL using stable provider competition identity/code.

Do not issue one discovery request per league unless repository/provider constraints discovered during implementation make the global endpoint unsuitable. If a fallback to competition subresources is necessary, document why.

Competition-specific fallback form:

```http
GET /v4/competitions/{competitionIdOrCode}/matches?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
```

## 6. BUSINESS_TIMEZONE versus provider UTC semantics

Critical: football-data.org date-sensitive defaults use UTC. Goalstery defines business day using:

```env
BUSINESS_TIMEZONE="Europe/London"
```

Therefore never rely on provider default `GET /v4/matches` to mean Goalstery "today".

Algorithm:

1. Resolve current calendar date in `BUSINESS_TIMEZONE`.
2. Compute exact interval:
   - business-day start: `00:00:00 Europe/London`
   - next business-day start: `00:00:00 Europe/London` on the next calendar day
3. Convert both boundaries to UTC instants.
4. Determine every UTC calendar date touched by `[businessDayStartUtc, nextBusinessDayStartUtc)`.
5. Request a `dateFrom/dateTo` range broad enough to cover those UTC dates.
6. Locally keep only matches whose parsed `utcDate` satisfies:

```text
businessDayStartUtc <= utcDate < nextBusinessDayStartUtc
```

This local interval filter is mandatory. It avoids DST/BST edge cases where a London business day overlaps two UTC calendar dates.

Do not compare date strings without timezone-aware conversion.

## 7. Provider status mapping

football-data.org v4 exposes these documented match statuses across its current docs/lookup tables:

```text
SCHEDULED
TIMED
IN_PLAY
PAUSED
EXTRA_TIME
PENALTY_SHOOTOUT
FINISHED
SUSPENDED
POSTPONED
CANCELLED
AWARDED
```

The provider also documents `LIVE` as a pseudo-status/filter which groups active play states rather than a canonical stored match state.

Required normalization for Goalstery:

```text
SCHEDULED          -> local pre-match/scheduled state
TIMED              -> local pre-match/scheduled state
IN_PLAY            -> LIVE
PAUSED             -> LIVE
EXTRA_TIME         -> LIVE
PENALTY_SHOOTOUT   -> LIVE
FINISHED           -> FINISHED
POSTPONED          -> POSTPONED
CANCELLED          -> CANCELLED
SUSPENDED          -> SUSPENDED (or nearest authoritative existing local equivalent)
```

### `AWARDED`

Do not guess its business meaning.

During repository implementation:

- treat it as an explicit provider status;
- inspect whether the existing Goalstery fixture model has an appropriate equivalent;
- do not automatically emit `match.finished` unless a valid final result required by Goalstery is present and repository semantics explicitly support treating AWARDED as final;
- otherwise log a structured unsupported/provider-status anomaly and preserve safe local state.

Unknown future provider statuses must not crash the worker. Log them as structured anomalies and skip unsafe transitions.

## 8. `LIVE` handling

Do not request live score for product purposes.

Goalstery only requires knowing that the match is active. While normalized state is LIVE, ignore intermediate score changes for persistence/business events.

When provider reports `FINISHED`, read `score.fullTime.home`, `score.fullTime.away`, and `score.winner` and persist the approved final result atomically with the `match.finished` outbox event.

If `FINISHED` is returned without a usable final score, do not fabricate `0-0` or infer a result. Log an anomaly and leave the fixture un-finalized according to the safest existing model behavior so a later polling attempt can recover.

## 9. Tracking endpoint and batching

football-data.org match list supports an `ids` filter containing multiple match IDs:

```http
GET /v4/matches?ids=123,456,789
```

Prefer batching due fixtures through this endpoint rather than blindly issuing one request per match. This is important because the free plan is limited to 10 calls/minute.

Implementation requirements:

- scheduler decides which local fixtures are due according to `MATCH_WORKER_SPEC.md`;
- collect their provider IDs;
- fetch due IDs in as few provider requests as practical;
- map returned items back by provider match ID;
- do not assume response order;
- if an API/documented request-size constraint is discovered, chunk deterministically below that limit;
- if no explicit safe maximum is documented, keep chunking configurable/conservative rather than depending on an unbounded URL.

The adapter may use `GET /v4/matches/{id}` for exceptional single-match retrieval if justified, but it should not be the normal N+1 polling strategy.

## 10. Competition filtering

football-data.org lookup documentation supports a `competitions` filter on list resources. However, the repository's authoritative league/provider IDs should determine what Goalstery consumes.

Preferred discovery strategy:

1. fetch the minimal date range for the business day;
2. filter locally to configured leagues by stable provider competition ID/code;
3. filter locally to the exact London business-day UTC interval.

If the provider `competitions` query filter is used for efficiency, treat it only as an optimization; still validate returned competition identity locally.

## 11. Rate limiting

Current official documentation states:

- free plan: 10 API calls/minute;
- higher plans have higher limits.

Do not scatter sleeps around worker code. Implement rate-limit awareness centrally inside the football-data.org provider/infrastructure layer.

Useful documented response headers include:

```text
X-RequestCounter-Reset
X-RequestsAvailable
X-API-Version
X-Authenticated-Client
```

Use `X-RequestsAvailable` and `X-RequestCounter-Reset` when present as telemetry/input to proactive throttling.

Requirements:

- never intentionally exceed the configured/provider-observed request budget;
- schedule/batch requests rather than burst all due fixtures simultaneously;
- make the configured limit overridable because subscription tier may change;
- conservative default for the current expected free plan: 10 requests/minute;
- reserve headroom if implementation can do so without missing required polling cadence.


## 11.1 Subscription-plan limitation

As of the specification date, football-data.org advertises the Free plan as 10 calls/minute with delayed scores and delayed schedules; live scores are advertised on a paid plan.

Therefore:

- do not encode an assumption that provider `LIVE` is real-time on the Free plan;
- the worker must tolerate delayed `IN_PLAY`/`PAUSED`/`FINISHED` transitions;
- prediction locking remains based on Goalstery `kickoffAt` and is deliberately outside this worker;
- polling frequency does not create a guarantee of data freshness beyond the subscribed provider plan;
- keep plan/request-budget configuration overridable so upgrading the provider subscription does not require architecture changes.

## 12. HTTP 429

Provider documents `429 Too Many Requests` when the allowed request limit is exceeded.

If the HTTP response includes `Retry-After`, honor it.

If it is absent, use provider-level backoff informed by `X-RequestCounter-Reset` when available; otherwise use the worker's tested conservative backoff.

During cooldown, do not continue sending new football-data.org requests from another path in the adapter.

## 13. Other HTTP failures

Provider documents at least:

- `400` malformed request;
- `403` restricted/unavailable resource;
- `404` missing resource;
- `429` rate limit;
- `5xx` provider/server failure semantics.

Classification for this worker:

### Retryable

- network/transport error;
- timeout;
- `429` using dedicated cooldown behavior;
- `5xx`.

### Normally non-retryable in the same polling attempt

- `400` — implementation/request defect; log structured error;
- `403` — plan/access/configuration issue; log prominently with competition/resource context, never token;
- `404` — log provider/resource anomaly; do not hammer retries.

A non-retryable error for one fixture/league must not terminate the worker process.

## 14. Nullability and validation

football-data.org explicitly uses `null` for unknown/unavailable values.

The adapter must runtime-validate the remote response at its boundary. Do not trust TypeScript compile-time interfaces for external JSON.

Important rules:

- a pre-match score may be null; that is normal;
- team metadata can contain nullable values;
- do not persist `undefined`/invalid numbers as scores;
- only accept final integer scores when processing FINISHED;
- malformed individual matches should be logged/skipped without discarding other valid matches in the same batch where practical.

Use the repository's existing validation library/convention if available.

## 15. Identity rules

Stable provider identities:

```text
match.id
homeTeam.id
awayTeam.id
competition.id and/or competition.code
```

These are the primary reconciliation keys.

Do not reconcile by fuzzy names.

If a known provider match ID conflicts with incompatible local team identities, follow `MATCH_WORKER_SPEC.md`: log data-integrity anomaly and skip destructive update.

## 16. Request timeout and User-Agent

Use the repository's existing HTTP client conventions. Requests must have a finite timeout/abort mechanism; never allow an external request to hang the worker indefinitely.

If the project has a standard outbound `User-Agent`, reuse it. Do not invent spoofed browser headers.

## 17. Provider adapter contract

Do not expose raw football-data.org DTOs outside the provider adapter.

Conceptually the worker should consume normalized values similar to:

```ts
type ProviderMatch = {
  providerMatchId: string;
  providerCompetitionId: string;
  kickoffAt: Date;
  status: NormalizedProviderMatchStatus;
  homeTeam: ProviderTeam;
  awayTeam: ProviderTeam;
  finalResult: null | {
    homeScore: number;
    awayScore: number;
    winner: "HOME" | "DRAW" | "AWAY";
  };
};
```

Exact names/types must follow repository conventions after audit.

The abstraction should expose worker-oriented operations such as:

```text
listMatchesForWindow(...)
getMatchesByIds(...)
```

rather than leaking URL construction and football-data.org response objects into orchestration/domain code.

## 18. What Codex must NOT do

- Do not use provider's UTC "today" default as Goalstery business day.
- Do not request one discovery call per configured league by default.
- Do not poll every match individually if due matches can be batched with `ids`.
- Do not unfold lineups/goals/bookings/substitutions.
- Do not persist live scores.
- Do not infer FINISHED from elapsed time.
- Do not fabricate final scores when provider data is null/incomplete.
- Do not keep correction polling after a successfully persisted FINISHED result.
- Do not hardcode API token.
- Do not log secrets.
- Do not fuzzy-match teams/fixtures.
- Do not let raw provider DTOs/status enums escape the provider adapter.

## 19. Provider-specific tests

At minimum add deterministic tests for:

- `X-Auth-Token` injection without secret logging;
- exact BUSINESS_TIMEZONE interval filtering across UTC date boundaries/DST;
- global discovery response filtered to configured competitions;
- response runtime validation/null handling;
- team field normalization;
- all documented status mappings, including LIVE normalization for active states;
- safe handling of `AWARDED` and unknown future statuses;
- FINISHED extraction from `score.fullTime` and `score.winner`;
- FINISHED with missing/null score does not fabricate a result;
- batching/mapping by match IDs;
- rate-limit headers parsing;
- 429 cooldown;
- 400/403/404 classification;
- 5xx/network retry behavior;
- no N+1 discovery behavior.

Tests must use mocked provider HTTP responses, not live network access.

# Task: Implement `worker:matches` external match synchronization

## Objective

Implement the Goalstery long-running `worker:matches` process according to [`MATCH_WORKER_SPEC.md`](./MATCH_WORKER_SPEC.md) and the provider-specific instructions in [`FOOTBALL_DATA_ORG_API.md`](./FOOTBALL_DATA_ORG_API.md).

The worker is responsible only for obtaining real-world football match facts from an external provider, normalizing them into Goalstery's existing PostgreSQL model, and atomically emitting outbox facts for meaningful match transitions.

`football-data.org` is the first provider, but the implementation must introduce a provider abstraction immediately.

## Mandatory first step: repository audit

Before editing code, inspect the repository and identify the authoritative existing implementations for:

- Fixture/match schema and statuses;
- Team schema/provider identity;
- leagues/competitions and their external IDs;
- current football-data.org code, if any;
- `BUSINESS_TIMEZONE` handling;
- outbox/event schema or conventions;
- background worker/scheduler conventions;
- logging;
- package/runtime scripts;
- tests and architecture docs relevant to Matches/predictions.

Do **not** blindly introduce the illustrative class/table/enum names from the spec. Reuse the current project model and terminology wherever possible.

Do not perform broad/global replacements.

## Implementation requirements

Use [`MATCH_WORKER_SPEC.md`](./MATCH_WORKER_SPEC.md) as the authoritative behavioral specification and [`FOOTBALL_DATA_ORG_API.md`](./FOOTBALL_DATA_ORG_API.md) as the authoritative integration guide for the first provider adapter. If provider behavior appears to differ, verify against the official documentation URLs listed in that file rather than guessing.

In particular:

- leagues come from PostgreSQL;
- `BUSINESS_TIMEZONE` defines the current business day;
- discover current-day matches every 30 minutes;
- provider abstraction is required;
- implement football-data.org v4 as the first provider adapter exactly according to `FOOTBALL_DATA_ORG_API.md`;
- authenticate with `X-Auth-Token` from server-side config/env;
- use global match-list discovery and batch due fixture polling where possible; avoid N+1 provider calls;
- explicitly reconcile Goalstery `BUSINESS_TIMEZONE` with provider UTC date semantics;
- create missing teams and update provider-owned team metadata;
- normalize `IN_PLAY` and `PAUSED` to LIVE;
- persist only the minimum required final result (home score, away score, winner), unless existing schema already contains compatible richer fields;
- use the approved per-fixture polling cadence;
- do not poll live score for product purposes;
- after FINISHED, stop normal polling and do not check result corrections;
- handle reschedules/postponements/cancellations safely;
- write match transition + OutboxEvent atomically;
- emit the approved fact events: `match.started`, `match.finished`, `match.postponed`, `match.cancelled`, `match.rescheduled` (adapt naming only if existing project conventions require it);
- make synchronization idempotent;
- bounded retries/backoff for transient failures;
- honor `429` / `Retry-After`;
- do not assume real-time LIVE availability on football-data.org Free; provider-plan delays must not affect prediction deadline correctness;
- after 4 hours without FINISHED, poll every 30 minutes and log an anomaly; never force FINISHED;
- conflicting provider identity data must be logged and skipped, not fuzzy-merged;
- implement a real long-running worker entry point consistent with repository conventions;
- no manual re-sync endpoint/CLI;
- only one worker instance is part of the supported architecture.

## Architectural boundary

Do not add prediction evaluation, settlement, cups, leaderboard, prizes, notifications or downstream event handling to `worker:matches`.

The worker may add/extend shared outbox persistence/contracts needed to emit events, but implementing `worker:events` dispatch/consumption is outside this task.

The match worker emits **facts**, not commands.

Correct concept:

```text
football-data.org
        |
        v
provider adapter
        |
        v
worker:matches
        |
        v
PostgreSQL transaction
  Fixture/Team updates
  + OutboxEvent
```

## Testing

Add or update automated tests sufficient to prove the acceptance criteria in [`MATCH_WORKER_SPEC.md`](./MATCH_WORKER_SPEC.md), including at least:

- provider status normalization;
- business-day boundaries using `BUSINESS_TIMEZONE`;
- team create/update behavior;
- fixture idempotency;
- transition event emission and non-duplication;
- rescheduling behavior;
- polling cadence selection;
- transient retry behavior;
- 429 cooldown behavior;
- provider response/rate-limit header parsing;
- UTC-vs-London business-day boundary filtering;
- batch `ids` match retrieval;
- safe `AWARDED`/unknown-status handling;
- FINISHED response with missing final score;
- >4h anomaly behavior;
- conflicting identity behavior;
- worker restart/state reconstruction where practical.

Use deterministic/fake clocks rather than real sleeps in unit tests.

Mock the external provider at the adapter boundary. Tests must not depend on live football-data.org availability.

## Verification

Run the project's applicable quality gates after implementation, including the repository equivalents of:

```text
typecheck
lint
unit tests
integration tests
build
```

Also run targeted worker/provider tests explicitly.

Do not weaken existing checks to make the task pass.

## Documentation

Update relevant project documentation with:

- `worker:matches` responsibility and non-goals;
- runtime/start command;
- provider abstraction;
- business-timezone semantics;
- approved polling cadence;
- event facts emitted;
- retry/rate-limit behavior;
- operational assumptions (single worker instance, no result-correction polling).

## Completion report

At the end, report concisely:

1. repository architecture discovered;
2. files/modules added or changed;
3. DB/schema/migration changes, if any;
4. worker scheduling/polling implementation;
5. provider abstraction and football-data.org adapter;
6. outbox integration/events;
7. tests added/changed;
8. commands/checks run and their results;
9. any remaining risks or deviations from [`MATCH_WORKER_SPEC.md`](./MATCH_WORKER_SPEC.md).

Do not claim completion if any mandatory acceptance criterion is knowingly missing.


## Runtime & Deployment Contract

`worker:matches` MUST be implemented as a separate long-running runtime process that is operationally independent from the Next.js/UI process.

Mandatory requirements:

- Provide a dedicated executable/entry point and an npm script such as `npm run worker:matches`.
- Starting the Next.js web/UI application MUST NOT start `worker:matches`.
- Starting `worker:matches` MUST NOT require the Next.js/UI server to be running.
- Do NOT implement the worker as a Next.js API route, Route Handler, Server Component, React lifecycle hook, instrumentation hook, request-triggered job, or application-internal cron endpoint.
- The worker owns its own continuous scheduling/polling loop according to `MATCH_WORKER_SPEC.md`.
- The worker connects directly to the shared PostgreSQL/database layer using the repository's authoritative persistence infrastructure.
- Web and worker may share source code, domain types, Prisma/database modules, configuration, and the same repository/deployable image, but they are distinct runtime processes.
- Support graceful shutdown on `SIGTERM` and `SIGINT`: stop scheduling new work, allow in-flight work to finish within a reasonable bounded shutdown period, release resources, and exit.
- Recoverable provider/network/request failures MUST NOT terminate the worker process.
- Fatal startup/configuration failures MUST fail startup with a non-zero exit code so the process supervisor can restart/report the service.
- Production deployment MUST be able to run the web process and `worker:matches` as separate services/containers/process commands with independent lifecycle/restart policies.
- Do not implement `worker:events` in this task. It is a separate future runtime process.

Target runtime topology:

```text
Goalstery repository / deployable code
│
├── web
│   └── Next.js / UI / HTTP API
│
├── worker:matches
│   └── External Match Data Worker
│
└── worker:events
    └── Internal Event Worker (future task)

               PostgreSQL
              ↑          ↑
              │          │
        Next.js web   worker:matches
                         │
                         ▼
                  football-data.org
```

Acceptance criterion: stopping, restarting, or redeploying the web/UI process must not be part of the `worker:matches` lifecycle, and the worker must not depend on incoming HTTP/UI traffic to make progress.

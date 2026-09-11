# Goalstery — `worker:matches` Specification

## 1. Purpose

`worker:matches` is the Goalstery process responsible exclusively for synchronizing football match facts from an external match-data provider into Goalstery's normalized PostgreSQL model.

Its responsibility ends after normalized match/team data and corresponding outbox events are persisted.

It must not contain prediction, settlement, leaderboard, prize, notification, or other downstream business logic.

Core principle:

> `worker:matches` answers only: **what happened to the real-world match?**

## 2. Runtime boundary

Goalstery remains one repository/codebase with independent runtime processes:

```text
web
worker:matches
worker:events
```

For this task implement only `worker:matches` and the infrastructure/contracts strictly required for it to persist match facts and outbox events.

There is exactly **one running instance** of `worker:matches` in the current architecture.

Do not design distributed scheduling or horizontal worker concurrency unless existing repository conventions require a minimal guard against accidental duplicate execution.

## 3. Source of competitions

The worker obtains the leagues/competitions to synchronize from the existing PostgreSQL data model.

Do not introduce a static hardcoded competition list in the worker if the repository already stores the supported leagues and their provider identifiers.

No additional `isActiveForMatchSync` flag should be introduced unless repository audit proves there is no existing unambiguous way to identify the configured Goalstery leagues.

The implementation must first inspect the existing League/Competition/Tournament models and reuse the authoritative source already present in the project.

## 4. Provider abstraction

Provider abstraction is required from the first implementation.

`football-data.org` is the first concrete provider, but provider-specific DTOs, status names, response structures, URLs, authentication and rate-limit handling must not leak into the match synchronization domain/orchestration layer.

The concrete v4 endpoint/authentication/filter/status/rate-limit integration requirements are specified in [`FOOTBALL_DATA_ORG_API.md`](./FOOTBALL_DATA_ORG_API.md). That file must be read before implementing the adapter.

Conceptually:

```text
MatchProvider
    |
    +-- FootballDataOrgProvider
```

The provider contract should expose normalized operations required by the worker, not mirror the remote REST API blindly.

The implementation should make future replacement/addition of a provider possible without rewriting the match synchronization workflow.

## 5. Business timezone

The project already has:

```env
BUSINESS_TIMEZONE="Europe/London"
```

This is the authoritative timezone for all `today` / `business day` calculations.

Requirements:

- never derive the Goalstery business date from server local timezone;
- never derive it from user timezone;
- calculate the current business-day boundaries using `BUSINESS_TIMEZONE`;
- store absolute timestamps such as kickoff/sync timestamps in UTC according to existing DB conventions;
- the Matches UI/API and `worker:matches` must use compatible business-day semantics.

## 6. Scope of match discovery

The predictions/Matches screen operates on matches of the **current business day**.

Therefore the worker's active synchronization scope is the current Goalstery business day, not continuous high-frequency maintenance of the whole season calendar.

Every **30 minutes**, the worker must refresh the list of matches for the current business day for all configured leagues.

This discovery refresh exists to detect:

- new/current-day fixtures;
- kickoff changes;
- postponements;
- cancellations;
- provider metadata changes.

Historical `Fixture` rows remain in PostgreSQL. A fixture moved to another business date remains stored but stops active current-day tracking until its new date becomes current.

## 7. Team synchronization

When a provider response references a team:

### Team does not exist locally

Create it and associate it with its provider identity (`providerTeamId` or the repository's equivalent external identifier structure).

### Team already exists

Update provider-owned external metadata when it changes, specifically the existing equivalents of:

- name;
- short name;
- crest/logo.

Do not overwrite Goalstery-owned/internal fields unrelated to provider metadata.

Team identity matching must primarily rely on stable provider identity, not fuzzy team-name matching.

## 8. Minimum persisted match result

The worker only needs to persist the minimum final-result model required by Goalstery:

- final home score;
- final away score;
- winner/result: `HOME`, `DRAW`, or `AWAY` (mapped into the repository's existing equivalent type if one exists).

Do not introduce persistence for halftime score, extra-time breakdown or penalties unless the existing schema already requires such fields.

The provider adapter may consume richer data but the worker should not expand Goalstery's persisted result model without need.

## 9. Normalized match states

The worker must normalize provider-specific states into Goalstery's internal fixture state model.

Repository audit is authoritative for exact enum names. Do not duplicate an existing status enum merely because names differ from this document.

Required semantics include at least:

```text
scheduled/open-before-start
live
finished
postponed
cancelled
suspended (if existing model supports/needs it)
```

Provider statuses `IN_PLAY` and `PAUSED` must both be treated as the Goalstery **LIVE** state.

A halftime/pause state does not require a separate Goalstery fixture status for this worker.

The worker must never infer `FINISHED` from elapsed wall-clock time. `FINISHED` must come from the provider.

## 10. Prediction deadline is outside this worker

`worker:matches` must not decide whether a prediction can be submitted or edited.

Prediction locking is separate business logic based on `kickoffAt`.

Therefore a polling delay in discovering `LIVE` must not create an opportunity to submit a late prediction.

Do not move prediction-deadline logic into this worker.

## 11. Polling strategy

### 11.1 Current-day discovery

```text
all configured leagues / current business day
-> every 30 minutes
```

### 11.2 Per-fixture tracking

```text
more than 30 minutes before kickoff
-> no dedicated fixture polling

within 30 minutes before kickoff
-> every 10 minutes

after kickoff, while provider has not reported LIVE
-> every 5 minutes

LIVE
-> every 10 minutes

more than 4 hours after kickoff and still not FINISHED
-> every 30 minutes
-> emit an anomaly log

FINISHED
-> stop polling permanently for the normal workflow
```

Live score updates are not required. While a fixture is LIVE, Goalstery only needs the LIVE state until the provider reports the final result.

### 11.3 Corrections

After a fixture has been successfully persisted as `FINISHED` with its final result, the normal worker flow does **not** keep polling it for later provider corrections.

Result-correction monitoring is explicitly outside the current scope.

## 12. Rescheduled matches

If a current-day match is moved to another date:

1. update its `kickoffAt`;
2. preserve the existing fixture identity;
3. create `match.rescheduled` in the outbox;
4. stop active current-day per-fixture tracking;
5. allow normal discovery/tracking to pick it up again when its new date becomes the current business day.

Do not delete and recreate the fixture solely because its kickoff date changed.

## 13. Outbox integration

PostgreSQL is the source of truth.

A meaningful match transition and its corresponding `OutboxEvent` must be persisted atomically.

Conceptually:

```text
BEGIN TRANSACTION
  update Fixture / Team data
  insert OutboxEvent(s)
COMMIT
```

The worker must never directly call prediction settlement or other downstream handlers.

Events represent **facts**, not commands.

Required event types for this worker:

```text
match.started
match.finished
match.postponed
match.cancelled
match.rescheduled
```

Use existing event/outbox naming conventions if the repository already defines them, while preserving these semantics.

Do not create events when repeated provider data causes no meaningful state change.

### `match.started`

Created when the normalized fixture transitions from a pre-match state into LIVE.

### `match.finished`

Created when the provider reports FINISHED and the final result has been persisted.

### `match.postponed`

Created when the provider reports a postponement transition.

### `match.cancelled`

Created when the provider reports cancellation.

### `match.rescheduled`

Created when the scheduled kickoff changes materially. If a postponement response also contains a new kickoff, follow repository event conventions and avoid accidental duplicate semantic notifications; document the chosen behavior in code/tests.

## 14. Idempotency

All synchronization operations must be idempotent.

Repeated identical provider responses must not:

- create duplicate fixtures;
- create duplicate teams;
- emit duplicate transition events;
- corrupt current state.

Use stable provider IDs and existing database uniqueness constraints where possible.

Outbox event creation should be tied to an actual detected state transition/change inside the same transaction.

## 15. Conflicting provider data

If incoming data conflicts with the identity of an existing match — for example an unexpected provider match ID collision or incompatible teams — the worker must **not automatically merge or destructively overwrite** the local record.

Required behavior:

- log a structured data-integrity anomaly;
- skip the unsafe update;
- continue processing other fixtures;
- do not crash the entire worker loop.

Avoid fuzzy automatic reconciliation of ambiguous fixtures.

## 16. Retry and transient failures

For transient failures such as:

- network errors;
- timeout;
- provider `5xx` responses;

perform a bounded number of retries with increasing backoff.

If retries are exhausted:

- log the error with useful provider/request/competition/fixture context;
- leave persisted valid state untouched;
- continue worker execution;
- allow the next scheduled polling cycle to try again.

The worker must not terminate because one provider request failed.

Exact retry counts/delays should reuse an existing repository policy if available; otherwise introduce conservative documented defaults and tests.

## 17. Rate limiting

`football-data.org` rate limits must be handled centrally inside the provider/infrastructure layer.

On HTTP `429`:

- if `Retry-After` is present, respect it;
- otherwise use provider backoff;
- do not continue issuing new requests to that provider during the enforced cooldown;
- log rate-limit activation and recovery.

The worker scheduler must not bypass provider rate-limit coordination.

## 18. Long-running match anomaly

If more than **4 hours** have elapsed since `kickoffAt` and the provider still does not report FINISHED:

- do not force the match to FINISHED;
- reduce polling to every 30 minutes;
- emit a structured anomaly log;
- continue waiting for the provider's authoritative status.

Avoid emitting the same noisy anomaly log every loop if an existing logging/throttling mechanism can prevent spam.

## 19. Observability

Use structured logging consistent with repository conventions.

At minimum make it possible to diagnose:

- worker startup/shutdown;
- business date and timezone used;
- discovery cycle start/end;
- provider request failures;
- retries;
- rate limiting / cooldown;
- fixtures created/updated;
- teams created/updated;
- match status transitions;
- final result persistence;
- emitted outbox events;
- reschedules/postponements/cancellations;
- long-running-match anomalies;
- data-integrity anomalies.

Do not log provider secrets/API tokens.

## 20. Worker lifecycle

Implement as a genuine long-running worker entry point compatible with the repository/runtime architecture, exposed through an appropriate script such as:

```bash
npm run worker:matches
```

Use the project's existing package manager/script conventions rather than blindly adding npm-specific assumptions.

Requirements:

- clean startup;
- continuous scheduling without overlapping the worker's own jobs accidentally;
- graceful shutdown on process termination signals according to project conventions;
- a failed cycle must not kill future cycles;
- after restart, state is reconstructed from PostgreSQL/current time rather than relying on in-memory scheduler state.

No manual re-sync CLI/admin endpoint is required.

## 21. Explicit non-goals

Do not implement in this task:

- prediction submission/editing rules;
- prediction evaluation;
- settlement;
- cups/points calculation;
- leaderboard updates;
- prizes/payouts;
- notifications;
- analytics consumers;
- `worker:events` processing/dispatch implementation beyond any minimal shared outbox schema/contracts required by this worker;
- live-score UI/data streaming;
- result correction polling after FINISHED;
- manual re-sync endpoints/commands;
- multiple concurrent `worker:matches` instances;
- Kafka/RabbitMQ/NATS/Redis Streams or another broker unless already mandatory in the repository.

## 22. Repository-first implementation rule

Before changing code, audit the repository for:

- `Fixture` model/schema and status enums;
- Team model and provider IDs;
- League/Competition/Tournament models and provider competition identifiers;
- existing football-data.org integration;
- existing provider/client abstractions;
- existing outbox/event infrastructure;
- `BUSINESS_TIMEZONE` utilities;
- existing scheduling/background-worker conventions;
- logging/observability utilities;
- package scripts/runtime/deployment structure;
- tests and documentation governing match/prediction behavior.

Reuse and extend existing authoritative abstractions. Do not create parallel models/services when the repository already has equivalents.

If this specification's illustrative names conflict with established project terminology, preserve the project terminology while implementing the specified behavior.

## 23. Acceptance criteria

The task is complete when all of the following are true:

1. `worker:matches` can run independently from the web process.
2. Configured leagues are read from PostgreSQL.
3. The current business day is derived from `BUSINESS_TIMEZONE`.
4. Current-day match discovery runs every 30 minutes.
5. Provider integration is behind an explicit abstraction.
6. `football-data.org` is implemented as the initial adapter.
7. Missing provider teams are created; existing provider metadata is updated safely.
8. Fixtures are created/updated idempotently using stable provider identity.
9. `IN_PLAY` and `PAUSED` normalize to LIVE.
10. Per-fixture polling follows the approved cadence.
11. LIVE score tracking is not introduced.
12. FINISHED persists final home/away score and winner.
13. FINISHED fixtures stop normal polling and are not checked for corrections.
14. Rescheduled fixtures retain identity and leave today's active tracking when moved to another day.
15. Required outbox facts are emitted only on meaningful transitions.
16. Fixture mutation and outbox event insertion are transactional.
17. Transient provider errors use bounded retry/backoff and do not kill the worker.
18. `429` respects `Retry-After` or provider backoff.
19. More-than-4-hour unfinished fixtures enter 30-minute anomaly polling without being force-finished.
20. Conflicting provider identity data is logged/skipped rather than automatically merged.
21. No prediction/settlement/business consumer logic is introduced into this worker.
22. Automated tests cover normalization, idempotency, transitions/events, business-day calculation, scheduler cadence, retries/rate limiting and relevant failure paths.
23. Existing project typecheck/lint/unit/integration/build checks pass as applicable.
24. Relevant architecture/runtime documentation is updated.



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

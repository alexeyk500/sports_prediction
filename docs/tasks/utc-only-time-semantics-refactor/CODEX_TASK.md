# Codex Task: Refactor Goalstery to UTC-only time semantics

## Task status

This task supersedes the previous London-day discovery task:

`docs/tasks/worker-matches-london-day-discovery-fix/`

Do **not** implement the old London-day task after this one is adopted.

The new architectural decision is:

> Goalstery has no business timezone. All backend/domain timestamps and all backend calendar-day boundaries use UTC. User-facing time localization is display-only and must not influence domain behavior.

The existing `BUSINESS_TIMEZONE="Europe/London"` contract is obsolete and must be removed from code, configuration, tests, database semantics, and project documentation.

---

# 1. Goal

Refactor Goalstery so that UTC is the single authoritative time basis across:

- match ingestion
- match discovery
- fixture persistence
- prediction deadlines
- date/day filtering
- Matches screen API semantics
- worker scheduling and discovery windows
- database fields and constraints where relevant
- date/time helpers
- tests
- environment configuration
- authoritative project documentation

The objective is to eliminate all business logic based on `Europe/London`, DST, BST/GMT transitions, or configurable business-day timezones.

The system should have one simple rule:

```text
All persisted timestamps are UTC.
All backend "day" boundaries are UTC.
All domain comparisons are performed using UTC instants.
Client-side localization is presentation only.
```

---

# 2. Architectural decision

## 2.1 Authoritative time model

Goalstery no longer has a business timezone.

Remove this concept:

```env
BUSINESS_TIMEZONE=Europe/London
```

Do not replace it with:

```env
BUSINESS_TIMEZONE=UTC
```

unless the current architecture strictly requires the variable temporarily during migration.

The preferred final state is that `BUSINESS_TIMEZONE` no longer exists.

UTC is not a configurable business setting. It is the fixed backend time basis.

## 2.2 Domain timestamps

All domain timestamps must remain absolute instants stored and compared in UTC, including but not limited to:

- `kickoffAt`
- prediction deadline/cutoff timestamps
- fixture timestamps
- provider sync timestamps
- match status update timestamps
- `createdAt`
- `updatedAt`
- settlement timestamps
- outbox timestamps
- delivery timestamps
- prize/payment timestamps where applicable
- tournament/cup timestamps where applicable

Do not convert persisted timestamps into user-local time.

## 2.3 Backend calendar days

Any backend concept equivalent to:

- today
- current day
- daily match list
- day start
- next day
- match discovery date
- current match day window

must use UTC boundaries:

```text
dayStartUtc <= timestamp < nextDayStartUtc
```

Example:

```text
UTC date: 2026-09-11

2026-09-11T00:00:00.000Z
<= timestamp <
2026-09-12T00:00:00.000Z
```

No DST logic is allowed in backend day classification.

## 2.4 Presentation localization

The frontend may localize timestamps to the user's/device's locale/timezone for display.

Example:

```text
persisted kickoffAt:
2026-09-11T19:00:00Z
```

may render as:

```text
London:   20:00
Berlin:   21:00
New York: 15:00
```

This display localization must not alter:

- which UTC day the fixture belongs to
- prediction deadlines
- eligibility
- settlement
- worker polling
- fixture identity
- tournament state
- API filtering

---

# 3. Repository audit first

Before changing code, perform a repository-wide classification of all time-related logic.

Search for at least:

```text
BUSINESS_TIMEZONE
Europe/London
London
BST
GMT
timezone
timeZone
business day
businessDay
dayStart
startOfDay
endOfDay
today
currentDate
current day
utcDate
kickoffAt
deadline
DateTimeFormat
toLocaleString
toLocaleDateString
Temporal
date-fns
date-fns-tz
luxon
moment
dayjs
AT TIME ZONE
timezone(
CURRENT_DATE
CURRENT_TIMESTAMP
```

Do not blindly replace strings.

Classify every occurrence into one of these groups:

1. **Domain/business semantics**
   - must become UTC-only.

2. **Provider integration**
   - provider timestamps remain normalized to UTC.

3. **Persistence/database semantics**
   - verify storage and querying are UTC-safe.

4. **Frontend presentation**
   - may retain user-local formatting.

5. **Documentation**
   - update architectural rules.

6. **Tests/fixtures**
   - rewrite assumptions around London/BST/GMT.

7. **Unrelated textual occurrence**
   - leave unchanged.

Include the audit summary in the final report.

---

# 4. Refactor environment/configuration

Remove the business-timezone configuration from runtime behavior.

Audit:

- `.env`
- `.env.example`
- environment schema/validation
- config modules
- worker startup config
- server config
- test env
- deployment documentation
- Docker/systemd/process manager config if present

Remove:

```env
BUSINESS_TIMEZONE=Europe/London
```

and any validation that requires it.

Do not introduce a replacement env variable for UTC unless there is a compelling technical requirement.

The preferred code should directly express UTC semantics.

Bad:

```ts
const timezone = process.env.BUSINESS_TIMEZONE ?? "UTC";
```

Preferred:

```ts
const startUtc = ...
```

UTC is an architectural invariant, not a deployment choice.

---

# 5. Shared date/time utilities

Audit all shared date helpers.

Delete or refactor helpers whose semantics are based on an arbitrary IANA business timezone.

Examples of obsolete concepts:

```ts
getBusinessDate(...)
getBusinessDayBounds(...)
getLondonDayBounds(...)
toBusinessTimezone(...)
getCurrentBusinessDate(...)
```

Replace them with explicit UTC utilities where useful.

Possible API shape:

```ts
getUtcDateKey(date: Date): string
getUtcDayBounds(date: Date): {
  startUtc: Date;
  endUtc: Date;
}
```

or equivalent consistent with the project's conventions.

UTC day bounds must always be:

```text
start = YYYY-MM-DDT00:00:00.000Z
end   = next UTC date at 00:00:00.000Z
```

Avoid host-local timezone APIs.

Do not rely on:

```ts
new Date(year, month, day)
```

for UTC boundaries because it uses local runtime timezone semantics.

Prefer explicit UTC construction such as:

```ts
Date.UTC(...)
```

or an already-established UTC-safe library/helper.

---

# 6. `worker:matches` refactor

Audit:

- `src/workers/matches-worker.ts`
- `src/modules/match-sync/*`
- `src/lib/sports-api/football-data-org-provider.ts`
- related repositories/services/helpers

The worker must use UTC day semantics only.

## 6.1 Discovery day

The current discovery day is the current UTC calendar day.

Conceptually:

```text
utcDay = current UTC date
startUtc = utcDay 00:00:00Z
endUtc = next UTC day 00:00:00Z
```

## 6.2 football-data.org provider integration

football-data.org match kickoff times are represented as UTC timestamps via `utcDate`.

Keep provider normalization into UTC `Date`/timestamp values.

For date-based provider queries, build the narrowest safe provider date range that covers the required UTC day.

Do not retain London/BST padding logic.

If provider `dateFrom`/`dateTo` semantics require a broader calendar envelope, use only the minimal safe envelope and perform final membership filtering locally with:

```text
startUtc <= kickoffAt < endUtc
```

Respect the confirmed football-data.org constraint:

```text
Specified period must not exceed 10 days.
```

A one-day discovery flow must never approach that limit.

## 6.3 Competition filtering

Preserve filtering by provider competition ID.

Do not introduce name matching.

Keep configured competition IDs authoritative.

## 6.4 Polling behavior

Preserve the existing polling policy unless UTC migration requires a mechanical adjustment.

Current intended behavior remains:

- general current-day discovery every 30 minutes
- more frequent polling near kickoff
- delayed LIVE detection must not control prediction eligibility
- LIVE polling
- anomaly handling after long-running matches
- stop normal polling after FINISHED
- stop normal polling after CANCELLED
- preserve POSTPONED/SUSPENDED handling
- no fabricated final states

Do not redesign polling in this task.

## 6.5 Diagnostics

Retain or add structured diagnostics sufficient to inspect:

- requested UTC day
- provider query range
- provider raw count
- normalized count
- configured competition count
- UTC-day membership count
- persisted/upserted count
- skip reasons

Never log the provider token.

---

# 7. Matches API / backend read path

Audit all API routes/services that determine which fixtures appear in the Matches screen.

The rule must become:

```text
show fixtures whose kickoffAt belongs to the requested/current UTC day
```

For "today":

```text
UTC today
```

not:

```text
server-local today
Europe/London today
browser-local today
```

Backend query boundaries must be explicit UTC instants.

Example:

```text
kickoffAt >= 2026-09-11T00:00:00Z
kickoffAt <  2026-09-12T00:00:00Z
```

Prefer half-open intervals.

Do not use inclusive end-of-day timestamps such as:

```text
23:59:59.999
```

when a `< nextDayStart` comparison is possible.

---

# 8. Prediction deadlines

Prediction availability must remain tied to the actual kickoff instant.

Do not derive prediction closure from:

- UTC day rollover
- user-local day rollover
- worker status transition
- LIVE detection

The authoritative rule remains conceptually:

```text
prediction allowed only before kickoffAt
```

or the project's existing cutoff rule if slightly different.

The UTC refactor must preserve all existing prediction timing behavior except removal of timezone-dependent day semantics.

Add regression tests where relevant.

---

# 9. Database / Prisma schema audit

Perform a careful schema audit before changing anything.

Inspect:

- `prisma/schema.prisma`
- migrations
- raw SQL
- indexes
- constraints
- views/functions if any
- repositories using date truncation or SQL timezone operations

## 9.1 Timestamp columns

Verify all timestamp columns used for domain instants have unambiguous UTC semantics.

Do not perform destructive type changes without a demonstrated need.

If PostgreSQL + Prisma currently uses a timestamp representation that already round-trips absolute instants correctly, preserve it.

Do not create a migration merely to "rename UTC" if storage is already correct.

However, fix schema/database constructs that encode business timezone assumptions.

Examples to audit:

```sql
AT TIME ZONE 'Europe/London'
date_trunc(... Europe/London ...)
timezone('Europe/London', ...)
CURRENT_DATE
localtimestamp
```

Any backend-day query must become explicitly UTC-safe.

## 9.2 Business-date columns

If the schema contains persisted fields whose value is specifically a London/business calendar date, classify them.

For each such field determine whether it is:

A. redundant and derivable from an authoritative UTC timestamp  
B. necessary as an immutable domain snapshot  
C. unrelated to this time model

Prefer removing redundant business-date state when safe.

Do not remove fields blindly.

If a persisted date field is removed or redefined:

- create an explicit Prisma migration
- backfill safely if required
- update all reads/writes
- update indexes
- update constraints
- update tests
- document the migration semantics

## 9.3 Indexes

Ensure the main date-range queries remain index-friendly.

A query like:

```sql
WHERE kickoffAt >= $startUtc
  AND kickoffAt < $endUtc
```

should be able to use an index on `kickoffAt`.

Avoid wrapping the indexed timestamp column in timezone/date conversion functions in hot queries.

Prefer computing UTC bounds in application code and passing them as query parameters.

## 9.4 Migration safety

If a migration is required:

- preserve existing absolute timestamps
- do not shift already-correct timestamps by +1/-1 hour
- do not reinterpret historical UTC instants as London-local wall-clock values
- make data migration idempotent where practical
- add validation queries or tests

The final report must explicitly state whether any timestamp data values changed and why.

---

# 10. Outbox and event timestamps

Audit `OutboxEvent` and any related delivery models.

Their timestamps must remain UTC absolute instants.

Event payloads containing match timestamps must use a canonical UTC representation, preferably ISO-8601 with `Z`, for example:

```json
{
  "kickoffAt": "2026-09-11T19:00:00.000Z"
}
```

Do not include a business timezone field unless independently required by another domain concern.

The UTC refactor must not change:

- event idempotency
- event type names
- transaction atomicity
- at-least-once design
- future `worker:events` architecture

---

# 11. Frontend behavior

Separate backend classification from user presentation.

## 11.1 Allowed

The frontend may use user/device timezone for rendering:

```ts
Intl.DateTimeFormat(...)
```

or the project's existing display formatter.

## 11.2 Not allowed

Frontend local time must not determine:

- API domain day
- prediction deadline
- fixture eligibility
- settlement
- worker behavior
- competition eligibility

## 11.3 Matches screen labeling

Audit labels such as:

- Today
- Tomorrow
- date headers

If the Matches screen currently exposes a backend UTC-day list while rendering timestamps in user-local time, document this semantic explicitly.

Do not silently change product behavior to "user-local day" as part of this task.

If a fixture belongs to the UTC day but visually renders after local midnight for a user, that is acceptable under the new architecture unless product requirements later change.

---

# 12. Tests

Replace London/BST/GMT domain tests with UTC invariants.

Add/update tests for at least:

## 12.1 UTC day boundaries

```text
2026-09-11T00:00:00.000Z  -> included
2026-09-11T23:59:59.999Z  -> included
2026-09-12T00:00:00.000Z  -> excluded
```

Use half-open intervals.

## 12.2 Runtime host timezone independence

Critical:

Tests should prove that backend behavior does not change if the Node/process host timezone differs.

Where practical, run or simulate tests with different `TZ` values, such as:

```text
TZ=UTC
TZ=Europe/London
TZ=America/New_York
```

UTC day classification must remain identical.

## 12.3 Provider normalization

Test:

- provider UTC `utcDate`
- parsed UTC instant
- correct UTC-day membership
- no local timezone drift

## 12.4 Prediction cutoff

Verify prediction cutoff uses absolute kickoff instant.

## 12.5 Database range queries

Verify UTC lower-inclusive / upper-exclusive fixture queries.

## 12.6 DST regression

Add at least one regression test using dates that previously crossed BST/GMT transitions to prove DST is now irrelevant to backend semantics.

For example, the same UTC boundary logic must apply on:

- a summer date
- a winter date
- a UK DST transition date

No special London logic should exist.

---

# 13. Documentation refactor

Audit and update authoritative docs.

At minimum search in:

```text
docs/
README*
architecture docs
PRODUCT_SPEC*
TECH_SPEC*
DB_SCHEMA*
DECISIONS*
deployment docs
worker docs
API docs
environment docs
```

Remove or supersede statements that say:

```text
BUSINESS_TIMEZONE=Europe/London
Goalstery business day is Europe/London
London day is authoritative
BST/GMT defines match day
```

Replace with the UTC-only architecture.

## 13.1 Architecture documentation

Document:

```text
UTC is the sole backend/domain time basis.
```

Explain the distinction:

```text
domain time = UTC
display time = user-local where appropriate
```

## 13.2 Product specification

Document that Matches "today" means UTC day at the backend unless the UI copy/product definition intentionally uses different wording.

Do not leave ambiguous language.

## 13.3 Technical specification

Specify:

```text
UTC day interval = [00:00:00Z, next day 00:00:00Z)
```

All absolute timestamps are stored and compared as UTC instants.

## 13.4 Database documentation

Update timestamp and date-field semantics.

Document any schema migration performed.

## 13.5 ADR / Decisions

Add a new decision, using the repository's existing ADR/decision numbering scheme.

The decision should record:

- previous rule: `Europe/London`
- new rule: UTC-only backend semantics
- motivation:
  - provider uses UTC timestamps
  - predictions depend on absolute kickoff
  - Goalstery is not tied to one geographic market
  - removes DST complexity
  - makes worker/API/database semantics deterministic
- consequences:
  - UTC defines backend day membership
  - user-local rendering remains presentation-only
  - local midnight may differ from UTC match-day boundary
- migration implications

Mark the previous London business-timezone decision as superseded if such a decision exists.

Do not silently delete historical ADR context if the project keeps historical decisions.

---

# 14. Remove obsolete London-specific task/code

Audit for code introduced specifically to handle London-day padding or DST.

Remove dead helpers and tests once no longer used.

Do not leave dual semantics such as:

```text
some APIs use UTC
some APIs use Europe/London
```

There must be one final authoritative contract.

Also update/remove references to:

`worker-matches-london-day-discovery-fix`

where project task documentation treats it as pending/current work.

Do not delete unrelated task history if `docs/tasks` intentionally serves as an immutable archive; in that case mark it superseded instead.

---

# 15. Compatibility and migration review

Before finishing, explicitly review the impact on:

- existing Fixture rows
- existing Prediction rows
- current tournaments/cups
- existing outbox events
- scheduled worker execution
- deployed environment variables
- API consumers
- frontend cached data
- tests and fixtures
- seed data

The migration must not alter historical absolute instants merely because the business-day interpretation changed.

If an existing record stores:

```text
2026-09-11T19:00:00Z
```

it should remain:

```text
2026-09-11T19:00:00Z
```

unless there is concrete evidence that the record was previously stored incorrectly.

---

# 16. Non-goals

Do NOT use this task to:

- redesign the worker architecture
- introduce `worker:events`
- change football prediction scoring
- change cup rewards
- change leaderboard behavior
- change prize logic
- change payment logic
- implement user-selectable timezones
- infer match outcomes
- add live-score UI
- redesign navigation
- change match provider
- add fuzzy matching
- redesign competition configuration
- change polling cadence unless required mechanically by UTC-day transition logic

Keep scope focused on time semantics.

---

# 17. Expected code quality

Prefer explicit semantics in names.

Good:

```ts
utcDayStart
utcDayEnd
kickoffAt
getUtcDayBounds
```

Avoid ambiguous names:

```ts
todayStart
businessDate
localizedDate
dayBoundary
```

unless their meaning is unambiguous in context.

Avoid hidden dependence on host timezone.

Use UTC-safe APIs consistently.

---

# 18. Validation

Run the project's normal validation suite, including at least:

```bash
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

Also run:

- match worker tests
- API tests related to Matches
- prediction deadline tests
- database/repository tests related to Fixture date ranges
- any migration validation
- any integration tests already present

If the repository has different canonical commands, use those and report them.

Where practical, run UTC-sensitive tests under multiple host `TZ` values.

---

# 19. Acceptance criteria

The task is complete only when all of the following are true:

1. `BUSINESS_TIMEZONE` is no longer part of Goalstery domain/runtime semantics.
2. `Europe/London` is not used for backend match-day classification.
3. Backend "today" and day ranges are defined in UTC.
4. `worker:matches` discovery uses UTC-day semantics.
5. football-data.org `utcDate` values normalize directly to UTC instants.
6. Matches API uses UTC lower-inclusive / upper-exclusive ranges.
7. prediction deadlines remain based on absolute kickoff timestamps.
8. database queries do not rely on London timezone conversion.
9. existing correctly stored absolute timestamps are not shifted during migration.
10. redundant business-date schema fields are removed/redefined only where justified by the audit.
11. indexes remain appropriate for timestamp range queries.
12. outbox/event timestamps remain UTC absolute instants.
13. frontend localization is presentation-only.
14. tests prove backend behavior is independent of host timezone.
15. London/BST/GMT-specific domain tests are removed or converted to UTC regression tests.
16. authoritative docs reflect UTC-only semantics.
17. ADR/decisions record the architectural change and supersede the old London rule.
18. old `worker-matches-london-day-discovery-fix` work is marked superseded/not applicable.
19. all relevant validation commands pass.
20. no unrelated product behavior is changed.

---

# 20. Final report required from Codex

After implementation, report:

## Root cause / previous complexity

Explain where `Europe/London` was embedded and what complexity/bugs it created.

## Code changes

List changed modules/files and their new responsibilities.

## Database changes

Explicitly state:

- whether Prisma schema changed
- whether a migration was added
- whether any columns were removed/renamed/redefined
- whether any existing timestamp values were transformed
- whether any indexes changed

## Runtime/config changes

State exactly what happened to:

```text
BUSINESS_TIMEZONE
```

and any deployment/env implications.

## Behavior before vs after

Provide concrete examples of UTC-day classification.

## Tests

List new/updated tests.

## Documentation

List updated authoritative docs and ADR/decision entry.

## Validation

Provide pass/fail results for all commands run.

## Remaining risks

Call out any intentional consequence, especially:

> A fixture may belong to one UTC backend day while displaying as the next/previous local calendar day for some users.

Do not stop at analysis. Implement the refactor completely.

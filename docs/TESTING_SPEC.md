# TESTING_SPEC.md

# Sports Prediction Tournament — Testing Spec v0.1

**Status:** Mandatory testing contract  
**Project:** Telegram Mini App — Sports Prediction Tournament  
**Stack:** Next.js + React + TypeScript + Prisma + PostgreSQL  
**Primary references:**
- `docs/PRODUCT_SPEC.md`
- `docs/TECH_SPEC.md`
- `docs/DB_SCHEMA.md`

---

## 1. Purpose

Этот документ определяет обязательную стратегию тестирования проекта.

Цель тестирования — не просто проверять UI, а гарантировать корректность:

- gameplay rules;
- scoring;
- daily quota;
- tournament participation;
- immutable snapshots;
- rewarded ads;
- settlement;
- leaderboard aggregates;
- rating calculations;
- prize claiming;
- retry/idempotency behavior;
- concurrent requests;
- business time logic.

Для критичных бизнес-операций correctness важнее количества тестов.

---

# 2. Testing Principles

## 2.1 Business logic first

Основной объём тестов должен проверять:

```text
domain functions
service layer
database invariants
transactions
workers
```

Route Handlers и UI не являются основным местом business logic.

---

## 2.2 No Prisma mocking for critical workflows

Для integration tests:

```text
createPrediction
updatePrediction
settlement
rating-finalization
AdReward consumption
PrizeClaim
```

используется реальный PostgreSQL test database.

Prisma client не мокается для проверки критичных database workflows.

---

## 2.3 Every production bug becomes a regression test

Если найден production bug:

1. сначала создаётся test, который воспроизводит проблему;
2. test должен падать;
3. исправляется код;
4. test должен проходить;
5. regression test остаётся в repository.

---

## 2.4 Deterministic tests

Tests не должны зависеть от:

- реального текущего времени;
- реального API-Football;
- реального Telegram;
- реального Monetag;
- реального TON network.

Внешние systems тестируются через controlled adapters/fakes.

---

## 2.5 Time must be injectable

Business logic не должна напрямую зависеть от:

```ts
new Date()
Date.now()
```

в местах, где время влияет на rules.

Рекомендуется использовать abstraction:

```ts
Clock
```

например:

```ts
interface Clock {
  now(): Date
}
```

Production implementation использует system time.

Tests используют fixed clock.

---

# 3. Test Levels

Используются четыре основных уровня:

```text
1. Unit
2. Integration
3. Concurrency
4. E2E
```

Дополнительно:

```text
API contract tests
Worker tests
Migration tests
Smoke tests
```

---

# 4. Tooling

Recommended tools:

```text
Vitest
Playwright
Prisma
PostgreSQL
Docker
```

Допускается использование дополнительных libraries для test utilities, но основной test runner:

```text
Vitest
```

Frontend E2E:

```text
Playwright
```

---

# 5. Suggested Test Structure

```text
tests/
├── unit/
│   ├── scoring/
│   ├── time/
│   ├── predictions/
│   ├── ratings/
│   └── tournaments/
│
├── integration/
│   ├── auth/
│   ├── predictions/
│   ├── fixtures/
│   ├── settlement/
│   ├── ads/
│   ├── tournaments/
│   ├── ratings/
│   └── prizes/
│
├── concurrency/
│   ├── predictions/
│   ├── ads/
│   ├── settlement/
│   ├── ratings/
│   └── prizes/
│
├── api/
│   ├── bootstrap/
│   ├── predictions/
│   ├── tournaments/
│   ├── ratings/
│   └── prizes/
│
├── e2e/
│   └── app/
│
├── fixtures/
├── factories/
└── helpers/
```

Допускается colocated structure внутри modules, если она остаётся понятной.

---

# 6. Unit Tests

Unit tests проверяют pure/domain logic без реальной DB.

---

## 6.1 Scoring Formula

Обязательно проверить:

```ts
points = clamp(round(6.5 / p), 7, 50)
```

Cases:

```text
p = 0.75 -> ~9
p = 0.65 -> 10
p = 0.55 -> 12
p = 0.45 -> 14
p = 0.35 -> 19
p = 0.30 -> 22
p = 0.25 -> 26
p = 0.20 -> 33 approximately according to Math.round
p = 0.15 -> 43
p <= ~0.13 -> 50 cap
high probability -> minimum 7
```

Также:

```text
p <= 0 invalid
p > 1 invalid
```

---

## 6.2 Odds Normalization

Для raw bookmaker odds:

```text
home
draw
away
```

проверить:

- implied probabilities;
- removal of overround;
- normalized sum ≈ 1;
- Decimal precision;
- invalid odds;
- missing outcome;
- zero/negative odds.

---

## 6.3 Business Time

Canonical timezone:

```text
Europe/London
```

Test cases:

- normal GMT day;
- normal BST day;
- transition GMT -> BST;
- transition BST -> GMT;
- exact midnight;
- second before reset;
- second after reset;
- UTC date differs from London business date.

Functions:

```text
getBusinessDate()
getBusinessDayRangeUtc()
getCurrentTournamentWindow()
```

must be deterministic.

---

## 6.4 Daily Prediction Rules

Test:

```text
0/3 free -> FREE
1/3 free -> FREE
2/3 free -> FREE
3/3 free -> REWARDED_REQUIRED
5 rewarded used -> DAILY_LIMIT
```

Also:

```text
3 free + 5 rewarded = 8 max
unused quota does not carry
new business date resets eligibility
```

---

## 6.5 Fixture Eligibility

Test:

```text
DRAFT -> not selectable
OPEN + now < kickoff -> selectable
OPEN + now == kickoff -> locked
OPEN + now > kickoff -> locked
LOCKED -> not selectable
LIVE -> not selectable
FINISHED -> not selectable
SETTLED -> not selectable
```

---

## 6.6 Prediction Update Rules

Test:

- outcome can change before kickoff;
- edit succeeds immediately before kickoff;
- edit fails exactly at kickoff;
- edit fails after kickoff;
- Fixture status must not reject edit before kickoff unless a separate approved product rule exists;
- slotType remains unchanged;
- daily usage remains unchanged;
- TournamentParticipant.predictionsCount remains unchanged;
- AdReward is not consumed again;
- same OutcomeSnapshot remains;
- probabilityAtPrediction changes to selected outcome value;
- potentialPoints changes to selected outcome value;
- update at kickoff rejected.

---

## 6.7 Rating Formula

At minimum test:

```text
ExpectedPoints
Variance
Z
actualPercentile
expectedPercentile
K factor
ratingDelta
league thresholds
```

Cases:

- exact expected performance;
- strong overperformance;
- strong underperformance;
- minimum 10 predictions;
- fewer than 10 predictions -> no rating update;
- first 5 qualified Cups -> K=120;
- established -> K=80.

---

## 6.8 Rating League Mapping

Test all boundaries:

```text
BRONZE_III
BRONZE_II
BRONZE_I
SILVER_III
SILVER_II
SILVER_I
GOLD_III
GOLD_II
GOLD_I
PLATINUM_III
PLATINUM_II
PLATINUM_I
DIAMOND_III
DIAMOND_II
DIAMOND_I
MASTER
LEGEND
```

Every threshold must have:

```text
value just below
exact threshold
value just above
```

---

# 7. Integration Tests

Integration tests use:

```text
real PostgreSQL
real Prisma client
real migrations
```

External providers remain mocked/faked at adapter boundary.

---

# 8. Test Database

Use a dedicated database:

```text
sports_prediction_test
```

or isolated ephemeral PostgreSQL container.

Never run tests against development or production database.

---

## 8.1 Database reset

Each integration test suite must start from known state.

Accepted strategies:

```text
transaction rollback
schema reset
truncate tables
ephemeral DB/container
```

Chosen method must support parallel test execution safely.

---

# 9. Prediction Integration Tests

Critical scenarios:

---

## 9.1 First Prediction

Given:

```text
active Tournament
OPEN Fixture
valid OutcomeSnapshot
User with 0 DailyPredictionUsage
```

When:

```text
createPrediction()
```

Then:

```text
Prediction created
TournamentParticipant created
freeUsed = 1
predictionsCount = 1
slotType = FREE
```

---

## 9.2 Second/Third Free Prediction

Verify:

```text
freeUsed increments
rewardedUsed unchanged
```

---

## 9.3 Fourth Prediction Without Reward

Expected:

```text
REWARDED_AD_REQUIRED
```

No database mutation.

---

## 9.4 Rewarded Prediction

Given:

```text
freeUsed = 3
valid VERIFIED AdReward
```

When prediction created:

```text
rewardedUsed += 1
AdReward -> CONSUMED
consumedByPredictionId set
slotType = REWARDED
```

---

## 9.5 Daily Limit

Given:

```text
freeUsed = 3
rewardedUsed = 5
```

Further createPrediction rejected.

No DB mutation.

---

## 9.6 Duplicate Fixture Prediction

Attempt second Prediction:

```text
same user
same fixture
```

must fail.

Database unique constraint must protect this even if service validation fails.

---

## 9.7 Change Prediction

Before kickoff:

```text
Prediction count unchanged
DailyPredictionUsage unchanged
TournamentParticipant.predictionsCount unchanged
slotType unchanged
AdReward unchanged
outcomeSnapshotId unchanged
selectedOutcome changed
potentialPoints updated
```

Regression cases:

```text
edit succeeds at kickoffAt - 1 ms
edit fails at kickoffAt
edit fails at kickoffAt + 1 ms
Fixture.status != OPEN does not block edit when now < kickoffAt unless an approved product rule says otherwise
```

---

## 9.8 Locked Prediction

At or after kickoff:

```text
updatePrediction rejected
```

No mutation.

---

# 10. Concurrency Tests

Concurrency tests are mandatory for critical mutations.

These tests should execute real parallel requests/transactions.

---

## 10.1 Simultaneous 8th Prediction

Initial:

```text
freeUsed = 3
rewardedUsed = 4
```

Two valid rewarded attempts run simultaneously.

Expected:

```text
only one Prediction succeeds
rewardedUsed becomes 5
total daily = 8
other request fails
```

Never:

```text
rewardedUsed = 6
9 predictions
```

---

## 10.2 Same AdReward Twice

Two concurrent requests attempt to consume same AdReward.

Expected:

```text
one succeeds
one fails
one Prediction linked to reward
```

---

## 10.3 Duplicate TournamentParticipant Creation

Two first predictions for same User/Tournament arrive concurrently.

Expected:

```text
exactly one TournamentParticipant row
predictionsCount = 2 if both valid predictions succeed
```

---

## 10.4 Concurrent Prediction Change and Kickoff

Test race near exact `kickoffAt`.

Backend transaction/time check must reject any update that is not valid at authoritative evaluation point.

---

# 11. Settlement Tests

---

## 11.1 Correct Prediction

Given:

```text
Prediction selectedOutcome = HOME
Fixture finalOutcome = HOME
potentialPoints = 19
```

After Settlement:

```text
resultStatus = CORRECT
earnedPoints = 19
settledAt set

TournamentParticipant:
tournamentPoints += 19
correctPredictionsCount += 1
```

---

## 11.2 Incorrect Prediction

Expected:

```text
resultStatus = INCORRECT
earnedPoints = 0
correctPredictionsCount unchanged
```

---

## 11.3 Mixed Fixture Settlement

Many users on same Fixture with different outcomes.

Verify each result independently.

---

## 11.4 Settlement Idempotency

Run Settlement twice.

Expected after second run:

```text
no extra points
no extra correct count
same Prediction state
same TournamentParticipant totals
```

---

## 11.5 Concurrent Settlement Workers

Run two settlement processes simultaneously.

Expected:

```text
exactly-once business effect
```

---

## 11.6 Fixture SETTLED State

Fixture becomes `SETTLED` only when internal settlement required for Fixture is complete.

---

# 12. Tournament Tests

Test lifecycle:

```text
SCHEDULED
ACTIVE
FINALIZING
FINISHED
```

---

## 12.1 Activation

At startsAt:

```text
Tournament becomes ACTIVE
```

---

## 12.2 Auto Participation

No explicit registration.

First Prediction creates TournamentParticipant.

---

## 12.3 Finalization

Tournament does not become fully FINISHED until required settlement/finalization rules are satisfied.

---

## 12.4 Duplicate Lifecycle Worker

Run lifecycle worker multiple times.

Expected:

```text
no duplicate Tournament
no duplicate Prize
no duplicate RatingHistory
```

---

# 13. Leaderboard Tests

Verify:

```text
TournamentParticipant.tournamentPoints
```

is source for Weekly Cup ranking.

Test:

- top N;
- user rank neighborhood;
- prize zone;
- pointsToPrizeZone;
- participant with zero/correct values.

Official tie-break tests must be added once Product Spec fixes tie-break rules.

Until then, tests must not encode accidental product tie-break behavior.

---

# 14. Rating Integration Tests

---

## 14.1 Qualification

```text
predictionsCount < 10
```

Expected:

```text
no RatingHistory
RatingProfile unchanged
```

---

## 14.2 Qualified Cup

For >=10 predictions:

```text
RatingHistory created
RatingProfile updated
TournamentParticipant.ratingDelta updated
```

---

## 14.3 Rating Idempotency

Run finalization twice.

Expected:

```text
one RatingHistory
rating applied once
```

---

## 14.4 Concurrent Rating Finalization

Two parallel workers.

Expected:

```text
one rating effect
UNIQUE(userId, tournamentId) protects history
```

---

# 15. Rewarded Ads Tests

External Monetag SDK/network mocked at adapter boundary.

Test states:

```text
CREATED
VERIFIED
CONSUMED
EXPIRED
REJECTED
```

---

## 15.1 Invalid Client Claim

Frontend says reward completed without valid verification.

Expected:

```text
Prediction not unlocked
```

---

## 15.2 Expired Reward

Expired reward rejected.

---

## 15.3 Consumed Reward

Cannot be reused.

---

## 15.4 Reward Ownership

User B cannot use User A AdReward.

---

# 16. Prize Tests

---

## 16.1 Prize Creation

After finalized Tournament:

```text
rank -> amountNanoTon
```

correctly assigned.

Example first tournament:

```text
#1 = 4_000_000_000
#2 = 2_500_000_000
#3 = 1_500_000_000
#4 = 1_000_000_000
#5 = 1_000_000_000
```

---

## 16.2 PrizeClaim

Test valid flow:

```text
UNCLAIMED
-> CLAIM_PENDING
-> PAID
```

---

## 16.3 Invalid Claim

Reject:

- non-owner;
- nonexistent Prize;
- duplicate claim;
- invalid state transition.

---

## 16.4 Concurrent Claim

Two simultaneous claim requests.

Expected:

```text
one PrizeClaim business result
```

---

# 17. Telegram Auth Tests

Telegram validation implementation must have unit/integration coverage.

Test:

- valid initData;
- invalid hash;
- modified user payload;
- expired auth_date if expiry policy exists;
- malformed initData;
- missing initData;
- missing required data;
- wrong bot token;
- large Telegram user ID.

Frontend-provided `userId` must never override authenticated Telegram identity.

---

# 18. API Contract Tests

Route Handlers should have focused API tests.

Check:

```text
HTTP status
JSON response shape
error.code
authentication
validation
idempotency behavior
```

Do not duplicate all service tests through HTTP.

Mandatory v0.1 API regression coverage:

```text
valid Telegram initData creates User
second authenticated request updates Telegram profile fields without duplicate User
invalid Telegram initData returns 401 error envelope
GET /api/bootstrap returns user, active tournament, daily usage, rating summary, serverTime, businessTimezone
GET /api/fixtures/today includes current London day displayable fixtures and excludes tomorrow/inactive/unsupported fixtures
GET /api/predictions/today returns current-day predictions with editable computed by now < kickoffAt
POST /api/predictions uses authenticated User only and requires Idempotency-Key
POST /api/predictions rejects frontend user impersonation
PATCH /api/predictions/:predictionId updates selectedOutcome through application service
PATCH locked prediction returns PREDICTION_LOCKED
```

---

## 18.1 Error Contract

Example:

```json
{
  "error": {
    "code": "DAILY_PREDICTION_LIMIT_REACHED",
    "message": "Daily prediction limit reached",
    "details": {}
  }
}
```

Tests should assert `error.code`, not human wording.

---

# 19. Sports Provider Adapter Tests

API-Football raw responses should be represented by stored fixtures.

Do not call live API during normal CI.

Test adapter converts provider payload into internal DTO.

Cases:

- valid fixture;
- missing odds;
- postponed match;
- cancelled match;
- completed match;
- malformed provider response;
- API error;
- rate-limit response.

---

# 20. Worker Tests

Each Worker must be testable as callable application code.

Do not test only shell/systemd invocation.

Workers:

```text
fixture-sync
odds-sync
result-sync
settlement
tournament-lifecycle
rating-finalization
```

Every worker test should cover:

```text
normal execution
retry
duplicate execution
partial failure
external provider failure where applicable
```

---

# 21. E2E Tests

E2E test suite should remain small and high-value.

Use:

```text
Playwright
```

Telegram environment can be simulated through test bootstrap/mock layer.

---

## 21.1 Core Smoke Flow

Minimum:

```text
open app
bootstrap succeeds
Predict screen visible
today fixtures loaded
select outcome
create free Prediction
Prediction visible in My Picks
open Cup
user participant visible
open Rating
open Profile
```

---

## 21.2 Change Prediction Flow

```text
create Prediction
change selected outcome
UI reflects updated points
```

---

## 21.3 Rewarded UI Flow

Mock rewarded success:

```text
3 free used
select fourth outcome
reward sheet shown
reward completes
Prediction created
```

---

## 21.4 Error Flow

Examples:

```text
Prediction becomes locked while screen open
API returns PREDICTION_LOCKED
UI updates gracefully
```

---

# 22. UI Component Tests

Do not over-test implementation details.

Useful targets:

- points/probability display;
- selected outcome state;
- quota display;
- locked state;
- result status;
- error state;
- countdown rendering.

Avoid tests tied to CSS class names unless necessary.

---

# 23. Test Factories

Create reusable factories:

```text
createTestUser()
createTestTournament()
createTestCompetition()
createTestTeam()
createTestFixture()
createTestOutcomeSnapshot()
createTestPrediction()
createTestAdReward()
```

Factories should have safe defaults and allow overrides.

Example:

```ts
createTestFixture({
  status: 'OPEN',
  kickoffAt: clock.addHours(2),
})
```

---

# 24. External Service Fakes

Create explicit adapters/interfaces for:

```text
SportsProvider
TelegramAuth
AdProvider
TonService
Clock
```

Tests should replace them with deterministic fakes.

This is preferable to scattered module mocking.

---

# 25. Test Data Rules

Never use production credentials.

`.env.test` may contain only test/local credentials.

Never:

```text
TELEGRAM_BOT_TOKEN production
API_FOOTBALL_KEY production
TON private key
production DATABASE_URL
```

in CI test jobs.

---

# 26. CI Pipeline

Minimum CI:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run test:integration
npm run build
```

Recommended separate job:

```bash
npm run test:concurrency
```

E2E:

```bash
npm run test:e2e
```

may be separate CI stage.

---

# 27. Proposed npm Scripts

Recommended:

```json
{
  "scripts": {
    "lint": "...",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:concurrency": "vitest run tests/concurrency",
    "test:api": "vitest run tests/api",
    "test:e2e": "playwright test"
  }
}
```

Exact commands may vary with final repository layout.

---

# 28. Coverage Policy

Do not use global coverage percentage as the primary quality metric.

Critical domain logic should target near-complete branch coverage.

Especially:

```text
scoring
quota
prediction creation/update
settlement
rating
AdReward
PrizeClaim
time boundaries
```

A file with 100% coverage can still have weak tests.

Assertions on business outcomes are more important than percentage.

---

# 29. Mandatory Tests Per Feature

Every implementation that changes product/domain behavior must include tests in the same change.

Examples:

### New Prediction rule

Must include:

```text
unit test
integration test if DB affected
concurrency test if race is possible
```

### New Worker behavior

Must include:

```text
normal execution
retry/idempotency
failure behavior
```

### New API endpoint

Must include:

```text
auth
validation
success response
error response
```

---

# 30. Definition of Done

Feature is not complete when only code works manually.

Feature is complete when:

- implementation matches specs;
- unit tests added where logic exists;
- integration tests added for persistence behavior;
- concurrency test exists where race can corrupt state;
- API contract is tested if endpoint changed;
- tests pass;
- typecheck passes;
- build passes.

---

# 31. Critical Test Matrix

| Area | Unit | Integration | Concurrency | E2E |
|---|---:|---:|---:|---:|
| Scoring | Required | Optional | No | No |
| Business Time | Required | Optional | No | No |
| Prediction Create | Required | Required | Required | Required |
| Prediction Update | Required | Required | Recommended | Required |
| Daily Quota | Required | Required | Required | Indirect |
| AdReward | Required | Required | Required | Required |
| Fixture Eligibility | Required | Required | Recommended | Indirect |
| Settlement | Required | Required | Required | Indirect |
| Tournament Lifecycle | Required | Required | Recommended | Indirect |
| Leaderboard | Required | Required | Recommended later | Required |
| Global Rating | Required | Required | Required | Required |
| PrizeClaim | Required | Required | Required | Recommended |
| Telegram Auth | Required | Required | No | Indirect |

---

# 32. High-Risk Scenarios

The following failures are considered severity critical:

```text
9th Prediction accepted
same AdReward used twice
Prediction changed after kickoff
Prediction settled twice
Tournament points credited twice
Rating applied twice
Prize claimed/paid twice
wrong user acts as another Telegram user
published scoring snapshot changes silently
daily reset uses wrong timezone
```

Each critical risk must have explicit automated coverage before production launch.

---

# 33. Time Boundary Test Set

Mandatory edge cases:

```text
23:59:59 Europe/London
00:00:00 Europe/London

kickoffAt - 1 ms
kickoffAt
kickoffAt + 1 ms

Tournament startsAt - 1 ms
startsAt
endsAt - 1 ms
endsAt
```

DST transitions must have dedicated tests.

---

# 34. Property-Based Testing Candidates

Not mandatory for initial MVP, but useful later:

```text
scoring formula
odds normalization
rating calculations
quota invariants
```

Properties:

```text
points always between 7 and 50
normalized probabilities sum approximately 1
daily usage never exceeds 8
earnedPoints never negative
```

---

# 35. Load/Performance Testing

Not required for first implementation, but before significant acquisition campaign test:

```text
GET /api/fixtures/today
GET leaderboard
POST createPrediction
settlement batch
```

Focus:

- DB indexes;
- lock contention;
- response latency;
- leaderboard query cost.

Do not introduce Redis only because synthetic load test exists; optimize after measurement.

---

# 36. Migration Tests

Before production migration:

```text
apply migrations to clean database
apply migrations to representative existing schema
run Prisma validation
run critical integration suite
```

Destructive migrations require explicit review.

---

# 37. Production Smoke Tests

After deploy, verify without mutating real gameplay where possible:

```text
/api/health
database connectivity
active Tournament exists
fixture sync freshness
worker freshness
frontend opens
Telegram bootstrap works
```

A dedicated operational health script is recommended.

---

# 38. Logging During Tests

Tests should not emit noisy production logs by default.

On failure, useful context may include:

```text
userId
fixtureId
tournamentId
predictionId
transaction attempt
worker execution
```

Never print secrets or full Telegram initData.

---

# 39. Open Testing Decisions

To finalize during implementation:

1. exact Vitest configuration;
2. database reset strategy;
3. CI provider;
4. exact Telegram auth test helper;
5. Monetag adapter verification strategy;
6. whether E2E runs on every PR or only main/release;
7. target browser/device matrix;
8. load test tool, if/when needed.

---

# 40. Acceptance Criteria

Testing system is acceptable when:

- critical business logic is not tested only through UI;
- integration tests use real PostgreSQL;
- critical Prisma workflows are not mocked;
- race conditions have explicit concurrency tests;
- clock/time is controllable in tests;
- external systems use adapters/fakes;
- retries cannot duplicate business effects;
- every critical production bug becomes a regression test;
- CI runs lint, typecheck, tests and build;
- high-risk scenarios from this document have automated coverage before launch.

---

# 41. Required Documents for Codex

Before implementing or changing business behavior, Codex must read:

```text
docs/PRODUCT_SPEC.md
docs/TECH_SPEC.md
docs/DB_SCHEMA.md
docs/TESTING_SPEC.md
```

When implementing a feature, Codex should update or add tests required by this document in the same change.

Do not silently weaken tests to make an implementation pass.

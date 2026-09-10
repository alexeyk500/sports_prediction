# Goalstery --- Testing Specification

**Testing Spec v0.1**

---

**Status** Mandatory testing contract
**Stack** Next.js + React + TypeScript + Prisma + PostgreSQL
**Product authority** `docs/PRODUCT_SPEC.md`
**Technical authority** `docs/TECH_SPEC.md`
**Database authority** `docs/DB_SCHEMA.md`

---

Этот документ определяет обязательную testing strategy и минимальную
automated coverage для correctness-critical behavior.

Он не должен повторно определять product rules, database schema или
frontend architecture. Tests проверяют authoritative behavior из
соответствующих specs.

---

# 1. Testing Principles

## 1.1 Test behavior at the correct layer

Primary coverage targets:

```text
pure/domain functions
application services
database invariants
transactions
concurrency
workers
HTTP contracts
critical browser flows
```

Не переносить business-rule coverage в UI только потому, что правило
видно пользователю.

## 1.2 Real PostgreSQL for persistence correctness

Critical persistence workflows test against:

```text
real PostgreSQL
real Prisma client
real migrations
```

Do not mock Prisma when verifying:

```text
create/update Prediction
quota
AdReward consumption
settlement
rating finalization
PrizeClaim
database constraints
transaction behavior
concurrency
```

## 1.3 Determinism

Normal automated tests must not depend on:

```text
wall-clock time
live API-Football
live Telegram
live Monetag
live TON network
production credentials
```

External systems use deterministic adapters/fakes/fixtures.

Time-sensitive business logic uses the approved controllable `Clock`.

## 1.4 Regression rule

For a reproducible production bug:

```text
reproduce with failing automated test
→ fix
→ keep regression test
```

Do not weaken tests merely to make implementation pass.

## 1.5 Correctness over coverage percentage

Global coverage percentage is not the primary quality metric.

For critical domain logic, aim for strong branch/boundary coverage and
assert business outcomes/invariants.

---

# 2. Test Levels

Use the smallest level that proves the behavior.

```text
Unit
Integration
Concurrency
API contract
Worker
Browser/E2E
Migration/operational smoke where relevant
```

Guidance:

Concern Primary level

---

Pure formula / mapping / presentation transform Unit
Persistence / transaction / DB constraint Integration
Race condition / duplicate business effect Concurrency
Auth/status/DTO/error envelope API
Retryable background operation Worker + integration
Critical user flow / layout behavior Browser/E2E
Migration compatibility Migration validation

Do not duplicate every service scenario through every higher layer.

---

# 3. Tooling and Test Environment

Baseline:

```text
Vitest
Playwright
Prisma
PostgreSQL
Docker where useful
```

Main unit/integration runner:

```text
Vitest
```

Browser/E2E:

```text
Playwright
```

Use a dedicated test database, currently:

```text
sports_prediction_test
```

or an isolated ephemeral PostgreSQL instance.

Never run automated tests against development or production databases.

Database reset must produce a known state and remain safe for parallel
execution. The exact reset mechanism is implementation/tooling
configuration, not a product decision.

---

# 4. Test Utilities

Prefer reusable deterministic factories/helpers such as:

```text
createTestUser()
createTestTournament()
createTestCompetition()
createTestTeam()
createTestFixture()
createTestOutcomeSnapshot()
createTestPrediction()
createTestAdReward()
FixedClock
```

External boundaries should use project-owned fakes/adapters rather than
scattered module mocking:

```text
SportsProvider
TelegramAuth boundary
AdProvider
TonService
Clock
```

Stored provider fixtures may represent API-Football responses. Normal CI
must not require live provider network access.

---

# 5. Scoring and Probability Tests

Test the currently authoritative scoring behavior from
`PRODUCT_SPEC.md`.

Current scoring formula coverage must include:

```text
normal probabilities
minimum-points boundary
maximum-points cap
rounding boundaries
invalid p <= 0
invalid p > 1
```

If current probability generation uses bookmaker-odds normalization,
test:

```text
implied probabilities
overround removal
normalized total within approved tolerance
Decimal precision
missing/zero/negative invalid inputs
```

Do not encode a future Goalstery mathematical model before that model is
approved.

When the model changes, replace/add tests only as part of the approved
synchronized model/spec migration.

---

# 6. Business Time Tests

Canonical timezone behavior must be deterministic.

Mandatory coverage:

```text
normal GMT date
normal BST date
GMT → BST transition
BST → GMT transition
London midnight boundary
UTC date differing from London business date
```

Critical exact boundaries:

```text
23:59:59 London
00:00:00 London

kickoffAt - 1 ms
kickoffAt
kickoffAt + 1 ms

Tournament startsAt - 1 ms
startsAt
endsAt - 1 ms
endsAt
```

Relevant business-time helpers and workflows must use a controllable
Clock rather than real wall-clock time.

---

# 7. Prediction and Daily Quota Tests

Coverage must prove the authoritative create/update rules without
restating them as a competing spec.

## 7.1 Unit/domain

At minimum test:

```text
FREE eligibility before configured free quota exhausted
REWARDED requirement after configured free quota
daily hard limit derived from centralized quota constants
new business date reset
Fixture eligibility for new Prediction
kickoff boundary
pre-kickoff editability
```

## 7.2 Integration --- createPrediction

Use real PostgreSQL to prove:

```text
first valid Prediction creates/uses TournamentParticipant correctly
free quota increments correctly
rewarded Prediction consumes valid AdReward exactly once
daily hard limit rejects with no partial mutation
duplicate User+Fixture is DB-protected
invalid/locked/ineligible Fixture creates no business effect
idempotent retry returns one business effect
conflicting idempotency reuse is rejected
```

## 7.3 Integration --- updatePrediction

Before kickoff, prove:

```text
selectedOutcome updates
probabilityAtPrediction/potentialPoints come from SAME OutcomeSnapshot
outcomeSnapshotId unchanged
slotType unchanged
DailyPredictionUsage unchanged
TournamentParticipant.predictionsCount unchanged
AdReward unchanged
```

Boundary regression:

```text
kickoffAt - 1 ms → allowed
kickoffAt        → PREDICTION_LOCKED
kickoffAt + 1 ms → PREDICTION_LOCKED
```

`Fixture.status != OPEN` must not prematurely block an otherwise valid
pre-kickoff edit unless a later approved product rule explicitly changes
this.

---

# 8. Prediction Concurrency Tests

Real concurrent database operations are mandatory where simultaneous
requests could corrupt quota/idempotency/reward state.

Required scenarios:

## 8.1 Last daily slot

Starting with exactly one remaining valid daily slot, two simultaneous
creates must result in:

```text
one success
one rejection
final usage at limit
no extra Prediction
```

## 8.2 Same AdReward

Two concurrent attempts to consume one reward:

```text
one business success
one rejection/idempotent equivalent as contract requires
one consumedByPredictionId
```

## 8.3 First participation race

Two valid first Predictions for the same User/Tournament concurrently:

```text
exactly one TournamentParticipant
both Predictions may succeed if otherwise valid
aggregate count reflects successful Predictions exactly once
```

## 8.4 Idempotency race

Simultaneous requests using the same new idempotency key must prove:

```text
same payload → one business effect / stable result
conflicting payload → no second business effect / conflict
```

Concurrency tests should exercise the real locking/unique-constraint
strategy, not a mocked approximation.

---

# 9. Settlement Tests

Use real PostgreSQL.

Correct Prediction must result in:

```text
CORRECT
earnedPoints = potentialPoints
settledAt set
TournamentParticipant points incremented once
correctPredictionsCount incremented once
```

Incorrect Prediction:

```text
INCORRECT
earnedPoints = 0
no correct-count increment
```

Also test:

```text
multiple users/outcomes on one Fixture
retrying Settlement
duplicate worker execution
concurrent Settlement workers
Fixture reaches SETTLED only after required internal settlement completes
```

Critical invariant:

```text
at-least-once execution
→ exactly-once business effect
```

---

# 10. Tournament and Leaderboard Tests

Tournament lifecycle coverage:

```text
scheduled activation
automatic participation through first Prediction
transition to finalization
finish only after required settlement/finalization
duplicate lifecycle execution
no duplicate Tournament/Prize/RatingHistory effects
```

Leaderboard coverage:

```text
ranking from maintained TournamentParticipant aggregates
top-N query
user neighborhood
prize-zone calculations
zero/edge aggregate values
```

Do not encode an official tie-breaker until it is explicitly approved.

A deterministic technical fallback order may be tested only as technical
determinism, not as an official product tie-break rule.

---

# 11. Rating Tests

Test the currently authoritative Rating formulas/rules from
`PRODUCT_SPEC.md`.

Pure/domain coverage should include:

```text
ExpectedPoints
Variance
Z
actualPercentile
expectedPercentile
K factor
ratingDelta
qualification threshold
```

Integration coverage:

```text
unqualified Cup → no RatingHistory / no rating effect
qualified Cup → RatingProfile updated + RatingHistory created
retry → rating applied once
parallel finalization → one rating effect
UNIQUE(userId, tournamentId) protects history
```

Exact `expectedPercentile` model/calibration is intentionally deferred.
Tests must not invent an expectation formula before it is approved.
Existing placeholder/implemented behavior may only receive regression
coverage that does not falsely promote it to authoritative product policy.

## 11.1 League thresholds

The current repository contains a known documentation-status issue
around whether exact League thresholds are final Accepted values or
provisional pending model calibration.

Until that is resolved:

```text
do not invent new thresholds
do not silently recalibrate them
do not add tests that falsely imply unresolved calibration is final product policy
```

Existing implementation thresholds may retain regression coverage so
behavior does not drift accidentally.

When the mathematical model/calibration decision is made, update
Product/Decisions/implementation/tests together.

---

# 12. Rewarded Ad Tests

Monetag/external ad behavior is tested at the adapter boundary without
live network dependency.

State coverage:

```text
CREATED
VERIFIED
CONSUMED
EXPIRED
REJECTED
```

Required business cases:

```text
unverified client claim cannot unlock Prediction
expired reward rejected
consumed reward cannot be reused
User cannot consume another User's reward
valid rewarded Prediction consumes reward atomically
concurrent consumption creates one business effect
```

Do not fake a stronger provider verification guarantee than the approved
Monetag integration actually provides.

---

# 13. Prize Tests

PrizeEntitlement creation must verify final placement/User/amount mapping only
against existing per-Cup `PrizeDistributionTier` rows.

PrizeClaim integration coverage:

```text
valid state flow
ownership
nonexistent Prize
duplicate claim
invalid transition
one PrizeClaim per PrizeEntitlement
concurrent claim
retry/idempotency
```

Manual payout state may be tested without connecting to TRON or any blockchain
API.

Never use real payout credentials in automated tests.

---

# 14. Telegram Authentication and User Settings

Telegram validation coverage:

```text
valid initData
invalid hash
tampered user payload
expired auth_date
malformed initData
missing initData
wrong bot token
large telegramUserId
```

Development initData tooling must validate against the production
validator and refuse unsafe production usage where designed.

Client-supplied user identity must never override authenticated Telegram
identity.

User/settings coverage:

```text
initial locale from supported Telegram language_code
unsupported language fallback
manual locale not overwritten by later Telegram sync
GET /api/settings
partial PATCH /api/settings
unsupported locale rejection
unsupported appearance rejection
bootstrap returns settings
```

---

# 15. API Contract Tests

Route Handler/API tests are focused on transport/auth/contract behavior,
not a duplicate of every service test.

For changed/implemented endpoints cover as relevant:

```text
authentication
runtime input validation
HTTP status
response DTO shape
stable error.code
idempotency header behavior
authorization/ownership
```

Current core regression coverage includes:

```text
valid Telegram auth creates/resolves User
subsequent sync does not duplicate User
invalid auth → 401 envelope

GET /api/bootstrap
GET /api/fixtures/today
GET /api/predictions/today
POST /api/predictions
PATCH /api/predictions/:predictionId
GET /api/settings
PATCH /api/settings
```

Prediction API coverage must prove authenticated identity is
authoritative and client impersonation cannot select another User.

For expected failures assert stable:

```text
error.code
```

Do not couple tests to human-readable/localized error wording unless the
localization layer itself is under test.

When `API_CONTRACTS.md` exists, endpoint-specific mandatory cases should
be synchronized with it rather than duplicated extensively here.

---

# 16. Sports Provider and Asset Tests

Sports Provider adapter tests use stored provider fixtures/fakes.

Cover relevant mapping behavior:

```text
valid Fixture
completed Fixture
provider/API error
rate limit response
malformed response
provider status mapping
```

Postponed/cancelled/rescheduled business behavior must not be invented
before the corresponding Open Decision is resolved.

Football asset manifest validation must cover:

```text
unique provider IDs
unique canonical slugs
lowercase ASCII kebab-case slugs
non-empty provider/canonical names
explicit unmapped handling
expected local asset existence when validating downloaded assets
```

Unit/CI tests must not require live API-Football access.

Canonical slug stability must not depend on provider display-name
cosmetic changes.

---

# 17. Worker Tests

Workers are tested as callable application code, not only shell/systemd
commands.

For each relevant worker responsibility cover:

```text
normal execution
retry
duplicate execution
partial failure
external provider failure where applicable
idempotent business effect
```

Current logical responsibilities include:

```text
fixture/sports ingestion
result-sync
settlement
tournament-lifecycle
rating-finalization
```

Do not require tests for an obsolete `odds-sync` worker name merely
because an older spec listed it. Current probability/snapshot ingestion
responsibilities must follow the active Technical/Product specs.

---

# 18. Frontend Unit Tests

Frontend unit tests should target meaningful pure behavior rather than
JSX/CSS implementation details.

Useful targets:

```text
DTO → presentation transforms
HOME/DRAW/AWAY → 1/X/2 mapping
points → trophy-value presentation data
quota/status presentation logic
localized API error mapping
translation fallback/interpolation
locale-aware formatting
direction resolution
theme resolution
asset URL resolution/fallback logic
```

Avoid brittle assertions on:

```text
CSS class names
exact DOM nesting
pixel geometry
implementation-only component decomposition
```

unless those details are themselves the contract.

Frontend architecture/testing boundaries are also governed by
`FRONTEND_ARCHITECTURE.md`.

---

# 19. Localization, RTL and Theme Tests

Supported locales:

```text
en
ru
de
es
ar
```

Dictionary tests must verify:

```text
known translation keys
complete dictionary contract
fallback behavior
dynamic interpolation
locale-aware number/date/time formatting
known API error mapping
unknown API error fallback
```

Direction:

```text
ar → RTL
others → LTR
```

Theme:

```text
system
light
dark
```

Browser sanity should verify representative supported locale/theme
combinations where practical, with dedicated RTL coverage.

Do not multiply the entire E2E suite across every locale × theme unless
there is demonstrated value.

---

# 20. Browser / E2E Tests

Keep E2E small and high-value.

Core smoke flow should cover implemented navigation/features without
pretending unfinished screens are complete.

For Matches, representative browser flow:

```text
open app
bootstrap
seeded Fixtures visible
create Free Prediction
Prediction visible in My Picks
edit before kickoff
locked/error behavior handled
```

Rewarded Monetag integration:

```text
free quota exhausted
select additional outcome
controlled rewarded-required UI appears
authenticated reward session creation requires eligibility
ymid is opaque and server-generated
session creation itself grants nothing
Monetag SDK boundary uses configured main zone, same ymid and requestVar
preload uses timeout=5
direct show does not use preload timeout
frontend Promise success alone grants nothing
authenticated confirm after successful SDK Promise creates exactly one VERIFIED AdReward
missing auth, wrong owner, expired or invalid sessions do not create grants
duplicate confirm is idempotent
public Monetag postback is not a reward authority
verified AdReward is consumed atomically with one rewarded Prediction
after consumption the same AdReward cannot unlock another Prediction
```

Mocked external-provider responses are allowed only at adapter
boundaries. Do not mock internal quota/prediction transaction behavior.

Browser layout sanity for current UI should verify:

```text
no horizontal overflow
no unintended page-level scroll
fixture list remains intended vertical scroll region
bottom navigation remains visible
safe-area behavior where applicable
Arabic root lang/dir
mixed-direction team names remain usable
dark semantic palette applies
```

Visual geometry/fidelity is verified through browser
rendering/screenshot comparison when a component has an approved visual
reference.

Do not replace visual review with brittle unit assertions for exact CSS
pixels.

---

# 21. MatchCard Visual Regression

When implementing/changing MatchCard against the approved reference:

```text
docs/design/predict-card-v2-spec.md
docs/design/predict-card-v2-reference.png
```

verify at least:

```text
390×844 reference sanity
360 width sanity
430 width sanity
light theme
dark theme
long team names
selected state
locked state
logo contrast/fallback
RTL behavior
no horizontal overflow
```

Use screenshot/browser comparison for visual fidelity.

Functional tests should separately verify semantic
mapping/accessibility; screenshot tests are not a substitute for
behavior tests.

---

# 22. Migration Validation

For schema migrations:

```text
apply migrations to clean test database
validate Prisma schema/client
run relevant integration suite
```

For destructive or data-transforming migrations also validate against
representative pre-migration data/schema state.

Manually maintained SQL constraints/indexes must be checked when
relevant.

Migration tests should prove preservation of required invariants, not
merely that SQL executes.

---

# 23. CI and Required Checks

Baseline checks for a normal code change:

```text
lint
typecheck
relevant unit tests
relevant integration tests
build
```

Additionally:

```text
concurrency suite → when concurrency-sensitive behavior changes
API tests         → when API contract changes
browser/E2E       → when critical user flow/UI changes
asset validation  → when football asset mapping/tooling changes
migration checks  → when schema/migrations change
```

Exact npm script names may follow repository configuration; this spec
does not require duplicate aliases solely for documentation aesthetics.

Do not run expensive unrelated suites when the task clearly cannot
affect them unless repository policy/CI requires it.

---

# 24. Mandatory Coverage by Change Type

Change Required coverage

---

Pure business formula/rule Unit
Persistence behavior Integration with real PostgreSQL
Race-sensitive mutation Concurrency
API endpoint/DTO/error behavior Focused API contract
Worker behavior Normal + retry/idempotency + failure
Prisma migration Migration validation + affected integration
Frontend pure transform/state rule Unit where meaningful
Critical user flow Browser/E2E
Approved visual reference implementation Browser screenshot/sanity
Production bug Regression test at lowest effective layer

A single change may require multiple rows.

---

# 25. Critical Risk Coverage

Before production launch, automated coverage must explicitly protect
against:

```text
daily Prediction limit exceeded
same AdReward consumed twice
Prediction edited at/after kickoff
duplicate Prediction business effect
duplicate settlement
Tournament Points credited twice
rating applied twice
PrizeClaim business effect duplicated
wrong Telegram User acting as another User
published scoring evidence silently mutated
London daily reset calculated incorrectly
idempotency key race creating duplicate mutation
```

When a new severity-critical invariant is introduced, add it here or to
the appropriate authoritative testing section rather than relying on
incidental coverage.

---

# 26. Test Data and Secrets

Never use production credentials in automated tests.

Test/CI environments must not contain production:

```text
TELEGRAM_BOT_TOKEN
API_FOOTBALL_KEY
TON private key
DATABASE_URL
other provider secrets
```

unless a deliberately isolated operational test explicitly requires a
non-production credential.

Never print secrets or full Telegram initData in test output.

Factories/fixtures should use deterministic safe defaults and explicit
overrides.

---

# 27. Performance and Load Testing

Load testing is not required for ordinary MVP feature development.

Before meaningful acquisition/load, measure representative paths such
as:

```text
today Fixtures
Leaderboard
createPrediction
Settlement batches
```

Focus on:

```text
query cost
indexes
lock contention
latency
worker throughput
```

Do not introduce Redis/distributed infrastructure merely because a
synthetic test can create load.

Scaling changes require measured need and the relevant architecture
decision.

---

# 28. Production Smoke Testing

Post-deploy smoke checks should verify current implemented operational
surfaces, for example:

```text
application reachable
database connectivity
Telegram bootstrap/auth
active Tournament availability
sports-data freshness
worker freshness
frontend opens
```

Do not require a specific `/api/health` endpoint unless that endpoint is
actually part of the implemented/approved operational contract.

Prefer non-mutating checks against production gameplay state.

---

# 29. Open Testing Decisions

Authoritative significant Open Decisions belong in:

```text
docs/DECISIONS.md
```

Do not maintain a second authoritative decision register here.

Testing/tooling details may remain implementation choices unless they
materially affect architecture/product behavior, for example:

```text
Vitest configuration
database reset implementation
CI provider
Telegram test helper implementation
E2E cadence
browser/device matrix
future load-test tool
```

Provider/model-dependent tests must wait for the corresponding
product/integration decisions rather than silently defining them through
tests.

---

# 30. Testing Definition of Done

A change is testing-complete when all relevant statements are true:

```text
tests verify authoritative behavior rather than inventing it
pure logic has meaningful unit coverage
persistence-critical behavior uses real PostgreSQL
race-sensitive behavior has real concurrency coverage
API contract changes have focused transport/auth/error tests
worker changes cover retry/idempotency/failure
time-sensitive behavior uses controllable Clock
external systems use deterministic boundaries
visual-reference work has actual browser/screenshot verification
production bug fixes retain regression tests
required checks pass
tests were not weakened to accommodate incorrect implementation
```

---

# 31. Spec Maintenance

This document owns:

```text
testing levels
mandatory coverage
critical risk scenarios
test-environment principles
concurrency testing requirements
browser/E2E testing policy
migration validation policy
testing Definition of Done
```

It does not own:

```text
product behavior             → PRODUCT_SPEC.md
backend/runtime architecture → TECH_SPEC.md
database schema              → DB_SCHEMA.md
frontend architecture        → FRONTEND_ARCHITECTURE.md
endpoint DTO details         → API_CONTRACTS.md when present
visual contract              → DESIGN_SYSTEM/component specs
accepted/open decisions      → DECISIONS.md
```

Agents should read this document when the requested change affects
behavior requiring tests. They do not need to load this entire document
for unrelated documentation-only or purely operational tasks.

If tests, implementation, specs or an Accepted Decision appear
inconsistent, do not silently rewrite tests to choose a winner. Follow
the conflict/change policy in `AGENTS.md`.

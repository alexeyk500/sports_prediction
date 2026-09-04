# AGENTS.md

# Sports Prediction Tournament — Agent Instructions

Этот файл обязателен для любого AI coding agent, работающего с repository.

Цель: не допускать случайного расхождения implementation с product, architecture, database и testing contracts.

---

## 1. Read Before Changing Code

Перед любыми изменениями product/domain behavior обязательно прочитать:

```text
docs/PRODUCT_SPEC.md
docs/TECH_SPEC.md
docs/DB_SCHEMA.md
docs/TESTING_SPEC.md
```

Также проверить:

```text
prisma/schema.prisma
```

Если задача касается базы данных.

Не делать предположений о product rules, если они уже описаны в этих документах.

---

## 2. Source of Truth Priority

При конфликте документов использовать порядок:

```text
1. docs/PRODUCT_SPEC.md
2. docs/TECH_SPEC.md
3. docs/DB_SCHEMA.md
4. docs/TESTING_SPEC.md
5. prisma/schema.prisma
6. implementation code
```

Если implementation расходится со spec, исправлять implementation.

Если требуется изменить product behavior, сначала обновить соответствующий spec, затем код.

---

## 3. Project Stack

Current stack:

```text
Next.js
React
TypeScript
App Router
Prisma 7
PostgreSQL
Zustand
CSS Modules
Vitest
Playwright
npm
```

Backend расположен внутри Next.js application.

Primary transport:

```text
/api/*
```

через Route Handlers.

Server Actions не использовать как основной transport layer.

---

## 4. Architecture Rules

Domain structure:

```text
src/
├── app/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tournaments/
│   ├── fixtures/
│   ├── predictions/
│   ├── ratings/
│   ├── prizes/
│   └── ads/
├── lib/
│   ├── prisma/
│   ├── telegram/
│   ├── sports-api/
│   ├── time/
│   ├── logger/
│   └── errors/
├── stores/
├── hooks/
├── components/
└── workers/
```

Route Handlers должны быть thin.

Route Handler responsibilities:

```text
authenticate
parse input
validate input
call service/domain function
map result to HTTP response
```

Не помещать в Route Handlers:

```text
scoring logic
quota logic
settlement logic
rating logic
prize logic
complex database transactions
```

---

## 5. Shared Domain Code

HTTP backend и Workers должны использовать общий service/domain layer.

Не заставлять Worker вызывать собственный backend через HTTP, если тот же application code можно вызвать напрямую.

---

## 6. Time Rules

Canonical business timezone:

```text
Europe/London
```

Использовать IANA timezone.

Не использовать fixed offset:

```text
UTC+0
UTC+1
GMT offset constants
```

для business calendar logic.

Все database timestamps хранятся как UTC/timezone-aware timestamps.

Business timezone определяет:

```text
Weekly Cup boundaries
daily prediction reset
current calendar day
Daily Match Pool
```

---

## 7. Money Rules

TON нельзя хранить как Float.

Canonical database representation:

```text
nanoTON
BigInt
```

Conversion:

```text
1 TON = 1_000_000_000 nanoTON
```

Example:

```text
1.5 TON = 1_500_000_000 nanoTON
```

UI formatting выполняется только на presentation layer.

---

## 8. Decimal Rules

Odds и probabilities не хранить как JavaScript floating point source of truth.

Use:

```text
Prisma.Decimal
PostgreSQL NUMERIC / DECIMAL
```

Scoring calculation должен работать с controlled numeric conversion и сохранять immutable result values.

---

## 9. Prediction Rules

Current MVP:

```text
3 free predictions per London business day
5 rewarded predictions per London business day
8 total max
```

No carry-over.

One User may have max one Prediction per Fixture.

Prediction can be changed before kickoff.

Prediction cannot be created or changed when:

```text
now >= fixture.kickoffAt
```

Changing Prediction:

```text
does not consume another slot
does not change slotType
does not increment DailyPredictionUsage
does not increment predictionsCount
```

---

## 10. Tournament Participation

No explicit registration.

First valid Prediction in active Tournament automatically creates:

```text
TournamentParticipant
```

A user may join a Weekly Cup mid-week.

No late-entry compensation.

---

## 11. Daily Match Pool

Do not create a separate DailyMatchPool table.

Daily pool is derived from Fixture data.

A Fixture is eligible for a new prediction only when it matches product rules and:

```text
Fixture.status = OPEN
now < kickoffAt
```

---

## 12. OutcomeSnapshot Rules

Published OutcomeSnapshot is immutable.

One published snapshot contains all 1X2 outcomes:

```text
HOME
DRAW
AWAY
```

with:

```text
raw odds
normalized probabilities
points
snapshotAt
scoringVersion
```

Do not mutate published snapshot on odds refresh.

Prediction must retain:

```text
outcomeSnapshotId
probabilityAtPrediction
potentialPoints
```

---

## 13. Scoring

Current formula:

```ts
points = Math.round(
  Math.min(50, Math.max(7, 6.5 / probability))
)
```

Where probability is normalized decimal probability in range:

```text
0 < probability <= 1
```

Incorrect prediction:

```text
0 points
```

No negative points.

No streak multiplier in Weekly Cup score.

---

## 14. Leaderboard

Do not calculate leaderboard by summing all Prediction rows on every request.

Use TournamentParticipant aggregates:

```text
tournamentPoints
predictionsCount
correctPredictionsCount
```

Current rank is derived.

Final rank may be stored after Tournament finalization.

Do not store live global rank as authoritative state.

---

## 15. Global Rating

Minimum qualified Cup:

```text
10 predictions
```

Do not invent or simplify formula.

Follow `PRODUCT_SPEC.md`.

RatingProfile stores current state.

RatingHistory is immutable and must be unique by:

```text
(userId, tournamentId)
```

Rating finalization must be idempotent.

---

## 16. Prize Rules

Prize and PrizeClaim are separate entities.

Prize:

```text
reward assigned to Tournament rank/User
```

PrizeClaim:

```text
claim and payout state
```

TON wallet is required only when claiming a prize.

Do not introduce:

```text
participant stake
entry fee
buying predictions
point-to-money conversion
random lottery
```

without explicit product-spec change.

---

## 17. Database Rules

Internal primary keys:

```text
UUID
```

External IDs remain separate:

```text
telegramUserId
providerFixtureId
providerTeamId
providerCompetitionId
```

Historical gameplay data must not be cascade-deleted.

Prefer:

```text
onDelete: Restrict
```

for historical relations.

User deletion must use anonymization/soft-delete strategy.

---

## 18. Database Transactions

Critical mutations must be transactional.

### createPrediction()

Must atomically cover:

```text
active Tournament validation
Fixture validation
kickoff validation
DailyPredictionUsage
quota enforcement
AdReward validation/consumption
TournamentParticipant creation
Prediction creation
usage increment
participant count increment
commit
```

### Settlement

Must apply points exactly once.

### Rating Finalization

Must update RatingProfile and create RatingHistory exactly once.

### Prize Claim

Must prevent duplicate business effect.

---

## 19. Idempotency

Mandatory for:

```text
prediction creation
rewarded ad completion
settlement
prize claim
Tournament finalization
rating finalization
```

Workers must be safe under:

```text
retries
duplicate execution
process restart
partial failure
```

Do not assume a Worker runs only once.

---

## 20. Workers

Logical workers:

```text
fixture-sync
odds-sync
result-sync
settlement
tournament-lifecycle
rating-finalization
```

Keep responsibilities separated even if multiple workers later share a process.

External API fetch logic belongs in provider adapter.

---

## 21. Sports Provider

Current provider:

```text
API-Football / API-Sports
```

Never call sports provider directly from frontend.

Never fetch provider data per end-user request when backend persistence/cache is the intended architecture.

Provider response shape must not leak deeply into domain code.

Use adapter DTOs.

---

## 22. Telegram Authentication

Telegram Mini App `initData` must be validated server-side.

Never trust frontend-supplied:

```text
telegramUserId
userId
username
```

as authentication authority.

Authenticated user identity comes from validated Telegram data.

---

## 23. Ads

Current provider:

```text
Monetag
```

Rewarded ad entitlement must be server controlled.

Do not trust a client-only "ad completed" flag.

AdReward must be:

```text
verified
owned by user
unexpired
used once
```

---

## 24. Testing Rules

Read:

```text
docs/TESTING_SPEC.md
```

Every product/domain change must include corresponding tests in the same change.

Critical Prisma workflows must use real PostgreSQL integration tests.

Do not mock Prisma for critical workflows.

Concurrency tests are mandatory when race conditions could corrupt state.

---

## 25. Regression Rule

For every discovered production bug:

```text
1. write failing regression test
2. fix implementation
3. verify test passes
4. keep regression test
```

Do not only patch the symptom.

---

## 26. Time Testing

Do not make business tests depend on real system time.

Use controllable Clock abstraction.

Mandatory boundary testing includes:

```text
kickoffAt - 1 ms
kickoffAt
kickoffAt + 1 ms

23:59:59 Europe/London
00:00:00 Europe/London

GMT/BST transitions
```

---

## 27. UI Rules

Frontend:

```text
React
TypeScript
CSS Modules
Zustand
```

Avoid adding UI/state libraries unless there is a concrete need.

Do not introduce TanStack Query without explicit architecture decision.

Data fetching should follow project custom fetch layer.

Do not put business rules only in client-side code.

Server remains authoritative.

---

## 28. TypeScript Rules

Prefer:

```text
strict typing
domain-specific types
explicit return types for public service functions
discriminated unions where useful
```

Avoid:

```text
any
unsafe casts
duplicated enum-like strings
```

Do not silently convert:

```text
BigInt -> Number
Decimal -> Number
```

when precision can matter.

---

## 29. Error Handling

Use unified API error contract.

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

Clients should branch on:

```text
error.code
```

not on human-readable message.

Do not invent ad-hoc error response shapes.

---

## 30. Logging

Logs should include useful identifiers where appropriate:

```text
userId
fixtureId
predictionId
tournamentId
worker name
operation
```

Never log:

```text
Telegram bot token
full Telegram initData
database password
TON private keys
provider secrets
```

---

## 31. Environment Variables

Secrets and environment-specific values must not be hardcoded.

Use environment configuration.

Never commit production secrets.

---

## 32. Prisma Rules

Current Prisma version:

```text
Prisma 7.x
```

Connection URL belongs in:

```text
prisma.config.ts
```

not inside `schema.prisma`.

`schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
}
```

Schema changes must use Prisma migrations.

Do not use `db push` as the normal production migration strategy.

---

## 33. Database CHECK Constraints

Some invariants from `DB_SCHEMA.md` cannot be fully represented in Prisma schema.

Do not remove manually added SQL CHECK constraints during future migrations.

Examples:

```text
freeUsed <= 3
rewardedUsed <= 5
freeUsed + rewardedUsed <= 8
potentialPoints BETWEEN 7 AND 50
startsAt < endsAt
amountNanoTon > 0
```

When changing related fields, inspect migration SQL carefully.

---

## 34. External Dependency Policy

Do not add a dependency when a small internal implementation is sufficient.

Before adding a package, evaluate:

```text
maintenance
bundle/runtime impact
security
license
actual need
```

Do not introduce Redis in v0.1 unless a measured requirement appears and architecture spec is updated.

---

## 35. Performance Rules

Avoid obvious N+1 queries.

Leaderboard must use indexed aggregate table.

Workers should batch provider/database work where appropriate.

Do not prematurely optimize with infrastructure that is not needed.

Measure before adding caching layers.

---

## 36. Open Product Decisions

Do not silently invent behavior for unresolved areas.

Current examples include:

```text
exact Weekly Cup boundary weekday/time
leaderboard tie-break rules
postponed/cancelled/rescheduled match policy
exact odds bookmaker/source
rating calibration details
season support
notification policy
exact Monetag verification mechanics
exact TON payout operations
```

If implementation reaches one of these unresolved decisions, stop that specific behavior from being guessed and surface the dependency.

---

## 37. Definition of Done

A feature is complete only when:

```text
implementation matches specs
types pass
lint passes
tests required by TESTING_SPEC exist
tests pass
build passes
database migration exists if schema changed
no unresolved product rule was invented
```

---

## 38. Before Finalizing Any Change

Agent should self-check:

```text
Did I read relevant specs?
Did I move business logic out of Route Handler/UI?
Did I preserve transactionality?
Did I preserve idempotency?
Did I consider concurrency?
Did I use Europe/London correctly?
Did I avoid Float for TON/odds/probabilities?
Did I preserve historical data?
Did I add required tests?
Did I introduce a new product decision without updating specs?
```

If answer to any relevant item is "yes, there is a problem", fix it before finalizing.

---

---

## 39. Documentation Must Stay in Sync

Specifications are living project documentation and must remain synchronized with the implementation.

When development introduces or requires an **approved** change to any of the following:

```text
product behavior
architecture
API contracts
database schema
testing strategy
infrastructure
integrations
security model
worker behavior
operational behavior
development conventions
```

the agent must update the corresponding specification/documentation in the **same change**.

Documentation mapping:

### `docs/PRODUCT_SPEC.md`

Update when changing:

```text
user-facing behavior
gameplay rules
prediction rules
Tournament rules
scoring rules
Global Rating rules
prize rules
product flows
```

### `docs/TECH_SPEC.md`

Update when changing:

```text
architecture
modules
services
API contracts
workers
integrations
authentication
security
infrastructure
deployment
logging
operational behavior
```

### `docs/DB_SCHEMA.md`

Update when changing:

```text
entities
fields
relations
enums
constraints
indexes
persistence rules
transaction-related database invariants
delete/retention policy
```

### `prisma/schema.prisma`

Must remain synchronized with:

```text
docs/DB_SCHEMA.md
```

A database change is incomplete if only one of them is updated when both are affected.

### `docs/TESTING_SPEC.md`

Update when changing:

```text
testing strategy
mandatory test scenarios
test infrastructure
CI test requirements
concurrency requirements
regression policy
```

### `AGENTS.md`

Update when changing:

```text
technology stack
development conventions
architecture rules
agent responsibilities
quality requirements
repository-wide engineering practices
```

Do not leave an accepted project decision documented only in:

```text
implementation code
comments
commit messages
chat context
```

If an approved change affects multiple specifications, update **all affected documents**.

Documentation synchronization is part of the Definition of Done.

The agent must not modify specifications merely to make an incorrect implementation appear compliant.

If implementation reveals that an already-approved product or architecture rule should change:

```text
1. identify the conflict or limitation;
2. explain why a change is needed;
3. propose the change;
4. obtain user approval when the change affects an approved product/architecture decision;
5. update affected specifications;
6. implement the approved change;
7. update/add tests.
```

For routine implementation details that do not change an approved contract, no user approval is required.

---

## 40. Engineering Quality, Best Practices and Patterns

The agent must use current, production-grade best practices appropriate to the project's stack and requirements.

Do not intentionally choose a weaker implementation merely because it is shorter or faster to generate.

Prefer code that is:

```text
correct
simple
readable
maintainable
testable
type-safe
secure
observable
transactionally safe
idempotent where required
easy to evolve
```

Use established software design patterns when they solve an actual problem.

Do not apply patterns mechanically or introduce abstraction without a concrete benefit.

Prefer:

```text
simple solution first
clear module boundaries
explicit domain concepts
composition over unnecessary inheritance
dependency inversion at external-system boundaries
small focused functions
cohesive services
single source of truth
explicit state transitions
immutable values where appropriate
transactional consistency
```

Avoid:

```text
god objects/services
business logic duplicated across layers
deep unnecessary abstraction
premature generalization
premature optimization
hidden side effects
magic values
unsafe type casts
catch-all utility modules
circular dependencies
N+1 database queries
unbounded queries
client-authoritative business rules
```

---

## 41. SOLID and Separation of Concerns

Apply SOLID principles pragmatically, not dogmatically.

Especially preserve:

### Single Responsibility

Modules/services/functions should have a clear reason to change.

Example:

```text
SportsProvider adapter fetches/maps provider data.
Scoring domain calculates scoring.
Prediction service manages prediction workflow.
Route Handler manages HTTP concerns.
```

Do not merge these responsibilities merely to reduce file count.

### Dependency Inversion

Domain/application logic should depend on abstractions at external boundaries where this improves testability.

Examples:

```text
SportsProvider
AdProvider
TelegramAuth
TonService
Clock
```

Provider-specific SDK/API details should remain behind adapters.

### Interface Segregation

Prefer small purpose-specific interfaces over broad service interfaces.

---

## 42. Domain-Driven Boundaries

Use domain-oriented modules already defined by the architecture:

```text
auth
users
tournaments
fixtures
predictions
ratings
prizes
ads
```

Business rules belong as close as practical to the domain that owns them.

Do not create generic folders such as:

```text
helpers/
utils/
services/
```

as dumping grounds for unrelated logic.

Shared utilities are acceptable only when genuinely cross-domain.

---

## 43. Service and Repository Boundaries

Do not add Repository pattern mechanically on top of Prisma for every model.

Prisma is already the data-access abstraction.

Introduce a dedicated repository/domain persistence abstraction only when it provides concrete value, for example:

```text
complex reusable persistence behavior
testable domain boundary
provider-independent persistence contract
specialized query abstraction
```

Avoid wrappers that merely rename Prisma methods.

Service layer should coordinate business workflows and transaction boundaries.

---

## 44. External Integrations Use Adapter Pattern

External systems must be isolated behind explicit adapters.

Current examples:

```text
API-Football / API-Sports
Telegram
Monetag
TON
Clock/time source
```

Application/domain code should consume internal types/DTOs rather than raw third-party payloads.

This reduces vendor lock-in and makes tests deterministic.

---

## 45. State Machines and Explicit Transitions

For stateful entities, prefer explicit allowed transitions rather than arbitrary status assignment.

Examples:

```text
TournamentStatus
FixtureStatus
AdRewardStatus
PrizeClaimStatus
PredictionResultStatus
```

Invalid transitions must be rejected.

Do not scatter status transition rules across unrelated files.

When transition complexity grows, centralize it in domain logic.

---

## 46. Database Best Practices

Use the database to enforce invariants that the database can reliably enforce.

Prefer:

```text
PRIMARY KEY
FOREIGN KEY
UNIQUE
CHECK
NOT NULL
transactions
appropriate indexes
```

Application validation complements database constraints; it does not replace them.

Do not rely solely on:

```text
"we checked it before insert"
```

for concurrency-sensitive invariants.

Design database operations with concurrent execution in mind.

---

## 47. Security by Default

Treat all client input and external provider data as untrusted.

Apply:

```text
server-side validation
authentication
authorization
input normalization
least privilege
secret isolation
safe error handling
rate limiting where appropriate
```

Never expose secrets to the browser.

Never trust client-calculated:

```text
points
quota
rating
prize
ad reward
user identity
fixture eligibility
```

Server/database remain authoritative.

---

## 48. Avoid Premature Infrastructure

Use the simplest architecture that satisfies current requirements and preserves reasonable evolution paths.

Do not introduce infrastructure such as:

```text
Redis
Kafka
RabbitMQ
microservices
Kubernetes
event sourcing
CQRS
```

without a concrete measured requirement and approved architecture change.

A modular monolith is the intended starting architecture.

---

## 49. Refactoring Responsibility

When implementing a feature, the agent may perform small local refactors needed to keep the code clean.

Do not perform unrelated large-scale refactors without a clear reason.

If existing code makes the requested feature unsafe or excessively complex:

```text
identify the technical problem
perform the smallest appropriate refactor
preserve behavior with tests
then implement the feature
```

Do not knowingly add significant technical debt just to avoid touching existing code.

---

## 50. Comments and Documentation in Code

Prefer self-explanatory code.

Comments should explain:

```text
why
business invariant
non-obvious concurrency reasoning
external provider limitation
important workaround
```

Comments should not merely restate what the code does.

Do not leave obsolete comments after refactoring.

---

## 51. Naming

Use domain terminology consistently with the specifications.

Examples:

```text
Tournament
TournamentParticipant
Fixture
OutcomeSnapshot
Prediction
DailyPredictionUsage
AdReward
RatingProfile
RatingHistory
Prize
PrizeClaim
```

Do not create alternate names for the same concept without a strong reason.

Names should reveal intent.

Avoid unexplained abbreviations.

---

## 52. Error Design

Expected business failures should be represented explicitly and predictably.

Prefer typed/domain errors with stable error codes.

Do not use generic:

```text
throw new Error("something went wrong")
```

for known business conditions.

Unexpected failures should preserve enough context for server-side diagnostics without leaking sensitive information to clients.

---

## 53. Code Duplication

Do not duplicate business rules.

Examples that must have one authoritative implementation:

```text
scoring formula
business-date calculation
quota rules
fixture eligibility
rating league mapping
PrizeClaim transitions
```

Frontend may display derived information, but backend/domain remains source of truth.

---

## 54. Dependency Selection

Before adding a dependency:

```text
confirm it solves a real problem
check maintenance/activity
check compatibility with current stack
check security implications
check license
consider whether a small internal implementation is simpler
```

Prefer established, actively maintained packages.

Do not add packages for trivial functionality.

---

## 55. Performance Awareness

Use appropriate database indexes and bounded queries.

Paginate potentially large collections.

Avoid:

```text
SELECT everything
N+1 query patterns
recalculating historical aggregates on every request
unbounded provider polling
unnecessary client/server round trips
```

Optimize based on expected access patterns and measurement.

Correctness remains the first priority.

---

## 56. Maintainability Over Cleverness

Prefer boring, explicit, understandable code over clever code.

A future developer or coding agent should be able to understand the intent without reconstructing hidden assumptions.

When two solutions are equally correct, prefer the one with:

```text
fewer moving parts
clearer invariants
better tests
lower coupling
simpler failure modes
```

---

## 57. Updated Definition of Done

A feature/change is complete only when all relevant items are satisfied:

```text
implementation matches approved specifications
affected documentation is synchronized
architecture boundaries are preserved
appropriate best practices/patterns are used
database invariants are preserved
security implications are considered
transactionality/idempotency/concurrency are handled where relevant
types pass
lint passes
required tests exist
tests pass
build passes
migration exists if schema changed
no unresolved product decision was silently invented
```

Documentation is part of the implementation, not optional follow-up work.

---

## 58. Before Finalizing Any Change

Agent must self-check:

```text
Did I read the relevant specs?
Did this change alter an approved contract?
If yes, did I update every affected specification?
Did I use an appropriate established pattern?
Did I add unnecessary abstraction?
Did I preserve domain/module boundaries?
Did I keep business logic out of UI and Route Handlers?
Did I preserve database invariants?
Did I consider concurrent execution?
Did I preserve idempotency where required?
Did I use Europe/London correctly?
Did I avoid unsafe Float/Number conversions?
Did I validate untrusted input?
Did I avoid leaking secrets?
Did I add the tests required by TESTING_SPEC?
Did I leave technical debt that should reasonably be fixed now?
```

Resolve relevant problems before finalizing.

---

## 59. Core Principle

The repository is specification-driven and quality-driven.

Code, database, tests and documentation must evolve together.

The goal is not merely to make a feature work.

The goal is to produce a correct, maintainable, testable and production-grade implementation that remains consistent with:

```text
PRODUCT_SPEC
TECH_SPEC
DB_SCHEMA
TESTING_SPEC
AGENTS
```

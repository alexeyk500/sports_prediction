# Goalstery --- Technical Specification

**Technical Spec v0.1**

---

**Status** Working technical baseline
**Platform** Telegram Mini App
**Product authority** `docs/PRODUCT_SPEC.md`
**Decision register** `docs/DECISIONS.md`

---

Этот документ определяет backend architecture, integration boundaries,
runtime, workers, security и operational rules. Product behavior,
database field-level structure, frontend architecture, testing strategy
и visual rules принадлежат соответствующим специализированным specs.

---

# 1. Technical Boundaries

Goalstery v0.1 --- modular monolith:

```text
Telegram Mini App
      │
      ▼
     Nginx
      │
      ▼
Next.js App Router
      │
      ├── Route Handlers /api/*
      │
      ▼
Application / Domain Services
      │
      ├────────────► external adapters
      │
      ▼
    Prisma
      │
      ▼
PostgreSQL

Separate Node.js Workers
      │
      └── reuse Application / Domain Services
```

Core stack:

```text
Next.js
React
TypeScript
App Router
PostgreSQL
Prisma
Node.js Workers
Nginx
systemd
npm
```

Frontend implementation details are governed by:

```text
docs/FRONTEND_ARCHITECTURE.md
```

Database structure is governed by:

```text
docs/DB_SCHEMA.md
prisma/schema.prisma
```

Testing requirements are governed by:

```text
docs/TESTING_SPEC.md
```

Accepted/Open project decisions are governed by:

```text
docs/DECISIONS.md
```

Do not duplicate those documents here unless a technical boundary must
be stated to make this spec coherent.

---

# 2. Runtime and Deployment Architecture

Backend is part of the same Next.js project.

Primary frontend/backend transport:

```text
/api/*
```

using Next.js Route Handlers.

Server Actions may be used only for appropriate internal server-driven
scenarios. They are not the primary API transport and must not own
unique business logic.

Production baseline:

```text
VPS
Nginx reverse proxy / HTTPS termination
Next.js Node.js service via systemd
PostgreSQL in Docker
separate Node.js Worker services via systemd
systemd timers or equivalent scheduler
```

v0.1 does not require:

```text
Redis
message broker
microservices
Kubernetes
PM2
GraphQL
WebSocket infrastructure
```

Such infrastructure requires a concrete need and approved architecture
decision.

PostgreSQL must use persistent storage, private/local exposure where
practical, health checks and backups.

Production schema changes use Prisma Migrations, not destructive schema
push.

---

# 3. Application Architecture

Route Handlers are thin:

```text
authenticate
parse/validate input
call application/domain service
map result/error to HTTP
```

Do not place in Route Handlers:

```text
scoring formulas
quota logic
settlement logic
rating calculation
tournament finalization
complex persistence workflows
```

Business logic belongs in reusable application/domain modules.

Workers and HTTP handlers call the same application/domain code. Workers
must not call the application's own HTTP API when the same operation can
be invoked directly.

Do not add a mechanical Repository layer over Prisma. Persistence
abstractions are justified only where they provide a real boundary or
solve a concrete problem.

Provider-specific payloads must not leak into domain modules.

---

# 4. External Adapter Boundaries

External systems are isolated behind project-owned adapters.

Current integration boundaries:

```text
Telegram
Sports Provider
Rewarded Ads
TON
Clock
```

Provider-specific API structures are translated into internal DTO/domain
structures before entering core business logic.

Changing an external provider should not require rewriting Prediction,
Tournament, Rating or Prize domain rules.

Secrets remain server-side.

---

# 5. Authentication

Telegram Mini App authentication uses:

```text
Telegram initData
```

Authenticated v0.1 API requests send raw initData in:

```text
X-Telegram-Init-Data
```

Backend performs official server-side validation including:

```text
hash verification
auth_date validation
expiration check
Telegram user extraction
internal User resolution
```

Default maximum age:

```text
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
```

`TELEGRAM_BOT_TOKEN` is server-only.

Never trust separately supplied client identity fields such as:

```text
userId
telegramUserId
username
client auth state
```

At first valid authenticated request:

```text
validated Telegram user
→ find User by telegramUserId
→ create if absent
→ return internal user context
```

Telegram profile metadata may be synchronized later. Manual Goalstery
settings must not be overwritten by subsequent Telegram metadata sync.

Supported persisted user settings are defined in database/frontend
specs.

## 5.1 Session note

The earlier Technical Spec described a possible future server-controlled
session/token optimization.

Current implemented/authenticated HTTP contract uses validated
`X-Telegram-Init-Data`.

Introducing a different session mechanism changes the auth contract and
must not be done as an opportunistic optimization. It requires explicit
architecture approval and synchronized contract updates.

---

# 6. Time Model

Persistent timestamps are timezone-aware and represent UTC instants.

Canonical business timezone:

```text
Europe/London
```

Use IANA timezone semantics; never emulate London with a fixed UTC
offset.

Business-day logic must use one shared time boundary implementation for:

```text
current business date
business-day UTC range
Daily Prediction quota
Daily Match Pool
Tournament time rules where applicable
```

Frontend/device local time is not authoritative.

Time-sensitive business logic uses the approved `Clock` abstraction so
tests can control time deterministically.

Exact product time rules remain in `PRODUCT_SPEC.md`.

---

# 7. Tournament Technical Model

Core lifecycle:

```text
SCHEDULED
→ ACTIVE
→ FINALIZING
→ FINISHED
```

`FINALIZING` separates closed gameplay from completion of
settlement/rating/prize finalization.

Tournament lifecycle operations must be idempotent.

The lifecycle worker is responsible for orchestration such as:

```text
ensure/create next Tournament
activate scheduled Tournament
transition previous Tournament to FINALIZING
wait for required settlement
run finalization
run rating finalization
create Prize records according to the approved Prize Distribution, once that distribution is defined
finish Tournament
```

Exact Weekly Cup boundaries are not defined by this section; they remain
subject to the relevant product/Open Decision.

`TournamentParticipant` is created automatically by the successful
Prediction workflow, not through a separate user join action.

Leaderboard uses maintained TournamentParticipant aggregates rather than
recomputing all Prediction sums on every request.

Official sports tie-break behavior must not be invented by database
ordering.

---

# 8. Fixture and Daily Match Pool

Fixture product lifecycle:

```text
DRAFT
OPEN
LOCKED
LIVE
FINISHED
SETTLED
```

Provider-specific statuses may be stored/mapped separately; product
status remains provider-agnostic.

Daily Match Pool is a derived query, not a dedicated persistence entity.

Its product eligibility rules are defined by `PRODUCT_SPEC.md`;
persistence/query details belong to `DB_SCHEMA.md`.

For new Prediction, server-side eligibility includes the current
authoritative Fixture/snapshot/day rules.

Existing Prediction editability follows the product kickoff rule and
must not be prematurely blocked by `Fixture.status`.

Policy for postponed/cancelled/abandoned/rescheduled Fixture remains
unresolved until explicitly decided.

---

# 9. Outcome Probability and Scoring Snapshot Boundary

`OutcomeSnapshot` is immutable after publication.

A Fixture points to its published scoring snapshot through the database
model defined in `DB_SCHEMA.md`.

Prediction preserves the scoring evidence/snapshot under which it was
created. Editing selected outcome does not silently migrate it to a
newer snapshot.

Scoring formula and product semantics belong to `PRODUCT_SPEC.md`.

Numeric persistence/rounding rules belong to `DB_SCHEMA.md`.

Scoring/probability calculations should be implemented as deterministic,
testable domain functions.

## 9.1 Probability-model transition guardrail

The current implemented/scoring baseline is based on the presently
approved scoring specification and persisted OutcomeSnapshot semantics.

Goalstery has also accepted the architectural direction that external
football providers are data sources rather than authoritative prediction
engines, and that Goalstery will own its probability-generation model.

The exact mathematical model has not yet been designed.

Therefore:

```text
do not replace current scoring/probability behavior yet
do not adopt provider prediction products as authority
do not silently redesign OutcomeSnapshot
```

When the mathematical model is designed, reconcile `PRODUCT_SPEC.md`,
`TECH_SPEC.md`, `DB_SCHEMA.md`, `TESTING_SPEC.md` and `DECISIONS.md`
explicitly before implementation.

---

# 10. Prediction Transaction

`createPrediction()` is a correctness-critical PostgreSQL transaction.

The operation must atomically enforce all current authoritative rules
required to:

```text
resolve authenticated User
resolve Active Tournament
lock/read eligible Fixture
enforce current Daily Match Pool eligibility
resolve published scoring snapshot
resolve London business date
enforce DailyPredictionUsage quota
validate/consume Rewarded entitlement when required
create TournamentParticipant if absent
create Prediction
update usage/participant aggregates
record idempotent business result
```

Failure of any required invariant rolls back the operation.

Concurrency must prevent:

```text
Prediction beyond daily quota
duplicate Prediction for User + Fixture
double AdReward consumption
duplicate participant/business effects
duplicate idempotent mutation effects
```

Exact database constraints/locks belong in `DB_SCHEMA.md` and
implementation/tests.

`updatePrediction()` is also server-authoritative and transactional.

Its product invariant is:

```text
now < fixture.kickoffAt  → permitted
now >= fixture.kickoffAt → PREDICTION_LOCKED
```

It must preserve the original slot/snapshot/quota/reward semantics
defined by `PRODUCT_SPEC.md`.

---

# 11. Rewarded Ads

Rewarded Ads are behind an adapter/integration boundary.

Current intended provider:

```text
Monetag
```

High-level flow:

```text
intended Prediction
→ server-created reward attempt
→ provider flow
→ authenticated server confirmation after successful SDK flow
→ verified AdReward
→ one-time Prediction consumption
```

Monetag Rewarded Interstitial uses a server-created `AdReward` session
with provider `MONETAG`, placement `MATCHES_EXTRA_PREDICTION`, opaque
server-generated `ymid`, and requestVar `matches_extra_prediction`.
The frontend receives only client-safe SDK invocation data and must use
the configured main SDK zone. The reward flow is launched from the
specific MatchCard after the user selects the intended fixture/outcome.

Durable reward authority is the authenticated Goalstery confirmation
endpoint called after a successful Monetag SDK Promise:

```text
POST /api/ad-rewards/monetag/sessions/:id/confirm
```

The confirm endpoint determines ownership from Telegram authentication
and loads the reward session by internal ID. It validates ownership, TTL,
provider, placement and lifecycle state. It does not trust client
supplied `ymid`, zone ID, requestVar, Telegram ID, reward status or
amount as proof. Repeated confirm of an already `VERIFIED` session is
idempotent; consumed, expired, rejected or wrong-owner sessions return
controlled 4xx domain responses.

This MVP intentionally trusts the successful client-side Monetag SDK
flow followed by authenticated Goalstery confirmation. This is weaker
than independent server-to-server proof and is an accepted MVP trade-off.

The integration minimizes forgery/replay using:

```text
server-created attempt
unique attempt ID
expiration
one-time consumption
replay protection
telemetry/anomaly detection
```

Environment configuration:

```text
MONETAG_REWARDED_INTERSTITIAL_ZONE_ID
```

Development and production use the same application/backend flow with
separate real Monetag main SDK zones. Runtime development reward
bypasses are not allowed.

---

# 12. Sports Data Integration

Sports provider code is isolated behind the Sports Provider adapter.

Current provider/discovery source:

```text
API-Football / API-Sports
```

Core domain code must not depend on raw provider responses.

High-level ingestion responsibilities may include:

```text
Fixture ingestion/sync
historical football data ingestion
result/status ingestion
data required by the future Goalstery probability model
```

Provider predictions are not Goalstery's authoritative probability
model.

Provider request budgeting, endpoint selection and polling cadence are
operational concerns and may evolve without changing product rules,
provided correctness and approved provider/model boundaries remain
intact.

## 12.1 Canonical football assets

Football presentation identity is Goalstery-owned and
provider-independent:

```text
Competition.slug
Team.slug
```

Runtime local assets:

```text
/assets/competitions/<Competition.slug>.webp
/assets/teams/<Team.slug>.webp
```

Canonical mapping:

```text
data/football-assets.manifest.json
```

Provider IDs/names are mapping/discovery data, not canonical Goalstery
identity and not runtime asset filenames.

Frontend must not derive canonical asset identity from:

```text
provider ID
provider logo URL
runtime slugify(displayName)
```

Provider-hosted logo URLs may exist in tooling/report data as download
sources but must not become runtime frontend dependencies.

Unknown provider entities must be surfaced as unmapped/reviewable rather
than silently assigned canonical identity.

Operational discovery/download reports are non-authoritative for
existing canonical slugs.

Detailed asset tooling belongs in scripts/tooling documentation rather
than this Technical Spec.

---

# 13. Result Ingestion and Settlement

Separate external data ingestion from internal business settlement.

Conceptually:

```text
result-sync
→ provider result/status ingestion

settlement
→ Goalstery Prediction consequences
```

Settlement for a finished eligible Fixture determines final outcome,
settles previously unsettled Prediction, updates participant aggregates
and marks settlement state according to authoritative product/database
rules.

Settlement must be safe under retries and duplicate worker execution.

Required business property:

```text
at-least-once execution
→ exactly-once business effect
```

Large settlement work may be chunked if necessary, but chunking must
preserve correctness and idempotency.

---

# 14. Global Rating Finalization

Rating formulas and qualification rules belong to `PRODUCT_SPEC.md`.

Technical finalization runs only after the Tournament has reached the
required settlement state.

Conceptual operation:

```text
select qualified participants
calculate approved rating inputs/results
update RatingProfile
create immutable RatingHistory
```

For a given:

```text
(userId, tournamentId)
```

rating finalization must not apply twice.

The exact future mathematical probability/rating calibration work must
not be inferred or implemented before its relevant decisions/spec
changes are approved.

---

# 15. Prizes and USDT/TRC-20

MVP Prize flow uses application-level `PrizeEntitlement` / `PrizeClaim` state.

Wallet is not required before a claimable Prize exists.

Prize state transitions and money persistence are governed by
product/database specs.

Current MVP payout execution is manual USDT on TRON (TRC-20).

The operator verifies the submitted public TRC-20 address, performs the USDT
transfer manually, records mandatory `paidAt` and optional transaction hash,
and marks the claim `PAID`.

Final settlement creates `PrizeEntitlement` records idempotently from the final
leaderboard and existing per-Cup `PrizeDistributionTier` rows only.

Critical Prize/Claim state transitions go through controlled
application/service operations and must be auditable/idempotent.

Do not introduce automatic smart-contract payout architecture without an
approved change.

---

# 16. Idempotency

Critical operations must be safe under retries.

At minimum this applies where relevant to:

```text
Prediction creation
Rewarded reward completion
Settlement
Prize claim
Tournament finalization
Rating finalization
```

Client-created critical POST operations use stable idempotency keys
where defined by the API contract.

Current Prediction creation contract uses:

```text
Idempotency-Key
```

scoped by user + operation.

Same key + same operation/payload returns the same business result.

Conflicting reuse returns the stable idempotency conflict error.

Workers must assume scheduler/process delivery is at-least-once.

---

# 17. Worker Model

Logical responsibilities:

```text
fixture-sync / sports ingestion
result-sync
settlement
tournament-lifecycle
rating-finalization
```

Additional model/data ingestion workers may be introduced when the
Goalstery mathematical model is explicitly designed.

Logical responsibilities do not require one OS process per task. Several
tasks may share a command/process when responsibility, retry and
scheduling remain clear.

Worker operations must tolerate:

```text
retry
process restart
duplicate timer invocation
temporary provider/network failure
```

Exact polling intervals are configuration/operations, not architectural
product rules.

---

# 18. HTTP API Contract

Base prefix:

```text
/api
```

JSON is the standard payload format.

Current implemented authenticated vertical slice:

```http
GET   /api/bootstrap
GET   /api/fixtures/today
GET   /api/predictions/today
POST  /api/predictions
PATCH /api/predictions/:predictionId
GET   /api/settings
PATCH /api/settings
```

Additional feature endpoints are introduced when their feature contracts
are implemented; this Technical Spec should not pretend unimplemented
endpoint sketches are stable contracts.

Authenticated endpoints use the approved Telegram auth contract unless
explicitly superseded.

Frontend-supplied business-authoritative values such as these must not
be trusted:

```text
user identity
points
probability
slot type
tournament id
business date
snapshot id
```

A dedicated `API_CONTRACTS.md` may become the detailed endpoint/DTO
authority; when it exists, endpoint-level schemas should move there
rather than grow this file.

---

# 19. API Errors

Expected failures use one stable machine-readable envelope:

```json
{
  "error": {
    "code": "PREDICTION_LOCKED",
    "message": "Prediction is locked",
    "details": {}
  }
}
```

Clients branch on:

```text
error.code
```

not localized/human-readable `message`.

Current HTTP policy:

```text
200 success
201 created
400 malformed/validation/non-conflict rejection
401 missing/invalid/expired auth
404 missing resource
409 duplicate/idempotency conflict
423 locked
429 quota/reward-required limit response
500 unexpected server error
```

Unexpected errors must not expose stack traces, Prisma/database
internals or secrets.

Stable domain/API error codes should be reused rather than inventing
route-specific variants.

Detailed endpoint error matrices belong in the future API contract
document.

---

# 20. Input Validation and Security

All external input is runtime-validated on the server.

TypeScript types alone are not runtime validation.

Use the project's established validation approach consistently; do not
introduce another validation framework without need.

Mandatory security boundaries:

```text
server-side Telegram auth
HTTPS in production
server-only secrets
private PostgreSQL exposure
runtime input validation
idempotency for critical mutations
database transactions for quota/points/money-critical workflows
auditability for Prize/Claim
```

Frontend countdowns, local quota state and client-generated values are
never security/correctness controls.

Rate limiting may reduce abuse but must not be used as a correctness
invariant.

Without Redis, low-risk single-instance read limiting may be in-process;
critical mutation correctness remains database/application enforced.

Do not add a production auth bypass.

---

# 21. Observability and Operations

Use structured logging.

Include relevant identifiers where available:

```text
requestId
userId
tournamentId
fixtureId
predictionId
workerName
operation
errorCode
```

Never log full Telegram initData or secrets.

Worker operational logs should make it possible to determine:

```text
start/end
duration
items processed/updated
provider requests
errors
```

MVP operational log store may be systemd journal.

Health/diagnostic capability should cover at least application/database
health and enough worker/provider freshness information to diagnose
ingestion failures.

Exact health endpoint shape is implementation-level unless exposed as a
stable external contract.

---

# 22. Database Operations

PostgreSQL runs in Docker for the current deployment model.

Required operational properties:

```text
persistent volume
non-default strong credentials
non-public exposure where practical
automatic restart
healthcheck
backups
```

Backups begin in MVP:

```text
regular pg_dump or equivalent
multiple retained generations
storage outside the sole database volume
periodic restore verification
production backup before risky schema migration
```

Prisma migration policy:

```text
development → prisma migrate dev
production  → prisma migrate deploy
```

Field-level schema, constraints and indexes belong in `DB_SCHEMA.md`.

---

# 23. Environment Configuration

Configuration is environment-driven.

Representative groups:

```text
App
Database
Telegram
Sports Provider
Rewarded Ads
TON
Business Time
```

Current examples include:

```text
NODE_ENV
APP_URL
DATABASE_URL

TELEGRAM_BOT_TOKEN
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS

API_FOOTBALL_KEY
API_FOOTBALL_BASE_URL

BUSINESS_TIMEZONE=Europe/London
```

Development-only public Telegram initData configuration may exist
according to the frontend/dev tooling contract.

Secrets are never committed to git or copied into public browser
environment variables.

---

# 24. Development Tooling

Development may use deterministic local seed data and signed development
Telegram initData.

These tools must:

```text
refuse unsafe production use where applicable
not call production external providers unless explicitly intended
not create real TON payout state
remain deterministic/re-runnable where designed
```

Exact commands and step-by-step local workflow belong in development
documentation/scripts rather than this Technical Spec.

---

# 25. Performance and Scaling

v0.1 intentionally optimizes for a simple single-VPS architecture:

```text
1 Next.js application
1 PostgreSQL
multiple Worker processes
Nginx
no Redis
no message broker
```

Scale only from measured need.

Potential future split boundaries include:

```text
Sports ingestion
Settlement
Leaderboard
Rating finalization
Ad verification
Prize payout
```

Core domain/application logic must remain sufficiently decoupled from
React/Route Handlers/provider payloads to permit future separation
without rewriting business rules.

Do not pre-build distributed-system infrastructure for hypothetical
scale.

---

# 26. Open Technical Decisions

Authoritative tracked Open Decisions belong in:

```text
docs/DECISIONS.md
```

Do not maintain a second authoritative list here.

Technical areas that may still require explicit resolution before
affected implementation include, depending on current Decision register:

```text
exact Weekly Cup boundary
fixture disruption policy
future Goalstery probability model and required data sources
probability/snapshot publication policy after model design
Monetag verification contract
rating calibration / expected-percentile details
future non-USDT Prize Distribution by winning rank
notification architecture
future payout operating procedure beyond manual USDT/TRC-20
```

If implementation depends on an unresolved decision, follow `AGENTS.md`:
stop and ask rather than silently choose.

---

# 27. Explicit Non-Goals v0.1

Without an approved architecture/product change, do not introduce:

```text
Redis
Kafka / RabbitMQ
microservices
Kubernetes
GraphQL
WebSocket infrastructure
separate auth provider
email/password accounts
automatic smart-contract payouts
complex admin panel
live/in-play Prediction
```

---

# 28. Technical Acceptance

The v0.1 technical architecture is compliant when:

```text
frontend is not authoritative for auth/quota/kickoff/scoring/prize state
critical Prediction mutations are atomic
Rewarded entitlement cannot be consumed twice
Settlement is retry-safe
Rating finalization is retry-safe
published scoring evidence remains immutable
business time uses Europe/London correctly
Leaderboard relies on maintained aggregates
Workers reuse application/domain logic without self-HTTP
external sports provider is adapter-isolated
API uses stable typed errors
PostgreSQL has migrations/backups
Accepted decisions are respected
Open Decisions are not silently resolved
```

---

# 29. Technical Spec Maintenance

This document owns:

```text
backend architecture
runtime/deployment architecture
application/domain boundaries
worker responsibilities
external integration boundaries
security architecture
idempotency architecture
operational principles
scaling boundaries
```

It does not own:

```text
product rules               → PRODUCT_SPEC.md
database field definitions  → DB_SCHEMA.md / schema.prisma
frontend architecture       → FRONTEND_ARCHITECTURE.md
visual system               → DESIGN_SYSTEM.md / component specs
test matrix                 → TESTING_SPEC.md
accepted/open decisions     → DECISIONS.md
```

Do not grow this file by copying those documents into it.

If an Accepted decision conflicts with this Technical Spec, follow the
conflict/change policy in `AGENTS.md`; do not silently rewrite either
source.

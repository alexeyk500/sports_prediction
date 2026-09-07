# Goalstery --- Database Schema

**Database Schema v0.1**

---

**Status** Working database contract
**Database** PostgreSQL
**ORM** Prisma
**Product authority** `docs/PRODUCT_SPEC.md`
**Technical authority** `docs/TECH_SPEC.md`
**Physical schema** `prisma/schema.prisma`

---

Этот документ определяет persistence model: entities, field semantics,
relations, constraints, indexes, historical integrity и
transaction-relevant database invariants.

Он не должен дублировать product flows, HTTP contracts, frontend
architecture, worker scheduling или test matrices.

---

# 1. Database Conventions

## 1.1 Internal identity

Внутренние entity IDs:

```text
UUID
```

Prisma convention:

```prisma
id String @id @default(uuid()) @db.Uuid
```

External identities хранятся отдельно:

```text
telegramUserId
providerFixtureId
providerCompetitionId
providerTeamId
```

Provider IDs не являются Goalstery internal primary keys.

## 1.2 Time

Persistent instants:

```text
PostgreSQL TIMESTAMPTZ
Prisma DateTime @db.Timestamptz(6)
```

Business timezone:

```text
Europe/London
```

`businessDate` --- London calendar date stored as PostgreSQL `DATE`.

Application/Clock layer owns conversion between London business time and
UTC instants.

## 1.3 TON money

TON amounts are never binary floating point.

Canonical persistence:

```text
nanoTON
BIGINT
Prisma BigInt

1 TON = 1_000_000_000 nanoTON
```

## 1.4 Decimal values

Probability/scoring/rating decimal evidence uses PostgreSQL `NUMERIC`.

Current baseline:

```text
rawOdds               NUMERIC(12,6)
probability           NUMERIC(10,8)
ratingPerformanceZ    NUMERIC(12,8)
percentile            NUMERIC(10,8)
```

Application code uses safe decimal arithmetic (`Prisma.Decimal` or
equivalent approved representation).

## 1.5 Historical integrity

Historical gameplay entities are not physically deleted during normal
business operations.

Default referential policy for historical relations:

```text
ON DELETE RESTRICT
```

Avoid cascade deletion for:

```text
Tournament
TournamentParticipant
Fixture
OutcomeSnapshot
Prediction
RatingHistory
Prize
PrizeClaim
```

User deletion/anonymization policy remains a separate legal/product
concern.

## 1.6 JSON policy

Use `JSONB` only for low-stability provider/operational metadata.

Core gameplay state must remain typed relational fields.

---

# 2. Enums

```text
TournamentStatus
  SCHEDULED
  ACTIVE
  FINALIZING
  FINISHED

FixtureStatus
  DRAFT
  OPEN
  LOCKED
  LIVE
  FINISHED
  SETTLED

PredictionOutcome
  HOME
  DRAW
  AWAY

PredictionResultStatus
  PENDING
  CORRECT
  INCORRECT

PredictionSlotType
  FREE
  REWARDED

AdRewardStatus
  CREATED
  VERIFIED
  CONSUMED
  EXPIRED
  REJECTED

PrizeClaimStatus
  UNCLAIMED
  CLAIM_PENDING
  PAID
  FAILED

RatingLeague
  UNRANKED
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

UserLocale
  en
  ru
  de
  es
  ar

UserAppearance
  system
  light
  dark
```

Exact Prisma enum declarations live in `prisma/schema.prisma`.

---

# 3. User

Purpose: internal representation of an authenticated Telegram user.

Fields:

```text
id                UUID PK
telegramUserId    BIGINT UNIQUE NOT NULL
username          VARCHAR NULL
firstName         VARCHAR NULL
lastName          VARCHAR NULL
languageCode      VARCHAR NULL
locale            UserLocale NOT NULL DEFAULT en
appearance        UserAppearance NOT NULL DEFAULT system
isDeleted         BOOLEAN NOT NULL DEFAULT false
deletedAt         TIMESTAMPTZ NULL
createdAt         TIMESTAMPTZ NOT NULL
updatedAt         TIMESTAMPTZ NOT NULL
```

Semantics:

- `telegramUserId` is the external Telegram identity.
- Telegram profile fields are metadata, not frontend authority.
- `languageCode` stores raw Telegram metadata.
- `locale` is Goalstery user preference and is not overwritten by
  later Telegram profile sync.
- `appearance` stores `system | light | dark`.

Relations:

```text
TournamentParticipant[]
Prediction[]
DailyPredictionUsage[]
AdReward[]
RatingProfile?
RatingHistory[]
UserAchievement[]
Prize[]
IdempotencyRecord[]
```

Account deletion must preserve historical integrity. Exact
anonymization/re-registration behavior remains unresolved until
explicitly specified.

---

# 4. Competition

Purpose: stable Goalstery competition catalog.

Fields:

```text
id                       UUID PK
providerCompetitionId    VARCHAR NOT NULL
code                     VARCHAR UNIQUE NOT NULL
name                     VARCHAR NOT NULL
slug                     VARCHAR UNIQUE NOT NULL
country                  VARCHAR NULL
isActive                 BOOLEAN NOT NULL DEFAULT true
createdAt                TIMESTAMPTZ NOT NULL
updatedAt                TIMESTAMPTZ NOT NULL
```

Current codes include:

```text
EPL
LALIGA
SERIE_A
BUNDESLIGA
LIGUE_1
UCL
UEL
```

Constraints:

```text
UNIQUE(code)
UNIQUE(providerCompetitionId)
UNIQUE(slug)
```

`slug` is Goalstery-owned canonical presentation identity:

```text
lowercase ASCII
kebab-case
human-readable
provider-independent
stable when display name changes
```

Local asset path:

```text
/assets/competitions/<slug>.webp
```

Provider identity and canonical asset identity are separate concepts.

If multi-provider support becomes real, provider identity uniqueness
must be redesigned/scoped explicitly rather than silently overloaded.

---

# 5. Team

Fields:

```text
id              UUID PK
providerTeamId  VARCHAR NOT NULL
name            VARCHAR NOT NULL
slug            VARCHAR UNIQUE NOT NULL
shortName       VARCHAR NULL
country         VARCHAR NULL
createdAt       TIMESTAMPTZ NOT NULL
updatedAt       TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(providerTeamId)
UNIQUE(slug)
```

`slug` has the same canonical Goalstery identity semantics as
Competition slug.

Local asset path:

```text
/assets/teams/<slug>.webp
```

If multi-provider support becomes real, provider identity uniqueness
must be explicitly migrated.

---

# 6. Tournament

Fields:

```text
id                 UUID PK
number             INTEGER NOT NULL
status             TournamentStatus NOT NULL
startsAt           TIMESTAMPTZ NOT NULL
endsAt             TIMESTAMPTZ NOT NULL
prizePoolNanoTon   BIGINT NOT NULL
createdAt          TIMESTAMPTZ NOT NULL
updatedAt          TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(number)
CHECK(startsAt < endsAt)
CHECK(prizePoolNanoTon >= 0)
```

Indexes:

```text
(status)
(startsAt)
(endsAt)
(status, startsAt, endsAt)
```

Tournament overlap is currently prevented by application/lifecycle
correctness plus tests unless/until a database exclusion constraint is
explicitly adopted.

Exact weekly boundary is not a schema decision.

---

# 7. TournamentParticipant

Purpose: User participation plus maintained Weekly Cup aggregates.

Fields:

```text
id                         UUID PK
tournamentId               UUID FK
userId                     UUID FK
tournamentPoints           INTEGER NOT NULL DEFAULT 0
predictionsCount           INTEGER NOT NULL DEFAULT 0
correctPredictionsCount    INTEGER NOT NULL DEFAULT 0
finalRank                  INTEGER NULL
ratingPerformanceZ         NUMERIC(12,8) NULL
ratingDelta                INTEGER NULL
createdAt                  TIMESTAMPTZ NOT NULL
updatedAt                  TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(tournamentId, userId)
CHECK(tournamentPoints >= 0)
CHECK(predictionsCount >= 0)
CHECK(correctPredictionsCount >= 0)
CHECK(correctPredictionsCount <= predictionsCount)
```

Indexes:

```text
(tournamentId, tournamentPoints DESC)
(tournamentId, tournamentPoints DESC, id)
(userId, tournamentId)
```

`finalRank` is written at finalization; live rank is derived.

The stable final DB sort key is not an official sports tie-breaker.
Official tie-break rules remain separately decided.

---

# 8. Fixture

Fields:

```text
id                    UUID PK
providerFixtureId     VARCHAR NOT NULL
competitionId         UUID FK
homeTeamId            UUID FK
awayTeamId            UUID FK
kickoffAt             TIMESTAMPTZ NOT NULL
status                FixtureStatus NOT NULL
providerStatus        VARCHAR NULL
homeScore             INTEGER NULL
awayScore             INTEGER NULL
finalOutcome          PredictionOutcome NULL
scoringSnapshotId     UUID NULL
createdAt             TIMESTAMPTZ NOT NULL
updatedAt             TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(providerFixtureId)
CHECK(homeTeamId != awayTeamId)
```

Indexes:

```text
(kickoffAt)
(status, kickoffAt)
(competitionId, kickoffAt)
(status, competitionId, kickoffAt)
```

Relations:

```text
Competition
home Team
away Team
OutcomeSnapshot[] via FixtureSnapshots
active OutcomeSnapshot? via FixtureScoringSnapshot
Prediction[]
```

Provider-specific status remains separate from Goalstery
`FixtureStatus`.

Final-state cross-field invariants may be enforced in application/domain
code where clearer than SQL CHECKs.

---

# 9. OutcomeSnapshot

Purpose: immutable scoring/probability evidence published for a Fixture.

Current fields:

```text
id                 UUID PK
fixtureId          UUID FK

homeRawOdds        NUMERIC(12,6)
drawRawOdds        NUMERIC(12,6)
awayRawOdds        NUMERIC(12,6)

homeProbability    NUMERIC(10,8) NOT NULL
drawProbability    NUMERIC(10,8) NOT NULL
awayProbability    NUMERIC(10,8) NOT NULL

homePoints         INTEGER NOT NULL
drawPoints         INTEGER NOT NULL
awayPoints         INTEGER NOT NULL

snapshotAt         TIMESTAMPTZ NOT NULL
scoringVersion     VARCHAR NOT NULL
createdAt          TIMESTAMPTZ NOT NULL
```

Current constraints:

```text
homeProbability > 0
drawProbability > 0
awayProbability > 0

homePoints BETWEEN 7 AND 50
drawPoints BETWEEN 7 AND 50
awayPoints BETWEEN 7 AND 50
```

Normalized probability total is validated using decimal tolerance in
application/domain logic rather than strict SQL equality.

Indexes:

```text
(fixtureId)
(fixtureId, snapshotAt DESC)
```

Published snapshot is immutable.

## 9.1 Future model guardrail

`homeRawOdds/drawRawOdds/awayRawOdds` reflect the current scoring
baseline.

Goalstery has not yet designed its own mathematical probability model.

Therefore these fields must not be silently removed, repurposed or
expanded merely because the future model direction has been accepted.
Any model-driven schema migration must be explicitly reconciled with
product/technical/testing/decision documents first.

---

# 10. Prediction

Fields:

```text
id                       UUID PK
userId                   UUID FK
tournamentId             UUID FK
fixtureId                UUID FK
outcomeSnapshotId        UUID FK

selectedOutcome          PredictionOutcome NOT NULL
slotType                 PredictionSlotType NOT NULL

probabilityAtPrediction  NUMERIC(10,8) NOT NULL
potentialPoints          INTEGER NOT NULL

resultStatus             PredictionResultStatus NOT NULL DEFAULT PENDING
earnedPoints             INTEGER NOT NULL DEFAULT 0

createdAt                TIMESTAMPTZ NOT NULL
updatedAt                TIMESTAMPTZ NOT NULL
settledAt                TIMESTAMPTZ NULL
```

Constraints:

```text
UNIQUE(userId, fixtureId)
CHECK(potentialPoints BETWEEN 7 AND 50)
CHECK(earnedPoints >= 0)
```

Indexes:

```text
(userId, createdAt DESC)
(userId, tournamentId)
(tournamentId, resultStatus)
(fixtureId, resultStatus)
(fixtureId)
(outcomeSnapshotId)
```

Snapshot semantics:

```text
outcomeSnapshotId
probabilityAtPrediction
potentialPoints
```

are intentionally retained for historical integrity/auditability.

On pre-kickoff outcome edit:

```text
selectedOutcome changes
probabilityAtPrediction changes to selected outcome value from SAME snapshot
potentialPoints changes to selected outcome value from SAME snapshot
updatedAt changes
```

but:

```text
outcomeSnapshotId unchanged
slotType unchanged
daily quota unchanged
```

Settlement invariant:

```text
PENDING   → earnedPoints = 0
CORRECT   → earnedPoints = potentialPoints
INCORRECT → earnedPoints = 0
```

Cross-field settlement consistency is application/domain enforced.

---

# 11. DailyPredictionUsage

Purpose: atomic daily quota accounting.

Fields:

```text
id              UUID PK
userId          UUID FK
businessDate    DATE NOT NULL
freeUsed        INTEGER NOT NULL DEFAULT 0
rewardedUsed    INTEGER NOT NULL DEFAULT 0
createdAt       TIMESTAMPTZ NOT NULL
updatedAt       TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(userId, businessDate)

CHECK(freeUsed >= 0)
CHECK(rewardedUsed >= 0)

The current quota ceilings are product/domain configuration:

FREE_PREDICTION_LIMIT = 3
REWARDED_PREDICTION_LIMIT = 5
DAILY_PREDICTION_LIMIT =
  FREE_PREDICTION_LIMIT + REWARDED_PREDICTION_LIMIT // currently 8

Do not duplicate these configurable ceilings as independent hard-coded DB
CHECK values. Quota ceilings are enforced transactionally by application
logic using the centralized authoritative constants together with the
row-locking/concurrency strategy.

If a future design intentionally moves configurable quota ceilings into
database configuration/constraints, that requires a synchronized schema
decision/migration.
```

Indexes:

```text
(userId, businessDate)
(businessDate)
```

These CHECKs intentionally mirror current hard product limits. Product
changes to quota require synchronized schema migration.

---

# 12. AdReward

Purpose: server-controlled one-time rewarded entitlement.

Fields:

```text
id                       UUID PK
userId                   UUID FK
provider                 VARCHAR NOT NULL
providerRewardId         VARCHAR NULL
attemptKey               VARCHAR NOT NULL
status                   AdRewardStatus NOT NULL
createdAt                TIMESTAMPTZ NOT NULL
verifiedAt               TIMESTAMPTZ NULL
consumedAt               TIMESTAMPTZ NULL
expiresAt                TIMESTAMPTZ NULL
consumedByPredictionId   UUID NULL
metadata                 JSONB NULL
```

Constraints:

```text
UNIQUE(attemptKey)
UNIQUE(consumedByPredictionId)
```

If the selected provider supplies a reliable globally unique event
identifier, a scoped unique constraint such as:

```text
UNIQUE(provider, providerRewardId)
```

may be added for non-null values.

Indexes:

```text
(userId, status, expiresAt)
(status, expiresAt)
```

Reward consumption and rewarded Prediction creation occur in the same
correctness transaction.

Exact provider verification metadata is intentionally not frozen before
the Monetag contract is approved.

---

# 13. RatingProfile

Purpose: current Global Rating state.

Fields:

```text
id                   UUID PK
userId               UUID FK
rating               INTEGER NOT NULL DEFAULT 1500
league               RatingLeague NOT NULL DEFAULT UNRANKED
qualifiedCupsCount   INTEGER NOT NULL DEFAULT 0
createdAt            TIMESTAMPTZ NOT NULL
updatedAt            TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(userId)
CHECK(qualifiedCupsCount >= 0)
```

Indexes:

```text
(rating DESC)
(league, rating DESC)
```

Internal rating may exist while visible league is `UNRANKED`.

`globalRank` is derived, not authoritative persisted state.

League calibration/threshold status is not decided by this schema
document.

---

# 14. RatingHistory

Purpose: immutable result of one qualified Tournament rating
calculation.

Fields:

```text
id                   UUID PK
userId               UUID FK
tournamentId         UUID FK
ratingBefore         INTEGER NOT NULL
ratingAfter          INTEGER NOT NULL
ratingDelta          INTEGER NOT NULL
performanceZ         NUMERIC(12,8) NOT NULL
actualPercentile     NUMERIC(10,8) NOT NULL
expectedPercentile   NUMERIC(10,8) NOT NULL
leagueBefore         RatingLeague NOT NULL
leagueAfter          RatingLeague NOT NULL
createdAt            TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(userId, tournamentId)

CHECK(actualPercentile >= 0 AND actualPercentile <= 1)
CHECK(expectedPercentile >= 0 AND expectedPercentile <= 1)
```

Indexes:

```text
(userId, createdAt DESC)
(tournamentId)
(tournamentId, performanceZ DESC)
```

Rows are immutable after finalization.

---

# 15. Achievement

Static achievement catalog.

Fields:

```text
id
code
name
description
isActive
createdAt
updatedAt
```

Constraint:

```text
UNIQUE(code)
```

`code` is the stable internal identifier.

Current product achievement catalog belongs to `PRODUCT_SPEC.md`, not
this schema contract.

---

# 16. UserAchievement

Fields:

```text
id
userId
achievementId
unlockedAt
createdAt
```

Constraint:

```text
UNIQUE(userId, achievementId)
```

Indexes:

```text
(userId, unlockedAt DESC)
(achievementId)
```

MVP has no generic achievement-progress persistence unless explicitly
added later.

---

# 17. Prize

Purpose: immutable Tournament award assigned to a rank/User.

Fields:

```text
id               UUID PK
tournamentId     UUID FK
userId           UUID FK
rank             INTEGER NOT NULL
amountNanoTon    BIGINT NOT NULL
createdAt        TIMESTAMPTZ NOT NULL
```

Constraints:

```text
UNIQUE(tournamentId, rank)
UNIQUE(tournamentId, userId)
CHECK(rank > 0)
CHECK(amountNanoTon > 0)
```

Indexes:

```text
(userId, createdAt DESC)
(tournamentId)
```

Do not hard-code a maximum prize rank in schema unless product rules
intentionally make it permanent.

Prize is immutable after finalization except explicit audited
operational correction.

Exact rank → amount Prize Distribution is not defined by this schema.
`Prize` records may only be created from an approved product distribution;
do not infer a distribution from current code, seed data or historical
examples.

---

# 18. PrizeClaim

Relation:

```text
Prize 1 → 0..1 PrizeClaim
```

Fields:

```text
id                 UUID PK
prizeId            UUID FK
walletAddress      VARCHAR NULL
status             PrizeClaimStatus NOT NULL DEFAULT UNCLAIMED
transactionHash    VARCHAR NULL
claimedAt          TIMESTAMPTZ NULL
paidAt             TIMESTAMPTZ NULL
failedAt           TIMESTAMPTZ NULL
failureReason      TEXT NULL
createdAt          TIMESTAMPTZ NOT NULL
updatedAt          TIMESTAMPTZ NOT NULL
```

Constraint:

```text
UNIQUE(prizeId)
```

A unique `transactionHash` must not be introduced unless payout
semantics guarantee one transfer hash per PrizeClaim; future batch
transfer support could invalidate such a constraint.

Conceptual state invariants:

```text
UNCLAIMED
  walletAddress may be null

CLAIM_PENDING
  walletAddress required
  claimedAt required

PAID
  walletAddress required
  transactionHash required
  paidAt required

FAILED
  claimedAt required
  failedAt required
```

State-machine consistency is primarily application/service enforced.

Exact wallet validation/payout operational fields remain unresolved.

---

# 19. IdempotencyRecord

Purpose: durable HTTP/business mutation idempotency.

Fields:

```text
id
userId
operation
key
requestHash
responseStatus
responseBody
createdAt
expiresAt
```

Constraint:

```text
UNIQUE(userId, operation, key)
```

This record supports returning the original business result for a
repeated request and detecting conflicting key reuse.

Domain-specific worker idempotency additionally relies on constraints
such as:

```text
Prediction(userId, fixtureId)
TournamentParticipant(tournamentId, userId)
RatingHistory(userId, tournamentId)
Prize(tournamentId, rank)
PrizeClaim(prizeId)
```

---

# 20. Relationship Summary

```text
User
 ├── 1:N TournamentParticipant
 ├── 1:N Prediction
 ├── 1:N DailyPredictionUsage
 ├── 1:N AdReward
 ├── 1:1 RatingProfile
 ├── 1:N RatingHistory
 ├── 1:N UserAchievement
 ├── 1:N Prize
 └── 1:N IdempotencyRecord

Tournament
 ├── 1:N TournamentParticipant
 ├── 1:N Prediction
 ├── 1:N RatingHistory
 └── 1:N Prize

Competition
 └── 1:N Fixture

Team
 ├── 1:N Fixture as homeTeam
 └── 1:N Fixture as awayTeam

Fixture
 ├── N:1 Competition
 ├── N:1 Team homeTeam
 ├── N:1 Team awayTeam
 ├── 1:N OutcomeSnapshot
 ├── 0:1 active OutcomeSnapshot via scoringSnapshotId
 └── 1:N Prediction

OutcomeSnapshot
 └── 1:N Prediction

Achievement
 └── 1:N UserAchievement

Prize
 └── 1:0..1 PrizeClaim
```

Explicit Prisma relation names are required where one model participates
in multiple relations between the same model pair, notably:

```text
HomeTeamFixtures
AwayTeamFixtures
FixtureSnapshots
FixtureScoringSnapshot
```

Exact Prisma syntax lives in `schema.prisma`.

---

# 21. Critical Uniqueness and Integrity

The physical schema must enforce the currently approved equivalents of:

```text
User.telegramUserId

Competition.code
Competition.providerCompetitionId
Competition.slug

Team.providerTeamId
Team.slug

Tournament.number

TournamentParticipant(tournamentId, userId)

Fixture.providerFixtureId

Prediction(userId, fixtureId)

DailyPredictionUsage(userId, businessDate)

RatingProfile.userId
RatingHistory(userId, tournamentId)

Achievement.code
UserAchievement(userId, achievementId)

Prize(tournamentId, rank)
Prize(tournamentId, userId)

PrizeClaim.prizeId

AdReward.attemptKey
AdReward.consumedByPredictionId

IdempotencyRecord(userId, operation, key)
```

Database + application together guarantee:

```text
one User + Fixture → at most one Prediction
daily quota cannot exceed current limits
one AdReward cannot unlock multiple Predictions
settlement has exactly-once business effect
rating finalization applies once per User/Tournament
one Prize per Tournament rank
one PrizeClaim per Prize
```

Current-time invariants such as kickoff lock are enforced
transactionally in application/domain code because they depend on the
authoritative Clock.

---

# 22. Transaction-Relevant Persistence Boundaries

This section defines database effects, not full business workflows.

## createPrediction

One transaction must cover the persistence effects needed to atomically:

```text
lock/serialize relevant quota/idempotency state
validate/read required Fixture/snapshot state
create TournamentParticipant if absent
create Prediction
increment DailyPredictionUsage
increment TournamentParticipant.predictionsCount
consume AdReward when applicable
persist idempotent result
```

## updatePrediction

Transactionally:

```text
load/lock relevant Prediction + Fixture + snapshot
validate authoritative kickoff rule
update selectedOutcome
update probabilityAtPrediction
update potentialPoints
```

No quota/slot/reward/snapshot identity changes.

## settleFixture

Transaction or correctness-preserving chunks:

```text
settle previously unsettled Prediction
apply participant aggregates exactly once
persist settled state
eventually mark Fixture SETTLED
```

## finalizeRating

Transactionally:

```text
prevent duplicate RatingHistory
update RatingProfile
create RatingHistory
persist participant finalization fields as applicable
```

## claimPrize

Transactionally enforce one PrizeClaim and valid state transition.

Exact orchestration belongs to `TECH_SPEC.md`.

---

# 23. Index Strategy

Indexes are driven by current primary query paths.

## Predict

```text
Fixture(status, competitionId, kickoffAt)
Fixture(kickoffAt)
```

## My Picks

```text
Prediction(userId, createdAt DESC)
Prediction(userId, tournamentId)
```

## Weekly Cup

```text
TournamentParticipant(tournamentId, tournamentPoints DESC)
```

## Rating

```text
RatingProfile(rating DESC)
```

## Result ingestion

```text
Fixture(status, kickoffAt)
```

## Settlement

```text
Prediction(fixtureId, resultStatus)
```

Avoid speculative indexes. Add/change indexes from measured query
patterns and explain any non-obvious index in schema/migration review.

---

# 24. Provider Identity Boundary

Current schema stores direct provider mapping fields:

```text
providerFixtureId
providerTeamId
providerCompetitionId
```

This is acceptable for the current single-provider phase.

Do not prematurely introduce generic provider mapping tables.

If multi-provider support becomes a real requirement, explicitly migrate
to provider-scoped identity, for example:

```text
provider + providerExternalId
```

or dedicated mapping tables.

Such migration must preserve Goalstery canonical entity IDs and
canonical asset slugs.

---

# 25. Retention

Current historical retention intent:

```text
Tournament
TournamentParticipant
Fixture
OutcomeSnapshot
Prediction
RatingHistory
Prize
PrizeClaim
```

is indefinite unless a later approved retention/legal policy changes it.

Operational/provider raw data may use shorter retention.

`IdempotencyRecord` may expire after a safe operational period.

AdReward metadata may use bounded retention subject to analytics/legal
requirements.

---

# 26. Migration and Seed Policy

Schema changes use Prisma Migrations.

```text
development → prisma migrate dev
production  → prisma migrate deploy
```

Destructive production migrations require:

```text
backup
migration review
recovery/rollback plan
```

Stable catalog seed may include:

```text
Competitions
Achievements
```

Development demo fixtures/tournaments belong to development seed
tooling, not production catalog semantics.

`schema.prisma` and migrations must not introduce new
product/architecture decisions silently.

---

# 27. Open Database Decisions

Authoritative Open Decisions belong in:

```text
docs/DECISIONS.md
```

Do not maintain a competing authoritative list here.

Database areas that may require future explicit resolution include:

```text
official leaderboard tie-break fields/indexes
fixture disruption representation
future Goalstery probability-model evidence fields
candidate-vs-published snapshot persistence after model design
Telegram anonymization/re-registration identity policy
PrizeClaim wallet validation/audit fields
season entity requirement
notification persistence
provider raw-payload retention
multi-provider identity mapping
```

If a schema change depends on one of these unresolved areas, stop and
resolve the relevant decision before migration.

---

# 28. Schema Acceptance

Database contract is compliant when:

```text
internal PKs are UUID
external IDs remain separate
TON uses BigInt nanoTON
probability/scoring decimal evidence uses NUMERIC
canonical Competition/Team slugs are unique and provider-independent
historical gameplay is protected from accidental cascade deletion
published OutcomeSnapshot is immutable
Prediction retains scoring evidence
one User has at most one Prediction per Fixture
daily quota is DB-constrained
AdReward is one-time consumable
TournamentParticipant stores leaderboard aggregates
current Global Rank is derived
RatingHistory is immutable/unique per User/Tournament
Prize and PrizeClaim remain separate
critical query paths are indexed
critical mutations have transactional/unique-constraint support
retry/concurrency cannot create duplicate business effects
```

---

# 29. Schema Maintenance

This document owns:

```text
persistence entities
field semantics
relations
constraints
indexes
referential actions
database invariants
transaction-relevant persistence effects
```

It does not own:

```text
product behavior             → PRODUCT_SPEC.md
backend/worker orchestration → TECH_SPEC.md
frontend architecture        → FRONTEND_ARCHITECTURE.md
HTTP DTO contracts           → API_CONTRACTS.md when present
testing matrix               → TESTING_SPEC.md
visual rules                 → design specs
accepted/open decisions      → DECISIONS.md
```

`prisma/schema.prisma` is the executable physical expression of this
contract.

If this document, Prisma schema, migrations or an Accepted Decision
appear inconsistent, do not silently choose a winner. Follow `AGENTS.md`
conflict/change policy and reconcile explicitly.

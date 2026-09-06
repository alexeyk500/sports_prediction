# DB_SCHEMA.md

# Sports Prediction Tournament — Database Schema v0.1

**Status:** Working database contract  
**Database:** PostgreSQL  
**ORM:** Prisma  
**Product source of truth:** `docs/PRODUCT_SPEC.md`  
**Technical source of truth:** `docs/TECH_SPEC.md`

---

## 1. Purpose

Этот документ фиксирует database model для MVP Sports Prediction Tournament.

Приоритет требований:

1. `PRODUCT_SPEC.md` — product/business behavior.
2. `TECH_SPEC.md` — architecture/implementation behavior.
3. `DB_SCHEMA.md` — database entities, constraints, indexes and relations.
4. `schema.prisma` должен соответствовать этому документу.

Если изменение database schema меняет product behavior, сначала обновляется `PRODUCT_SPEC.md`.

---

# 2. General Database Conventions

## 2.1 Primary Keys

Все внутренние entity IDs:

```text
UUID
```

Рекомендуемая Prisma модель:

```prisma
id String @id @default(uuid()) @db.Uuid
```

External/provider IDs хранятся отдельно.

Примеры:

```text
telegramUserId
providerFixtureId
providerCompetitionId
providerTeamId
```

---

## 2.2 Time

Все timestamps хранятся в UTC.

PostgreSQL type:

```text
TIMESTAMPTZ
```

Prisma:

```prisma
DateTime @db.Timestamptz(6)
```

Canonical product timezone:

```text
Europe/London
```

Она используется application layer для business calendar logic.

---

## 2.3 Money

TON amounts никогда не хранятся как `Float`.

Используется:

```text
nanoTON
```

Соотношение:

```text
1 TON = 1_000_000_000 nanoTON
```

Database type:

```text
BIGINT
```

Prisma:

```prisma
BigInt
```

Пример:

```text
1.5 TON = 1_500_000_000 nanoTON
```

---

## 2.4 Odds and Probabilities

Odds/probabilities не должны использовать binary floating point как source of truth.

Использовать PostgreSQL `NUMERIC/DECIMAL`.

Рекомендуемые типы:

```text
rawOdds                NUMERIC(12,6)
normalizedProbability  NUMERIC(10,8)
ratingPerformanceZ     NUMERIC(12,8)
percentile             NUMERIC(10,8)
```

Application layer должен использовать `Prisma.Decimal` либо безопасное decimal representation.

---

## 2.5 Soft Delete / Historical Integrity

Gameplay/history entities не удаляются физически как обычная business operation.

Нельзя cascade-delete исторические:

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

User account deletion реализуется через anonymization / soft-delete.

---

# 3. Enums

## 3.1 TournamentStatus

```ts
enum TournamentStatus {
  SCHEDULED
  ACTIVE
  FINALIZING
  FINISHED
}
```

---

## 3.2 FixtureStatus

```ts
enum FixtureStatus {
  DRAFT
  OPEN
  LOCKED
  LIVE
  FINISHED
  SETTLED
}
```

Provider-specific raw statuses хранятся отдельно.

---

## 3.3 PredictionOutcome

```ts
enum PredictionOutcome {
  HOME
  DRAW
  AWAY
}
```

---

## 3.4 PredictionResultStatus

```ts
enum PredictionResultStatus {
  PENDING
  CORRECT
  INCORRECT
}
```

---

## 3.5 PredictionSlotType

```ts
enum PredictionSlotType {
  FREE
  REWARDED
}
```

---

## 3.6 AdRewardStatus

```ts
enum AdRewardStatus {
  CREATED
  VERIFIED
  CONSUMED
  EXPIRED
  REJECTED
}
```

---

## 3.7 PrizeClaimStatus

```ts
enum PrizeClaimStatus {
  UNCLAIMED
  CLAIM_PENDING
  PAID
  FAILED
}
```

---

## 3.8 RatingLeague

```ts
enum RatingLeague {
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
}
```

## 3.9 UserLocale

```ts
enum UserLocale {
  en
  ru
  de
  es
  ar
}
```

## 3.10 UserAppearance

```ts
enum UserAppearance {
  system
  light
  dark
}
```

---

# 4. User

## 4.1 Purpose

Internal representation Telegram user.

## 4.2 Fields

```text
id
telegramUserId
username
firstName
lastName
languageCode
locale
appearance
isDeleted
deletedAt
createdAt
updatedAt
```

Recommended types:

```text
id               UUID PK
telegramUserId   BIGINT UNIQUE NOT NULL
username         VARCHAR NULL
firstName        VARCHAR NULL
lastName         VARCHAR NULL
languageCode     VARCHAR NULL
locale           UserLocale NOT NULL DEFAULT en
appearance       UserAppearance NOT NULL DEFAULT system
isDeleted        BOOLEAN NOT NULL DEFAULT false
deletedAt        TIMESTAMPTZ NULL
createdAt        TIMESTAMPTZ NOT NULL
updatedAt        TIMESTAMPTZ NOT NULL
```

`telegramUserId` следует хранить как `BIGINT`.

Frontend не является source of truth для Telegram profile fields.

`languageCode` хранит raw Telegram profile metadata. `locale` хранит
user language preference and must not be overwritten by later Telegram
profile sync after creation. `appearance` stores user-selected theme
mode.

---

## 4.3 Relations

```text
User
 ├── TournamentParticipant[]
 ├── Prediction[]
 ├── DailyPredictionUsage[]
 ├── AdReward[]
 ├── RatingProfile?
 ├── RatingHistory[]
 ├── UserAchievement[]
 ├── Prize[]
 └── PrizeClaim[] indirectly through Prize
```

---

## 4.4 Deletion Policy

При удалении пользователя:

- `User` row сохраняется;
- identifying profile data anonymized;
- `telegramUserId` должен быть обработан согласно выбранной account deletion/re-registration policy;
- gameplay history сохраняется;
- historical Leaderboards не должны ломаться.

Точная legal/privacy deletion policy фиксируется отдельно.

---

# 5. Competition

## 5.1 Purpose

Stable internal competition catalog independent of Sports Provider.

## 5.2 Fields

```text
id
providerCompetitionId
code
name
slug
country
isActive
createdAt
updatedAt
```

Recommended:

```text
providerCompetitionId VARCHAR NOT NULL
code                  VARCHAR UNIQUE NOT NULL
name                  VARCHAR NOT NULL
slug                  VARCHAR UNIQUE NOT NULL
country               VARCHAR NULL
isActive              BOOLEAN NOT NULL DEFAULT true
```

Examples:

```text
EPL
LALIGA
SERIE_A
BUNDESLIGA
LIGUE_1
UCL
UEL
```

`code` является internal stable identifier.

`slug` is a canonical Goalstery asset identifier. It is lowercase ASCII
kebab-case, human-readable, unique within Competition, independent from
provider IDs, and must not automatically change when display `name`
changes. Local competition logo assets use:

```text
/assets/competitions/<Competition.slug>.webp
```

`slug` is assigned from the reviewed football asset manifest / ingestion
boundary. It must not be derived by frontend runtime from display `name`,
provider ID, or provider logo URL.

---

## 5.3 Constraints

```text
UNIQUE(code)
UNIQUE(providerCompetitionId)
UNIQUE(slug)
```

Если provider IDs потенциально зависят от provider, schema может быть расширена `provider + providerCompetitionId`.

---

# 6. Team

## 6.1 Fields

```text
id
providerTeamId
name
slug
shortName
country
createdAt
updatedAt
```

`country` допускается nullable.

`slug` is a canonical Goalstery asset identifier. It is lowercase ASCII
kebab-case, human-readable, unique within Team, independent from provider
IDs, and must not automatically change when display `name` changes. Local
team logo assets use:

```text
/assets/teams/<Team.slug>.webp
```

`slug` is assigned from the reviewed football asset manifest / ingestion
boundary. It must not be derived by frontend runtime from display `name`,
provider ID, or provider logo URL.

---

## 6.2 Constraints

```text
UNIQUE(providerTeamId)
UNIQUE(slug)
```

При добавлении нескольких sports providers uniqueness должен быть scoped provider name.

---

# 7. Tournament

## 7.1 Fields

```text
id
number
status
startsAt
endsAt
prizePoolNanoTon
createdAt
updatedAt
```

Types:

```text
number            INTEGER
status            TournamentStatus
startsAt          TIMESTAMPTZ
endsAt            TIMESTAMPTZ
prizePoolNanoTon  BIGINT
```

---

## 7.2 Constraints

```text
UNIQUE(number)
CHECK(startsAt < endsAt)
CHECK(prizePoolNanoTon >= 0)
```

Tournament windows не должны overlap по business rule.

PostgreSQL exclusion constraint может быть добавлен позже, но для MVP overlap prevention допустимо обеспечивать lifecycle service + tests.

---

## 7.3 Indexes

```text
INDEX(status)
INDEX(startsAt)
INDEX(endsAt)
INDEX(status, startsAt, endsAt)
```

---

# 8. TournamentParticipant

## 8.1 Purpose

User participation and Weekly Cup aggregate state.

Создаётся автоматически при первой Prediction пользователя в Tournament.

## 8.2 Fields

```text
id
tournamentId
userId

tournamentPoints
predictionsCount
correctPredictionsCount

finalRank
ratingPerformanceZ
ratingDelta

createdAt
updatedAt
```

Recommended:

```text
tournamentPoints          INTEGER NOT NULL DEFAULT 0
predictionsCount          INTEGER NOT NULL DEFAULT 0
correctPredictionsCount   INTEGER NOT NULL DEFAULT 0
finalRank                 INTEGER NULL
ratingPerformanceZ        NUMERIC(12,8) NULL
ratingDelta               INTEGER NULL
```

---

## 8.3 Constraints

```text
UNIQUE(tournamentId, userId)
CHECK(tournamentPoints >= 0)
CHECK(predictionsCount >= 0)
CHECK(correctPredictionsCount >= 0)
CHECK(correctPredictionsCount <= predictionsCount)
```

---

## 8.4 Indexes

Critical leaderboard indexes:

```text
INDEX(tournamentId, tournamentPoints DESC)
INDEX(tournamentId, tournamentPoints DESC, id)
INDEX(userId, tournamentId)
```

После фиксации official tie-breaker индекс должен быть расширен его полями.

---

## 8.5 Rank

Live rank не является persisted source of truth.

`finalRank` записывается только при Tournament Finalization.

---

# 9. Fixture

## 9.1 Fields

```text
id
providerFixtureId

competitionId
homeTeamId
awayTeamId

kickoffAt
status
providerStatus

homeScore
awayScore
finalOutcome

scoringSnapshotId

createdAt
updatedAt
```

Recommended:

```text
providerFixtureId  VARCHAR NOT NULL
kickoffAt          TIMESTAMPTZ NOT NULL
status             FixtureStatus NOT NULL
providerStatus     VARCHAR NULL

homeScore          INTEGER NULL
awayScore          INTEGER NULL
finalOutcome       PredictionOutcome NULL

scoringSnapshotId  UUID NULL
```

---

## 9.2 Relations

```text
Fixture -> Competition
Fixture -> Team homeTeam
Fixture -> Team awayTeam
Fixture -> OutcomeSnapshot? active scoring snapshot
Fixture -> OutcomeSnapshot[] historical/internal snapshots if retained
Fixture -> Prediction[]
```

---

## 9.3 Constraints

```text
UNIQUE(providerFixtureId)
CHECK(homeTeamId != awayTeamId)
```

For `SETTLED` fixtures:

```text
finalOutcome IS NOT NULL
```

может проверяться application/domain layer либо database CHECK, если enum/null semantics удобно выразимы.

---

## 9.4 Indexes

```text
INDEX(kickoffAt)
INDEX(status, kickoffAt)
INDEX(competitionId, kickoffAt)
INDEX(status, competitionId, kickoffAt)
```

Critical for Daily Match Pool:

```text
INDEX(kickoffAt, status, competitionId)
```

---

# 10. OutcomeSnapshot

## 10.1 Purpose

Immutable published scoring snapshot for a Fixture.

## 10.2 Fields

```text
id
fixtureId

homeRawOdds
drawRawOdds
awayRawOdds

homeProbability
drawProbability
awayProbability

homePoints
drawPoints
awayPoints

snapshotAt
scoringVersion
createdAt
```

Recommended:

```text
homeRawOdds       NUMERIC(12,6)
drawRawOdds       NUMERIC(12,6)
awayRawOdds       NUMERIC(12,6)

homeProbability   NUMERIC(10,8)
drawProbability   NUMERIC(10,8)
awayProbability   NUMERIC(10,8)

homePoints        INTEGER
drawPoints        INTEGER
awayPoints        INTEGER

snapshotAt        TIMESTAMPTZ
scoringVersion    VARCHAR
```

---

## 10.3 Constraints

```text
homeProbability > 0
drawProbability > 0
awayProbability > 0

homePoints BETWEEN 7 AND 50
drawPoints BETWEEN 7 AND 50
awayPoints BETWEEN 7 AND 50
```

Probability sum should be approximately 1.

Из-за Decimal precision лучше не использовать strict SQL equality `= 1`.

Application/domain validation must enforce normalized total within configured tolerance.

---

## 10.4 Immutability

После публикации `OutcomeSnapshot` не update.

Если нужен новый snapshot до publication — создаётся новая row.

Обычный refresh не должен mutate active published snapshot.

---

## 10.5 Indexes

```text
INDEX(fixtureId)
INDEX(fixtureId, snapshotAt DESC)
```

---

# 11. Prediction

## 11.1 Fields

```text
id

userId
tournamentId
fixtureId
outcomeSnapshotId

selectedOutcome
slotType

probabilityAtPrediction
potentialPoints

resultStatus
earnedPoints

createdAt
updatedAt
settledAt
```

Recommended:

```text
selectedOutcome          PredictionOutcome NOT NULL
slotType                 PredictionSlotType NOT NULL

probabilityAtPrediction  NUMERIC(10,8) NOT NULL
potentialPoints          INTEGER NOT NULL

resultStatus             PredictionResultStatus NOT NULL DEFAULT PENDING
earnedPoints             INTEGER NOT NULL DEFAULT 0

settledAt                TIMESTAMPTZ NULL
```

---

## 11.2 Snapshot Semantics

Prediction stores both:

```text
outcomeSnapshotId
probabilityAtPrediction
potentialPoints
```

Это намеренная denormalization.

Причина:

- historical integrity;
- simple Settlement;
- auditable UI history;
- защита от accidental snapshot mutation/migration.

`probabilityAtPrediction` и `potentialPoints` immutable после creation.

При изменении `selectedOutcome` до kickoff они должны быть обновлены на значения **того же immutable OutcomeSnapshot** для нового selected outcome.

То есть change prediction меняет:

```text
selectedOutcome
probabilityAtPrediction
potentialPoints
updatedAt
```

но не:

```text
slotType
outcomeSnapshotId
daily usage
```

---

## 11.3 Constraints

```text
UNIQUE(userId, fixtureId)
CHECK(potentialPoints BETWEEN 7 AND 50)
CHECK(earnedPoints >= 0)
```

Один пользователь имеет максимум один Prediction на Fixture.

---

## 11.4 Indexes

```text
INDEX(userId, createdAt DESC)
INDEX(userId, tournamentId)
INDEX(tournamentId, resultStatus)
INDEX(fixtureId, resultStatus)
INDEX(fixtureId)
INDEX(outcomeSnapshotId)
```

---

## 11.5 Settlement Integrity

`earnedPoints`:

```text
CORRECT   -> potentialPoints
INCORRECT -> 0
PENDING   -> 0
```

Application layer enforces invariant.

---

# 12. DailyPredictionUsage

## 12.1 Purpose

Atomic daily quota enforcement.

## 12.2 Fields

```text
id
userId
businessDate
freeUsed
rewardedUsed
createdAt
updatedAt
```

`businessDate` should be PostgreSQL `DATE`, representing calendar date in `Europe/London`.

Example:

```text
2026-09-04
```

---

## 12.3 Constraints

```text
UNIQUE(userId, businessDate)

CHECK(freeUsed >= 0)
CHECK(freeUsed <= 3)

CHECK(rewardedUsed >= 0)
CHECK(rewardedUsed <= 5)

CHECK(freeUsed + rewardedUsed <= 8)
```

Hard limits correspond to Product Spec v0.1.

Если product constants станут configurable, CHECK constraints должны мигрироваться синхронно.

---

## 12.4 Indexes

```text
INDEX(userId, businessDate)
INDEX(businessDate)
```

---

# 13. AdReward

## 13.1 Purpose

Server-controlled rewarded-ad entitlement.

## 13.2 Fields

```text
id
userId

provider
providerRewardId
attemptKey

status

createdAt
verifiedAt
consumedAt
expiresAt

consumedByPredictionId
metadata
```

Recommended:

```text
provider                VARCHAR NOT NULL
providerRewardId        VARCHAR NULL
attemptKey              VARCHAR NOT NULL
status                  AdRewardStatus NOT NULL

verifiedAt              TIMESTAMPTZ NULL
consumedAt              TIMESTAMPTZ NULL
expiresAt               TIMESTAMPTZ NULL

consumedByPredictionId  UUID NULL

metadata                JSONB NULL
```

---

## 13.3 Constraints

```text
UNIQUE(attemptKey)
UNIQUE(consumedByPredictionId)
```

Если Monetag предоставляет globally unique reward/event ID:

```text
UNIQUE(provider, providerRewardId)
```

для non-null providerRewardId.

---

## 13.4 One-Time Use

`AdReward` может перейти:

```text
VERIFIED -> CONSUMED
```

только один раз.

Consumption должна происходить в той же transaction, где создаётся rewarded Prediction.

---

## 13.5 Indexes

```text
INDEX(userId, status, expiresAt)
INDEX(status, expiresAt)
```

---

# 14. RatingProfile

## 14.1 Purpose

Current Global Rating state for User.

One row per User.

## 14.2 Fields

```text
id
userId
rating
league
qualifiedCupsCount
createdAt
updatedAt
```

Recommended:

```text
rating              INTEGER NOT NULL DEFAULT 1500
league              RatingLeague NOT NULL DEFAULT UNRANKED
qualifiedCupsCount  INTEGER NOT NULL DEFAULT 0
```

Internal rating may exist while visible league remains `UNRANKED`.

---

## 14.3 Constraints

```text
UNIQUE(userId)
CHECK(qualifiedCupsCount >= 0)
```

---

## 14.4 Global Rank

`globalRank` не хранится как authoritative field.

Он derived from current Rating population.

При необходимости позже может быть cache/materialized value.

---

## 14.5 Indexes

```text
INDEX(rating DESC)
INDEX(league, rating DESC)
```

---

# 15. RatingHistory

## 15.1 Purpose

Immutable result of one qualified Tournament rating calculation.

## 15.2 Fields

```text
id
userId
tournamentId

ratingBefore
ratingAfter
ratingDelta

performanceZ
actualPercentile
expectedPercentile

leagueBefore
leagueAfter

createdAt
```

Recommended:

```text
ratingBefore         INTEGER
ratingAfter          INTEGER
ratingDelta          INTEGER

performanceZ         NUMERIC(12,8)
actualPercentile     NUMERIC(10,8)
expectedPercentile   NUMERIC(10,8)

leagueBefore         RatingLeague
leagueAfter          RatingLeague
```

---

## 15.3 Constraints

```text
UNIQUE(userId, tournamentId)
CHECK(actualPercentile >= 0 AND actualPercentile <= 1)
CHECK(expectedPercentile >= 0 AND expectedPercentile <= 1)
```

RatingHistory immutable.

---

## 15.4 Indexes

```text
INDEX(userId, createdAt DESC)
INDEX(tournamentId)
INDEX(tournamentId, performanceZ DESC)
```

---

# 16. Achievement

## 16.1 Purpose

Static achievement catalog.

## 16.2 Fields

```text
id
code
name
description
isActive
createdAt
updatedAt
```

Example codes:

```text
FIRST_PICK
FIRST_WIN
ON_FIRE
GIANT_KILLER
SHARPSHOOTER
CHAMPION
ELITE
MASTER
```

---

## 16.3 Constraints

```text
UNIQUE(code)
```

`code` является stable internal identifier.

---

# 17. UserAchievement

## 17.1 Purpose

Fact that User unlocked Achievement.

## 17.2 Fields

```text
id
userId
achievementId
unlockedAt
createdAt
```

---

## 17.3 Constraints

```text
UNIQUE(userId, achievementId)
```

No progress storage in MVP.

---

## 17.4 Indexes

```text
INDEX(userId, unlockedAt DESC)
INDEX(achievementId)
```

---

# 18. Prize

## 18.1 Purpose

Award assigned to exact Tournament rank/User.

Prize and PrizeClaim are separate concepts.

## 18.2 Fields

```text
id
tournamentId
userId
rank
amountNanoTon
createdAt
```

Recommended:

```text
rank            INTEGER NOT NULL
amountNanoTon   BIGINT NOT NULL
```

---

## 18.3 Constraints

```text
UNIQUE(tournamentId, rank)
UNIQUE(tournamentId, userId)

CHECK(rank > 0)
CHECK(amountNanoTon > 0)
```

For v0.1 prize zone ranks are 1–5, but schema should not hard-code max 5 unless Product Spec requires it permanently.

---

## 18.4 Indexes

```text
INDEX(userId, createdAt DESC)
INDEX(tournamentId)
```

Prize immutable after Tournament Finalization except explicit operational correction with audit.

---

# 19. PrizeClaim

## 19.1 Purpose

User claim and manual TON payout state.

Recommended relation:

```text
Prize 1 -> 0..1 PrizeClaim
```

## 19.2 Fields

```text
id
prizeId

walletAddress
status

transactionHash

claimedAt
paidAt
failedAt

failureReason

createdAt
updatedAt
```

Recommended:

```text
walletAddress      VARCHAR NULL
status             PrizeClaimStatus NOT NULL DEFAULT UNCLAIMED
transactionHash    VARCHAR NULL

claimedAt          TIMESTAMPTZ NULL
paidAt             TIMESTAMPTZ NULL
failedAt           TIMESTAMPTZ NULL

failureReason      TEXT NULL
```

---

## 19.3 Constraints

```text
UNIQUE(prizeId)
```

Optional:

```text
UNIQUE(transactionHash)
```

если один TON transaction hash соответствует ровно одному PrizeClaim.

Если batch transfers later become possible, это ограничение не использовать.

---

## 19.4 State Invariants

Conceptual:

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

Часть invariants лучше держать в service layer, чтобы state machine была явной.

---

# 20. Idempotency Record

## 20.1 Recommendation

Для generic HTTP mutation idempotency рекомендуется отдельная entity:

```text
IdempotencyRecord
```

## 20.2 Fields

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

---

## 20.3 Constraints

```text
UNIQUE(userId, operation, key)
```

Это позволяет повторному request вернуть исходный business result.

---

## 20.4 Notes

Worker idempotency обычно обеспечивается domain-specific unique constraints:

```text
RatingHistory UNIQUE(userId, tournamentId)
Prediction UNIQUE(userId, fixtureId)
Prize UNIQUE(tournamentId, rank)
TournamentParticipant UNIQUE(tournamentId, userId)
```

и transactional status transitions.

---

# 21. Optional Worker Execution Record

Для observability можно добавить:

```text
WorkerExecution
```

Не является обязательной MVP gameplay entity.

Potential fields:

```text
id
workerName
startedAt
finishedAt
status
itemsProcessed
providerRequests
errorMessage
metadata
```

Для первой версии systemd journal может быть достаточен.

---

# 22. Relationships Summary

```text
User
 ├── 1:N TournamentParticipant
 ├── 1:N Prediction
 ├── 1:N DailyPredictionUsage
 ├── 1:N AdReward
 ├── 1:1 RatingProfile
 ├── 1:N RatingHistory
 ├── 1:N UserAchievement
 └── 1:N Prize

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

---

# 23. Critical Unique Constraints

Must exist:

```text
User.telegramUserId

Competition.code
Competition.providerCompetitionId

Team.providerTeamId

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

---

# 24. Critical Database Invariants

Database/application together must guarantee:

## Predictions

```text
one User + one Fixture = max one Prediction
```

```text
Prediction cannot be created at/after kickoff
```

Kickoff rule enforced in transaction/application because it depends on current time.

---

## Daily Quota

```text
freeUsed <= 3
rewardedUsed <= 5
freeUsed + rewardedUsed <= 8
```

---

## Rewarded Ads

```text
one AdReward cannot unlock more than one Prediction
```

---

## Settlement

```text
Prediction points applied to TournamentParticipant exactly once
```

---

## Rating

```text
one RatingHistory per User per Tournament
```

---

## Prize

```text
one Prize per Tournament rank
```

```text
one PrizeClaim per Prize
```

---

# 25. Transaction Boundaries

## 25.1 createPrediction()

Single DB transaction:

```text
lock/read DailyPredictionUsage
validate quota
validate Fixture/kickoff
validate AdReward if required
create TournamentParticipant if absent
create Prediction
increment DailyPredictionUsage
increment TournamentParticipant.predictionsCount
consume AdReward if required
commit
```

---

## 25.2 updatePrediction()

Transaction:

```text
load Prediction + Fixture + Snapshot
validate now < kickoffAt
update selectedOutcome
update probabilityAtPrediction
update potentialPoints
commit
```

No quota changes.

---

## 25.3 settleFixture()

Transaction or chunked transaction with exactly-once effect:

```text
lock unsettled Prediction
set resultStatus
set earnedPoints
increment TournamentParticipant aggregates
mark settledAt
eventually mark Fixture SETTLED
```

---

## 25.4 finalizeRating()

```text
ensure RatingHistory absent
calculate result
update RatingProfile
create RatingHistory
update TournamentParticipant rating fields
commit
```

---

## 25.5 claimPrize()

```text
load Prize
ensure claimable
create/update PrizeClaim
validate state transition
commit
```

---

# 26. Delete / Referential Actions

Recommended default:

```text
ON DELETE RESTRICT
```

for historical domain relationships.

Avoid:

```text
ON DELETE CASCADE
```

for:

```text
Prediction
TournamentParticipant
RatingHistory
Prize
PrizeClaim
OutcomeSnapshot
```

Cascade may be acceptable only for non-historical auxiliary data after explicit review.

---

# 27. Prisma Relation Naming

Because Fixture references Team twice, explicit relation names required:

```text
HomeTeamFixtures
AwayTeamFixtures
```

Because Fixture can contain active snapshot plus all snapshots, explicit relation names also required:

```text
FixtureSnapshots
FixtureScoringSnapshot
```

Exact Prisma relation syntax will be defined in `schema.prisma`.

---

# 28. JSON Fields Policy

Use `JSONB` only for provider/raw metadata where schema stability is low.

Allowed candidates:

```text
AdReward.metadata
provider raw metadata
WorkerExecution.metadata
```

Core gameplay fields must not be hidden inside JSON.

Do not store:

```text
Prediction
Tournament scoring
Rating
Prize state
```

as generic JSON.

---

# 29. Provider Abstraction

Current sports provider:

```text
API-Football / API-Sports
```

v0.1 may use direct fields:

```text
providerFixtureId
providerTeamId
providerCompetitionId
```

If multiple provider support becomes real requirement, migrate to:

```text
provider
providerExternalId
```

or separate mapping tables.

Do not prematurely add provider abstraction tables before needed.

---

# 30. Index Strategy by Main Query

## Predict screen

Query:

```text
today fixtures
competition filter
status OPEN
kickoff sort
```

Indexes:

```text
Fixture(kickoffAt, status, competitionId)
```

---

## My Picks

Query:

```text
Prediction by user
current business day / tournament
```

Indexes:

```text
Prediction(userId, createdAt DESC)
Prediction(userId, tournamentId)
```

---

## Weekly Cup

Query:

```text
TournamentParticipant by tournament
ordered by tournamentPoints
```

Index:

```text
TournamentParticipant(tournamentId, tournamentPoints DESC)
```

---

## Rating

Query:

```text
RatingProfile ordered by rating
```

Index:

```text
RatingProfile(rating DESC)
```

---

## Result Worker

Query:

```text
Fixture where status in LOCKED/LIVE
kickoffAt already passed
```

Index:

```text
Fixture(status, kickoffAt)
```

---

## Settlement

Query:

```text
Prediction by fixture and PENDING
```

Index:

```text
Prediction(fixtureId, resultStatus)
```

---

# 31. Data Retention

MVP retention:

```text
Tournament                 indefinite
TournamentParticipant      indefinite
Fixture                    indefinite
OutcomeSnapshot            indefinite
Prediction                 indefinite
RatingHistory              indefinite
Prize / PrizeClaim         indefinite
```

Provider raw/debug data may have shorter retention.

Idempotency records may expire after safe operational period.

AdReward attempt metadata may have bounded retention subject to analytics/legal needs.

---

# 32. Migration Policy

Schema changes only through Prisma Migrations.

Development:

```bash
npx prisma migrate dev
```

Production:

```bash
npx prisma migrate deploy
```

Before destructive production migrations:

```text
backup required
migration review required
rollback/recovery plan required
```

---

# 33. Seed Data

Seed script should create stable catalog data:

```text
Competitions
Achievements
```

Initial Competition codes:

```text
EPL
LALIGA
SERIE_A
BUNDESLIGA
LIGUE_1
UCL
UEL
```

Initial Achievement codes:

```text
FIRST_PICK
FIRST_WIN
ON_FIRE
GIANT_KILLER
SHARPSHOOTER
CHAMPION
ELITE
MASTER
```

Tournament should not normally be seeded in production; lifecycle service owns it.

---

# 34. Open Database Decisions

Still unresolved and must not be silently invented:

1. official Leaderboard tie-breaker fields/index;
2. exact postponed/cancelled/rescheduled Fixture representation;
3. exact provider odds/bookmaker metadata required;
4. whether multiple candidate OutcomeSnapshots are persisted or only published snapshot;
5. Telegram re-registration behavior after anonymized account deletion;
6. exact PrizeClaim wallet validation fields;
7. whether manual payout needs separate operator audit entity;
8. whether season entities are required for v0.1;
9. whether Notification entities are needed in MVP;
10. whether provider raw payloads are retained.

---

# 35. Suggested Prisma Models

Expected Prisma model list:

```text
User
Competition
Team
Tournament
TournamentParticipant
Fixture
OutcomeSnapshot
Prediction
DailyPredictionUsage
AdReward
RatingProfile
RatingHistory
Achievement
UserAchievement
Prize
PrizeClaim
IdempotencyRecord
```

Optional:

```text
WorkerExecution
```

---

# 36. Schema Acceptance Criteria

Database model is acceptable when all of the following hold:

- every internal primary key is UUID;
- Telegram/provider IDs are external IDs, not internal PKs;
- TON is stored as `BigInt` nanoTON;
- probabilities/odds use Decimal/Numeric;
- User has unique `telegramUserId`;
- Competition and Team are separate entities;
- Fixture references Competition + two Team relations;
- immutable published OutcomeSnapshot exists;
- Prediction points/probability snapshot is retained;
- one User has max one Prediction per Fixture;
- Daily quota has database constraints;
- rewarded Prediction has one-time AdReward semantics;
- TournamentParticipant stores leaderboard aggregates;
- current Global Rank is not persisted as source of truth;
- RatingHistory is immutable and unique per User/Tournament;
- Prize and PrizeClaim are separate;
- historical gameplay rows are not cascade-deleted;
- indexes support Predict, Cup, Rating and Settlement paths;
- all critical mutations have transactional boundaries;
- duplicate/retry execution cannot create duplicate business effects.

---

# 37. Next Step

После фиксации этого документа следующий artifact:

```text
prisma/schema.prisma
```

Он должен быть механическим выражением `DB_SCHEMA.md`, а не местом для новых product/architecture decisions.

После `schema.prisma` рекомендуется создать:

```text
AGENTS.md
```

с инструкцией Codex всегда читать:

```text
docs/PRODUCT_SPEC.md
docs/TECH_SPEC.md
docs/DB_SCHEMA.md
```

до изменения product/domain behavior.

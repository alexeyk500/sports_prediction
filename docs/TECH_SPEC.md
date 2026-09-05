# TECH_SPEC.md

# Sports Prediction Tournament — Technical Spec v0.1

**Status:** Working technical baseline  
**Platform:** Telegram Mini App  
**Product source of truth:** `docs/PRODUCT_SPEC.md`  
**Language policy:** архитектурные объяснения — русский; code entities, enums, API paths, field names и программные идентификаторы — English.

---

## 1. Назначение документа

Этот документ описывает, **как технически реализуется** поведение, зафиксированное в `PRODUCT_SPEC.md`.

При конфликте между документами действует следующий приоритет:

1. `PRODUCT_SPEC.md` — source of truth для product/business rules.
2. `TECH_SPEC.md` — source of truth для architecture/implementation rules.
3. `DB_SCHEMA.md` — source of truth для database structure после его появления.
4. Код должен соответствовать этим документам.

Если реализация требует изменить product rule, сначала изменяется `PRODUCT_SPEC.md`, затем связанные технические документы, и только после этого код.

---

# 2. Technology Stack

## 2.1 Frontend

- **Next.js** — latest stable version на момент implementation.
- **React**
- **TypeScript**
- **App Router only**
- **CSS Modules**
- **Zustand** для client-side application/UI state.
- Собственная реализация server-state/data fetching без TanStack Query.
- Telegram Mini App environment.

Не использовать Pages Router.

---

## 2.2 Backend

Backend является частью того же Next.js project.

Основной transport между frontend и backend:

```text
/api/...
```

через **Next.js Route Handlers**.

`Server Actions` могут использоваться точечно для внутренних server-driven сценариев, но:

- не являются основным public/internal API transport;
- не должны содержать уникальную business logic;
- business logic должна находиться в domain/service layer и быть доступна Route Handlers и Workers.

---

## 2.3 Database

- **PostgreSQL**
- PostgreSQL запускается в **Docker**
- **Prisma ORM**
- Redis в v0.1 не используется.

Все критичные ограничения должны обеспечиваться не только application code, но по возможности также:

- database constraints;
- unique indexes;
- foreign keys;
- transactions.

---

## 2.4 Infrastructure

```text
Internet
   │
   ▼
Nginx
   │
   ▼
Next.js Node.js process
   │
   ├── PostgreSQL (Docker)
   │
   └── shared domain/services
          ▲
          │
    Worker processes
```

Deployment:

- VPS under project control.
- Nginx as reverse proxy.
- Next.js запускается как Node.js service через `systemd`.
- Workers запускаются как отдельные Node.js processes/services через `systemd`.
- Scheduled workers запускаются через `systemd timers` либо другой системный scheduler, но business logic живёт в Node.js codebase.
- PM2 не является базовым runtime manager v0.1.

---

# 3. Repository Structure

Базовая структура:

```text
project/
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── TECH_SPEC.md
│   └── DB_SCHEMA.md
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── scripts/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   └── ...
│   │
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── tournaments/
│   │   ├── fixtures/
│   │   ├── predictions/
│   │   ├── ratings/
│   │   ├── prizes/
│   │   └── ads/
│   │
│   ├── lib/
│   │   ├── prisma/
│   │   ├── telegram/
│   │   ├── sports-api/
│   │   ├── time/
│   │   ├── logger/
│   │   └── errors/
│   │
│   ├── stores/
│   ├── hooks/
│   ├── components/
│   └── workers/
│       ├── fixture-sync/
│       ├── odds-sync/
│       ├── result-sync/
│       ├── settlement/
│       ├── tournament-lifecycle/
│       └── rating-finalization/
│
├── AGENTS.md
├── package.json
└── ...
```

Структура может уточняться без изменения архитектурного принципа.

---

# 4. Domain Layer Rules

## 4.1 Route Handlers должны быть thin

Route Handler отвечает за:

1. authentication;
2. input parsing;
3. validation;
4. вызов domain/service method;
5. преобразование результата в HTTP response.

Route Handler **не должен** содержать:

- прямые сложные Prisma queries;
- scoring formulas;
- quota calculation;
- settlement logic;
- tournament finalization;
- rating calculation.

Пример:

```ts
export async function POST(request: Request) {
  const auth = await requireTelegramUser(request);
  const input = await parseCreatePredictionRequest(request);

  const result = await predictionService.createPrediction({
    userId: auth.userId,
    ...input,
  });

  return Response.json(result);
}
```

---

## 4.2 Module structure

Рекомендуемая структура module:

```text
modules/predictions/
├── prediction.service.ts
├── prediction.repository.ts
├── prediction.domain.ts
├── prediction.types.ts
├── prediction.errors.ts
└── prediction.validation.ts
```

`service` orchestration layer.

`repository` инкапсулирует persistence access.

`domain` содержит pure business calculations/rules, когда это возможно.

---

## 4.3 Shared business logic

Workers и HTTP backend используют **один и тот же** domain/service code.

Worker не должен обращаться HTTP-запросом к собственному Next.js backend, если ту же операцию можно вызвать напрямую через shared module.

---

# 5. Authentication

## 5.1 Telegram Mini App Auth

Основной login mechanism:

```text
Telegram Mini App initData
```

Frontend передаёт Telegram `initData` backend.

Backend обязан выполнять server-side validation согласно официальному Telegram Mini Apps algorithm.

For v0.1 authenticated API requests pass Telegram Mini App `initData`
in the HTTP header:

```text
X-Telegram-Init-Data
```

The backend validates `hash`, parses `auth_date`, rejects expired
`initData`, and resolves the internal `User` from the validated
Telegram user payload. Default max age:

```text
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS=86400
```

`TELEGRAM_BOT_TOKEN` is server-side only and must never be returned to
the client.

Нельзя доверять:

- `user.id`, переданному frontend отдельно;
- username;
- query parameters;
- client-generated auth state.

После успешной проверки backend определяет authenticated Telegram user и internal `User`.

---

## 5.2 User bootstrap

При первом валидном authenticated request:

```text
Telegram user
      ↓
find User by telegramUserId
      ↓
create if absent
      ↓
return internal user context
```

Поля Telegram profile могут синхронизироваться при последующих сессиях.

`telegramUserId` должен быть unique.

---

## 5.3 Session strategy

Для MVP допустимы два варианта:

1. валидировать `initData` на authenticated API requests;
2. после первичной validation выдавать server-controlled session.

По умолчанию для v0.1 предпочтителен простой server-controlled session/token после Telegram validation, если это заметно уменьшает повторную crypto validation cost.

Конкретная session implementation фиксируется при реализации auth module.

Нельзя создавать password/email login.

---

# 6. Time Model

## 6.1 Storage timezone

Все timestamps в PostgreSQL:

```text
UTC
```

Использовать timezone-aware timestamps.

Основные поля:

```text
kickoffAt
startsAt
endsAt
snapshotAt
settledAt
createdAt
updatedAt
```

---

## 6.2 Business timezone

Canonical business timezone:

```text
Europe/London
```

Она используется для:

- Weekly Cup boundaries;
- Daily Prediction reset;
- определения current calendar day;
- Daily Match Pool eligibility.

Нельзя реализовывать London timezone через фиксированный offset.

Нужно использовать IANA timezone:

```text
Europe/London
```

чтобы автоматически учитывать:

- GMT;
- BST;
- DST transitions.

---

## 6.3 Daily boundaries

`calendarDay` определяется в `Europe/London`.

Пример:

```text
2026-09-04 Europe/London
```

должен быть преобразован в соответствующий UTC interval:

```text
dayStartUtc <= kickoffAt < nextDayStartUtc
```

Все Daily Prediction Usage операции используют ту же функцию определения business day.

В проекте должен существовать единый time utility, например:

```ts
getBusinessDate(now)
getBusinessDayRangeUtc(date)
getCurrentTournamentWindow(now)
```

Frontend не определяет Daily Reset самостоятельно как source of truth.

---

# 7. Core Domain Entities

Полная database definition будет находиться в `DB_SCHEMA.md`.

В архитектуре фиксируются следующие основные entities:

```text
User
Tournament
TournamentParticipant
Fixture
OutcomeSnapshot
Prediction
DailyPredictionUsage
RatingProfile
RatingHistory
Achievement
UserAchievement
AdReward
Prize
PrizeClaim
```

---

# 8. Tournament Architecture

## 8.1 Tournament lifecycle

Рекомендуемый enum:

```ts
enum TournamentStatus {
  SCHEDULED
  ACTIVE
  FINALIZING
  FINISHED
}
```

Основной lifecycle:

```text
SCHEDULED
   ↓
ACTIVE
   ↓
FINALIZING
   ↓
FINISHED
```

`FINALIZING` нужен, чтобы Tournament перестал принимать новый gameplay, но backend мог дождаться окончательного Settlement относящихся к турниру Fixture и выполнить Rating Finalization.

---

## 8.2 Tournament creation

`tournament-lifecycle` Worker:

- гарантирует наличие следующего Tournament;
- активирует Tournament в `startsAt`;
- переводит предыдущий в `FINALIZING`;
- после необходимых Settlement выполняет finalization;
- запускает Rating Finalization;
- создаёт Prize records;
- переводит Tournament в `FINISHED`.

Операции должны быть idempotent.

---

## 8.3 TournamentParticipant

`TournamentParticipant` создаётся автоматически при первой успешно сохранённой `Prediction` пользователя в Tournament.

Не существует отдельной `joinTournament()` операции для обычного пользователя.

В entity хранятся агрегаты Weekly Cup, как минимум:

```text
tournamentPoints
predictionsCount
correctPredictionsCount
rank-related derived/cache fields where needed
```

---

# 9. Leaderboard Architecture

Leaderboard не пересчитывает `SUM(Prediction.points)` по всей таблице при каждом frontend request.

`TournamentParticipant` хранит актуальные агрегаты.

При Settlement correct Prediction в одной transaction обновляются:

```text
Prediction
TournamentParticipant.tournamentPoints
TournamentParticipant.correctPredictionsCount
```

`predictionsCount` обновляется при создании Prediction.

---

## 9.1 Ranking

Ranking вычисляется по индексируемым aggregate fields.

Основной порядок:

```text
tournamentPoints DESC
```

Окончательные tie-break rules пока остаются Open Decision в Product Spec.

До их фиксации нельзя случайно делать `createdAt` или `userId` product-level tie breaker.

Для deterministic DB query допустим технический final sort по stable unique key, но он не должен считаться официальным спортивным tie breaker.

---

## 9.2 Leaderboard queries

Backend должен эффективно поддерживать:

```text
Top N
User current rank
User rank neighborhood
Prize zone
pointsToPrizeZone
```

При росте нагрузки допускаются:

- materialized ranking;
- scheduled rank cache;
- Redis;
- separate leaderboard service.

Но Redis не добавляется в v0.1 без измеренной необходимости.

---

# 10. Fixture Architecture

## 10.1 Fixture

Минимальная domain model:

```ts
Fixture {
  id
  providerFixtureId
  competitionCode
  homeTeam
  awayTeam
  kickoffAt
  status
  scoringSnapshotId
}
```

---

## 10.2 FixtureStatus

Product lifecycle:

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

Backend может хранить дополнительные provider-specific statuses отдельно, но product status должен оставаться provider-agnostic.

---

# 11. Daily Match Pool

Отдельная entity/table:

```text
DailyMatchPool
```

**не создаётся**.

Daily Match Pool — derived query из `Fixture`.

Основные условия:

```text
kickoffAt within current Europe/London business day
competitionCode in supportedCompetitions
Fixture is eligible for display
scoringSnapshotId is not null
```

Доступность для нового Prediction дополнительно требует:

```text
status = OPEN
now < kickoffAt
```

---

# 12. Odds and OutcomeSnapshot

## 12.1 Immutability

`OutcomeSnapshot` после публикации immutable.

Пример:

```ts
OutcomeSnapshot {
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
}
```

Точные поля определяются в `DB_SCHEMA.md`.

---

## 12.2 Snapshot lifecycle

До публикации Fixture может существовать несколько candidate/internal odds samples.

Но один `Fixture` имеет один активный:

```text
scoringSnapshotId
```

После перехода Fixture в `OPEN`:

```text
scoringSnapshotId
```

не заменяется обычным odds refresh.

Таким образом пользователь всегда получает те же displayedPoints, которые были опубликованы.

---

## 12.3 Scoring

Scoring source of truth:

```text
PRODUCT_SPEC.md
```

v0.1:

```ts
points = clamp(round(6.5 / normalizedProbability), 7, 50)
```

Scoring logic должна быть pure function и покрыта unit tests.

---

# 13. Prediction Architecture

## 13.1 Create Prediction

`createPrediction()` является критичной transactional operation.

В одной PostgreSQL transaction необходимо:

1. определить authenticated `User`;
2. получить Active Tournament;
3. получить `Fixture`;
4. проверить `Fixture.status`;
5. проверить `now < kickoffAt`;
6. проверить selected `Outcome`;
7. определить business `calendarDay`;
8. получить/создать `DailyPredictionUsage`;
9. проверить free/rewarded quota;
10. при необходимости проверить валидный unused `AdReward`;
11. создать `TournamentParticipant`, если его ещё нет;
12. создать `Prediction`;
13. увеличить `DailyPredictionUsage`;
14. увеличить `TournamentParticipant.predictionsCount`;
15. пометить использованный `AdReward`, если применимо;
16. commit.

Если любой шаг не проходит, transaction rollback.

---

## 13.2 Race condition protection

Нельзя полагаться только на:

```ts
if (usage < 8)
```

в application memory.

Нужно сочетать:

- transaction;
- unique constraints;
- atomic updates;
- row locking / suitable isolation where required.

Цель:

два параллельных requests не могут создать:

- 9-ю Prediction;
- двойное использование одного `AdReward`;
- duplicate Prediction для `User + Fixture`.

---

## 13.3 Prediction uniqueness

Для одного User и Fixture существует максимум одна active Prediction.

Рекомендуемый DB constraint:

```text
UNIQUE(userId, fixtureId)
```

Изменение Outcome выполняется через `updatePrediction()`, а не созданием второй Prediction.

---

## 13.4 Update Prediction

До `kickoffAt` пользователь может изменить `selectedOutcome`.

Server-side invariant:

```text
now < fixture.kickoffAt -> update permitted
now >= fixture.kickoffAt -> PREDICTION_LOCKED
```

Проверка выполняется на backend/application layer внутри transaction
boundary с использованием backend time source. Client time не является
authoritative.

`Fixture.status` не является authoritative источником истины для
момента блокировки edit. Если `Fixture.status` используется для других
lifecycle-задач, он не должен преждевременно запрещать пользователю
изменить существующий Prediction до `kickoffAt`.

`updatePrediction()`:

- не увеличивает Daily Usage;
- не создаёт новый TournamentParticipant;
- не расходует новый Rewarded Slot;
- не меняет первоначальный Daily Slot type;
- не потребляет `AdReward` повторно;
- запрещён при `now >= fixture.kickoffAt`.

---

# 14. DailyPredictionUsage

`DailyPredictionUsage` существует для atomic quota enforcement.

Концептуальные поля:

```ts
DailyPredictionUsage {
  userId
  businessDate
  freeUsed
  rewardedUsed
}
```

Constraint:

```text
UNIQUE(userId, businessDate)
```

Business constants:

```ts
FREE_PREDICTION_LIMIT = 3
REWARDED_PREDICTION_LIMIT = 5
DAILY_PREDICTION_LIMIT = 8
```

Неиспользованные значения не переносятся.

---

# 15. Rewarded Ads Architecture

Provider:

```text
Monetag
```

Rewarded flow:

```text
User selects Outcome
   ↓
Free quota exhausted?
   ↓ yes
Frontend requests rewarded flow
   ↓
Monetag ad
   ↓
verified reward completion
   ↓
AdReward created/confirmed
   ↓
createPrediction(..., adRewardId)
```

---

## 15.1 Security rule

Frontend callback:

```text
"ad watched"
```

сам по себе не является достаточным доказательством Reward.

Backend должен использовать strongest verification mechanism, который предоставляет Monetag для выбранного integration mode.

Если provider не предоставляет полноценный signed server callback, техническая схема должна минимизировать client forgery через:

- server-created reward attempt;
- unique attempt ID;
- short expiration;
- one-time consumption;
- replay protection;
- telemetry/anomaly detection.

---

## 15.2 AdReward

`AdReward` должен иметь lifecycle, например:

```ts
enum AdRewardStatus {
  CREATED
  VERIFIED
  CONSUMED
  EXPIRED
  REJECTED
}
```

Один `AdReward` можно использовать максимум один раз.

---

# 16. Settlement Architecture

Settlement разделён на:

```text
result-sync
settlement
```

`result-sync` отвечает за external sports result ingestion.

`settlement` отвечает за internal business consequences.

---

## 16.1 result-sync

Получает от API-Football:

- match status;
- final score;
- final 1X2 outcome;
- provider metadata.

Обновляет provider/result data idempotently.

---

## 16.2 settlement

Для FINISHED Fixture:

1. определить finalOutcome;
2. найти unsettled `Prediction`;
3. для каждой Prediction определить:
   - `CORRECT`;
   - `INCORRECT`;
4. assign `earnedPoints`;
5. обновить `TournamentParticipant`;
6. отметить Prediction settled;
7. перевести Fixture в `SETTLED`.

Settlement должен быть безопасен при повторном запуске.

Повторный Worker run не может второй раз начислить Points.

---

## 16.3 Atomic settlement

Settlement batch может выполняться:

- одной transaction для Fixture, если размер приемлем;
- chunked transactions при большом числе Prediction.

Обязательное требование:

```text
exactly-once business effect
```

даже если технически Worker выполняется at-least-once.

---

# 17. Global Rating Architecture

`rating-finalization` запускается после завершения Tournament и Settlement всех относящихся к нему Prediction.

Source of truth формулы:

```text
PRODUCT_SPEC.md
```

Основные этапы:

1. выбрать `TournamentParticipant` с `predictionsCount >= MIN_RATING_PREDICTIONS`;
2. вычислить Expected Points и Variance по их Prediction;
3. вычислить `Z`;
4. построить distribution qualified field;
5. получить `actualPercentile`;
6. вычислить `expectedPercentile`;
7. определить K;
8. вычислить `ratingDelta`;
9. обновить `RatingProfile`;
10. создать immutable `RatingHistory`.

---

## 17.1 Rating idempotency

Для пары:

```text
(userId, tournamentId)
```

может существовать максимум одна final `RatingHistory`.

Constraint должен предотвращать двойной Rating Update.

---

# 18. Prize Architecture

MVP:

```text
PrizeClaim + manual TON payout
```

Автоматический smart-contract payout не требуется.

После финализации Tournament создаются `Prize` records для winning positions.

---

## 18.1 PrizeClaimStatus

Минимальный enum:

```ts
enum PrizeClaimStatus {
  UNCLAIMED
  CLAIM_PENDING
  PAID
  FAILED
}
```

TON wallet не требуется пользователю до появления claimable Prize.

---

## 18.2 Manual payout

Для MVP оператор:

1. получает PrizeClaim;
2. проверяет wallet;
3. выполняет TON transfer вручную;
4. сохраняет transaction reference/hash;
5. переводит claim в `PAID`.

Admin UI не требуется; операция может выполняться script/DB-assisted tool.

Критичные изменения Prize state должны проходить через application/service function, а не произвольный SQL update, если есть риск нарушить invariants.

---

# 19. Idempotency

Обязательная idempotency для критичных operations:

```text
Prediction creation
Rewarded ad completion
Settlement
Prize claim
Tournament finalization
Rating finalization
```

---

## 19.1 HTTP Idempotency

Для client-created critical requests frontend генерирует:

```text
idempotencyKey
```

например UUID.

For `POST /api/predictions`, the key is sent in:

```text
Idempotency-Key
```

Backend сохраняет key scoped by:

```text
user + operation type
```

Повторный request с тем же key должен вернуть тот же business result, а не выполнить операцию повторно.

---

## 19.2 Worker Idempotency

Worker operations не должны зависеть от того, что scheduler вызовет их ровно один раз.

Каждый Worker должен быть безопасен при:

- retry;
- process restart;
- duplicate timer invocation;
- temporary network failure.

---

# 20. Worker Model

Логически Workers разделяются на:

```text
fixture-sync
odds-sync
result-sync
settlement
tournament-lifecycle
rating-finalization
```

Физически несколько Worker tasks могут запускаться одной command/process, если это не смешивает responsibility и не мешает независимо управлять cadence/retry.

---

## 20.1 Responsibilities

### `fixture-sync`

- получает upcoming Fixtures;
- upsert по `providerFixtureId`;
- обновляет schedule/provider metadata;
- не меняет published scoring snapshot.

### `odds-sync`

- получает Pre-match 1X2 Odds;
- нормализует probabilities;
- рассчитывает candidate Scoring Snapshot;
- публикует `OutcomeSnapshot`;
- переводит eligible Fixture в `OPEN`.

### `result-sync`

- проверяет unresolved Fixtures;
- получает official/final status;
- сохраняет result.

### `settlement`

- рассчитывает Prediction;
- начисляет Weekly Cup Points;
- обновляет aggregate fields.

### `tournament-lifecycle`

- создаёт/активирует/закрывает Tournament;
- orchestrates finalization.

### `rating-finalization`

- выполняет Global Rating calculation;
- создаёт Rating History.

---

## 20.2 Scheduling baseline

Точные intervals являются configuration и могут меняться.

Initial operational baseline:

```text
fixture-sync:
  periodic, several times per day

odds-sync:
  periodic for eligible current/upcoming fixtures

result-sync:
  every few minutes for fixtures past expected finish

settlement:
  immediately after new FINISHED result or frequent short interval

tournament-lifecycle:
  frequent lightweight check, e.g. every minute

rating-finalization:
  triggered/check after tournament becomes finalizable
```

API-Football quota должен ограничивать external polling frequency.

---

# 21. Sports Provider Integration

Provider:

```text
API-Football / API-Sports
```

Provider-specific code располагается:

```text
src/lib/sports-api/
```

Domain modules не должны зависеть от raw provider response structures.

Использовать adapter:

```text
API-Football response
        ↓
SportsProviderAdapter
        ↓
internal DTO/domain model
```

Это позволит в будущем заменить provider без переписывания Prediction/Tournament logic.

---

## 21.1 Request budget

Backend ведёт usage telemetry:

```text
requestsToday
requestsByEndpoint
providerErrors
lastSuccessfulSync
```

При приближении к quota:

1. прекращаются неважные refresh;
2. снижается frequency result polling;
3. Settlement-critical requests имеют приоритет.

---

# 22. API Design

Base prefix:

```text
/api
```

Response payloads используют JSON.

---

## 22.1 Suggested endpoints

### Bootstrap

```http
GET /api/bootstrap
```

Возвращает минимум данных для запуска TMA:

```text
user
activeTournamentSummary
dailyPredictionUsage
ratingSummary
serverTime
businessTimezone
```

---

### Predict

```http
GET /api/fixtures/today
GET /api/predictions/today
POST /api/predictions
PATCH /api/predictions/:predictionId
```

---

### Weekly Cup

```http
GET /api/tournaments/current
GET /api/tournaments/current/leaderboard
GET /api/tournaments/current/me
```

Leaderboard query может принимать:

```text
top
aroundMe
limit
```

---

### Rating

```http
GET /api/ratings/me
GET /api/ratings/leaderboard
GET /api/ratings/history
```

---

### Profile

```http
GET /api/profile
GET /api/profile/cups
GET /api/profile/prizes
GET /api/profile/achievements
```

---

### Rewarded Ads

```http
POST /api/ads/reward-attempts
POST /api/ads/reward-callback
```

Конкретный callback contract зависит от Monetag integration.

---

### Prize

```http
GET  /api/prizes
POST /api/prizes/:prizeId/claim
```

---

# 23. API Error Contract

Использовать единый machine-readable формат:

```json
{
  "error": {
    "code": "DAILY_PREDICTION_LIMIT_REACHED",
    "message": "Daily prediction limit reached",
    "details": {}
  }
}
```

Frontend должен принимать решения по:

```text
error.code
```

а не парсить human-readable `message`.

Примеры codes:

```text
UNAUTHORIZED
INVALID_TELEGRAM_INIT_DATA
NO_ACTIVE_TOURNAMENT
FIXTURE_NOT_FOUND
FIXTURE_NOT_OPEN
FIXTURE_NOT_IN_DAILY_POOL
PREDICTION_LOCKED
PREDICTION_ALREADY_EXISTS
FREE_PREDICTION_LIMIT_REACHED
DAILY_PREDICTION_LIMIT_REACHED
REWARDED_AD_REQUIRED
INVALID_AD_REWARD
AD_REWARD_ALREADY_CONSUMED
PRIZE_NOT_CLAIMABLE
IDEMPOTENCY_CONFLICT
```

---

## 23.1 HTTP Status Policy

Stable mapping:

```text
200 success
201 created Prediction
400 malformed request / validation / non-conflict domain rejection
401 missing, invalid, or expired Telegram initData
404 missing resource
409 duplicate Prediction / idempotency conflict
423 locked Prediction
429 daily quota or rewarded-ad-required limit response
500 unexpected server error
```

Unexpected errors return the standard error envelope without stack
traces, database internals, Prisma details, or secrets.

# 23.2 HTTP Auth Contract

Authenticated endpoints in v0.1:

```text
GET /api/bootstrap
GET /api/fixtures/today
GET /api/predictions/today
POST /api/predictions
PATCH /api/predictions/:predictionId
```

All require `X-Telegram-Init-Data`. Frontend-supplied `userId`,
Telegram user id, username, points, probability, slot type,
tournament id, business date, and snapshot id are not authoritative.

# 24. Validation

Все external input валидируется на Backend.

Рекомендуется использовать одну schema-validation library на проекте, например:

```text
Zod
```

Если команда выберет другую library, она должна быть единой для всех API contracts.

TypeScript type без runtime validation недостаточен.

---

# 25. Frontend Data Fetching

TanStack Query не используется.

Нужна собственная небольшая server-state layer.

Рекомендуемые принципы:

```text
apiClient
request deduplication where useful
AbortController
loading/error states
manual invalidation
background refresh only where product needs it
```

Не строить заранее сложную generic caching framework.

For v0.1 frontend API calls use the custom typed client in
`src/lib/api`. It automatically attaches:

```text
X-Telegram-Init-Data
```

from the frontend Telegram boundary and maps the standard API error
envelope to typed client errors. Do not introduce TanStack Query without
an explicit architecture decision.

Frontend Telegram Mini App access is isolated in `src/lib/telegram`.
Components must not read `window.Telegram` directly. The frontend may
obtain raw `initData` only to forward it to the backend; it must not use
parsed Telegram user data as authentication authority.

Development outside Telegram may use `NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA`
or the browser localStorage key:

```text
sports_prediction_dev_init_data
```

This is development-only. The backend still validates the signed
`initData` with `TELEGRAM_BOT_TOKEN`; there is no production auth bypass.

Generate local development `initData` with:

```text
npm run telegram:dev-init-data
```

The command signs a deterministic development Telegram user with the
server-side `TELEGRAM_BOT_TOKEN`. The generated value can be copied to:

```text
NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA=<generated initData>
```

in `.env.local`. Because `NEXT_PUBLIC_*` values are bundled for the
browser by Next.js, restart `npm run dev` after changing this value.

Optional local write mode:

```text
npm run telegram:dev-init-data -- --write
```

This updates only `NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA` in `.env.local`.
It must not copy secrets into `.env.local`.

---

## 25.1 Data ownership

Server state:

```text
fixtures
predictions
tournament
leaderboard
rating
profile
```

не должен считаться authoritative в Zustand.

Zustand используется прежде всего для client/UI state:

```text
selectedLeagueFilter
activePredictTab
openModal
pendingRewardedPrediction
onboardingState
temporary UI preferences
```

Допускается хранить snapshot server data в store для удобства, но backend остаётся source of truth.

---

# 26. Revalidation / Refresh

Нет необходимости в WebSocket v0.1.

Baseline:

- Predict refresh при app focus/manual action;
- My Picks periodic refresh для unresolved matches;
- Leaderboard refresh после Settlement-related events и при открытии Cup;
- Rating меняется только после Weekly Cup finalization;
- Profile загружается on demand.

Если real-time usage станет важным, первым кандидатом является SSE/WebSocket, но это не MVP requirement.

---

# 27. Security

## 27.1 Mandatory

- Telegram `initData` server validation.
- HTTPS only.
- Secrets только server-side.
- Sports API key не попадает frontend bundle.
- PostgreSQL не открыт публично.
- Nginx exposes only required web ports.
- Input validation.
- Rate limiting для mutation endpoints.
- Idempotency.
- Audit logs для Prize/Claim.
- Database transactions для money/points/quota-critical operations.

---

## 27.2 Prediction integrity

Backend проверяет:

```text
now < fixture.kickoffAt
```

на момент transaction.

Frontend countdown не является security control.

---

## 27.3 Anti-abuse baseline

MVP собирает telemetry для:

- many accounts/device patterns where observable;
- abnormal Rewarded Ad completion;
- repeated failed idempotency;
- impossible request rates;
- suspicious Prize Claim changes.

Сложный anti-fraud engine не входит в v0.1.

---

# 28. Rate Limiting

Даже без Redis должен существовать basic rate limiting.

На одном VPS допустим in-process limiter для low-risk read endpoints.

Для critical mutation protection предпочтительны DB-enforced invariants и при необходимости PostgreSQL-backed limiting.

Нельзя полагаться на in-memory limiter для correctness.

---

# 29. Logging and Observability

Использовать structured logging.

Каждый log event должен по возможности иметь:

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

Не логировать Telegram `initData` целиком.

---

## 29.1 Worker logs

Для каждого Worker:

```text
startedAt
finishedAt
duration
itemsProcessed
itemsUpdated
providerRequests
errors
```

Systemd journal является первым operational log store MVP.

---

## 29.2 Health endpoints

Добавить:

```http
GET /api/health
```

Минимум:

```text
app status
database connectivity
version/build identifier
```

Отдельный internal diagnostic script может проверять:

- Sports API last sync;
- active Tournament;
- unresolved Fixture;
- Worker freshness.

---

# 30. Deployment

## 30.1 Nginx

Nginx:

- terminates HTTPS;
- reverse proxies to local Next.js port;
- sets forwarding headers;
- optionally handles compression/static cache where safe.

---

## 30.2 Next.js systemd service

Conceptual:

```text
sports-app.service
```

Responsibilities:

```text
npm run start
restart on failure
environment file
working directory
dedicated Unix user
```

---

## 30.3 Worker services/timers

Examples:

```text
sports-fixture-sync.service
sports-fixture-sync.timer

sports-result-sync.service
sports-result-sync.timer

sports-settlement.service
sports-settlement.timer

sports-tournament-lifecycle.service
sports-tournament-lifecycle.timer
```

При объединении Worker command названия могут измениться.

---

# 31. PostgreSQL Docker

PostgreSQL запускается через Docker Compose либо equivalent Docker setup.

Минимальные требования:

- persistent volume;
- non-default strong password;
- bind only to local/private interface where possible;
- automatic restart;
- healthcheck;
- backups.

Пример topology:

```text
Next.js host process
      │
      └── localhost/private Docker bridge
              │
              ▼
         PostgreSQL
```

---

# 32. Database Backups

С самого MVP нужны автоматические backups.

Baseline:

- регулярный `pg_dump`;
- retention нескольких поколений;
- backup хранится вне единственного PostgreSQL volume;
- периодическая проверка restore procedure.

Перед schema migration production backup обязателен.

---

# 33. Prisma Migration Policy

Использовать Prisma Migrations.

Development:

```text
prisma migrate dev
```

Production:

```text
prisma migrate deploy
```

Нельзя использовать destructive schema push на production как обычный deployment mechanism.

---

# 34. Environment Configuration

Пример env groups:

```text
# App
NODE_ENV
APP_URL

# Database
DATABASE_URL

# Telegram
TELEGRAM_BOT_TOKEN
TELEGRAM_INIT_DATA_MAX_AGE_SECONDS
NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA

# Sports
API_FOOTBALL_KEY
API_FOOTBALL_BASE_URL

# Monetag
MONETAG_...

# TON
TON_NETWORK
TON_...

# Business
BUSINESS_TIMEZONE=Europe/London
```

Secrets не хранятся в git.

---

# 35. Development Seed

Local UI development without API-Football may use:

```text
npm run db:seed:dev
```

The seed is development-only and must refuse `NODE_ENV=production`.
It creates deterministic demo data for the current Europe/London
business day:

```text
active Tournament
supported active Competitions
Teams
today Fixtures
published OutcomeSnapshots with fixed probabilities/points
```

The seed must be safe to re-run. It does not create production data,
does not call API-Football, does not simulate Monetag success, and does
not create TON state.

Manual local Predict workflow:

```text
1. configure TELEGRAM_BOT_TOKEN
2. npm run db:seed:dev
3. npm run telegram:dev-init-data
4. copy NEXT_PUBLIC_TELEGRAM_DEV_INIT_DATA to .env.local
5. npm run dev
6. open http://localhost:3000
```

---

# 36. Testing Strategy

## 35.1 Unit tests

Обязательно для:

```text
scoring formula
odds normalization
business-day calculation
prediction quota rules
fixture eligibility
rating calculations
tie-break implementation once defined
```

---

## 35.2 Integration tests

С реальной PostgreSQL test database:

```text
createPrediction transaction
concurrent Prediction attempts
AdReward one-time consumption
settlement idempotency
TournamentParticipant aggregate updates
RatingHistory uniqueness
PrizeClaim transitions
```

---

## 35.3 Concurrency tests

Отдельно проверить:

```text
two simultaneous 8th-prediction requests
same AdReward consumed twice
two settlement workers
duplicate rating-finalization run
duplicate PrizeClaim request
```

---

# 37. Performance Principles

Сразу строим architecture, допускающую рост, но без premature distributed systems.

v0.1:

```text
1 VPS
1 Next.js application
1 PostgreSQL
multiple Worker processes
Nginx
no Redis
no message broker
```

Переход к:

```text
Redis
queue
separate API service
read replicas
multiple app instances
dedicated leaderboard service
```

должен выполняться по измеренной нагрузке.

Domain boundaries должны позволять такой split без переписывания business rules.

---

# 38. Scaling Boundaries

Компоненты, которые должны быть отделимы в будущем:

```text
Sports ingestion
Settlement
Leaderboard
Rating finalization
Ad verification
Prize payout
```

Именно поэтому они не должны быть tightly coupled с React/Route Handler code.

---

# 39. Open Technical Decisions

До Implementation Freeze необходимо дополнительно зафиксировать:

1. точные `Weekly Cup startsAt/endsAt` в `Europe/London`;
2. official Leaderboard Tie Breakers;
3. Fixture policy для:
   - POSTPONED;
   - CANCELLED;
   - ABANDONED;
   - RESCHEDULED;
4. конкретный Odds Source/Bookmaker selection внутри API-Football;
5. когда именно публикуется immutable `OutcomeSnapshot`;
6. точную server/session implementation после Telegram `initData`;
7. Monetag reward verification contract;
8. точную Global Rating `expectedPercentile` implementation после simulation;
9. exact notification architecture;
10. TON wallet format/validation и manual payout operational procedure.

---

# 40. Explicit Non-Goals v0.1

Не добавлять без отдельного product/technical decision:

```text
Redis
Kafka/RabbitMQ
microservices
Kubernetes
GraphQL
WebSocket infrastructure
separate auth provider
email/password accounts
automatic smart-contract payouts
complex admin panel
live betting/prediction
```

---

# 40. Implementation Order

Рекомендуемый порядок реализации:

```text
1. Project foundation
2. Prisma/PostgreSQL
3. Telegram Auth
4. Tournament lifecycle
5. Fixture + OutcomeSnapshot ingestion
6. Predict API + quota transaction
7. Predict UI
8. Settlement
9. Weekly Cup leaderboard
10. Rewarded Ads
11. Global Rating
12. Profile
13. PrizeClaim/manual payout flow
14. Observability / hardening
```

---

# 41. Technical Acceptance Criteria v0.1

Архитектура соответствует этому Technical Spec, если:

- frontend не доверяется для auth, quota, kickoff lock, points или payout state;
- все critical Prediction operations атомарны;
- один `AdReward` нельзя использовать дважды;
- Settlement можно безопасно повторить;
- Rating Finalization можно безопасно повторить;
- published `OutcomeSnapshot` не изменяется;
- all timestamps хранятся UTC, product calendar работает через `Europe/London`;
- Leaderboard использует `TournamentParticipant` aggregates;
- Workers используют shared domain logic без self-HTTP;
- API имеет единый error contract;
- Sports Provider изолирован adapter layer;
- PostgreSQL имеет backups и Prisma migrations;
- приложение может быть разделено на отдельные services в будущем без переписывания core domain rules.

---

# 42. Architecture Summary

```text
Telegram Mini App
      │
      ▼
     Nginx
      │
      ▼
Next.js App Router
      │
      ├── React / TypeScript / CSS Modules
      ├── Route Handlers /api/*
      ├── Zustand UI state
      │
      ▼
Domain / Service Layer
      │
      ├── Predictions
      ├── Tournaments
      ├── Fixtures
      ├── Ratings
      ├── Ads
      └── Prizes
      │
      ├─────────────► API-Football
      │
      ▼
Prisma
      │
      ▼
PostgreSQL (Docker)

Separate Node.js Workers
      │
      └── reuse same Domain / Service Layer
```

**Основной архитектурный принцип:** PostgreSQL и Backend являются source of truth для gameplay. Frontend отображает состояние и инициирует действия, но не определяет auth, quota, Tournament eligibility, scoring, Settlement или Prize state.

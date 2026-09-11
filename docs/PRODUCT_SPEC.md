# Goalstery — Product Specification

**Product Spec v0.1**

Продуктовые требования, user-facing behavior и бизнес-правила MVP.

|              |                                             |
| ------------ | ------------------------------------------- |
| **Status**   | Working baseline specification              |
| **Platform** | Telegram Mini App                           |
| **Language** | Описание — русский; code entities — English |

Этот документ является product/domain source of truth. Архитектурные, database, testing и visual implementation details принадлежат соответствующим специализированным specs и не должны дублироваться здесь.

---

# 1. Product Definition

Goalstery — бесплатный еженедельный турнир футбольных прогнозистов внутри Telegram.

Пользователь:

```text
выбирает исходы матчей 1X2
→ получает Tournament Points в зависимости от вероятности исхода
→ соревнуется в Weekly Cup
→ может получить заранее объявленный Prize в TON
→ формирует долгосрочный Global Rating
```

Product boundary:

```text
free-to-play
no deposit
no stake
no paid entry
no Prediction purchase
no convertible/transferable Points
no odds × stake payout
no random prize lottery
```

Победители определяются совокупностью Prediction.

TON используется для заранее определённых Tournament prizes.

---

# 2. Product Loops

| Loop       | Period        | Purpose                                           |
| ---------- | ------------- | ------------------------------------------------- |
| Daily      | Calendar day  | Match Pool, 3 Free + up to 5 Rewarded Predictions |
| Weekly Cup | Week          | Tournament, Leaderboard, TON prizes               |
| Long-term  | Multiple Cups | Global Rating, League, Profile, Career            |

---

# 3. Weekly Cup

В каждый момент существует один Active Weekly Cup.

Weekly Cups идут непрерывно:

```text
current Cup ends
→ next Cup starts
```

Rules:

- Cup запускается по недельному расписанию независимо от participants count.
- Отдельной регистрации нет.
- Первая valid Prediction автоматически создаёт Tournament Participation.
- User может присоединиться в любой момент недели.
- Late-entry compensation отсутствует.
- Daily Prediction Slots не переносятся между business days.
- Tournament Points обнуляются при старте нового Cup.
- Prize Pool фиксируется до открытия Cup и не меняется внутри него.
- Exact Prize Distribution по местам для MVP будет спроектирована позднее и не должна молча выводиться из текущего примера/implementation.

Первый эксперимент: ориентир около 100 Players и 10 TON Prize Pool. Количество Players не является условием старта.

## 3.1 Prize Distribution

Exact Prize Distribution по winning places для MVP пока не утверждена.

До отдельного решения нельзя считать конкретные rank → amount значения частью authoritative product contract.

Первый эксперимент сохраняет ориентир:

```text
Prize Pool ≈ 10 TON
```

но распределение Prize Pool между местами будет разработано позднее.

Точная weekly boundary определяется отдельным approved decision.

---

# 4. Daily Predictions

Canonical business timezone:

```text
Europe/London
```

Daily Match Pool и Daily Prediction quota используют London calendar day.

Limits:

```text
FREE_PREDICTION_LIMIT = 3
REWARDED_PREDICTION_LIMIT = 5
DAILY_PREDICTION_LIMIT =
  FREE_PREDICTION_LIMIT + REWARDED_PREDICTION_LIMIT // currently 8
```

These are centralized product/domain configuration constants. Application/UI logic must not scatter literal `3`, `5` or `8` as independent quota rules. Changing the configured limits later must be a deliberate synchronized product/code/test change.

Rules:

- New Prediction доступна только для Fixture текущего London calendar day.
- На завтрашние и более поздние Fixture заранее прогнозировать нельзя.
- Unused slots не переносятся.
- Rewarded Ad даёт право сохранить конкретную intended Prediction; отдельного user-facing Ticket/Token нет.
- Prediction остаются в My Picks после kickoff и Settlement.
- При 8/8 новые Prediction блокируются до следующего London business day.

## 4.1 Editing

Existing Prediction можно изменить строго по правилу:

```text
now < fixture.kickoffAt
→ edit allowed

now >= fixture.kickoffAt
→ PREDICTION_LOCKED
```

Editing до kickoff не зависит от:

```text
Fixture.status === OPEN
```

При edit:

```text
selectedOutcome may change
slotType does not change
DailyPredictionUsage does not increase
predictionsCount does not increase
Rewarded AdReward is not consumed again
original scoring snapshot remains attached
```

Backend remains authoritative regardless of client state or Sports API delay.

## 4.2 Cancellation

Before kickoff, tapping the already selected outcome cancels that Prediction.

Cancellation:

```text
removes Prediction from My Picks
recomputes DailyPredictionUsage from the total remaining Predictions
decrements predictionsCount
does not restore consumed rewarded AdReward
```

Free-vs-rewarded requirement for the next new Prediction is determined by the
total number of current Predictions for the business day. If the user already
has at least `FREE_PREDICTION_LIMIT` current Predictions, the next Prediction
requires a new rewarded ad even if the cancelled Prediction originally used a
FREE slot.

For a REWARDED Prediction, the already consumed AdReward remains spent
permanently. The next rewarded Prediction requires a new rewarded ad completion.

At or after kickoff:

```text
cancel → PREDICTION_LOCKED
```

---

# 5. Daily Match Pool

MVP competitions:

1. Premier League
2. La Liga
3. Serie A
4. Bundesliga
5. Ligue 1
6. UEFA Champions League
7. UEFA Europa League

В Daily Match Pool входят все eligible Fixture этих competitions текущего London calendar day.

Искусственного лимита Fixture на Competition нет.

Fixture eligible для новой Prediction только при наличии опубликованного valid pre-match 1X2 Scoring Snapshot и выполнении остальных product rules.

Ориентир полной активной недели: примерно 50–70+ eligible Fixture в зависимости от календаря.

---

# 6. Scoring v1

Для каждого 1X2 Outcome используется normalized probability `p`.

Tournament Points:

```text
points = clamp(round(6.5 / p), 7, 50)
```

Equivalent implementation:

```ts
Math.round(Math.min(50, Math.max(7, 6.5 / probability)));
```

Rules:

```text
Correct Prediction   → fixed potential/displayed Points
Incorrect Prediction → 0 Points
```

Нет:

```text
negative Points
Streak Multiplier
additional Tournament Score Bonus
```

Scoring Snapshot immutable после публикации.

Prediction сохраняет scoring evidence исходного snapshot. Edit selectedOutcome не переводит Prediction на более новый snapshot.

Scoring имеет versioned semantics через `scoringVersion`.

`MAX_POINTS = 50` ограничивает влияние единичного экстремального longshot.

| Probability | Points |
| ----------: | -----: |
|         75% |      9 |
|         65% |     10 |
|         55% |     12 |
|         45% |     14 |
|         35% |     19 |
|         25% |     26 |
|         20% |     33 |
|         15% |     43 |
|        ≤13% | 50 cap |

В domain/API/database значение называется `Points`.

В compact UI scoring value представляется как:

```text
trophy icon + numeric value
```

Это presentation metaphor, а не переименование domain concept.

Detailed numeric persistence/rounding rules belong in `docs/DB_SCHEMA.md` / technical specs.

---

# 7. Fixture and Prediction Result Experience

High-level Fixture lifecycle:

```text
DRAFT → OPEN → LOCKED → LIVE → FINISHED → SETTLED
```

| Status   | Product meaning                              |
| -------- | -------------------------------------------- |
| DRAFT    | Fixture ещё не опубликован для Prediction    |
| OPEN     | Fixture доступен для new Prediction          |
| LOCKED   | Kickoff boundary reached                     |
| LIVE     | Match in progress; Prediction result pending |
| FINISHED | Final result received                        |
| SETTLED  | Prediction results/Points applied            |

Important:

Existing Prediction editability определяется kickoff rule из §4.1, а не `Fixture.status === OPEN`.

До Settlement UI показывает neutral Pending state.

После Settlement UI отражает earned Points и актуальное Tournament state.

Worker polling/timing/batching mechanics принадлежат `docs/TECH_SPEC.md`.

Policy для postponed/cancelled/abandoned/rescheduled Fixture остаётся Open Decision.

---

# 8. Information Architecture

Bottom Navigation:

| Item    | Purpose                                     |
| ------- | ------------------------------------------- |
| Matches | Today's Fixtures, Prediction, My Picks      |
| Cup     | Current Weekly Cup, Prize Zone, Leaderboard |
| History | Current Cup prediction history              |
| Profile | Career, History, Achievements, Prizes       |

Settings не является отдельным Bottom Navigation item и открывается из Profile.

Matches — default landing screen при обычном запуске.

---

# 9. Matches Screen

Matches должен давать быстрый путь от открытия приложения до Prediction.

Core content:

```text
Weekly Cup summary
Daily quota
Available / My Picks
Competition filter
Fixture cards
```

Available Fixtures сортируются прежде всего по `kickoffAt`.

MatchCard показывает:

```text
Competition identity
home Team identity
away Team identity
kickoff time
1 / X / 2 outcomes
trophy + numeric scoring value
```

Presentation mapping:

```text
HOME → 1
DRAW → X
AWAY → 2
```

Основной UI не имитирует bookmaker odds interface.

Competition/team logos используются при наличии canonical local asset; missing asset имеет graceful fallback.

Outcome tap:

```text
eligible FREE slot
→ create Prediction immediately
```

Confirmation modal отсутствует.

Когда Free quota исчерпана:

```text
Outcome tap
→ Rewarded Prediction flow for that intended Fixture/Outcome
```

Rewarded Ad не запускается автоматически.

После verified rewarded completion Backend сохраняет intended Prediction согласно product rules.

Повторный tap на уже выбранный outcome до kickoff отменяет Prediction вместо
повторного сохранения того же outcome.

My Picks показывает relevant OPEN/LOCKED/LIVE/SETTLED Prediction и summary metrics.

Exact visual contract belongs in design specs.

---

# 10. Weekly Cup Screen

Core information:

```text
Cup identity
Prize Pool
endsAt
participants count
User rank
Tournament Points
predictions count
accuracy
Prize Zone status/gap
Prize Distribution
Leaderboard
user rank neighborhood
```

Если User ещё не участвует:

```text
NOT_PARTICIPATING
→ CTA to first Prediction
```

Отдельной Join button нет.

Вне Prize Zone UI показывает progress/gap и CTA к Matches.

В Prize Zone UI показывает current Prize и competitive gaps.

История прошлых Weekly Cups находится в Profile.

---

# 11. Global Rating

Global Rating оценивает качество Prediction, а не накопленную активность.

Weekly Cup score и Global Rating намеренно являются разными competitive metrics.

Rating пересчитывается после завершения Weekly Cup.

Qualification:

```text
MIN_RATING_PREDICTIONS = 10
```

До первого Qualified Cup:

```text
RatingStatus = UNRANKED
```

Rating Screen показывает:

```text
globalRank
ratingValue
leagueDivision
percentile
progressToNextDivision
current Cup rating progress
recent Rating History
```

Friends Leaderboard — V2.

## 11.1 Performance Model

For Prediction `i`:

```text
E_i   = p_i × points_i
Var_i = p_i × (1 - p_i) × points_i²
```

For qualified Cup:

```text
Z =
(ActualPoints - ExpectedPoints)
/
sqrt(sum Var_i)
```

Qualified Players ранжируются по `Z`.

Position in qualified Z distribution → `actualPercentile`.

Exact `expectedPercentile` model пока не утверждена. Она будет разработана позднее вместе с mathematical/rating calibration work и не должна быть выведена из implementation по умолчанию.

Rating update:

```text
ratingDelta =
K × (actualPercentile - expectedPercentile)
```

```text
first 5 Qualified Cups → K = 120
afterwards             → K = 80
```

Internal initial rating:

```text
1500
```

Он скрыт до первого Qualified Cup.

## 11.2 League Thresholds

Current thresholds:

| ratingValue | leagueDivision |
| ----------: | -------------- |
|       <1200 | BRONZE_III     |
|        1200 | BRONZE_II      |
|        1300 | BRONZE_I       |
|        1400 | SILVER_III     |
|        1450 | SILVER_II      |
|        1500 | SILVER_I       |
|        1550 | GOLD_III       |
|        1650 | GOLD_II        |
|        1750 | GOLD_I         |
|        1850 | PLATINUM_III   |
|        1925 | PLATINUM_II    |
|        2000 | PLATINUM_I     |
|        2075 | DIAMOND_III    |
|        2150 | DIAMOND_II     |
|        2225 | DIAMOND_I      |
|        2300 | MASTER         |
|       2450+ | LEGEND         |

**Documentation note:** исходная Product Spec помечала эти thresholds как `provisional` и требующие Simulation/Calibration. Если `docs/DECISIONS.md` фиксирует их как Accepted, это apparent documentation conflict и должно быть отдельно разрешено до изменения статуса thresholds.

## 11.3 Rating Seasons

Rating Seasons не зафиксированы как MVP behavior.

Candidate concept:

```text
SEASON_CUP_COUNT = 12
soft reset toward 1500
candidate reset:
1500 + (oldRating - 1500) × 0.5
```

Это не должно реализовываться как approved MVP rule без отдельного решения.

---

# 12. Profile and Settings

Profile uses Telegram identity; отдельная Profile Registration не нужна.

Profile may include:

```text
league/rating status
CareerStats
TournamentResults
PredictionStats
Achievements
CupHistory
PrizeHistory
ShareProfile
Settings entry
```

Achievement не влияет на Tournament Points или Global Rating.

Wallet не запрашивается до реальной Prize Claim.

Supported UI locales:

```text
en
ru
de
es
ar
```

Appearance:

```text
system
light
dark
```

## 12.1 Achievement v0.1

| Code         | Condition                                                                           |
| ------------ | ----------------------------------------------------------------------------------- |
| FIRST_PICK   | First Prediction                                                                    |
| FIRST_WIN    | First Correct Prediction                                                            |
| ON_FIRE      | 5 Correct Predictions in a row                                                      |
| GIANT_KILLER | Correct Prediction with Points ≥ 40                                                 |
| SHARPSHOOTER | Correct Predictions equal current `DAILY_PREDICTION_LIMIT` in one day (currently 8) |
| CHAMPION     | Weekly Cup win                                                                      |
| ELITE        | Global Rank ≤ 100                                                                   |
| MASTER       | League = MASTER                                                                     |

---

# 13. Progressive Onboarding

Goal: first launch → first Prediction in approximately 20–30 seconds.

Explain mechanics when they become relevant.

| Trigger                  | Message                                          |
| ------------------------ | ------------------------------------------------ |
| FIRST_LAUNCH             | Free-to-play Weekly Cup, Prize Pool, 3 Free/day  |
| FIRST_MATCH_VIEW         | More unlikely outcome = more Points              |
| FIRST_PREDICTION_CREATED | Prediction automatically joined current Cup      |
| FREE_LIMIT_REACHED       | Up to 5 Rewarded Predictions available           |
| FIRST_PREDICTION_SETTLED | Points affect Weekly Leaderboard                 |
| RATING_PROGRESS          | 10 Predictions required for Rating qualification |
| FIRST_CUP_FINISHED       | Rating Delta and League movement                 |
| FIRST_PRIZE              | USDT/TRC-20 wallet and Prize Claim               |

Before first Prediction do not request:

```text
wallet
email
phone
favorite leagues
```

After third Free Prediction do not auto-launch rewarded advertising.

Detailed scoring explanation may be available via Info UI; formula `6.5 / p` is not part of normal primary UI.

---

# 14. Core UI States

| Area       | State                | Product behavior                                                |
| ---------- | -------------------- | --------------------------------------------------------------- |
| Matches    | NO_ELIGIBLE_FIXTURES | Explain no available matches today; My Picks remains accessible |
| Matches    | FREE_AVAILABLE       | One-tap Prediction                                              |
| Matches    | REWARDED_REQUIRED    | Outcome → rewarded flow                                         |
| Matches    | DAILY_LIMIT_REACHED  | Block new Prediction until daily reset                          |
| Prediction | OPEN                 | selectedOutcome editable before kickoff                         |
| Prediction | LOCKED_OR_LIVE       | Edit forbidden; result Pending                                  |
| Prediction | SETTLED_CORRECT      | earnedPoints and relevant movement                              |
| Prediction | SETTLED_INCORRECT    | 0 Points; neutral wording                                       |
| Cup        | NOT_PARTICIPATING    | CTA → first Prediction                                          |
| Cup        | ACTIVE               | Rank, Points, Prize gap, Leaderboard                            |
| Cup        | IN_PRIZE_ZONE        | Current Prize and competitive gaps                              |
| Cup        | FINISHED_WINNER      | Final result, Prize Claim, next Cup                             |
| Cup        | FINISHED_NON_WINNER  | Final result, Rating Delta, next Cup                            |
| Rating     | UNRANKED             | Qualification progress                                          |
| Rating     | RANKED               | Rank, League, Percentile, next threshold                        |
| Profile    | NEW_USER             | Avoid wall of zeros; emphasize current progress                 |
| Wallet     | NOT_REQUIRED         | Do not request connection                                       |
| Wallet     | CLAIM_REQUIRED       | TON connection + Prize Claim                                    |

Detailed component geometry and visual states belong in design documentation.

---

# 15. Monetization

MVP monetization:

```text
Prediction #1–#3 → Free
Prediction #4–#8 → may require Rewarded Ad
```

Rewarded entitlement is valid only after verified completion.

No:

```text
Internal Currency
purchasable Prediction Balance
transferable Reward Asset
forced launch ad
automatic ad after third Prediction
```

Initial Cups may be unprofitable; MVP validates retention and unit economics.

Exact ad-provider verification mechanics belong in technical/integration specs and unresolved decisions.

---

# 16. USDT/TRC-20 Prize Flow

Prize Pool is fixed before Tournament starts.

For the USDT/TRC-20 MVP, the existing per-Cup `PrizeDistributionTier` rows
stored in the database and shown on the Cup screen are the approved Prize
Distribution source of truth. Do not create a second prize configuration.

Final Leaderboard is fixed after all Tournament-relevant Fixture are settled according to approved Tournament rules.

Wallet is requested only when a Prize Winner needs to claim a Prize.

Minimum claim states:

```text
READY_TO_CLAIM
UNDER_REVIEW
ACTION_REQUIRED
PAID
REJECTED
```

`READY_TO_CLAIM` is represented by a PrizeEntitlement without a PrizeClaim.

MVP uses a PrizeEntitlement/PrizeClaim flow with manual USDT payout on the
TRON (TRC-20) network by an operator.

The operator verifies the submitted public TRC-20 wallet address, performs the
USDT transfer manually, records optional transaction hash and mandatory
`paidAt`, and marks the claim `PAID`.

Automatic server-side or smart-contract payout is not part of the current MVP.

Prize amounts are domain monetary values; exact persistence representation belongs in `DB_SCHEMA.md`.

---

# 17. Product Language

| Prefer                           | Avoid as primary UI               |
| -------------------------------- | --------------------------------- |
| Prediction / прогноз             | Bet / ставка                      |
| Points / очки                    | Stake                             |
| Market Probability / вероятность | Bookmaker Odds as main UI element |
| Tournament / Weekly Cup          | Lottery / betting pool            |
| Prize / Prize Pool               | Bet winnings                      |
| Rating / League                  | Cash balance                      |

Product visual/language framing must remain skill-competition oriented rather than casino/betting oriented.

---

# 18. MVP Analytics

Core product metrics:

```text
activationFirstPredictionRate
predictionsPerDAU
predictionsPerCup
freePredictionUsageDistribution
rewardedOfferRate
rewardedStartRate
rewardedCompletionRate
D1 / D3 / D7 Retention
weeklyCupParticipationRate
weeklyCupCompletionRate
ratingQualificationRate
leaderboardRevisitRate
profileRevisitRate
revenuePerActiveUser
rewardedRevenuePerImpression
prizeCostToAdRevenueRatio
shareProfileRate
referredOpenRate
```

Metrics requiring not-yet-implemented features become relevant only when those features exist.

---

# 19. Open Product Decisions

Authoritative tracked Open Decisions belong in:

```text
docs/DECISIONS.md
```

Do not maintain a second authoritative open-decision list here.

Product areas known to require explicit resolution before affected behavior is implemented include, as applicable:

```text
exact Weekly Cup boundary
postponed/cancelled/abandoned/rescheduled Fixture policy
Goalstery mathematical outcome model
exact Prize Distribution by winning rank
Global Rating expected-percentile model / calibration
```

Other unresolved implementation/product questions discovered during development must be surfaced according to `AGENTS.md` and, when accepted for tracking, added to `docs/DECISIONS.md`.

Do not silently resolve them in code.

---

# 20. Out of Scope — MVP

```text
Deposits
Paid Entry
Prediction purchase via TON / Telegram Stars / fiat
Tradable Tickets/Tokens
Tournament Points withdrawal
Live/In-play Prediction
full Match Center
lineups/injuries/H2H/xG/news/AI analysis
additional competitions without approved scope change
Friends Leaderboard
special League-gated Tournament
complex Achievement rewards/cosmetics
full historical Prediction drill-down
Subscription/Premium Analytics
```

---

# 21. MVP Acceptance

MVP is product-complete when a new Telegram User can:

```text
open Mini App
→ understand current Weekly Cup
→ make first Free Prediction quickly
→ return for Settlement and Leaderboard movement
→ optionally unlock up to five Rewarded Predictions/day
→ finish Cup with understandable Tournament Result
→ receive Global Rating update when qualified
→ submit a TRC-20 wallet address only if a Prize actually requires claim
```

Primary Loop:

```text
Open
→ Matches Today
→ Settlement
→ Weekly Cup Movement
→ Global Rating
→ Repeat
```

---

# 22. Product Spec Maintenance

This document owns product behavior, not implementation detail.

Do not add here unless product-facing/domain-relevant:

```text
Prisma field definitions
SQL constraints
worker polling intervals
HTTP handler structure
provider request budgeting
CSS geometry
component file structure
test harness details
deployment details
```

Those belong in their dedicated authoritative docs.

If an Accepted decision constrains this Product Spec, follow `AGENTS.md` decision policy.

Do not silently rewrite product behavior to match implementation.

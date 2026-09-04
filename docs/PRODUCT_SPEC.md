TELEGRAM MINI APP • PRODUCT SPECIFICATION

Sports Prediction Tournament

**Product Spec v0.1**

Продуктовые требования, бизнес-правила, UI states и программная модель
MVP

| **Статус**    | Рабочая базовая спецификация                |
|---------------|---------------------------------------------|
| **Дата**      | 4 сентября 2026                             |
| **Платформа** | Telegram Mini App                           |
| **Язык**      | Описание — русский; code entities — English |

# 1. Определение продукта

Бесплатный еженедельный турнир футбольных прогнозистов внутри Telegram.
Пользователь выбирает исходы матчей 1X2, получает Tournament Points в
зависимости от рыночной вероятности исхода, соревнуется в Weekly Cup за
заранее объявленный призовой фонд в TON и формирует долгосрочный Global
Rating.

**•** Позиционирование: бесплатный турнир спортивных прогнозистов, а не
букмекерский продукт со ставкой участника.

**•** Нет deposit, stake, покупки Prediction, конвертируемых Points,
P2P-передачи Points или выплаты по модели odds × stake.

**•** Победители определяются результатами совокупности Prediction, а не
случайным розыгрышем.

**•** Для призов в Telegram Mini App предполагается TON.

# 2. Основные продуктовые циклы

| **Цикл**   | **Период**                 | **Назначение**                                                   |
|------------|----------------------------|------------------------------------------------------------------|
| Daily Loop | Каждый календарный день    | Новый Match Pool, 3 Free Predictions + до 5 Rewarded Predictions |
| Weekly Cup | Неделя                     | Турнир, Leaderboard и TON prizes                                 |
| Long-term  | Несколько турниров/сезонов | Global Rating, League, Profile, Career                           |

# 3. Weekly Cup — правила

**•** В каждый момент существует один Active Weekly Cup.

**•** Weekly Cup запускается по фиксированному недельному расписанию
независимо от количества участников.

**•** После завершения текущего Weekly Cup следующий начинается сразу.

**•** Отдельной регистрации нет: первая принятая Prediction
автоматически создаёт Tournament Participation.

**•** Присоединиться можно в любой момент недели. Late-entry
compensation отсутствует.

**•** Неиспользованные Daily Prediction Slots не переносятся.

**•** Tournament Points обнуляются при старте нового Weekly Cup.

**•** Prize Pool и Prize Distribution фиксируются до открытия турнира и
не меняются внутри него.

**•** Первый эксперимент: ориентир около 100 Players и 10 TON Prize
Pool; 100 Players не является условием старта.

## 3.1. Начальное распределение Prize Pool

| **Place** | **Prize** |
|-----------|-----------|
| \#1       | 4 TON     |
| \#2       | 2.5 TON   |
| \#3       | 1.5 TON   |
| \#4       | 1 TON     |
| \#5       | 1 TON     |

# 4. Daily Prediction Rules

**•** Для создания новой Prediction доступны только Fixture, kickoffAt
которых приходится на текущий календарный день.

**•** Prediction на завтрашние и более поздние Fixture заранее сделать
нельзя.

**•** В начале календарного дня пользователь получает
FREE_PREDICTION_LIMIT = 3.

**•** Через Rewarded Ad можно разблокировать REWARDED_PREDICTION_LIMIT =
5 дополнительных Prediction.

**•** DAILY_PREDICTION_LIMIT = 8.

**•** Rewarded Ad открывает право сохранить конкретную выбранную
Prediction и не создаёт отдельный Ticket/Token.

**•** Сделанные Prediction остаются в My Picks после kickoff и после
Settlement.

**•** До kickoffAt пользователь может изменить selectedOutcome без
расходования дополнительного Daily Slot.

**•** В момент kickoffAt Prediction становится LOCKED на Backend
независимо от состояния клиента и задержек Sports API.

# 5. Match Pool и соревнования

**•** MVP Competitions: Premier League, La Liga, Serie A, Bundesliga,
Ligue 1, UEFA Champions League, UEFA Europa League.

**•** В Daily Match Pool включаются все подходящие Fixture этих
соревнований текущего дня; искусственного лимита на League нет.

**•** Fixture становится Eligible только при наличии валидного Pre-match
1X2 Odds Snapshot, из которого можно зафиксировать Scoring Snapshot.

**•** Ориентир для активной полной недели: примерно 50–70+ Eligible
Fixtures, в зависимости от календаря.

# 6. Scoring v1

Bookmaker Odds преобразуются в Implied Probability и нормализуются для
удаления Overround. Для каждого Outcome вычисляются Tournament Points:

**points = clamp(round(6.5 / p), 7, 50)**

**•** p — normalizedProbability в диапазоне 0..1.

**•** Correct Prediction: начисляются зафиксированные displayedPoints.

**•** Incorrect Prediction: 0 Points.

**•** Отрицательных Points, Streak Multiplier и дополнительных
Tournament Score Bonus в v0.1 нет.

**•** Scoring Snapshot фиксируется до публикации Fixture и после этого
не меняется.

**•** Для каждого Outcome сохраняется scoringVersion.

**•** MAX_POINTS = 50 намеренно снижает Expected Value экстремальных
Longshot и ограничивает влияние единичного сверхредкого исхода.

| **normalizedProbability** | **displayedPoints** |
|---------------------------|---------------------|
| 75%                       | 9                   |
| 65%                       | 10                  |
| 55%                       | 12                  |
| 45%                       | 14                  |
| 35%                       | 19                  |
| 25%                       | 26                  |
| 20%                       | 33                  |
| 15%                       | 43                  |
| ≤13%                      | 50 (cap)            |

# 7. Fixture Lifecycle и Settlement

**DRAFT → OPEN → LOCKED → LIVE → FINISHED → SETTLED**

| **FixtureStatus** | **Смысл**                                                      |
|-------------------|----------------------------------------------------------------|
| DRAFT             | Fixture получен, но Scoring Snapshot ещё не опубликован.       |
| OPEN              | Fixture доступен и принимает Prediction.                       |
| LOCKED            | Наступил kickoffAt; новые/изменённые Prediction запрещены.     |
| LIVE              | Матч идёт; Prediction имеет Pending Result.                    |
| FINISHED          | Получен подтверждённый Final Result.                           |
| SETTLED           | Prediction рассчитаны, Points начислены, Leaderboard обновлён. |

**•** Result Worker начинает проверку ориентировочно через 105–110 минут
после kickoffAt.

**•** Неразрешённые группы матчей проверяются примерно раз в 5 минут до
получения FT.

**•** Fixture группируются по kickoff/expectedFinish window, чтобы
минимизировать Sports API Requests.

**•** До Settlement UI показывает нейтральный Pending State.

**•** После Settlement Points и Weekly Leaderboard обновляются сразу.

# 8. Information Architecture

| **BottomNavigationItem** | **Задача**                                          |
|--------------------------|-----------------------------------------------------|
| Predict                  | Сегодняшние Fixture, создание Prediction, My Picks. |
| Cup                      | Текущий Weekly Cup, Prize Zone, Leaderboard.        |
| Rating                   | Global Rating и долгосрочный competitive status.    |
| Profile                  | Career, History, Achievements, Prizes.              |

Отдельного Settings item в Bottom Navigation нет. Settings открывается
из Profile.

# 9. Screen: Predict

**•** Predict — Default Landing Screen при обычном запуске приложения.

**•** Верх: компактный WeeklyCupSummary — Prize Pool, endsAt,
currentRank, tournamentPoints, pointsToPrizeZone.

**•** DailyQuota показывает использованные/оставшиеся Free и Rewarded
Prediction.

**•** Tabs: Available / My Picks.

**•** LeagueFilter использует Chips для семи Competition.

**•** Available Fixtures сортируются прежде всего по kickoffAt.

**•** MatchCard показывает Team, marketProbability и displayedPoints;
основной UI не имитирует букмекерские 1/X/2 Odds.

**•** displayedPoints визуально приоритетнее marketProbability.

**•** Tap по Outcome сразу вызывает createPrediction(); Confirmation
Modal отсутствует.

**•** До kickoffAt действие Change вызывает updatePrediction() и не
увеличивает Daily Usage.

**•** После 3 Free Prediction tap по следующему Outcome открывает
RewardedPredictionSheet для конкретного Fixture/Outcome.

**•** После успешного rewarded completion Backend автоматически
сохраняет intended Prediction.

**•** При 8/8 создание новых Prediction блокируется до Daily Reset, но
Fixture остаются видимыми.

**•** My Picks показывает OPEN/LOCKED/LIVE/SETTLED Prediction, Daily
Points и Accuracy.

# 10. Screen: Weekly Cup

**•** WeeklyCupHeader: cupNumber, prizePoolTon, endsAt,
participantsCount.

**•** UserTournamentSummary: rank, points, predictionsCount, accuracy,
rankDeltaToday, pointsToPrizeZone.

**•** PrizeDistribution — компактный блок.

**•** Leaderboard показывает Top Players и Rank Neighborhood
пользователя.

**•** StickyUserRank остаётся над Bottom Navigation при scroll.

**•** Вне Prize Zone показываем pointsToPrizeZone и CTA → Predict.

**•** В Prize Zone показываем currentPrize, pointsToNextRank и
leadOverNextRank.

**•** Если Tournament Participation ещё нет: NOT_PARTICIPATING и CTA →
первая Prediction. Кнопки Join нет.

**•** История прошлых Weekly Cup хранится в Profile, а не в основном Cup
Screen.

# 11. Screen: Global Rating

Global Rating оценивает качество прогнозирования, а не накопленную
активность. Weekly Cup и Global Rating намеренно используют разные
критерии.

**•** Global Rating пересчитывается только после завершения Weekly Cup.

**•** Для Rating Qualification необходимо MIN_RATING_PREDICTIONS = 10
Prediction за Weekly Cup.

**•** До первого Qualified Cup пользователь имеет RatingStatus =
UNRANKED.

**•** Rating Screen показывает globalRank, ratingValue, leagueDivision,
percentile и progressToNextDivision.

**•** Global Leaderboard показывает Leaders и Rank Neighborhood
пользователя.

**•** Current Cup block показывает текущий Tournament Result и время до
следующего Rating Update.

**•** Recent Rating History показывает Cup, performancePercentile и
ratingDelta.

**•** Friends Leaderboard — V2.

## 11.1. Rating Performance Model

Для каждой Prediction i:

**Eᵢ = pᵢ × pointsᵢ Varᵢ = pᵢ(1 − pᵢ) × pointsᵢ²**

Для Weekly Cup рассчитывается risk-adjusted performance:

**Z = (ActualPoints − ExpectedPoints) / √ΣVarᵢ**

**•** Qualified Players ранжируются по Z, а не по raw Tournament Points.

**•** Так количество Prediction само по себе не создаёт Global Rating, а
выбор Favorites/Underdogs учитывается через Variance.

**•** Место в Z-distribution преобразуется в actualPercentile.

**•** expectedPercentile рассчитывается из ratingValue игрока
относительно Rating Distribution квалифицированного Field по Elo-style
expectation.

**•** ratingDelta = K × (actualPercentile − expectedPercentile).

**•** Первые 5 Qualified Cups: K_PROVISIONAL = 120.

**•** Далее: K_ESTABLISHED = 80.

**•** Внутренний initialRating = 1500; до первого Qualified Cup он
пользователю не показывается.

## 11.2. League Thresholds — provisional

| **ratingValue** | **leagueDivision** |
|-----------------|--------------------|
| \<1200          | BRONZE_III         |
| 1200            | BRONZE_II          |
| 1300            | BRONZE_I           |
| 1400            | SILVER_III         |
| 1450            | SILVER_II          |
| 1500            | SILVER_I           |
| 1550            | GOLD_III           |
| 1650            | GOLD_II            |
| 1750            | GOLD_I             |
| 1850            | PLATINUM_III       |
| 1925            | PLATINUM_II        |
| 2000            | PLATINUM_I         |
| 2075            | DIAMOND_III        |
| 2150            | DIAMOND_II         |
| 2225            | DIAMOND_I          |
| 2300            | MASTER             |
| 2450+           | LEGEND             |

Пороги требуют Simulation/Calibration до окончательной фиксации.

## 11.3. Rating Seasons

**•** Кандидат: SEASON_CUP_COUNT = 12 Weekly Cups (~3 месяца).

**•** После Season сохраняется SeasonResult и выполняется Soft Reset к
1500.

**•** Кандидат: newRating = 1500 + (oldRating − 1500) × 0.5.

**•** Season можно активировать после MVP, если для первого релиза нужна
меньшая операционная сложность.

# 12. Screen: Profile

**•** Telegram avatar/name/username используются напрямую; отдельная
Profile Registration не нужна.

**•** ProfileHeader: leagueDivision, ratingValue, globalRank,
percentile.

**•** CareerStats: cupsPlayed, predictionsCount, accuracy,
bestPredictionPoints.

**•** TournamentResults: winsCount, podiumsCount, top10Count,
totalTonWon.

**•** PredictionStats: correctCount, accuracy, bestPredictionPoints,
bestCorrectStreak, avgWinningPickPoints, optional bestCompetition.

**•** Achievement не влияет на Tournament Points и Global Rating.

**•** CupHistory содержит summary прошлых Weekly Cup.

**•** PrizeHistory показывает Prize и ClaimStatus.

**•** Wallet не запрашивается до появления реальной Prize Claim.

**•** ShareProfile создаёт Telegram share-card.

**•** Settings открывается из Profile.

## 12.1. Achievement v0.1

| **achievementCode** | **Condition**                             |
|---------------------|-------------------------------------------|
| FIRST_PICK          | Первая Prediction                         |
| FIRST_WIN           | Первая Correct Prediction                 |
| ON_FIRE             | 5 Correct Prediction подряд               |
| GIANT_KILLER        | Correct Prediction с displayedPoints ≥ 40 |
| SHARPSHOOTER        | 10 Correct Prediction за один день        |
| CHAMPION            | Победа в Weekly Cup                       |
| ELITE               | Global Rank ≤ 100                         |
| MASTER              | Достигнут League = MASTER                 |

# 13. First Run и Progressive Onboarding

Цель: от первого открытия Mini App до первой Prediction — ориентировочно
20–30 секунд. Механики объясняются в момент, когда становятся
релевантными.

| **Trigger**              | **Onboarding Message**                                       |
|--------------------------|--------------------------------------------------------------|
| FIRST_LAUNCH             | Free-to-play Weekly Cup, Prize Pool, 3 Free Predictions/day. |
| FIRST_MATCH_VIEW         | More unlikely = more points.                                 |
| FIRST_PREDICTION_CREATED | Prediction автоматически включила пользователя в Weekly Cup. |
| FREE_LIMIT_REACHED       | Можно разблокировать до 5 Rewarded Predictions.              |
| FIRST_PREDICTION_SETTLED | Как Points меняют Weekly Leaderboard.                        |
| RATING_PROGRESS          | Нужно 10 Prediction для Rating Qualification.                |
| FIRST_CUP_FINISHED       | Rating Delta и Promotion/Demotion.                           |
| FIRST_PRIZE              | TON Wallet Connection и Claim.                               |

**•** До первой Prediction не запрашиваются Wallet, email, phone или
favorite leagues.

**•** После третьей Free Prediction Rewarded Ad не запускается
автоматически.

**•** Подробное объяснение Scoring доступно через Info Sheet; формула
6.5/p в обычном UI не показывается.

# 14. UI State Matrix

| **Area**   | **State**            | **Поведение**                                                            |
|------------|----------------------|--------------------------------------------------------------------------|
| Predict    | NO_ELIGIBLE_FIXTURES | Сообщить, что сегодня нет доступных матчей; My Picks остаётся доступным. |
| Predict    | FREE_AVAILABLE       | One-tap Prediction.                                                      |
| Predict    | REWARDED_REQUIRED    | Outcome tap → RewardedPredictionSheet.                                   |
| Predict    | DAILY_LIMIT_REACHED  | Блокировать новые Prediction; показать Daily Reset Countdown.            |
| Prediction | OPEN                 | Можно изменить selectedOutcome.                                          |
| Prediction | LOCKED_OR_LIVE       | Изменение запрещено; ResultStatus = PENDING.                             |
| Prediction | SETTLED_CORRECT      | Показать earnedPoints и rank movement.                                   |
| Prediction | SETTLED_INCORRECT    | 0 Points; нейтральный текст без “you lost”.                              |
| Cup        | NOT_PARTICIPATING    | CTA → первая Prediction.                                                 |
| Cup        | ACTIVE               | Rank, Points, Prize Gap, Leaderboard.                                    |
| Cup        | IN_PRIZE_ZONE        | Current Prize и competitive gaps.                                        |
| Cup        | FINISHED_WINNER      | Final Result, Prize Claim, Next Cup CTA.                                 |
| Cup        | FINISHED_NON_WINNER  | Final Result, Rating Delta, Next Cup CTA.                                |
| Rating     | UNRANKED             | Progress до 10 Prediction.                                               |
| Rating     | RANKED               | Rank, League, Percentile, Next Threshold.                                |
| Profile    | NEW_USER             | Не показывать стену нулей; акцент на Current Cup и Progress.             |
| Wallet     | NOT_REQUIRED         | Не запрашивать Connection.                                               |
| Wallet     | CLAIM_REQUIRED       | TON Connect + Prize Claim.                                               |

# 15. Data Model — программные сущности верхнего уровня

Подробная DB Schema будет отдельным Technical Spec. В Product Spec
фиксируются названия основных Domain Entities, чтобы Codex и Backend
использовали единый словарь.

| **Entity**            | **Назначение**                                   |
|-----------------------|--------------------------------------------------|
| User                  | Telegram user и продуктовый профиль.             |
| Tournament            | Weekly Cup configuration и lifecycle.            |
| TournamentParticipant | Участие User в Tournament и агрегаты Weekly Cup. |
| Fixture               | Спортивное событие и lifecycle.                  |
| OutcomeSnapshot       | 1X2 probability/points snapshot для Fixture.     |
| Prediction            | Выбранный User Outcome для Fixture.              |
| DailyPredictionUsage  | Free/Rewarded usage User по calendarDay.         |
| RatingProfile         | Текущий Global Rating и League.                  |
| RatingHistory         | Изменение Rating после Qualified Cup.            |
| Achievement           | Каталог достижений.                              |
| UserAchievement       | Полученные User achievements.                    |
| Prize                 | Призовое обязательство по Tournament.            |
| PrizeClaim            | TON claim/payment state.                         |
| AdReward              | Подтверждённый Rewarded Ad unlock.               |

# 16. Sports Data Architecture

**•** Preferred Provider для MVP: API-Football / API-Sports, после
технической проверки quota и endpoint behavior.

**•** Frontend никогда не вызывает Sports Provider напрямую.

**•** Backend Worker получает Fixtures/Odds/Results, сохраняет Snapshot
в DB и отдаёт данные всем Users через Application API.

**•** Sports API load зависит прежде всего от количества Fixture, а не
от количества Users.

**•** Fixture хранит providerFixtureId, competitionCode, homeTeam,
awayTeam, kickoffAt, fixtureStatus.

**•** OutcomeSnapshot хранит rawOdds, normalizedProbability,
displayedPoints, snapshotAt, scoringVersion.

**•** Backend ведёт requestBudgetCounter и при приближении к quota
снижает polling frequency.

# 17. Monetization v0.1

**•** Основная монетизация MVP: Rewarded Ads для Prediction \#4–#8
текущего дня.

**•** Prediction \#1–#3 всегда Free.

**•** AdReward считается валидным только после verified completion.

**•** Нет Internal Currency, purchasable Prediction Balance или
transferable Reward Asset.

**•** Нет Forced Ad при запуске приложения и автоматического Ad после
третьей Prediction.

**•** Первые Weekly Cup могут быть убыточными; ключевая задача —
проверить Retention и Unit Economics.

# 18. TON Prize Flow

**•** prizePoolTon и Prize Distribution фиксируются до Tournament Start.

**•** Final Leaderboard фиксируется после Settlement всех Fixture,
которые согласно Tournament Rules входят в Cup.

**•** Wallet запрашивается только у Prize Winner при необходимости
Claim.

**•** Минимальные PrizeClaimStatus: UNCLAIMED, CLAIM_PENDING, PAID,
FAILED.

**•** Конкретный Payout Mechanism (server-side transfer или Claim Smart
Contract) в v0.1 не фиксируется.

# 19. Product Language

| **Использовать**                       | **Не использовать как основной UI**              |
|----------------------------------------|--------------------------------------------------|
| Prediction / прогноз                   | Bet / ставка                                     |
| Points / очки                          | Stake                                            |
| Market Probability / вероятность рынка | Bookmaker Odds / коэффициент как главный элемент |
| Tournament / Weekly Cup                | Lottery / betting pool                           |
| Prize / Prize Pool                     | Выигрыш ставки                                   |
| Rating / League                        | Cash balance                                     |

# 20. MVP Analytics

**•** activationFirstPredictionRate

**•** predictionsPerDAU и predictionsPerCup

**•** freePredictionUsageDistribution

**•** rewardedOfferRate / rewardedStartRate / rewardedCompletionRate

**•** D1 / D3 / D7 Retention

**•** weeklyCupParticipationRate и weeklyCupCompletionRate

**•** ratingQualificationRate

**•** leaderboardRevisitRate / profileRevisitRate

**•** revenuePerActiveUser / rewardedRevenuePerImpression

**•** prizeCostToAdRevenueRatio

**•** shareProfileRate и referredOpenRate после появления Referral
Attribution

# 21. Open Decisions перед Implementation Freeze

**•** TOURNAMENT_TIMEZONE и точные weekly startsAt/endsAt.

**•** Что означает calendarDay для Daily Quota и Match Eligibility:
Tournament Timezone или User Timezone.

**•** Leaderboard Tie Breakers.

**•** Policy для POSTPONED / CANCELLED / ABANDONED / RESCHEDULED
Fixture.

**•** Выбор конкретного Bookmaker/Odds Source и snapshotAt.

**•** Финальная реализация expectedPercentile и Simulation Calibration
Global Rating.

**•** Входит ли Season в первый MVP Release.

**•** TON Payout/Claim architecture.

**•** Anti-abuse: Multi-accounting, Telegram Identity, Ad Reward
Verification, suspicious behavior.

**•** Notifications policy.

**•** Legal Review: tournament mechanics, advertising, TON prizes,
Terms, Privacy, jurisdiction/age restrictions.

**•** Publisher Policy выбранной Ad Network для sports prediction
product с real prizes.

# 22. Out of Scope — MVP

**•** Deposits и Paid Entry.

**•** Покупка Prediction через TON, Telegram Stars или fiat.

**•** Tradable Tickets/Tokens и Withdrawal Tournament Points.

**•** Live/In-play Prediction.

**•** Полный Match Center: lineups, injuries, H2H, xG, news, AI
analysis.

**•** Дополнительные League/Conference League без доказанной
необходимости.

**•** Friends Leaderboard и специальные League-gated Tournament.

**•** Сложные Achievement Rewards/Cosmetics.

**•** Полный Historical Prediction Drill-down.

**•** Subscription/Premium Analytics.

# 23. MVP Acceptance Summary

MVP считается продуктово цельным, если новый Telegram User может открыть
Mini App, за несколько секунд понять текущий Weekly Cup, сделать первую
Free Prediction, вернуться за Settlement и движением в Leaderboard, при
желании разблокировать до пяти дополнительных Daily Prediction через
Rewarded Ads, завершить неделю с понятным Tournament Result и Global
Rating Update и подключить TON Wallet только в случае фактически
заработанного Prize.

**Primary Loop:** Open → Predict Today → Settlement → Weekly Cup
Movement → Global Rating → Repeat.

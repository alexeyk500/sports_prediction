# Task for Codex — Cup Leaderboard scalability

Нужно реализовать масштабируемый leaderboard для экрана `Cup`.

## Context

Сейчас Cup screen показывает рейтинг как обычный список.
Это работает для небольшого числа участников, но ломает UX при 1000+ игроков.

Пример:

- участников: 1000;
- current user rank: #800.

Пользователь не должен скроллить сотни строк, чтобы найти себя.

В package приложены:

- `current-cup-screen.png` — текущий экран;
- `leaderboard-concept.png` — UX-концепт;
- `LEADERBOARD_SPEC.md` — полная спецификация.

Перед реализацией ОБЯЗАТЕЛЬНО:

1. Изучи архитектуру проекта и markdown-спецификации.
2. Найди текущий Cup screen и все дочерние React components.
3. Найди leaderboard data flow: API → service/query → component.
4. Найди существующие типы Cup/Leaderboard/User/Prediction.
5. Найди текущую business logic расчета rank/points.
6. Не дублируй существующие компоненты или contracts без необходимости.

## Required UX

Leaderboard должен иметь три режима:

- `Top 50`
- `Around Me`
- `All Players`

### Top 50

Показывает первые 50 участников.

Не загружать полный leaderboard для этого режима.

Если current user входит в Top 50:

- выделить его строку.

### Around Me

Показывает current user и соседние позиции.

Использовать radius = 4:

- до 4 выше;
- current user;
- до 4 ниже.

Пример current user #800:

796
797
798
799
800 YOU
801
802
803
804

Корректно обрабатывать начало/конец рейтинга.

### All Players

Полный leaderboard:

- backend pagination/cursor pagination;
- page size около 50;
- infinite loading;
- virtualization, если в проекте уже есть подходящая библиотека или это действительно необходимо.

Не создавать внутренний вертикальный scroll leaderboard.
Все строки продолжают общий scroll Cup screen.

## Page scroll

Сохранить один vertical scroll для Cup screen.

- Bottom navigation остается fixed.
- Leaderboard не получает `overflow-y: auto`.
- Добавить достаточный bottom padding с учетом bottom nav/safe-area.
- Не делать Your Position sticky.

Если Current Cup / History уже реализован как sticky — сохранить.
Если нет — не вводить sticky без необходимости в рамках этой задачи.

## Components

Следуй существующим project conventions.

Если текущая структура позволяет, логично выделить примерно:

- `CupLeaderboard`
- `LeaderboardModeTabs`
- `LeaderboardTable`
- `LeaderboardRow`
- `AroundMeLeaderboard`

Но НЕ создавай компоненты механически.
Сначала изучи текущую component hierarchy и вложи дочерние компоненты в родителей согласно project specification.

Сохраняй принятое в проекте правило экспорта React components:

- standalone React component file → default export;
- types/helpers/constants → named exports.

## Backend / API

Не тащи весь leaderboard на frontend.

Предпочтительная модель:

Top:
`GET /cups/:cupId/leaderboard?mode=top&limit=50`

Around:
`GET /cups/:cupId/leaderboard/me?radius=4`

All:
`GET /cups/:cupId/leaderboard?mode=all&limit=50&cursor=...`

Это ориентир, не обязательный URL contract.

Если уже существует endpoint/service:

- расширь его в рамках текущей архитектуры;
- не создавай параллельную систему.

Backend должен возвращать rank.
Frontend не вычисляет ranking самостоятельно.

Минимальные данные строки:

```ts
type LeaderboardEntry = {
  userId: string;
  rank: number;
  displayName: string;
  avatarUrl?: string | null;
  correct: number;
  wrong: number;
  totalPredictions: number;
  points: number;
  isCurrentUser: boolean;
};
```

Используй реальные существующие project types, если они уже есть.

## Current user's position card

Сохранить блок `Your position`.

Он должен использовать те же backend-derived values:

- rank
- points
- predictions/picks
- correct
- wrong

Не вычислять их отдельно в React.

## Data fetching

Используй существующий data fetching stack проекта.

Если используется React Query:

- разные query keys для top / around-me / all;
- keep/cache полученных данных;
- infinite query для All Players.

Если используется другой подход — придерживайся его.

При переключении Top 50 ↔ Around Me:

- не делать full page reload;
- не сбрасывать Cup screen;
- показывать локальный loading state/skeleton только для leaderboard.

## Loading / empty / error states

Реализовать:

- loading;
- empty leaderboard;
- API error + retry;
- loading next page;
- end of All Players list.

Если турнир существует, но participants = 0:

- leaderboard должен корректно отображать empty state.

## UI

Не пытайся pixel-perfect копировать AI mockup.

Source of truth:

1. текущий дизайн проекта;
2. `current-cup-screen.png`;
3. `leaderboard-concept.png` только как reference структуры.

Сохранить:

- navy background;
- teal active state;
- существующую typography;
- card borders/radius;
- table proportions;
- BottomNavigation.

Current user row:

- subtle teal highlight;
- хороший contrast;
- без яркого neon.

## Important constraints

Не делать:

- frontend mock data;
- hardcoded leaderboard;
- загрузку 1000 участников одним request;
- отдельный scroll внутри leaderboard;
- дублирование scoring/ranking logic;
- вычисление rank на client;
- существенный redesign Cup screen;
- новые зависимости без необходимости.

## Tests

Добавить/обновить тесты в рамках существующего test stack.

Минимальные сценарии:

1. current user #12 из 50:
   - visible in Top 50;
   - row highlighted.

2. current user #800 из 1000:
   - Top 50 содержит только top entries;
   - Around Me содержит #796–804;
   - #800 highlighted.

3. current user #1:
   - Around Me корректно начинается с #1.

4. current user #1000:
   - Around Me корректно заканчивается #1000.

5. All Players:
   - загружается первая page;
   - следующая page добавляется без удаления предыдущей;
   - duplicate rows не появляются.

6. mode switching:
   - состояние Cup card и page не сбрасывается.

## Dev data

Используй уже созданный dev seed leaderboard, если он есть.

Если текущая dev база не позволяет проверить кейс #800:

- минимально расширь dev seed до 1000 участников;
- текущему dev user задай/получи через реальные prediction/scoring данные позицию примерно #800;
- не хардкодить rank, если он должен вычисляться domain logic.

Не ухудшать существующий seed для обычного 50-player сценария.
При необходимости введи отдельный deterministic large leaderboard dev scenario.

## Verification

После реализации:

1. запусти typecheck;
2. lint;
3. tests;
4. приложение/dev server, если доступно;
5. проверь Cup screen на mobile viewport;
6. проверь Top 50;
7. Around Me;
8. All Players;
9. current user #800;
10. последний элемент списка не перекрывается BottomNavigation.

## Final report

В финале перечисли:

1. измененные файлы;
2. новые/измененные API contracts;
3. component hierarchy;
4. как устроены Top 50 / Around Me / All Players;
5. как реализована pagination;
6. как определяется current user;
7. какие тесты добавлены;
8. команды для проверки;
9. известные ограничения, если остались.

Критерий готовности:
Cup screen остается визуально согласованным с текущим приложением и корректно работает
как для 50, так и для 1000+ участников, при этом пользователь с rank #800
может мгновенно увидеть себя через Around Me и при желании открыть полный leaderboard.

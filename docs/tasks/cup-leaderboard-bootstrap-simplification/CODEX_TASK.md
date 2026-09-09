# Codex Task: Simplify Cup leaderboard loading around bootstrap

## Task name
`cup-leaderboard-bootstrap-simplification`

## Goal
Упростить архитектуру загрузки данных Cup. При первом открытии `CupScreen` должен выполняться один initial HTTP request — существующий bootstrap/current-cup. Bootstrap должен содержать все данные для первого рендера, включая initial Top 50 Cup leaderboard.

`CupLeaderboard` не должен автоматически выполнять `GET /api/cups/:cupId/leaderboard?mode=top&limit=50` при mount. Top 50 нужно рендерить из bootstrap. Дополнительные leaderboard-запросы должны выполняться только после действий пользователя.

## Target request flow

```text
CupScreen mount
  -> GET bootstrap/current-cup
  -> bootstrap содержит:
     - cup/currentTournament
     - prize data
     - current user summary/position
     - initial Top 50 leaderboard
  -> render CupScreen / CurrentCupView / CupLeaderboard
```

На initial render:

```text
bootstrap/current-cup                         1 request
leaderboard?mode=top&limit=50                0 requests
leaderboard/me                               0 requests
leaderboard?mode=all                         0 requests
```

После действий пользователя:

```text
Top
-> никаких запросов, используем bootstrap data

Around Me
-> GET /api/cups/:cupId/leaderboard/me?radius=4

All
-> GET /api/cups/:cupId/leaderboard?mode=all&limit=50

Load more
-> GET /api/cups/:cupId/leaderboard?mode=all&limit=50&cursor=...
```

## Что изучить до изменений

Обязательно проследи текущий flow через:
- `CupScreen`
- `CurrentCupView`
- `CupLeaderboard`
- `useCupBootstrap`
- `useCupLeaderboard`
- `cup-leaderboard-data-source.ts`
- `ICupLeaderboardDataSource`
- `ApiClient.getBootstrap`
- `ApiClient.getCupLeaderboard`
- `ApiClient.getCupLeaderboardAroundMe`
- bootstrap DTO/types/store
- backend bootstrap/current-cup implementation
- leaderboard backend service/routes
- тесты предыдущего request-dedup refactor

Не делай blind rewrite.

## 1. Bootstrap должен отдавать initial Top 50

Расширь текущий bootstrap payload, чтобы он содержал initial Top 50 leaderboard.

Используй существующую backend ranking/query логику. Не дублируй ranking/business logic.

Примерно:

```ts
interface ICupBootstrap {
  // existing fields...
  leaderboard: {
    top: {
      items: CupLeaderboardItem[];
      totalParticipants: number;
      nextCursor: string | null;
    };
  };
}
```

Нейминг может соответствовать текущим conventions проекта.

Initial Top должен быть эквивалентен:

```text
mode=top
limit=50
```

Не загружай полный leaderboard в bootstrap.

## 2. CupLeaderboard не делает Top request на mount

Инициализируй Top mode данными из bootstrap:

```ts
{
  rows: initialTop.items.map(toCupLeaderboardRowModel),
  totalParticipants: initialTop.totalParticipants,
  nextCursor: initialTop.nextCursor,
  isLoaded: true,
}
```

Удали mount-effect или другую механику, которая автоматически вызывает Top request.

Не заменяй её другим скрытым mount-triggered запросом.

## 3. Передавай capabilities, а не raw ApiClient

Вместо передачи `ApiClient` presentation-компонентам передавай явные loader functions:

```ts
loadLeaderboardPage(...)
loadLeaderboardAroundMe(...)
```

Предпочтительный flow:

```text
CupScreen / Cup data composition
  ├─ bootstrap
  ├─ loadLeaderboardPage()
  └─ loadLeaderboardAroundMe()
        ↓
CurrentCupView
        ↓
CupLeaderboard
```

Пример props:

```ts
interface ICupLeaderboardProps {
  cupId: string;
  initialTop: ICupLeaderboardPage;
  loadPage: (params: LoadPageParams) => Promise<ICupLeaderboardPage>;
  loadAroundMe: (
    params: LoadAroundMeParams,
  ) => Promise<ICupLeaderboardAroundMe>;
}
```

Точные типы и названия адаптируй к проекту.

## 4. Упростить/удалить generic dedup layer

Пересмотри недавно добавленные:
- `cup-leaderboard-data-source.ts`
- `createCupLeaderboardDataSource(...)`
- shared in-flight `Map<fullRequestKey, Promise>`
- связанные types/tests

Initial duplicate Top должен исчезнуть структурно, потому что самого Top request на mount больше нет.

Если data-source слой после этого не несёт полезной ответственности — удали его.

Если часть abstraction нужна как простой API adapter — оставь только минимально необходимую часть.

Не сохраняй generic shared in-flight registry только потому, что он уже написан.

## 5. Lazy modes

### Around Me
- Загружать только после выбора `Around Me`.
- `radius = 4`.
- После успешной загрузки переключение туда-сюда не должно автоматически перезапрашивать данные.

### All
- Загружать только после выбора `All`.
- Первый запрос: `mode=all&limit=50`.
- Сохрани cursor pagination.

### Pagination
Сохрани current Load more / IntersectionObserver behavior.

Не допускай двойной загрузки одного и того же cursor из-за одновременного button + observer trigger.

Используй простой локальный loading/request ownership. Не добавляй generic global dedup без доказанной необходимости.

## 6. Retry/error behavior

Сохрани:
- translated API errors;
- retry для Around Me / All;
- retry pagination, если он есть;
- Top bootstrap error теперь относится к bootstrap error handling, а не отдельному leaderboard mount error.

## 7. Reset при смене Cup

Если `cupId` изменился без полного remount:
- Top должен замениться новым `initialTop`;
- Around Me reset в unloaded;
- All reset в unloaded;
- cursor/loading/error старого Cup не должны протекать в новый Cup.

## 8. Backend

Bootstrap должен переиспользовать существующую leaderboard service/query логику.

Не создавай отдельный ranking implementation.

Не вводи N+1.

Не удаляй standalone leaderboard endpoints: они нужны для All, pagination, Around Me и других callers.

## 9. UI не менять

Не менять:
- leaderboard tabs/table/design
- Cup layout
- Prizes
- bottom navigation
- Current Cup UI
- routes
- ranking semantics

Это data-loading/ownership refactor.

## Tests

Добавь/обнови тесты:

1. Bootstrap содержит initial Top leaderboard.
2. Bootstrap Top ограничен Top 50 и использует существующую ranking semantics.
3. Initial Cup render не вызывает `mode=top&limit=50`.
4. Top rows рендерятся из bootstrap.
5. Around Me делает один request только после выбора.
6. Повторный выбор загруженного Around Me не делает автоматический refetch.
7. All делает один initial request только после выбора.
8. Повторный выбор загруженного All не делает повторный first-page request.
9. Pagination использует текущий `nextCursor`.
10. Один cursor не запрашивается дважды конкурентно.
11. После pagination error retry работает.
12. При смене `cupId` lazy state reset и Top заменяется новыми bootstrap data.
13. Around Me radius остаётся 4.
14. API contracts и row mapping не меняются.

Тесты старого generic in-flight dedup layer, которые больше не соответствуют архитектуре, удалить/заменить.

## Verification

Выполни:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Проверь Network в dev и production.

Initial Cup:

```text
bootstrap/current-cup                         1
leaderboard?mode=top&limit=50                0
leaderboard/me                               0
leaderboard?mode=all                         0
```

После Around Me:

```text
leaderboard/me?radius=4                      +1
```

После All:

```text
leaderboard?mode=all&limit=50                +1
```

После pagination:

```text
leaderboard?mode=all&limit=50&cursor=...     +1 per unique page
```

## Не делать

Не:
- отключать React Strict Mode;
- использовать `hasLoadedRef`/useRef hacks для initial Top;
- добавлять debounce/timeouts;
- сохранять сложный dedup layer без необходимости;
- грузить полный leaderboard в bootstrap;
- менять ranking business logic;
- менять Prizes/UI/navigation.

## Final report

В конце опиши:
1. какие файлы изменены/удалены;
2. кто теперь владеет initial bootstrap и lazy leaderboard requests;
3. финальный initial Network flow;
4. какой old dedup code удалён;
5. lazy flow Around Me / All / pagination;
6. результаты lint/typecheck/tests/build.

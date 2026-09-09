# Codex Task: Move initial Cup Top leaderboard loading to store state

## Task name

`cup-top-leaderboard-store-state`

## Goal

Убрать `cup.leaderboard.top` из bootstrap, чтобы не раздувать bootstrap payload.

Initial Top 50 Cup leaderboard должен загружаться отдельно при первом mount/open `CupScreen`, но строго один раз на `cupId`, включая dev React Strict Mode, где lifecycle подтверждённо выглядит так:

```text
CupScreen mounted
CupScreen unmounted
CupScreen mounted
```

Решение должно использовать store-level state/status, который переживает StrictMode remount.

Не использовать generic in-flight Map, `hasLoadedRef`, debounce, timers или отключение StrictMode.

---

## Target architecture

```text
useCupBootstrap()
  -> GET /api/bootstrap
  -> bootstrap НЕ содержит cup.leaderboard.top

CupScreen
  -> получает cupId из bootstrap
  -> useCupTopLeaderboard(cupId)
       -> store state per cupId
       -> один initial GET top 50 на cupId
  -> передаёт Top data в CupLeaderboard

CupLeaderboard
  -> Top: только render переданных данных
  -> Around Me: lazy request
  -> All: lazy request
  -> pagination: lazy cursor requests
```

Target initial flow:

```text
App start
-> GET /api/bootstrap

First CupScreen open
-> GET /api/cups/:cupId/leaderboard?mode=top&limit=50   exactly once
```

В dev Strict Mode второй mount `CupScreen` не должен отправлять второй Top request.

---

## 1. Remove Top leaderboard from bootstrap

Убери initial Top leaderboard из bootstrap DTO/payload:

```text
cup.leaderboard.top
```

или соответствующего текущего поля.

Удалить backend вызов:

```ts
getCupLeaderboardPage(... mode: "top", limit: 50)
```

из bootstrap composition.

Bootstrap снова должен содержать только данные, реально относящиеся к bootstrap/current Cup shell.

Не менять остальные bootstrap fields.

---

## 2. Add Top leaderboard state to store

Используй существующий подход/store conventions проекта.

Нужно хранить состояние initial Top leaderboard по `cupId`.

Концептуально:

```ts
type CupTopLeaderboardLoadStatus =
  | "idle"
  | "loading"
  | "loaded"
  | "error";

interface ICupTopLeaderboardState {
  status: CupTopLeaderboardLoadStatus;
  data: ICupLeaderboardPage | null;
  error: unknown | null;
}
```

Store должен поддерживать данные по `cupId`, чтобы:

- один Cup не переиспользовал Top другого Cup;
- повторный mount того же Cup не делал новый request;
- новый Cup загружал свой Top.

Допустимая форма:

```ts
topLeaderboardByCupId: Record<string, ICupTopLeaderboardState>
```

или `Map`, если это соответствует store conventions.

---

## 3. Atomic begin-load guard in store

Нужен store action уровня:

```ts
beginCupTopLeaderboardLoad(cupId): boolean
```

Семантика:

```text
idle/error? -> loading -> return true
loading     -> return false
loaded      -> return false
```

Для обычного initial load `error` можно либо не auto-retry, либо разрешать только через explicit retry action. Следуй текущему UX.

Главное: check + transition должны выполняться атомарно внутри одного store action.

Strict Mode flow должен быть:

```text
mount #1
beginCupTopLeaderboardLoad(cupId) -> true
-> HTTP request

unmount

mount #2
beginCupTopLeaderboardLoad(cupId) -> false
-> no second HTTP request
```

Не делай check отдельно от set, иначе останется race.

---

## 4. Add store completion/error actions

Нужны actions вида:

```ts
setCupTopLeaderboard(cupId, data)
failCupTopLeaderboardLoad(cupId, error)
```

После success:

```text
status = loaded
data = response
error = null
```

После failure:

```text
status = error
error = error
```

Retry должен переводить state обратно в `loading` и выполнять новый request.

---

## 5. Add/use `useCupTopLeaderboard(cupId)`

Вынеси orchestration initial Top request в отдельный hook, если это соответствует текущей архитектуре.

Пример ответственности:

```ts
useCupTopLeaderboard(cupId)
```

должен:

- читать state из store;
- запускать initial load при наличии `cupId`;
- использовать store atomic begin guard;
- вызывать существующий API:
  `GET /api/cups/:cupId/leaderboard?mode=top&limit=50`;
- сохранять success/error в store;
- отдавать:
  - `data`
  - `isLoading`
  - `errorMessage`
  - `retry`

Не создавать новый `ApiClient` на каждый render.

Используй существующий stable API client ownership.

---

## 6. CupScreen owns initial Top loading

`CupScreen` должен orchestration-level получать initial Top:

```ts
const {
  data: topLeaderboard,
  isLoading: isTopLeaderboardLoading,
  errorMessage: topLeaderboardError,
  retry: retryTopLeaderboard,
} = useCupTopLeaderboard(cupId);
```

И передавать вниз данные/состояние.

Не передавать raw `ApiClient` в presentation components без необходимости.

---

## 7. CupLeaderboard remains presentation + lazy modes

`CupLeaderboard` не должен делать Top request на mount.

Он получает initial Top через props/state сверху.

Пример:

```ts
interface ICupLeaderboardProps {
  cupId: string;
  initialTop: ICupLeaderboardPage | null;
  isInitialTopLoading: boolean;
  initialTopError: string | null;
  retryInitialTop: () => void;

  loadPage: (...args) => Promise<...>;
  loadAroundMe: (...args) => Promise<...>;
}
```

Exact API адаптируй под проект.

Top rendering:
- loading -> текущий loading UI;
- error -> текущий error/retry UI;
- loaded -> rows;
- no mount HTTP request.

Around Me / All / pagination не менять концептуально.

---

## 8. Lazy modes remain separate

Сохрани текущую механику:

### Around Me
```text
GET /api/cups/:cupId/leaderboard/me?radius=4
```

Только после выбора режима.

### All
```text
GET /api/cups/:cupId/leaderboard?mode=all&limit=50
```

Только после выбора режима.

### Pagination
```text
GET /api/cups/:cupId/leaderboard?mode=all&limit=50&cursor=...
```

Сохрани same-cursor guard.

Initial Top store state не должен использоваться как generic cache для Around Me / All.

---

## 9. Cache semantics

Для одного и того же `cupId`:

- first Cup open -> load Top once;
- StrictMode remount -> no second request;
- обычный rerender -> no request;
- переход на другой screen и обратно -> reuse loaded Top;
- если cupId изменился -> load new Top once.

Не требуется TTL/refetch-on-focus/stale-while-revalidate, если этого уже нет в проекте.

Не добавляй speculative cache invalidation.

---

## 10. Retry semantics

После Top request failure:

- показать текущий translated API error;
- explicit Retry должен отправить новый request;
- status должен корректно перейти `error -> loading -> loaded/error`;
- StrictMode не должен блокировать retry навсегда.

Не auto-loop retry.

---

## 11. Cleanup

После refactor удалить dead code, связанный с Top-in-bootstrap:

- bootstrap leaderboard DTO fields;
- serialization/types;
- backend bootstrap leaderboard query;
- frontend bootstrap mapping;
- tests, которые ожидают `cup.leaderboard.top` в bootstrap.

Не трогать standalone leaderboard API routes.

---

## 12. Do not reintroduce generic dedup layer

Запрещено:

- shared/global `Map<requestKey, Promise>`;
- `hasLoadedRef`;
- `useRef` guard на mount;
- debounce;
- setTimeout;
- disabling StrictMode;
- swallowing duplicate responses after HTTP already sent;
- generic query cache framework только ради одного initial Top request.

Store status — это source of truth для ownership initial Top load.

---

## Tests

Добавить/обновить тесты минимум на:

1. bootstrap больше не содержит `cup.leaderboard.top`;
2. bootstrap backend больше не вызывает Top leaderboard query;
3. first `CupScreen` open -> one Top request;
4. simulated StrictMode remount -> still one Top request;
5. second render/remount same cupId after loaded -> zero additional requests;
6. different cupId -> separate Top request;
7. failed request -> store status `error`;
8. Retry after error -> new request works;
9. loading state blocks second concurrent initial load;
10. loaded state blocks redundant load;
11. `CupLeaderboard` itself не вызывает Top request на mount;
12. Around Me remains lazy with radius=4;
13. All remains lazy;
14. pagination behavior remains unchanged.

Если есть store unit tests — протестировать atomic `beginCupTopLeaderboardLoad(cupId)` отдельно.

---

## Verification

Запустить:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Проверить dev Network с включённым Strict Mode.

При первом открытии Cup:

```text
/api/cups/:cupId/leaderboard?mode=top&limit=50   exactly 1
```

Несмотря на:

```text
CupScreen mounted
CupScreen unmounted
CupScreen mounted
```

При повторном переходе на Cup того же cupId:

```text
additional top requests = 0
```

Around Me / All должны появляться только после выбора соответствующих режимов.

---

## Non-goals

Не менять:
- leaderboard ranking logic;
- Top 50 limit;
- Around Me radius=4;
- All pagination;
- Cup UI;
- Prizes;
- navigation;
- unrelated bootstrap data;
- API endpoint contracts.

---

## Final report

В конце отчитай:

1. какие store fields/actions добавлены;
2. как работает atomic begin-load guard;
3. какие bootstrap fields/query удалены;
4. final request flow;
5. подтверждение StrictMode dev behavior;
6. retry behavior;
7. tests/lint/typecheck/build results.

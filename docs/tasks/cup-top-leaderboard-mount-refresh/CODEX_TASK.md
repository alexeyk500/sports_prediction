# Codex Task: Simplify Cup Top leaderboard refresh to mount-based loading

## Task name

`cup-top-leaderboard-mount-refresh`

## Goal

Упростить текущую механику обновления initial Top 50 Cup leaderboard.

Сейчас для различения реального повторного входа в Cup и React Strict Mode remount используется `entryVersion`, который создаётся в `AppShell` и прокидывается в `CupScreen`.

Нужно удалить эту навигационную надстройку и перейти к более простой семантике:

```text
каждый реальный mount CupScreen
-> пробуем загрузить fresh Top 50

если Top уже грузится
-> второй concurrent mount/load ничего не делает

если предыдущая загрузка завершена (loaded/error)
-> новый mount может начать свежую загрузку
```

То есть store должен блокировать только concurrent `loading`, а не навсегда кешировать `loaded`.

## Product semantics

При каждом новом входе пользователя на экран Cup должны запрашиваться свежие Top 50 данные.

Ожидаемый flow:

```text
First Cup entry
-> GET /api/cups/:cupId/leaderboard?mode=top&limit=50

Strict Mode synthetic remount during same entry
-> no second concurrent request

Cup -> Matches -> Cup
-> new GET /api/cups/:cupId/leaderboard?mode=top&limit=50
```

Не нужно вводить отдельный entry identifier/version для этого поведения.

---

## Current implementation to inspect

Перед изменениями проследи текущий flow:

- `AppShell`
- bottom-nav screen switching
- `CupScreen`
- `useCupTopLeaderboard`
- `bootstrap-store.ts`
- `beginCupTopLeaderboardLoad(cupId)`
- `entryVersion`
- props, которые передают entryVersion вниз
- Top leaderboard loading/error/retry tests
- Strict Mode tests

Убедись, что `CupScreen` действительно remount-ится при новом входе с другого bottom-nav экрана.

---

## Required refactor

### 1. Remove `entryVersion`

Удалить `entryVersion` из:

- `AppShell`
- Cup navigation state
- `CupScreen` props
- hooks
- tests
- types
- любой связанной логики

Не заменять его другим route-entry counter/token/id.

### 2. Load Top on `CupScreen` mount

`CupScreen` или `useCupTopLeaderboard(cupId)` должен инициировать fresh Top load при mount.

Conceptually:

```ts
useEffect(() => {
  if (!cupId) return;
  void loadTop(cupId);
}, [cupId, loadTop]);
```

При этом сам `loadTop` должен иметь store-level concurrent guard.

### 3. Store guard blocks only `loading`

`beginCupTopLeaderboardLoad(cupId)` должен разрешать новый load при:

```text
idle   -> loading -> true
loaded -> loading -> true
error  -> loading -> true
```

И блокировать только:

```text
loading -> false
```

Check + transition должны быть атомарными внутри store action.

### 4. Keep state per cupId

Состояние Top leaderboard остаётся per `cupId`.

Это нужно, чтобы:

- concurrent request конкретного Cup был защищён;
- данные одного Cup не смешивались с другим;
- смена cupId корректно работала.

Но `loaded` НЕ означает permanent cache. Новый mount того же `cupId` может refresh-ить данные.

### 5. Preserve current data while refreshing if appropriate

Если текущий UI уже умеет показывать предыдущие loaded rows во время refresh, сохрани это поведение.

Предпочтительно:

```text
loaded data exists
new mount starts refresh
-> old rows may remain visible
-> loading state can indicate refresh without clearing the table
```

Но не вводи сложный stale-while-revalidate layer, если его нет.

Если текущая модель при `loading` очищает данные и показывает spinner, можно сохранить текущую UX-семантику, если это проще и не ломает UI.

### 6. Strict Mode behavior

React Strict Mode уже подтверждён фактическим lifecycle:

```text
CupScreen mounted
CupScreen unmounted
CupScreen mounted
```

Нужно сохранить отсутствие concurrent duplicate request в нормальном случае:

```text
mount #1
-> begin(cupId) = true
-> request starts

mount #2 while status=loading
-> begin(cupId) = false
-> no second request
```

Не отключать Strict Mode.

Не использовать:

- `hasLoadedRef`
- `useRef` mount guards
- debounce
- timers
- global generic in-flight Map
- entry token/version

### 7. Retry

После error:

```text
status = error
```

Explicit Retry должен снова запускать Top request.

Поскольку `error -> loading` разрешён, отдельного special-case guard не требуется.

### 8. CupLeaderboard stays passive for Top

`CupLeaderboard` по-прежнему не должен сам делать initial Top request.

Он получает:

- Top data
- loading state
- error
- retry

сверху.

Around Me / All / pagination оставить lazy и без изменения бизнес-семантики.

### 9. Do not touch bootstrap

Bootstrap уже не содержит Top 50. Это нужно сохранить.

Не возвращать leaderboard обратно в bootstrap.

---

## Important race note

При очень быстром response теоретически возможен редкий race:

```text
mount #1
-> request starts
-> request finishes -> loaded
-> Strict Mode mount #2
-> loaded -> loading -> second request
```

Не усложняй архитектуру ради полного устранения этого теоретического edge case, если текущий runtime не демонстрирует его.

Цель этой задачи — убрать overengineering с `entryVersion` и оставить простой mount + loading guard.

Если в реальном dev trace второй request всё же стабильно воспроизводится из-за слишком быстрого response, зафиксируй это в отчёте и предложи минимальную альтернативу, но не вводи новый navigation entry token без отдельного согласования.

---

## Tests

Обновить/добавить тесты минимум на:

1. `entryVersion` полностью удалён.
2. first Cup mount -> one Top request.
3. second concurrent load while status=`loading` -> no second request.
4. after success (`loaded`) a new mount -> new Top request allowed.
5. after error a new mount/retry -> new Top request allowed.
6. same cupId after leaving and re-entering Cup -> fresh request.
7. different cupId -> independent request/state.
8. `CupLeaderboard` does not own Top mount loading.
9. Around Me remains lazy.
10. All remains lazy.
11. pagination unchanged.
12. bootstrap still does not include Top leaderboard.

Если есть AppShell tests, обновить их так, чтобы Cup navigation больше не генерировала `entryVersion`.

---

## Verification

Run:

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

Проверить dev Network с включённым Strict Mode.

Expected:

### First Cup entry

```text
GET /api/cups/:cupId/leaderboard?mode=top&limit=50
-> 1 request
```

### Strict Mode synthetic remount during same entry

```text
additional concurrent Top requests
-> 0
```

### Cup -> Matches -> Cup

```text
GET /api/cups/:cupId/leaderboard?mode=top&limit=50
-> +1 fresh request
```

### Around Me / All

Без изменений:

```text
Around Me -> only after click
All -> only after click
```

---

## Non-goals

Do not:

- re-add Top to bootstrap;
- change leaderboard API contracts;
- change Top 50 limit;
- change ranking semantics;
- change Around Me radius=4;
- change All pagination;
- redesign Cup UI;
- change bottom-nav UX;
- introduce route entry IDs/tokens/versions;
- add generic query caching infrastructure.

---

## Final report

В конце отчитай:

1. где удалён `entryVersion`;
2. как теперь запускается Top refresh;
3. точная семантика `beginCupTopLeaderboardLoad`;
4. dev Strict Mode Network result;
5. повторный Cup entry Network result;
6. tests/lint/typecheck/build results;
7. если выявлен real fast-response race — опиши отдельно без самостоятельного усложнения архитектуры.

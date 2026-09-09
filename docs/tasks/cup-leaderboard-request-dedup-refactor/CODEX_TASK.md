# Task: Cup leaderboard request deduplication refactor

## Goal

Refactor Cup leaderboard data loading so that the initial `top` leaderboard request is executed only once per logical query, including React Strict Mode development mounts, without disabling Strict Mode and without masking the issue with component-local `useRef` flags, debounce, timers, or ad-hoc global booleans.

The current `CupLeaderboard` implementation owns network loading directly inside the presentation component and has a fragile dependency graph:

- `useEffect(..., [activeMode, loadMode])`
- `loadMode` depends on the entire `modeState`
- `modeState` changes recreate `loadMode`
- `dataSource` identity may also recreate `loadMode`
- `isLoaded` only becomes `true` after the HTTP request resolves, so duplicate effect execution can start a second identical request while the first one is still in flight

Observed duplicate request:

```text
GET /api/cups/:cupId/leaderboard?mode=top&limit=50
GET /api/cups/:cupId/leaderboard?mode=top&limit=50
```

## Source component

Refactor the current `CupLeaderboard` component and the data layer it uses.

Current responsibilities mixed inside `CupLeaderboard`:

- active leaderboard mode UI state
- cache/state per mode
- initial mode loading
- retries
- pagination for `all`
- in-flight loading state
- API errors and translation
- direct HTTP/dataSource orchestration

The target architecture should separate presentation/UI state from query/data-loading responsibilities.

---

## Required architecture

### 1. Keep `CupLeaderboard` primarily as a presentation/composition component

`CupLeaderboard` may keep UI-only state such as:

```ts
const [activeMode, setActiveMode] = useState<CupLeaderboardMode>("top");
```

It should not own low-level request deduplication logic.

Move leaderboard data loading into a dedicated hook/data layer, for example:

```ts
useCupLeaderboard({ cupId, mode, dataSource })
```

or an equivalent project-appropriate abstraction.

Do not introduce a new dependency solely for this task if the project does not already use a query library.

---

### 2. Deduplicate identical in-flight requests at the data/query layer

Identical requests must share the same in-flight Promise instead of creating multiple HTTP requests.

At minimum, the request identity must include all parameters that affect the endpoint response:

```text
cupId
mode
limit
cursor
radius (for around-me)
```

Conceptually:

```ts
const pendingRequests = new Map<string, Promise<LeaderboardResponse>>();

function loadPage(params) {
  const key = createLeaderboardRequestKey(params);
  const existing = pendingRequests.get(key);

  if (existing) {
    return existing;
  }

  const request = actualLoad(params).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}
```

The exact implementation may differ to fit the existing architecture, but the semantics are required:

- first caller starts HTTP request
- second caller with the same request key while the first is pending receives the same Promise
- only one HTTP request is sent
- entry is cleared after resolve/reject
- retry after failure must still be possible

Do not permanently cache failed requests.

---

### 3. Remove the `modeState -> loadMode -> useEffect` dependency loop

Current problematic pattern:

```ts
const loadMode = useCallback(..., [cupId, dataSource, locale, modeState]);

useEffect(() => {
  void loadMode(activeMode);
}, [activeMode, loadMode]);
```

Refactor so that updating leaderboard rows does not recreate a callback which itself retriggers the loading effect.

The data-loading effect/query should be driven by stable request identity:

```text
cupId + activeMode (+ pagination parameters where relevant)
```

and not by the complete response state object.

Avoid dependencies such as the full `modeState` object in the initial-load callback.

---

### 4. Preserve lazy mode loading

Do NOT load all leaderboard modes on mount.

Expected behavior:

```text
initial Cup leaderboard mount
→ load `top` only

user opens `around-me`
→ load around-me only on first use

user opens `all`
→ load first all page only on first use
```

If the user switches back to an already loaded mode, reuse the existing loaded data and do not make another request unless they explicitly retry/refresh.

---

### 5. Preserve `all` pagination

Existing pagination semantics must remain:

```text
mode=all
limit=50
cursor=...
```

Requirements:

- first `all` page loads once
- next pages append using `mergeCupLeaderboardRows`
- duplicate concurrent requests for the same cursor must be deduplicated
- `IntersectionObserver` and manual `Load more` must not be able to start two identical next-page requests concurrently
- different cursors are different requests and must not be collapsed together

---

### 6. Preserve `around-me`

Keep:

```ts
const AROUND_ME_RADIUS = 4;
```

and current endpoint/dataSource semantics.

The request must be deduplicated by at least:

```text
cupId + radius
```

and remain lazy.

---

### 7. Preserve retry behavior

Current retry:

```tsx
onRetry={() => void loadMode(activeMode, true)}
```

Keep equivalent functionality.

Retry must intentionally start a new request after a previous request has completed/failed.

Do not let stale `isLoaded` state prevent an explicit retry.

---

### 8. Keep error presentation behavior

Continue using:

```ts
messageForApiError(error, locale)
```

Do not change user-facing error semantics unless required by the refactor.

Development logging can remain where appropriate.

---

### 9. Ensure `dataSource` identity is stable

Inspect the parent that creates and passes:

```ts
ICupLeaderboardDataSource
```

If it is created inline on every parent render, refactor it so its identity is stable, for example with `useMemo`, a module-level adapter, or a dedicated hook/service.

Do not rely on an unstable object/function identity as a trigger for network reloads.

Example of code that should NOT remain if it recreates on every render:

```tsx
<CupLeaderboard
  dataSource={{
    loadPage: (...args) => ...,
    loadAroundMe: (...args) => ...,
  }}
/>
```

unless those functions/object are otherwise guaranteed stable.

---

## Explicitly forbidden fixes

Do NOT solve the issue by:

- disabling React Strict Mode
- component-local `useRef` such as `hasLoadedRef`
- `setTimeout` / debounce
- arbitrary request delays
- suppressing duplicate calls only in development
- global boolean like `isLeaderboardLoading`
- swallowing the second request after it was already sent
- removing dependency-array entries just to silence reruns

The fix must be correct under normal React lifecycle behavior and production usage.

---

## Desired request flow

After the refactor, initial Cup load should look like:

```text
Cup bootstrap
GET /api/bootstrap/...

CupLeaderboard mount
GET /api/cups/:cupId/leaderboard?mode=top&limit=50   ← exactly one HTTP request
```

In React Strict Mode, multiple logical consumers/effect executions may call the data layer, but they must resolve through the same in-flight request:

```text
caller A ─┐
          ├─ same Promise → one HTTP request
caller B ─┘
```

---

## Tests

Add/update tests covering at least:

### In-flight deduplication

Two concurrent identical calls:

```ts
Promise.all([
  loadPage({ cupId, mode: "top", limit: 50 }),
  loadPage({ cupId, mode: "top", limit: 50 }),
]);
```

must invoke the underlying HTTP/API method exactly once.

### Request-key correctness

These must NOT be incorrectly deduplicated:

```text
top vs all
cursor A vs cursor B
cup A vs cup B
around-me radius 4 vs another radius
```

### Failure cleanup

If a request rejects:

- the pending entry is removed
- a subsequent retry starts a new HTTP call

### Mode caching

Switching:

```text
top → around-me → top
```

must not reload `top` if its data is already loaded.

### Pagination concurrency

If IntersectionObserver and the manual Load More action request the same next cursor at nearly the same time, only one HTTP request should be sent and rows should not be appended twice.

### Strict Mode / remount behavior

Where practical, add a component/hook test that simulates repeated mount/effect execution and confirms that the initial `top` HTTP request is sent once while in flight.

---

## Verification

After implementation:

1. Run unit/integration tests.
2. Run typecheck.
3. Run lint.
4. Run the app in development with React Strict Mode enabled.
5. Open Cup screen and inspect Network.
6. Confirm only one request for:

```text
/api/cups/:cupId/leaderboard?mode=top&limit=50
```

7. Switch to Around Me and confirm one lazy request.
8. Switch to All and confirm one first-page request.
9. Trigger pagination and confirm one request per cursor.
10. Verify production build behavior as well.

---

## Non-goals

Do not change:

- leaderboard ranking/business semantics
- API response shape unless absolutely required for internal refactor
- leaderboard visual design
- Cup/Prizes UI
- Cup routes/navigation
- bootstrap business data
- match/prediction logic
- ranking calculations on backend

Do not move the full paginated leaderboard into Cup bootstrap as part of this task. The leaderboard remains a legitimate lazy/paginated data source; this task is about correct ownership, stable dependencies, and request deduplication.

---

## Acceptance criteria

Task is complete when:

- initial `top` leaderboard sends exactly one HTTP request
- React Strict Mode remains enabled
- identical concurrent requests share one in-flight Promise
- `CupLeaderboard` no longer has the fragile `modeState -> loadMode -> effect` reload cycle
- already loaded modes are reused without refetching
- `around-me` remains lazy
- `all` pagination remains lazy and cursor-based
- duplicate same-cursor pagination cannot append duplicate rows
- retry works after errors
- unstable parent `dataSource` identity is fixed if present
- tests/typecheck/lint pass
- no visual/business behavior regressions

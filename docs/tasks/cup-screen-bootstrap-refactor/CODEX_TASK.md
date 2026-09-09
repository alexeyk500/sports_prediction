# Task: Refactor CupScreen bootstrap/data-loading responsibilities

## Goal

Refactor `CupScreen` so it is primarily a screen-composition component and the Cup initial data flow is simpler, easier to reason about, and based on a single bootstrap request.

The current `CupScreen` mixes:
- API client construction;
- bootstrap loading;
- store synchronization;
- loading/error state;
- a 30-second clock tick;
- derived `nowMs` calculation;
- screen composition.

The target is to separate data-loading and clock concerns from the screen component without changing product behavior.

## Current component

The current component is conceptually equivalent to:

```tsx
const CupScreen = (...) => {
  const { bootstrap, setBootstrap } = useBootstrapStore();
  const apiClient = useMemo(() => new ApiClient({ getTelegramInitData }), []);
  const [activeTab, setActiveTab] = useState<CupTab>("current");
  const [isBootstrapping, setIsBootstrapping] = useState(!bootstrap);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(0);

  const load = useCallback(async () => {
    setErrorMessage(null);
    const nextBootstrap = await apiClient.getBootstrap();
    setBootstrap(nextBootstrap);
  }, [apiClient, setBootstrap]);

  // bootstrap effect
  // clock effect
  // nowMs memo
  // render
};
```

## Required refactor

### 1. Extract Cup bootstrap loading into a dedicated hook

Create a hook such as:

```ts
useCupBootstrap()
```

The hook should own:
- reading/writing `useBootstrapStore`;
- calling the existing bootstrap API;
- loading state;
- error state;
- error presentation/logging related to bootstrap loading.

Suggested public shape:

```ts
{
  bootstrap,
  isLoading,
  errorMessage,
  apiClient,
}
```

or a cleaner equivalent appropriate for the current architecture.

Important:
- there must still be only one initial bootstrap HTTP request for Cup data;
- if the bootstrap is already present in the store, do not fetch it again unnecessarily;
- do not introduce polling;
- do not add frontend mock/fallback data;
- do not disable React Strict Mode as a workaround;
- do not add arbitrary `useRef`/global-dedupe hacks unless the project already has an established shared request-deduplication abstraction and using it is architecturally correct.

If `ApiClient` is already provided by a shared module/provider elsewhere in the project, reuse that instead of creating another instance inside the hook. Otherwise move the current construction out of `CupScreen` into the data layer/hook.

### 2. Extract the Cup clock into a dedicated hook

Create a hook such as:

```ts
useCupClock(...)
```

It should own:
- the 30-second tick;
- calculation of current effective time from `bootstrap.serverTime`;
- cleanup of the interval.

`CupScreen` should not directly contain interval-management logic.

Review the existing fallback:

```ts
if (Number.isNaN(serverTimeMs)) {
  const fallbackMs = Date.parse(bootstrap.currentTournament?.endsAt ?? "");
  return Number.isNaN(fallbackMs) ? 0 : fallbackMs;
}
```

Using `endsAt` as the current time is semantically wrong because it can collapse the countdown to zero. Replace it with a sensible fallback, preferably current client time (`Date.now()`) if no trustworthy server time is available, unless the project has an existing time-sync utility that should be used instead.

Preserve the intended behavior that countdown/time-sensitive UI advances without additional HTTP requests.

### 3. Simplify CupScreen

After the refactor, `CupScreen` should mostly be responsible for:
- active tab state;
- loading/empty/error rendering;
- composing `CupHeader`, `CupModeTabs`, `CurrentCupView`, `PrizesView`;
- passing already-resolved data/handlers to children.

Target conceptual shape:

```tsx
const CupScreen: React.FC<ICupScreenProps> = ({ onOpenMatches }) => {
  const { t } = useTranslation();
  const { bootstrap, isLoading, errorMessage, apiClient } = useCupBootstrap();
  const [activeTab, setActiveTab] = useState<CupTab>("current");
  const nowMs = useCupClock(bootstrap?.serverTime);

  if (isLoading) {
    ...
  }

  if (!bootstrap) {
    ...
  }

  return (...);
};
```

This is only illustrative. Follow the repository's established naming/file-placement conventions.

### 4. Remove redundant prop/data passing where safe

Currently `CurrentCupView` receives both:

```tsx
bootstrap={bootstrap}
cup={bootstrap.cup}
```

Review `CurrentCupView` and remove redundant props if this can be done cleanly without broad unrelated changes.

Prefer explicit data props over passing a large bootstrap object when a child only needs a small subset.

However:
- do not blindly rewrite unrelated child architecture;
- keep the scope focused on simplifying the Cup screen data flow.

### 5. Audit child-side API loading

Inspect `CurrentCupView` and direct Cup-screen children for extra requests that happen automatically on initial mount.

The desired initial data flow is:

```text
Cup screen initial load
  -> one bootstrap request
  -> render Current Cup / Prizes from bootstrap data
```

If child components are automatically fetching data that is already available in bootstrap, remove that duplication and use bootstrap data instead.

Do NOT remove legitimate lazy requests that are required only after a user action or for functionality not included in bootstrap, for example paginated/full leaderboard modes, unless the bootstrap already fully replaces them.

Document any request that intentionally remains separate and why.

### 6. Keep presentation components API-light

Where practical, avoid passing `ApiClient` into purely presentational Cup components.

Desired direction:

```text
Cup data hook / data layer
        -> API

CupScreen
CurrentCupView
PrizesView
CupHeader
CupModeTabs
        -> render/composition
```

If `CurrentCupView` still genuinely needs `apiClient` for user-triggered/lazy functionality, keep it, but isolate that responsibility and do not force a broad rewrite just to satisfy this diagram.

## Non-goals

Do not change:
- Cup business logic;
- prize distribution logic;
- leaderboard semantics;
- Matches behavior;
- navigation/routes;
- visual design/layout/styles except incidental cleanup required by the refactor;
- bottom navigation;
- API response contracts unless absolutely necessary for eliminating duplicated data fetching.

Do not add a new state-management library or query library solely for this task.

## Expected file structure

Use repository conventions, but a reasonable result could be:

```text
CupScreen/
├── CupScreen.tsx
├── CupScreen.module.css
├── hooks/
│   ├── useCupBootstrap.ts
│   └── useCupClock.ts
└── ...
```

If the project keeps shared hooks elsewhere, follow that existing structure instead.

## Validation

Verify all of the following:

1. Opening Cup with an empty bootstrap store triggers one logical bootstrap load.
2. If bootstrap already exists in the store, opening/remounting Cup does not refetch it unnecessarily.
3. `CupScreen` no longer directly owns API bootstrap loading details.
4. `CupScreen` no longer directly owns the interval/tick implementation.
5. Countdown/time-sensitive UI still updates every 30 seconds without HTTP requests.
6. Invalid/missing `serverTime` does not use tournament `endsAt` as the current time.
7. Current Cup and Prizes render exactly as before.
8. Existing Cup error/empty/loading UI still works.
9. No new automatic duplicate requests are introduced.
10. Run the relevant unit/component tests, lint and TypeScript checks used by the project.

## Deliverable

Implement the refactor and provide a concise summary containing:
- what logic was extracted from `CupScreen`;
- what files/hooks were added or changed;
- how many HTTP requests happen on initial Cup load after the refactor;
- whether any separate child request remains and why;
- test/typecheck/lint results.

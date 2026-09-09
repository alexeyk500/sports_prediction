# Codex Task — Investigate duplicated network requests

## Goal

Find and fix the bug that causes API requests to be executed twice.

Use the attached Network screenshot as evidence:

- `network-duplicates.png`

The screenshot shows repeated pairs of the same requests, including:

- `bootstrap`
- `today`
- `leaderboard?mode=top&limit=50`
- `history`

All duplicate calls return `200`, and the initiator shown in DevTools is `client.ts:174`.

## Important

Do **not** apply a blind workaround such as:

- globally suppressing duplicate fetches;
- adding arbitrary `useRef` guards everywhere;
- disabling React Strict Mode without proving it is the root cause;
- adding debounce/throttle to API calls that should naturally execute once;
- hiding duplicate requests through caching without understanding why they are issued twice.

First identify the real source of the duplicate execution.

## Investigation plan

Trace the request path starting from the fetch wrapper around `client.ts:174`.

For every duplicated request, determine:

1. Which component/hook/service triggers it.
2. How many times the caller is mounted/rendered.
3. Whether the request originates from:
   - `useEffect`;
   - route/page mount;
   - duplicated provider/bootstrap initialization;
   - duplicated query hooks;
   - React Strict Mode development behavior;
   - Suspense / remounting;
   - navigation/layout composition;
   - manual refetch;
   - another client-side lifecycle issue.
4. Whether duplication occurs:
   - only in development;
   - in a production build as well.

## React Strict Mode

Explicitly verify whether React Strict Mode is involved.

If development Strict Mode is the only reason for the second request, do not simply turn Strict Mode off.

Instead determine whether the current data-loading implementation is lifecycle-safe and whether request deduplication/caching belongs in the existing data layer.

If duplicate HTTP requests also happen in production, treat this as an actual application bug and fix the duplicate caller/lifecycle.

Document the conclusion in code comments only if it is non-obvious and useful; do not add unnecessary explanatory comments.

## Scope

Inspect at least the code paths responsible for:

```text
bootstrap
today
leaderboard?mode=top&limit=50
history
```

Because all of them are duplicated, look first for a shared architectural cause before fixing endpoints individually.

Pay particular attention to:

- app/root providers;
- page/layout composition;
- shared bootstrap hooks;
- query/data-fetching hooks;
- `client.ts`;
- effects whose dependencies may be unstable;
- components mounted twice;
- fetch functions invoked both by parent and child components.

## Expected fix

After the root cause is identified, implement the smallest architectural fix so that one logical data load produces one HTTP request.

Preserve:

- existing API contracts;
- routes;
- loading/error states;
- cache behavior;
- Cup/Matches/History/Leaderboard functionality;
- light/dark theme behavior.

Do not introduce endpoint-specific hacks if the same root cause affects all requests.

## Verification

Verify in browser DevTools Network that the duplicated pairs are gone.

Check at least:

- initial app/bootstrap load;
- Matches / today data;
- Cup leaderboard;
- History.

Run both:

1. normal development mode;
2. production build/start if the project supports it.

Record the root cause and verification result in the final Codex report.

## Acceptance criteria

- Root cause of duplicated requests is explicitly identified.
- It is confirmed whether React Strict Mode is or is not involved.
- Duplicate HTTP calls are removed at the correct architectural layer.
- `bootstrap` is not unnecessarily requested twice.
- `today` is not unnecessarily requested twice.
- leaderboard request is not unnecessarily requested twice.
- `history` is not unnecessarily requested twice.
- No API response or UI behavior is broken.
- No blind `useRef`/debounce/global suppression workaround is introduced.
- Production behavior is verified separately from development behavior.

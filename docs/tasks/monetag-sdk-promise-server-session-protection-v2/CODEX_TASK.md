# CODEX TASK — Monetag Rewarded Interstitial via SDK Promise + Server Session Protection (v2)

## Goal

Refactor the existing Monetag rewarded-ad integration so Goalstery no longer depends on Monetag server-side postbacks for granting one additional prediction.

New MVP contract:

**Successful Monetag Rewarded Interstitial SDK Promise + authenticated server session confirmation = one single-use extra prediction.**

This version additionally incorporates Monetag Developer FAQ requirements for React/Next.js SDK initialization, preload behavior, timeout handling, placement analytics and ad-ready UX.

Read `FLOW_SPEC.md` and `MONETAG_FAQ_NOTES.md` before modifying code. Treat them as authoritative for this follow-up.

## Existing architecture to preserve

The repository already contains:
- `monetag-tg-sdk`;
- server-created `AdReward` / reward sessions;
- server-generated opaque `ymid`;
- existing `VERIFIED -> CONSUMED` single-use grant lifecycle;
- transactional grant consumption during quota-gated prediction submission;
- MatchCard reward flow;
- dev/prod Monetag main SDK zone configuration;
- lifecycle/My Picks/settled-result UI;
- concurrency/idempotency tests.

Do not rebuild the reward domain. Replace only the reward-verification source.

Current authority:

`CREATED -> Monetag server postback -> VERIFIED`

Target authority:

`CREATED -> Monetag SDK Promise resolves -> authenticated confirm endpoint -> VERIFIED`

## Product rule

For this MVP:

**1 successful rewarded ad flow = 1 single-use extra prediction.**

The ad does not directly mutate quota on the client. The backend confirm endpoint remains authoritative for creating the verified reward state.

## 1. Keep server-created reward sessions

Keep the existing reward session model and current good fields.

Required invariants:
- reward session created only by backend;
- authenticated user ownership;
- opaque server-generated `ymid`;
- placement = Matches extra prediction;
- short expiration;
- valid lifecycle state;
- optional fixture/outcome audit metadata may remain;
- one session can produce at most one verified grant;
- one verified grant can be consumed at most once.

Client must never choose authoritative:
- `userId`;
- Telegram user id;
- reward status;
- `ymid`;
- provider identity;
- reward amount.

## 2. Authenticated confirm endpoint

Implement an authenticated endpoint following current route conventions, conceptually:

`POST /api/ad-rewards/monetag/sessions/:id/confirm`

It must:
- authenticate using the existing Telegram/user auth;
- load the reward session for the current authenticated user;
- reject wrong owner;
- reject expired session;
- reject wrong provider/placement;
- reject invalid state;
- be idempotent for already-VERIFIED session;
- never create more than one verified reward;
- be concurrency-safe;
- return controlled 4xx domain responses for expected failures;
- never trust a client supplied `ymid`, zone id, requestVar, Telegram id or reward status as proof.

Document explicitly that this endpoint does not cryptographically prove ad viewing.

## 3. Monetag SDK initialization — React/Next.js

Use the official npm package:

`monetag-tg-sdk`

Use only the **main SDK zone ID**.

Do not use a Monetag sub-zone in `createAdHandler(...)`.

Create the ad handler once per effective zone/client lifecycle rather than on every render or every button click.

The SDK boundary must be client-side only and must not execute during SSR.

Preferred behavior:
- initialize after hydration / DOM availability;
- keep handler in a stable module/singleton/ref abstraction;
- recreate only if the configured main zone actually changes;
- avoid loading multiple SDK instances.

If the current `src/lib/monetag/rewarded-interstitial.ts` abstraction already satisfies this, extend it rather than adding a second wrapper.

## 4. Preload flow — required

Monetag recommends preloading Rewarded Interstitials.

Use:

`type: "preload"`

with:

`timeout: 5`

and the server-created `ymid`.

Example contract:

```ts
await adHandler({
  type: "preload",
  timeout: 5,
  ymid,
  requestVar: "matches_extra_prediction",
});
```

Important:
- `timeout` applies to preload only;
- do not pass or rely on `timeout` for the direct show call;
- preload failure must be handled via `.catch()` / rejected Promise;
- preload failure must not grant reward;
- preload failure must leave the UI recoverable.

## 5. Ad-ready UX

Do not start the ad before preload succeeds when the preload flow is used.

Target UI lifecycle:

`rewardRequired -> adPreloading -> adReady -> adShowing -> confirming -> granted`

Recoverable states:
- preload unavailable/failed;
- ad show failed;
- ad skipped/rejected;
- confirm failed;
- session expired;
- session invalid.

Preferred behavior:
- once rewardRequired is known, create/reuse one eligible reward session and preload in advance;
- show the CTA as ready only after preload succeeds;
- if preload is still running, button must not trigger `show`;
- while `adShowing` or `confirming`, duplicate launches are blocked.

If product UX currently requires preload to start only after explicit user interaction, keep that behavior only if necessary, but still maintain the semantic `preloading -> ready -> showing` states and do not issue show before preload success.

## 6. Same ymid for preload and show

For one reward attempt:

**1 reward session = 1 ymid = 1 preload/show lifecycle**

Use the same `ymid` for:
- preload;
- direct show.

Do not reuse one `ymid` for multiple rewarded ad attempts.

After the show flow completes or fails, treat the preload as consumed/invalid and reset local `isPreloaded`/ready state.

A later reward attempt must use a fresh or explicitly reusable server session according to backend policy.

## 7. requestVar semantics

Continue passing a stable placement marker such as:

`matches_extra_prediction`

Use it for Monetag analytics/reporting only.

Do **not** use `requestVar` as a security primitive in the new no-postback flow.

Backend confirm must not depend on a client-provided requestVar.

## 8. Direct show flow

After preload succeeds, show the ad with the same session `ymid`.

Conceptually:

```ts
await adHandler({
  ymid,
  requestVar: "matches_extra_prediction",
});
```

Do not use `timeout` here.

Always handle rejection.

If show rejects/skips/fails:
- do not call backend confirm;
- do not grant reward;
- reset ready/preload state;
- present a recoverable retry state.

If show resolves:
- reset preload-ready state because that loaded ad has been used;
- call authenticated confirm exactly once;
- do not mark durable reward locally before confirm succeeds.

## 9. Confirm flow after SDK Promise success

Target sequence:

1. SDK show Promise resolves;
2. frontend calls authenticated confirm endpoint exactly once;
3. backend transitions valid session to VERIFIED;
4. frontend refreshes/reconciles authoritative access/quota state;
5. prediction controls become actionable only after backend state confirms access.

Do not keep the old "waiting for Monetag postback" verification loop.

Rename old postback-specific UI copy/state such as `verifying` if it implies a server-to-server provider confirmation that no longer exists.

`confirming` is preferred.

## 10. Server session protection

Because postback authority is removed, compensate with server protections.

### Ownership
Session belongs to one authenticated user only.

### TTL
Use a short bounded expiry.

Prefer existing expiry if already correct; otherwise use 5–10 minutes and document the exact choice.

### Active session protection
Prevent unlimited active sessions.

Prefer:
- one active non-expired session per user + placement;
- safe reuse of an existing active session if appropriate;

or controlled rejection if repository architecture makes reuse undesirable.

### Idempotency
Repeated confirm of an already VERIFIED session must not mint duplicate rewards.

### Concurrency
Concurrent confirm requests must result in at most one verified reward state.

### State machine
Keep the minimal useful lifecycle, e.g.:

`CREATED -> VERIFIED -> CONSUMED`

Existing terminal states like `EXPIRED` / `REJECTED` may remain if already meaningful.

## 11. Preserve atomic consumption

Do not weaken existing prediction transaction logic.

Required invariant:
- free quota first, according to current rules;
- when free quota is exhausted, one valid VERIFIED reward can authorize one additional quota-gated prediction;
- one reward cannot be consumed twice;
- prediction creation + rewarded usage + AdReward consumption remain transaction-safe;
- concurrent prediction submits cannot spend one reward twice;
- editing semantics remain exactly as already defined by the project.

## 12. Remove postback as reward authority

The Monetag public postback route must no longer be able to create, verify or mutate a reward.

Audit all existing postback code.

Preferred outcome:
- remove the public postback route;
- remove dead postback-only service logic;
- remove postback-only tests;
- remove postback setup from docs.

If there is a compelling reason to retain a diagnostic route, it must be strictly non-authoritative and incapable of changing reward state.

Do not leave two reward-authority paths.

Retire concepts that are only needed for the old authority flow:
- `reward_event_type === valued`;
- `non_valued` reward gating;
- postback retry idempotency;
- postback `telegram_id`;
- postback zone/requestVar validation.

Legacy DB fields may remain only if removing them creates unnecessary migration risk. If they remain, document them as unused legacy audit fields.

## 13. Development and production

Use the same real Monetag SDK flow in both environments.

Development Telegram Mini App:
- real Monetag SDK;
- dedicated development **main SDK zone**;
- real preload;
- real rewarded show;
- SDK Promise;
- authenticated Goalstery confirm;
- VERIFIED;
- real single-use consumption.

Production:
- same code;
- separate production main SDK zone.

Environment variable remains conceptually:

`MONETAG_REWARDED_INTERSTITIAL_ZONE_ID`

No dev reward bypass.
No fake grant action in runtime UI.
Mocks only in automated tests.

## 14. Main zone requirement

Audit configuration and tests to ensure:
- `createAdHandler(zoneId)` uses the configured **main zone ID**;
- no sub-zone is passed to the SDK;
- docs explicitly call this out;
- dev/prod values are both main zones.

## 15. SDK readiness

Ensure ad calls happen only after SDK/client initialization.

Expected behavior:
- no SDK call during SSR;
- no call before handler exists;
- unavailable/not-ready state is handled without 500/crash;
- preload may start after client readiness;
- UI remains recoverable if SDK cannot initialize.

## 16. MatchCard behavior

Do not regress the existing card architecture.

Must remain true:
- Available and My Picks keep separate geometry;
- fixed-height / stable-layout behavior remains;
- reward transient states do not cause list jumps;
- ambient crest background remains;
- settled result UI remains;
- `canSubmitPrediction` remains authoritative for prediction mutation;
- invalid clicks still make zero prediction mutation/API requests.

Reward UI may be an extension/status area but must not accidentally resize the base card during `adPreloading`, `adReady`, `adShowing`, or `confirming`.

## 17. Error mapping

Expected failures must be controlled 4xx responses, never 500.

Cover:
- not eligible;
- session not found/wrong owner;
- expired;
- invalid state;
- already consumed;
- stale/replayed session;
- quota unavailable;
- confirmation not allowed.

Duplicate confirm of already VERIFIED should be idempotent success where reasonable.

## 18. Documentation / manual setup

Update repository docs and task/manual setup to remove postback configuration.

Manual setup should now be only:

1. prepare Telegram Mini App in Monetag;
2. create a development Rewarded Interstitial **main SDK zone**;
3. create a production Rewarded Interstitial **main SDK zone**;
4. set `MONETAG_REWARDED_INTERSTITIAL_ZONE_ID` per environment;
5. open the app inside Telegram;
6. verify:
   - rewardRequired;
   - preload succeeds;
   - CTA becomes ready;
   - show succeeds;
   - SDK Promise resolves;
   - Goalstery confirm succeeds;
   - reward becomes VERIFIED;
   - one extra prediction succeeds;
   - reward becomes CONSUMED;
   - same reward cannot be reused.

No Monetag postback URL is required for this MVP flow.

Explicitly document the security trade-off:

> Goalstery trusts the successful client-side Monetag SDK flow followed by authenticated server confirmation. This is weaker than independent server-to-server proof and is an intentional MVP trade-off.

## 19. Tests / acceptance criteria

Update/add tests for at least:

1. eligible authenticated user can create reward session;
2. ineligible user cannot create a useful session;
3. session creation grants nothing;
4. ymid is opaque/server-generated;
5. SDK handler uses configured main zone;
6. handler is initialized client-side and not recreated unnecessarily;
7. preload uses `type: "preload"`;
8. preload uses `timeout: 5`;
9. preload uses session ymid;
10. show uses the same ymid;
11. requestVar is passed for analytics;
12. direct show does not use preload timeout semantics;
13. preload rejection leaves reward unverified;
14. show rejection/skipped flow never calls confirm;
15. successful show Promise calls confirm exactly once;
16. successful show resets preloaded/ready state;
17. confirm requires auth;
18. wrong owner cannot confirm;
19. expired session cannot become VERIFIED;
20. invalid state cannot become VERIFIED;
21. confirm is idempotent;
22. concurrent confirm calls yield at most one VERIFIED state;
23. confirm itself does not consume reward;
24. one VERIFIED reward enables exactly one additional quota-gated prediction;
25. consumption remains concurrency-safe;
26. consumed reward cannot be reused;
27. old postback route cannot mint rewards;
28. postback-specific tests/docs are removed or updated;
29. UI uses `preloading -> ready -> showing -> confirming`;
30. UI does not show ready before preload success;
31. duplicate ad launches are prevented;
32. MatchCard geometry remains stable;
33. forbidden prediction clicks still produce zero prediction API requests;
34. existing lifecycle/My Picks/settled tests remain green;
35. all translations/types compile;
36. dev/prod differ only by configuration.

## 20. Verification

Run at minimum:

- `npm run typecheck`
- `npm run test:unit`
- relevant integration/API tests
- concurrency tests
- `npm run lint`
- `npm run build`
- `git diff --check`

Validate migrations if schema changes are made.

## Out of scope

- Monetag In-App Interstitial (`type: "inApp"`);
- frequency/capping/interval logic for automatic interstitials;
- rewarded popup;
- multiple ad providers;
- postback/HMAC verification;
- payout logic;
- revenue-scaled rewards;
- MatchCard redesign;
- dev fake reward button.

## Final Codex report

Include:
1. what was already present;
2. changed files;
3. schema/migration changes;
4. postback code removed/retired;
5. final reward session lifecycle;
6. TTL / active-session / ownership strategy;
7. exact SDK initialization strategy;
8. exact preload call including timeout;
9. exact show call;
10. Promise -> confirm flow;
11. idempotency/concurrency strategy;
12. grant consumption strategy;
13. dev/prod main-zone config;
14. tests/results;
15. updated manual setup;
16. explicit security limitation of client-confirmed rewards.

# CODEX TASK --- Monetag Rewarded Ads → Extra Predictions

## Goal

Integrate Monetag Rewarded Interstitial into the Telegram Mini App so
that, after the normal free prediction allowance is exhausted, a user
can watch one confirmed monetized rewarded ad and receive exactly **one
additional prediction**.

This is a production-grade integration. Development inside Telegram must
use a separate Monetag development/test SDK zone with the same
application code and the same backend reward flow as production. Do not
implement a development bypass that directly grants predictions.

Read `MONETAG_INTEGRATION_SPEC.md` before changing code. Treat it as the
integration contract for this task.

## Existing behavior that must remain intact

The existing Matches/MatchCard lifecycle refactor is authoritative: -
prediction mutation is permitted only by the existing derived
`canSubmitPrediction` rules; - `rewardRequired` is already a distinct
access state; - forbidden clicks must produce zero prediction
mutation/API requests; - Available and My Picks have different card
geometry and must not be forcibly unified; - MatchCard height must
remain stable during transient states; - ambient team crest backgrounds
and settled-result behavior must remain intact.

Audit the repository first. Reuse existing prediction-limit, quota,
entitlement, domain-error, Telegram auth and transaction abstractions
instead of creating parallel concepts.

## Product rule

MVP economy:

**1 confirmed Monetag `valued` rewarded ad = 1 additional prediction.**

A grant is single-use. It is consumed atomically when an otherwise
quota-blocked prediction is successfully created/changed according to
the project's existing quota semantics.

Do not use ad revenue (`estimated_price`) to scale the reward.

## Required architecture

### 1. Reward session

Persist a server-created ad reward session before showing an ad. Adapt
names to existing project conventions, but the model must represent at
least:

-   internal id;
-   user identity;
-   provider = Monetag;
-   placement = extra prediction on Matches;
-   unique opaque `ymid`;
-   lifecycle/status;
-   main zone expected for the environment where appropriate;
-   request/placement identifier;
-   provider event metadata needed for audit;
-   `reward_event_type`;
-   `event_type`;
-   optional sub-zone;
-   optional estimated price for analytics only;
-   created/confirmed/rejected/expired timestamps as appropriate;
-   a uniqueness constraint that makes reward confirmation idempotent.

Generate `ymid` on the server. Do not use Telegram ID, database user ID,
email, or another direct identifier as `ymid`.

### 2. Extra-prediction entitlement/grant

Use the existing quota/access model if one exists. Otherwise introduce
the smallest domain model necessary for a single-use extra prediction
grant.

Required properties: - belongs to a user; - source identifies Monetag
rewarded ad; - one reward session cannot mint more than one grant; - one
grant can be consumed at most once; - grant creation and
duplicate-postback handling are transaction-safe; - consumption is
atomic with the prediction/quota operation so concurrent requests cannot
spend one grant twice.

Do not build a separate quota system if the repository already has one.

### 3. Create-session endpoint

Add an authenticated application endpoint that creates a reward session
and returns only client-safe data required to invoke Monetag, including
the opaque `ymid` and placement/requestVar.

It must: - require the normal Telegram/user authentication; - verify the
user is actually eligible for the extra-prediction reward flow; - not
grant anything; - not accept a client-supplied user identity as
authoritative; - avoid creating unbounded reusable sessions; apply
sensible expiry/reuse rules consistent with the current architecture.

### 4. Monetag frontend integration

Use the official React/npm integration described in
`MONETAG_INTEGRATION_SPEC.md` (`monetag-tg-sdk`) unless repository
constraints make the script-tag integration clearly preferable.

Use the **main SDK zone ID**, not a sub-zone.

For each reward attempt: 1. obtain a server-created reward session; 2.
preload the rewarded interstitial using that session's `ymid`; 3.
enable/show the ad only after preload succeeds; 4. show using the same
`ymid`; 5. pass a stable `requestVar`, e.g. `matches_extra_prediction`;
6. handle Promise success and failure; 7. after client success, do not
mint the grant locally; enter a verification state and refresh/poll
authoritative server reward/access state for a bounded period; 8. on
skip/failure/unavailable, show a recoverable state and do not grant
access.

The official Telegram WebApp SDK must remain available so Monetag can
respect Telegram/system safe areas.

Do not load multiple Monetag SDK instances/tags.

### 5. Server-side postback

Implement a public HTTPS GET endpoint suitable for Monetag postbacks.

It must parse and validate the supported Monetag macros documented in
`MONETAG_INTEGRATION_SPEC.md`: - `ymid` - `zone_id` - `sub_zone_id` -
`request_var` - `telegram_id` (optional/non-authoritative) -
`event_type` - `reward_event_type` - `estimated_price`

Security/business requirements: - find the internal reward session by
opaque `ymid`; - validate placement/requestVar; - validate expected
provider/zone configuration where reliable; - never trust `telegram_id`
to select the rewarded user; - only a matching server-created session
may produce a grant; - only `reward_event_type === "valued"` may produce
the extra-prediction grant; - `non_valued` must never unlock a
prediction; - duplicate/retried postbacks for the same `ymid` must not
duplicate rewards; - malformed/unknown sessions must not create
rewards; - log sufficient provider metadata for diagnostics without
leaking secrets/PII; - successful/idempotently processed postbacks
return HTTP 200; - design error responses with Monetag retry behavior in
mind.

Do not infer "watched N seconds" using a client timer. Follow Monetag's
rewarded SDK/postback contract.

### 6. UI flow

When the existing MatchCard state is `rewardRequired`, show the existing
reward extension/action without changing the base card geometry.

Required UI state machine (names may follow project conventions):

`rewardRequired → adPreloading → adReady/adShowing → verifying → granted`

Recoverable failures: - unavailable/preload failed; - ad failed or
skipped; - verification timeout; - non-valued/rejected reward.

Rules: - while ad flow is in progress, prevent duplicate ad launches; -
do not enable prediction buttons merely because the SDK Promise
resolved; - enable them only after authoritative backend state reports
an available grant/quota; - after `granted`, preserve fixed card/list
geometry as much as the existing design permits; - localized user-facing
strings must be added to all currently supported locales (currently
en/ru/de/es/ar unless repository audit shows otherwise); - do not expose
Monetag terminology such as `ymid`, `valued`, zone IDs or postbacks in
normal UI.

### 7. Prediction consumption

Integrate the grant into the existing prediction submit/edit path.

Required invariant: - if free quota/access is available, preserve
current behavior; - if free quota is exhausted but an unconsumed
rewarded grant exists, the request may proceed and consumes exactly one
applicable grant according to existing quota semantics; - if neither is
available, return the existing controlled reward/quota domain response,
never 500; - client-side guards remain UX protection; backend remains
authoritative; - concurrent submissions cannot consume the same grant
twice.

Clarify during audit whether editing an already-created prediction
consumes a new quota unit. Preserve the existing business rule; do not
silently redefine it.

### 8. Development and production configuration

Do not create `if (dev) grantReward()` or a fake manual reward path in
application runtime.

Use the same Monetag integration in both environments: - development
Telegram Mini App → dedicated Monetag development/test main SDK zone; -
production Telegram Mini App → production main SDK zone.

Environment/config should expose the appropriate public main zone ID to
the frontend using the project's existing env conventions. Do not commit
real zone IDs or secrets.

Fail safely: - missing/invalid Monetag config must not unlock
predictions; - production must not silently fall back to a development
zone; - document required environment variables in the repository's
env/example documentation.

For automated tests only, mock the Monetag SDK boundary and invoke the
real backend/domain/postback logic.

### 9. Observability

Add structured logging/telemetry consistent with existing infrastructure
for: - reward session created; - preload/show failure category; -
postback received; - postback rejected and reason; - valued
confirmation; - duplicate confirmation; - grant created; - grant
consumed; - verification timeout.

Never log secrets or raw Telegram authentication payloads.

## Tests / acceptance criteria

Add focused unit, integration and frontend tests covering at least:

1.  reward session can only be created by an authenticated eligible
    user;
2.  `ymid` is opaque, unique and server generated;
3.  session creation itself grants nothing;
4.  Monetag invocation uses the configured main zone, same `ymid` for
    preload/show, and the expected requestVar;
5.  failed/skipped SDK Promise grants nothing;
6.  frontend Promise success alone grants nothing;
7.  valid matching `valued` postback creates exactly one grant;
8.  `non_valued` postback creates no grant;
9.  duplicate `valued` postback is idempotent;
10. unknown/malformed `ymid` cannot reward a user;
11. optional `telegram_id` cannot redirect the reward to another user;
12. wrong placement/requestVar cannot mint a grant;
13. invalid/mismatched zone cannot mint a grant according to configured
    validation;
14. granted backend state makes the reward-blocked prediction
    actionable;
15. one grant allows exactly one additional quota-gated prediction;
16. grant consumption is concurrency-safe;
17. after consumption the user returns to `rewardRequired` when no other
    quota/grant remains;
18. forbidden MatchCard clicks still make zero prediction API requests;
19. no 500 for expected quota/reward/domain rejections;
20. fixed MatchCard geometry does not regress through reward transient
    states;
21. all supported translations/typechecks compile;
22. existing MatchCard lifecycle, My Picks, settled results and
    prediction tests remain green.

Where practical, add an integration test that calls the actual postback
route with Monetag-shaped query parameters rather than testing only the
service.

## Monetag dashboard/manual setup documentation

Add a concise repository doc or README section explaining the non-code
steps:

1.  add/prepare the Telegram Mini App in Monetag;
2.  create/use a dedicated development SDK main zone and a production
    SDK main zone;
3.  configure the postback URL on each main SDK zone;
4.  use an HTTPS endpoint without redirects;
5.  configure macros corresponding to the endpoint contract;
6.  test a real rewarded view inside Telegram;
7.  verify a valued postback, one grant, one consumption and
    duplicate-postback idempotency.

Do not put actual account credentials or production IDs into docs.

## Out of scope

-   rewarded popup;
-   in-app interstitial;
-   multiple ad providers/fallback networks;
-   reward amount based on ad price;
-   cash/USDT rewards;
-   ad analytics dashboard;
-   scoreline changes;
-   redesign of MatchCard;
-   changing tournament prediction economics beyond the single
    extra-prediction grant.

## Required implementation process

1.  Audit current schema, quota/prediction services, MatchCard
    rewardRequired behavior, API error mapping, auth, env conventions
    and tests.
2.  Report any conflict between this task and authoritative repository
    docs before inventing a parallel rule.
3.  Implement the smallest coherent domain/API/frontend changes.
4.  Add migration if persistence changes require it.
5.  Update docs/env examples.
6.  Run formatting/checks appropriate to the repository, at minimum:
    -   typecheck;
    -   relevant unit tests;
    -   relevant integration/API tests;
    -   lint;
    -   production build;
    -   `git diff --check`.
7.  In the final Codex report include:
    -   changed files;
    -   schema/migration changes;
    -   exact source of reward authority;
    -   postback validation/idempotency strategy;
    -   grant consumption transaction strategy;
    -   dev vs production configuration;
    -   tests run/results;
    -   manual Monetag dashboard steps still required;
    -   any unresolved limitations.

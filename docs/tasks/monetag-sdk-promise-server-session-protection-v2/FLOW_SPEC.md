# FLOW SPEC — Monetag SDK Promise + Server Session Protection

## Final MVP authority model

Monetag server postback is not used as reward authority.

Authoritative flow:

    rewardRequired
      -> create/reuse server reward session
      -> initialize client-side Monetag handler
      -> preload ad with timeout=5 and session ymid
      -> adReady
      -> user clicks
      -> show rewarded ad with same ymid
      -> SDK Promise resolves
      -> authenticated Goalstery confirm
      -> AdReward VERIFIED
      -> refresh/reconcile authoritative access
      -> one extra prediction
      -> AdReward CONSUMED

If preload rejects:
- no show;
- no confirm;
- no grant.

If show rejects/skips:
- no confirm;
- no grant.

If confirm fails:
- no durable grant;
- UI must not enable prediction merely because the SDK Promise resolved.

## Session model

One reward attempt:

    1 server reward session
    = 1 opaque server-generated ymid
    = 1 preload/show lifecycle
    = at most 1 VERIFIED grant
    = at most 1 CONSUMED prediction

Do not reuse one ymid for multiple ad attempts.

## SDK initialization

Use `monetag-tg-sdk`.

Use only the Monetag **main SDK zone ID**.

Create `createAdHandler(mainZoneId)` once per effective zone/client lifecycle.

Do not initialize during SSR.

Do not create a new handler on each button click.

## Preload

Required call shape:

```ts
adHandler({
  type: "preload",
  timeout: 5,
  ymid,
  requestVar: "matches_extra_prediction",
})
```

`timeout` is valid for preload only.

UI becomes ad-ready only after preload Promise resolves.

## Direct show

Required semantic call:

```ts
adHandler({
  ymid,
  requestVar: "matches_extra_prediction",
})
```

Do not rely on `timeout` for direct show.

Always handle Promise rejection.

After show success/failure, reset local preload-ready state.

## requestVar

`requestVar` is analytics/placement metadata.

Use:

`matches_extra_prediction`

Do not treat it as a backend security primitive.

## Backend confirmation

After successful show Promise:

```ts
await confirmRewardSession(session.id)
```

Backend determines current user from auth and loads the session itself.

Backend validates:
- ownership;
- TTL;
- provider;
- placement;
- lifecycle;
- idempotency.

Client does not submit authoritative reward proof fields.

## Trust limitation

This MVP does not receive independent server-to-server confirmation from Monetag.

The accepted trust model is:

    successful Monetag client SDK flow
    + authenticated Goalstery confirm
    + protected server session
    -> VERIFIED

This is weaker than server-side postback verification and is an intentional MVP trade-off.

## Anti-abuse

At minimum:
- authenticated session creation;
- eligibility check;
- short TTL;
- one active session per user/placement or equivalent;
- opaque server-generated ymid;
- ownership enforcement;
- idempotent confirm;
- transaction-safe confirm;
- single-use reward;
- transaction-safe prediction consumption.

## Development

Development is not a fake provider.

Development uses:
- real Telegram Mini App;
- real Monetag SDK;
- dedicated development main zone;
- real preload;
- real show;
- real Promise;
- real Goalstery confirm.

Production uses the same flow with a different main zone ID.

Mocks are only for automated tests.

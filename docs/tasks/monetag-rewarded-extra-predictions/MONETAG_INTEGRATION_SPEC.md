# MONETAG INTEGRATION SPEC

This file captures the official Monetag behavior that this task relies
on. Re-check the official documentation if package/API behavior differs
at implementation time.

## Official references

-   Rewarded Interstitial:
    https://docs.monetag.com/docs/ad-integration/rewarded-interstitial/
-   Postback configuration:
    https://docs.monetag.com/docs/postbacks/configuration/
-   Postback macro reference:
    https://docs.monetag.com/docs/postbacks/macroses/

## Rewarded Interstitial contract

Monetag documents Rewarded Interstitial as a full-screen rewarded format
for Telegram Mini Apps.

React/npm example uses:

    import createAdHandler from 'monetag-tg-sdk'
    const adHandler = createAdHandler(REWARDED_INTERSTITIAL_ZONE_ID)

The ID passed to the SDK is the **main zone ID**.

The show Promise resolves for the successful rewarded flow and rejects
when the ad fails or is skipped. Always handle `.catch()`.

### ymid

Pass a unique identifier with each reward attempt. Monetag includes it
in the server postback. For Goalstery, `ymid` MUST be an opaque,
server-generated unique reward-session identifier.

Do not use Telegram ID as the authoritative correlation key.

### requestVar

Pass a stable placement identifier such as:

    matches_extra_prediction

This lets the backend verify that the postback belongs to the intended
reward placement.

### Preload

Monetag supports:

    adHandler({ type: 'preload', ymid: '...' })

Then show the ad with the same `ymid`. Preload before enabling the
watch-ad action where practical.

### Telegram SDK

Monetag recommends the official Telegram WebApp SDK be available so safe
areas can be detected correctly.

### Reward authority

The client Promise is useful for UX but Goalstery must not mint a
durable prediction entitlement from client state alone. Durable reward
authority is the matching Monetag server postback plus Goalstery's
server-side validation/idempotency rules.

## Server-side postback

Monetag postbacks are available for reward-based formats including
Rewarded Interstitial.

The configured endpoint receives HTTP GET requests.

Supported macros documented by Monetag:

  Macro                   Meaning
  ----------------------- -----------------------------------------------
  `{ymid}`                unique identifier supplied by the app
  `{zone_id}`             main SDK zone
  `{sub_zone_id}`         actual serving sub-zone
  `{request_var}`         placement identifier
  `{telegram_id}`         Telegram user ID when available; may be empty
  `{event_type}`          `impression` or `click`
  `{reward_event_type}`   `valued` or `non_valued`
  `{estimated_price}`     approximate USD revenue

Monetag explicitly recommends: - unique `ymid` per ad event; -
validation of parameters; - HTTPS; - no redirects; - logging; -
idempotency by `ymid`.

If the endpoint does not return HTTP 200, Monetag may retry. Therefore
duplicate delivery must be expected.

### Reward event type

For this task:

-   `valued` → eligible to confirm one extra-prediction reward, subject
    to all other validation;
-   `non_valued` → MUST NOT grant prediction access.

`estimated_price` is analytics metadata only.

### telegram_id

Monetag may include Telegram user ID automatically, but it may be
absent. Goalstery must never use this field as the authoritative owner
of a reward. Ownership comes from the server-created reward session
addressed by opaque `ymid`.

## Suggested postback shape

Adapt route naming to repository conventions. A representative
configuration is:

    https://<host>/api/ad-providers/monetag/postback
      ?ymid={ymid}
      &zone={zone_id}
      &sub={sub_zone_id}
      &event={event_type}
      &value={reward_event_type}
      &price={estimated_price}
      &source={request_var}
      &telegram_id={telegram_id}

The implementation may choose clearer parameter names, but the mapping
must be documented and tested.

## Development policy

Manual development must exercise the real Monetag SDK and backend flow
using a dedicated development/test main SDK zone inside the development
Telegram Mini App.

Production uses its own main SDK zone.

The application must not contain a development shortcut that directly
creates an extra-prediction grant.

Automated tests may mock the external Monetag SDK boundary and may call
the real postback route with synthetic Monetag-shaped values tied to
test-created reward sessions.

## Goalstery business rule

For this MVP:

    1 confirmed valued Rewarded Interstitial = 1 additional prediction

The entitlement is server-side, single-use and idempotent.

A client-side successful ad callback does not itself equal an
entitlement.

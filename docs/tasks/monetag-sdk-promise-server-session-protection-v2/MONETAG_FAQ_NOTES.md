# MONETAG FAQ NOTES — Requirements Incorporated into This Task

This follow-up incorporates the Monetag Developer FAQ behavior supplied for implementation.

## Main zone only

Use the main Monetag zone ID in:

- SDK script configuration;
- `createAdHandler(zoneId)`.

Do not use a linked sub-zone ID.

## ymid

Monetag describes `ymid` as an optional correlation identifier.

Goalstery intentionally uses a stricter policy:

- backend generates it;
- one reward session owns it;
- same ymid used for preload and show;
- never reused across independent reward attempts.

Because this flow does not use Monetag postbacks, `ymid` is no longer a server-to-server verification primitive, but remains useful for SDK/session correlation.

## requestVar

Monetag states:
- `ymid` is backend/postback correlation;
- `requestVar` is analytics/reporting for placements.

Therefore Goalstery uses:

`requestVar = "matches_extra_prediction"`

for analytics only.

It is not accepted from the frontend as backend reward proof.

## Preload

Monetag recommends preload for Rewarded Interstitial.

Required:

```ts
adHandler({
  type: "preload",
  timeout: 5,
  ymid,
  requestVar: "matches_extra_prediction",
})
```

UI should only expose the ad as ready after this resolves.

## Timeout

Monetag FAQ states timeout works for `type: "preload"`.

Do not rely on timeout for direct ad show calls.

Direct show failure must be handled with Promise rejection / `.catch()`.

## React / Next.js

Use the npm package:

`monetag-tg-sdk`

Create the handler once and reuse it.

Initialize only client-side / after hydration.

Do not create a new handler on each render or button click.

## Ad show

Rewarded ad show must be tied to a user interaction when required by browser/WebView behavior.

After show completes, reset local preload-ready state before the next reward attempt.

## In-App Interstitial

The FAQ's:

`type: "inApp"`

and:
- frequency;
- capping;
- interval;
- timeout;
- everyPage;

belong to Monetag In-App Interstitial and are OUT OF SCOPE for this task.

This task implements Rewarded Interstitial only.

## Failure handling

Always handle rejected Promises.

Preload failure:
- no ready state;
- no show;
- no grant.

Show failure/skip:
- no confirm;
- no grant.

Confirm failure:
- no durable reward despite successful SDK Promise.

## Development

Use a separate real development **main SDK zone** in the development Telegram Mini App.

Do not add a runtime fake provider or direct grant shortcut.

# Monetag SDK Promise + Server Session Protection v2

Entry point: `CODEX_TASK.md`.

Required reading before implementation:
- `FLOW_SPEC.md`
- `MONETAG_FAQ_NOTES.md`

This version supersedes the previous `monetag-sdk-promise-server-session-protection` task and incorporates Monetag Developer FAQ details:
- main zone only;
- `createAdHandler` once;
- client-side SDK readiness;
- preload before show;
- preload `timeout: 5`;
- same `ymid` for preload/show;
- `requestVar` for analytics only;
- reset preloaded state after show;
- no direct-show timeout assumption;
- In-App Interstitial explicitly out of scope.

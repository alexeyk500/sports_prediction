# Codex Task — Prizes & Payouts USDT/TRC-20 MVP

Implement the complete end-to-end MVP from `PRIZES_PAYOUTS_SPEC.md`. Use `approved-visual-reference.png` as visual source of truth.

Task folder: `docs/tasks/prizes-payouts-usdt-trc20-mvp/`

## Mandatory repository audit
Before editing inspect existing Cup/Prize Cup schema, persisted prize-by-place distribution shown on Cup, final settlement flow, leaderboard/participants, Profile placeholder, API/service/auth conventions, Prisma/DB + money conventions, locales en/ru/de/es/ar, configured Telegram support destination and tests. Reuse existing architecture; do not duplicate prize configuration.

## Implementation
1. Rename/localize `Prizes & Wallet` -> `Prizes & Payouts` and wire the screen through existing navigation.
2. Add DB persistence/migration for PrizeEntitlement, PrizeClaim and wallet-address revision/history, adapted to repository conventions. Persist immutable USDT/TRC20 snapshots; use existing Decimal/money conventions.
3. Hook idempotent entitlement generation into final Cup settlement using the existing prize-by-place DB data and final leaderboard. Only winning configured places receive entitlements. No duplicate entitlement on settlement retry.
4. Add authenticated current-user read API for summary, ordered cards and claim details. Never expose another user's payout data.
5. Add claim mutation: user submits only TRC-20 address for owned Ready entitlement. Server derives amount/asset/network/ownership. Success -> Under review. Prevent duplicate/racing submissions.
6. Only Action Required may update address. Validate, preserve previous address in history, update, return -> Under review. Ordinary Under review is read-only.
7. Enforce: Action Required requires message; Rejected requires reason; Paid requires paidAt; hash optional; Rejected final for user; no duplicate active claim. Do not add user-accessible admin transitions.
8. Implement reusable client/server TRON address format validation only. No RPC/blockchain API/wallet connect/signing.
9. Build localized `Prizes & Payouts` UI: USDT/TRON info, Total won/Pending/Paid, Ready, Under review, Action required, Paid, Rejected, plus empty/loading/error/retry states. Production must contain no mock prizes.
10. Implement Claim Prize modal/sheet using existing patterns and approved reference. Amount/USDT/TRON read-only; address editable; safety warning; loading/errors/double-submit protection.
11. Action Required: show free-text admin message, masked address, Update payout details; edit shows full address.
12. Paid: show amount, paidAt, masked address. Optional hash -> View transaction via centralized safe TRON explorer helper. No hash -> no placeholder.
13. Rejected: reason + Contact support using existing env-configured Telegram support destination; do not hardcode username.
14. Cards mask wallet; details show full wallet + Copy using existing feedback patterns.
15. Summary exactly: Pending=Ready+UnderReview+ActionRequired; Paid=Paid; TotalWon=active/pending+Paid; Rejected excluded. USDT only.
16. Sort: ActionRequired, Ready, UnderReview, Paid, Rejected; newest first inside each.
17. Add en/ru/de/es/ar copy through existing locale architecture. Verify Arabic RTL/bidi for Latin crypto strings.
18. No admin panel/API.

## Explicit non-goals
No other currencies/networks, wallet connect, signing/secrets, on-chain validation, automated payout, deadline, notifications, fiat conversion, post-settlement corrections, or Goalstery Cups purchase/transfer/withdrawal.

## Tests
Cover at minimum: entitlement generation from existing prize config; retry idempotency; winners only; immutable amount/USDT/TRC20; auth/ownership; valid/invalid address; duplicate claim; Under review read-only; Action Required update + address history; Paid with/without hash + paidAt invariant; Rejected reason; Action Required message; summary; sorting; masked wallet; existing Telegram support reuse; empty state; five locales; Arabic RTL.

## Validation
Run exact package.json scripts: typecheck, unit tests, lint, production build and relevant integration/E2E tests.

Manual smoke test: empty; Ready; invalid address; claim -> Under review; Action Required -> update -> Under review; Paid without hash; Paid with hash; Rejected + support; dark/light if applicable; en + ar.

## Completion report
Report audit findings, files/migration, final schema, settlement hook, idempotency, API contracts, TRON validation, transition enforcement, summary calculation, address history, UI states, localization/RTL, automated/manual test results, and any deliberate deviation with reason.

## 18. Mandatory icon assets — do not invent icons

The task package contains an `icons/` directory. These SVG files are the visual source of truth for feature-local icons shown in `approved-visual-reference.png`:

- `icons/trophy.svg` — prize/Cup trophy inside prize cards and claim summary; tint with the design/status semantic color, do not replace with emoji or another icon.
- `icons/usdt.svg` — USDT asset badge. Use this supplied file, do not redraw the Tether mark in JSX/CSS.
- `icons/tron.svg` — TRON network badge. Use this supplied file, do not substitute a generic crypto/network icon.
- `icons/chevron-right.svg` — prize-card/detail disclosure chevron.
- `icons/copy.svg` — copy-wallet/copy-hash action.
- `icons/info.svg` — payout safety/info notice.
- `icons/external-link.svg` — external explorer/support link affordance.
- `icons/close.svg` — Claim Prize sheet/modal close action when the existing Goalstery sheet component does not already provide its own canonical close icon.
- `icons/help.svg` — help glyph next to Contact support.
- `icons/back.svg` — page back affordance only if the current app shell does not already supply its canonical back icon.
- `icons/more.svg` — overflow affordance only if required by the existing shell.

Rules:

1. Do not use emoji, Unicode trophy/currency symbols, CSS-drawn approximations, icon-font glyphs, or newly invented SVG paths for these feature-local roles.
2. Prefer an already-existing canonical Goalstery shell/navigation icon over the supplied `back.svg`, `close.svg`, or `more.svg` when the repository already has that exact shell control. Do not duplicate global app-shell assets.
3. The Goalstery crown/logo and the application's real bottom-navigation icons are **not** feature assets. Reuse the exact existing repository assets/components. Do not recreate them from the screenshot.
4. The bottom navigation visible in `approved-visual-reference.png` is conceptual. Preserve the project's actual navigation structure and canonical icons.
5. Preserve SVG `viewBox` and geometry. Monochrome SVGs use `currentColor` intentionally so existing semantic design tokens control their tint.
6. Do not recolor the supplied branded `usdt.svg` or `tron.svg` unless the existing project has an already-approved canonical brand asset that is demonstrably the same role; in that case prefer the project's canonical asset.
7. If the repository already contains an exact equivalent of any supplied feature icon, reuse the existing canonical asset instead of creating a duplicate, but do not choose a visually different substitute.
8. If an icon needed by the implementation is not represented in this manifest and is not already canonical in the repository, stop and report the gap rather than inventing a new visual asset.

During the completion report, list the final asset/component used for every icon role above.

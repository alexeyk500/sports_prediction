# Prizes & Payouts MVP Specification

## Fixed model
- Asset: **USDT** only.
- Network: **TRON (TRC-20)** only.
- Manual payout by admin; no admin panel in MVP.
- No wallet connect/signing, seed phrase/private key/password handling, on-chain validation, notifications, payout deadline, fiat conversion, or automated payout.
- Rename Profile entry `Prizes & Wallet` -> `Prizes & Payouts`.
- Locales: en, ru, de, es, ar.

## Entitlements
Reuse the existing Prize Cup prize-by-place distribution already stored in DB and displayed on the Cup page. Do not create duplicate prize configuration.

Immediately after final Cup settlement, backend uses final leaderboard + existing prize distribution to automatically create `PrizeEntitlement` only for configured prize-winning places. Generation must be idempotent/retry-safe. Amount is immutable. Post-entitlement Cup-result corrections are out of scope.

Persist entitlement with user, cup, final placement, amount, immutable `USDT` asset snapshot, immutable `TRC20` network snapshot and timestamps.

## Claims and history
Keep `PrizeClaim` separate from entitlement. It contains entitlement/user, current wallet address, status, optional transactionHash/paidAt, actionRequiredMessage/rejectionReason and timestamps.

Persist wallet-address revision/audit history. An address replaced after Action Required must not be silently lost.

## State machine
`READY_TO_CLAIM -> UNDER_REVIEW -> PAID`
`UNDER_REVIEW -> ACTION_REQUIRED -> UNDER_REVIEW`
`UNDER_REVIEW -> REJECTED`

READY_TO_CLAIM may be represented by entitlement-without-claim.

- Ready: appears immediately after final settlement; no expiry.
- Under review: immediately after submit; no separate Submitted; address read-only.
- Action required: admin sets directly in DB; `actionRequiredMessage` mandatory. User may update address; resubmit -> Under review; old address retained.
- Paid: admin sets directly in DB; `paidAt` mandatory; `transactionHash` optional. Hash present -> View transaction; absent -> no placeholder.
- Rejected: admin sets directly in DB; `rejectionReason` mandatory; final for user; show reason + existing Telegram Contact support.

## Summary
USDT only:
- Pending = Ready + Under review + Action required
- Paid = Paid only
- Total won = active/pending + Paid
- Rejected excluded from Pending and Total won

## Sorting
Action required -> Ready -> Under review -> Paid -> Rejected. Newest first within status.

## Claim
User chooses neither asset nor network. Show amount, USDT and TRON (TRC-20) read-only. Only editable field is public TRC-20 address.

Show safety warning: Goalstery only needs the public address and never asks for seed phrase, private key or wallet password.

Validate TRON address format on client and server. Server authoritative. No blockchain API/RPC/ownership proof.

## Privacy
Cards show masked address like `TQ8f...X92k`. Details show full address + Copy. Action Required edit shows full current address. Use bidi isolation for Arabic.

## Admin
No admin UI/API. Admin works directly with DB to set Action Required + message, Rejected + reason, or Paid + paidAt and optional transactionHash.

## Security
Client must never control another user, entitlement ownership, cup, placement, amount, asset, network, paidAt, transaction hash, admin statuses/messages. No secret-wallet fields anywhere.

## Localization
All new UI copy in en/ru/de/es/ar via existing locale source of truth. Arabic RTL must handle USDT/TRON/TRC-20/address/hash correctly.

## Visual
Use `approved-visual-reference.png` as approved direction while preserving Goalstery tokens, themes and existing app chrome.

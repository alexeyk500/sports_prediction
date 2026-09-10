# Codex Task — Configure Telegram Support Link on Public Docs

## Goal

Replace the remaining support-account placeholders on Goalstery's localized public pages with the approved official Telegram support account:

`@goalstery_admin`

The support account must come from environment configuration. Clicking an actionable support link or CTA must open:

`https://t.me/goalstery_admin`

so the user can open the Telegram chat/account and send a message.

## Task folder

`docs/tasks/public-docs-telegram-support-link/`

## Environment configuration

First inspect the repository's existing env conventions and typed env/config layer.

Preferred variable:

```env
NEXT_PUBLIC_GOALSTERY_SUPPORT_USERNAME=goalstery_admin
```

Use the project's existing naming convention if it has a stricter equivalent.

Requirements:

- env is the single source of truth;
- do not hardcode `goalstery_admin` or `https://t.me/goalstery_admin` in multiple React components;
- update the repository's env example/template file;
- do not commit unrelated local `.env` files;
- this is intentionally public client-side configuration, not a secret.

Normalize a possible leading `@` before constructing the URL.

Create/reuse centralized configuration that exposes:

- normalized username: `goalstery_admin`;
- display username: `@goalstery_admin`;
- support URL: `https://t.me/goalstery_admin`.

Validate conservatively. If the env value is missing/invalid, do not create an unsafe or malformed URL. Preserve a safe fail-state according to existing project conventions.

## Pages to update

Use the existing localized public-doc implementation. Do not introduce a second locale system.

Apply the configured support destination on:

- `/help`
- `/privacy`
- `/terms`

### Help & Support

Wire at least:

- the prominent `Need more help?` / localized `Contact Support` CTA;
- the Contact Support section;
- actionable account-deletion/help references where the user is explicitly instructed to contact support.

The existing approved visual design must remain unchanged apart from turning the relevant support UI into a real Telegram link.

### Privacy Policy

Wire the real support account in actionable locations, especially:

- account/data deletion request instructions;
- final Contact section.

### Terms of Use

Wire the real support account in actionable locations, especially:

- prize-claim instructions;
- final Contact section.

Do not link every incidental occurrence of the word `Telegram`. Link only places where the user is expected to take an action.

## Link behavior

Construct:

```text
https://t.me/<normalized username>
```

Use a semantic external `<a>` or the project's existing external-link abstraction.

Do not use a JavaScript click handler when a normal anchor is sufficient.

Do not use Next.js `Link` for the external Telegram destination unless the repository already wraps external links that way.

Preserve project conventions for `target` / `rel`.

The browser fallback must remain valid even if Telegram is not installed.

## Localization

The pages already support:

- `en`
- `ru`
- `de`
- `es`
- `ar`

Keep all surrounding copy localized through the existing locale registry.

The username stays exactly:

`@goalstery_admin`

in every locale.

Do not create new duplicate translations.

Do not regress fallback to English.

## Arabic / RTL

Verify on `ar`:

- the link remains clickable;
- `@goalstery_admin` displays correctly inside RTL content;
- surrounding punctuation/order is not broken;
- no manual string reversal;
- use bidi isolation / LTR wrapper only if required by the existing markup.

## Scope

Do not redesign or change:

- Help cards;
- Privacy callouts;
- Terms summary cards;
- page shell;
- icons;
- theme runtime;
- legal meaning;
- locale architecture;
- routes.

This is only support destination configuration + link integration.

## Tests

Add/update tests according to the current project test strategy.

At minimum verify:

1. username is read from env/config;
2. `@goalstery_admin` display value is correct;
3. URL resolves to `https://t.me/goalstery_admin`;
4. `/help` CTA uses the configured URL;
5. `/privacy` actionable support link uses the configured URL;
6. `/terms` actionable support/prize link uses the configured URL;
7. missing/invalid env has a safe fail-state;
8. all five locales still render;
9. Arabic RTL remains correct;
10. English fallback is unaffected.

If Next.js inlines `NEXT_PUBLIC_*` at build time, account for that correctly in tests/build.

## Validation

Run the exact repository scripts from `package.json`, including at least:

- typecheck;
- unit tests;
- lint;
- production build;
- relevant public-doc E2E tests if present.

Manually verify one LTR locale and Arabic RTL, and confirm links resolve to:

`https://t.me/goalstery_admin`

## Completion report

Report:

1. exact files changed;
2. exact env variable name used;
3. env template/documentation updated;
4. location of centralized username normalization/URL construction;
5. all support locations wired on `/help`, `/privacy`, `/terms`;
6. missing/invalid env behavior;
7. Arabic RTL verification;
8. tests/build results;
9. confirmation that no unrelated design/legal content changed.

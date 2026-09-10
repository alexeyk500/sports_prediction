# Codex Task — Localize Public Help & Legal Pages to 5 Languages

## Goal

Localize Goalstery's public Support & Legal pages to all five application languages and render the correct language according to the user's existing selected Goalstery locale.

Pages:

- `/help`
- `/privacy`
- `/terms`

Supported locales:

- English (`en`)
- Russian (`ru`)
- German (`de`)
- Spanish (`es`)
- Arabic (`ar`)

The current English implementation and visual design are approved. Preserve that visual implementation and add localization without redesigning the pages.

## Task folder

Place this task at:

`docs/tasks/public-docs-localization-five-languages/`

## Required input files

Use these files from this task folder:

- `HELP_SUPPORT_V1.md`
- `PRIVACY_POLICY_V1.md`
- `TERMS_OF_USE_V1.md`
- `TRANSLATION_SPEC.md`

The three English documents are the authoritative source content.

`TRANSLATION_SPEC.md` defines translation, fallback, RTL, terminology, and legal-authority requirements.

## First step: inspect the current implementation

Before editing:

1. inspect how Goalstery currently stores and resolves `en`, `ru`, `de`, `es`, and `ar`;
2. locate the selected-language source of truth;
3. inspect the current `/help`, `/privacy`, and `/terms` content architecture;
4. inspect the current public-page theme/runtime wrapper;
5. inspect how `lang` and RTL behavior are currently handled elsewhere in the app;
6. inspect whether the public documents were implemented as typed data under `src/content/public-docs/` or an equivalent location.

Do not create a second independent locale system.

Reuse the existing Goalstery locale source of truth.

## Required behavior

When a user has selected:

- English → show English public documents
- Russian → show Russian public documents
- German → show German public documents
- Spanish → show Spanish public documents
- Arabic → show Arabic public documents

This applies to all three routes.

Do not require the user to choose a language again inside the public pages.

## Content architecture

Keep public-document content locale-aware and maintainable.

Preferred shape, if compatible with the current implementation:

```text
src/content/public-docs/
├── en/
│   ├── help.ts
│   ├── privacy.ts
│   └── terms.ts
├── ru/
│   ├── help.ts
│   ├── privacy.ts
│   └── terms.ts
├── de/
│   ├── help.ts
│   ├── privacy.ts
│   └── terms.ts
├── es/
│   ├── help.ts
│   ├── privacy.ts
│   └── terms.ts
└── ar/
    ├── help.ts
    ├── privacy.ts
    └── terms.ts
```

Use the current repository's equivalent structure if already established.

Avoid duplicating rendering logic per locale.

Prefer one shared typed schema with locale-specific content.

Do not add Markdown/MDX runtime dependencies solely for localization.

The runtime application must not read `docs/tasks/`.

## Translation work

Produce complete translations for all three documents into:

- Russian
- German
- Spanish
- Arabic

Use the English source documents as the source of truth.

Follow `TRANSLATION_SPEC.md`.

Do not shorten or omit legal sections.

Do not add new legal meaning.

Do not invent:

- legal entity;
- company address;
- jurisdiction;
- governing law;
- advertising provider;
- support username;
- payment provider;
- wallet integration;
- additional prize mechanics.

If a sentence is legally awkward to translate literally, preserve its substantive meaning using natural formal language.

## English remains authoritative

For Terms and Privacy:

- English remains the authoritative version.
- Translated versions are for convenience.
- Include a localized notice on non-English versions communicating this.
- Do not show that notice on English unless the current English Terms already contain the language-authority section as part of the document itself.

Do not remove the existing Terms section stating that English is authoritative.

## Help & Support localization

Translate:

- page title/subtitle;
- category labels;
- FAQ questions;
- FAQ answers;
- troubleshooting;
- Prize Cups;
- Fair Play;
- contact support;
- Privacy / Terms footer links;
- any page-level UI chrome such as `Popular questions`, `Need more help?`, `Contact Support`, etc.

All visible Help text must use the selected locale.

Do not leave mixed English/Russian/etc. UI unless it is a proper noun/product token.

## Privacy Policy localization

Translate:

- title/subtitle;
- version/date labels;
- Contents;
- section titles;
- body;
- callouts;
- contact text;
- English-authoritative convenience notice on translated variants.

Keep stable semantic section IDs rather than deriving anchors from translated headings.

## Terms of Use localization

Translate:

- title/subtitle;
- version/date labels;
- Contents;
- body;
- all section titles;
- `Before you play`;
- all five quick facts;
- `Cups`;
- positive/negative rule labels;
- Fair Play summaries if currently visible;
- English-authoritative convenience notice.

Preserve the approved visual design exactly.

Do not change icon geometry, spacing, card layout, or theme styling merely because strings are longer.

Instead, make layout resilient to localized text.

## Localized text and layout resilience

German and Russian strings may be longer than English.

Arabic has different directionality.

Adjust layout only where required to prevent:

- clipping;
- overflow;
- unreadable wrapping;
- broken cards;
- misaligned contents;
- collapsed icon/text relationships.

Do not globally enlarge components if a smaller scoped adjustment solves the problem.

The final UI should remain visually consistent with the approved English design.

## Arabic / RTL

Arabic support is mandatory.

For Arabic:

- use `dir="rtl"`;
- use the correct `lang="ar"`;
- align document text naturally for RTL;
- ensure Contents controls work;
- ensure disclosure chevrons/arrows behave correctly;
- ensure lists and section numbers are readable;
- ensure `Before you play` remains balanced;
- ensure Cups positive/negative columns remain semantically clear;
- preserve icon geometry;
- do not mirror icons that should not be mirrored;
- keep Latin tokens like Goalstery, Telegram, USDT, GRAM, URLs, and football-data.org readable.

Do not solve RTL with manual string reversal.

Use proper CSS logical properties and existing project RTL conventions.

## Existing locale runtime

The selected public-document language must come from the same user setting/runtime used by Goalstery.

If the current public pages are outside `AppShell`, factor/reuse the minimum locale runtime required so they still know the user's selected locale.

Do not duplicate state.

Do not hardcode a separate locale in local storage if the application already has a canonical setting mechanism.

Do not regress authenticated screens.

## Direct navigation

The localization must work when the user opens `/help`, `/privacy`, or `/terms` directly.

If selected locale persistence is available before authenticated data/bootstrap, use that persisted locale.

If the locale cannot yet be resolved, render/fallback to English safely, then update to the selected locale through the established runtime without broken hydration.

Avoid hydration mismatch warnings.

## Fallback

Implement deterministic fallback:

`requested/selected locale -> English`

If a translation object is missing or malformed, do not render a blank document.

Prefer a typed locale registry so missing locale documents are detectable at build/test time.

## Stable anchors

Do not derive anchor IDs from localized headings.

Use stable semantic IDs across all locales.

Examples:

- `eligibility`
- `telegram-account`
- `cups`
- `free-participation`
- `prize-cups`
- `fair-play`
- `contact`

Contents navigation must continue to work in every language.

## Page metadata

Localize public-page metadata/title where practical in the current architecture.

At minimum ensure visible page headings are localized.

Do not introduce architectural complexity solely for metadata.

## Version/date

Preserve:

- Version `1.0`
- Last Updated `September 9, 2026`

The visible date label may use locale-appropriate formatting if the existing application already has a date-formatting convention.

Do not change the underlying date.

## Support destination

Do not invent or modify the official Telegram support destination.

Localization should affect the visible CTA text only.

Preserve the current configured/fail-safe support destination behavior.

## Visual scope

The current visual design is approved.

Do not redesign:

- public page shell;
- Terms summary cards;
- Cups card;
- Privacy callouts;
- Help category cards;
- icon assets;
- theme colors;
- responsive structure;

except for minimal layout resilience required by translated strings or RTL.

## Tests

Add/update tests following the current project strategy.

At minimum verify:

1. each page resolves content for all 5 locales;
2. locale selection uses the existing Goalstery language setting;
3. fallback to English works;
4. all stable section anchors exist;
5. translated Help labels render;
6. translated Privacy titles/body render;
7. translated Terms quick facts/Cups labels render;
8. Arabic pages have RTL direction;
9. Arabic mixed Latin product tokens remain present;
10. no English-only UI chrome remains on translated pages except approved product/proper nouns or authoritative-language notices;
11. existing English visual/content behavior remains intact.

Where practical, add typed completeness checks that fail if one of the three documents is missing for a supported locale.

## Validation

Run exact repository scripts from `package.json`, including at least:

- typecheck;
- unit tests;
- lint;
- production build.

Also manually verify all 15 page/locale combinations:

- 3 pages × 5 locales

Pay particular attention to:

- Russian long strings;
- German long strings;
- Arabic RTL;
- Terms `Before you play`;
- Terms `Cups`;
- Privacy callouts;
- Help category cards and FAQ.

## Completion report

Report:

1. exact files created/modified;
2. final locale content architecture;
3. how the selected Goalstery locale is resolved on public pages;
4. how English fallback works;
5. how Arabic RTL is implemented;
6. how stable anchors are handled;
7. whether any localized string required layout adjustment;
8. confirmation English remains authoritative;
9. confirmation no support/account/provider/legal facts were invented;
10. automated validation results;
11. manual verification results for all 15 page/locale combinations;
12. any translation wording that should receive human legal review before production.

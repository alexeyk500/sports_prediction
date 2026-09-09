# Codex Task --- Public Support & Legal Pages

## Status

Implementation task. The product/legal content and visual direction
attached to this task are approved product specifications for v1.

## Goal

Implement three public Goalstery routes:

-   `/help` --- Help & Support
-   `/privacy` --- Privacy Policy
-   `/terms` --- Terms of Use

Connect the existing Profile → Support & Legal controls to these routes
and implement the pages according to the attached content specifications
and visual references.

## Required input files

Treat these files in this task folder as authoritative inputs:

-   `HELP_SUPPORT_V1.md`
-   `PRIVACY_POLICY_V1.md`
-   `TERMS_OF_USE_V1.md`
-   `reference-dark.png`
-   `reference-light.png`

The PNG files define visual direction, hierarchy, density, surfaces,
contrast, and composition. They are references rather than pixel-perfect
screenshots: preserve the project's existing design system, typography,
icon system, spacing conventions, and semantic theme tokens where they
conflict with generated-image details.

Do not invent or rewrite legal/product meaning from the approved
Markdown files.

## Audit findings already established

A prior repository audit established:

-   the application uses Next.js App Router;
-   there is currently no Markdown/MDX application pipeline;
-   there are no existing public Help, Privacy Policy, or Terms
    documents;
-   no Markdown parser/renderer dependency is currently installed;
-   the existing three Support & Legal controls are in:
    -   `src/components/ProfileScreen/SupportLegalSection/SupportLegalSection.tsx`
    -   wired from `src/components/ProfileScreen/ProfileScreen.tsx`;
-   all three currently call the same placeholder;
-   there is no global middleware route auth guard preventing public
    pages;
-   `src/app/globals.css` currently makes `html, body` height `100%`
    with `overflow: hidden`;
-   theme/locale runtime currently enters through the authenticated
    `AppShell`;
-   public long-form pages therefore need an explicit scrolling strategy
    and must not accidentally depend on AppShell scrolling;
-   existing engineering documents under `docs/` are not public content
    sources and must not be repurposed as such.

Verify these assumptions against the current repository before changing
code. If the repository has changed, adapt to the current architecture
rather than blindly following stale paths.


## Provided SVG icon assets

Use the SVG assets from `icons/` as the visual/iconography reference for the public Support & Legal pages:

- `icons/arrow-left.svg` — back / return navigation
- `icons/help-circle.svg` — Help & Support
- `icons/football.svg` — Predictions
- `icons/trophy.svg` — Cups / Prize Cups
- `icons/leaderboard.svg` — Leaderboard
- `icons/user.svg` — Account
- `icons/shield.svg` — Privacy / security callouts
- `icons/file-text.svg` — Terms / legal document
- `icons/telegram.svg` — Contact Support CTA
- `icons/chevron-down.svg` — expandable Contents / FAQ controls
- `icons/sun.svg` — light-theme control reference
- `icons/moon.svg` — dark-theme control reference

These SVGs are approved task assets. Preserve their simple outline style, stroke proportions, rounded line caps, and `currentColor` behavior.

If the repository already has an existing icon library or project-standard icon component that contains an exact or near-exact equivalent, prefer that existing project icon rather than duplicating runtime assets. In that case, treat the attached SVG as the required visual reference and document the substitution in the completion report.

Do not introduce a new third-party icon library for this task.

Do not redraw these icons with emoji, Unicode symbols, or CSS pseudo-elements.

## Architecture

### Public routes

Create public App Router pages equivalent to:

-   `src/app/help/page.tsx`
-   `src/app/privacy/page.tsx`
-   `src/app/terms/page.tsx`

They must be accessible without authenticated Goalstery API state.

Do not render these routes inside the authenticated `AppShell`.

Do not render bottom navigation on these pages.

Each route should define appropriate Next.js page metadata/title.

### Canonical application content

Do not add a Markdown/MDX runtime pipeline merely to render these three
documents.

The attached `.md` files are implementation specifications. Convert
their approved content into a typed/static application representation
under a dedicated public-content location such as:

`src/content/public-docs/`

Use the project's conventions if an equivalent content location now
exists.

The runtime application must not read files from `docs/tasks/`.

Do not add `react-markdown`, `@next/mdx`, `next-mdx-remote`, `remark`,
`rehype`, `gray-matter`, `marked`, `markdown-it`, or similar
dependencies unless the current repository has independently adopted
such a pipeline and reuse is clearly preferable.

### Shared document UI

Implement a reusable public-document presentation layer for Privacy
Policy and Terms of Use. A likely ownership boundary is:

`src/components/PublicDocumentPage/`

but follow the project's current React component ownership rules and
naming conventions.

Avoid unnecessary component fragmentation. Extract components only where
they represent a genuine reusable UI concept.

The Help page may share the outer public-page shell while using
Help-specific content structures.

### Theme

Both dark and light themes are required.

Use existing semantic design tokens. Do not introduce hardcoded
page-specific color systems when an existing semantic token expresses
the intent.

Public pages must visually remain part of Goalstery even though they are
outside AppShell.

Reuse the existing theme runtime/state where architecturally
appropriate, or factor the minimum required theme runtime into a
location usable by both AppShell and public routes.

Do not duplicate theme logic.

Do not introduce regressions to the existing AppShell/theme behavior.

The light theme must retain clear separation between page background,
surfaces, borders, primary text, secondary text, and accent surfaces.
Avoid a washed-out all-white presentation.

### Locale

The approved v1 document content is English and the English Terms are
authoritative.

Do not fabricate translations of the approved legal text.

If the existing locale runtime can safely be reused, it may still be
used for generic UI chrome such as a Back label, but the v1 document
body remains the approved English source unless an existing approved
localization source is found.

## Shared public-page behavior

Implement:

-   a compact top navigation/header;
-   a clear way to return to Goalstery;
-   no bottom navigation;
-   a scrollable long-form content surface on mobile and desktop;
-   responsive layout;
-   strong readable typography suitable for long documents;
-   accessible focus states;
-   semantic headings;
-   anchor targets for document sections;
-   links that remain usable with keyboard navigation;
-   appropriate `aria-*` behavior for collapsible controls;
-   support for dark/light theme;
-   no horizontal overflow at narrow mobile widths.

Use the current Goalstery icon system rather than emoji.

The generated status bars/home indicators visible in the reference
images are presentation artifacts and must not be implemented as
application UI.

## Privacy Policy page

Use `PRIVACY_POLICY_V1.md` as the authoritative content.

The page should visually follow `reference-dark.png` and
`reference-light.png`.

Required presentation:

-   eyebrow: `SUPPORT & LEGAL`;
-   title: `Privacy Policy`;
-   concise subtitle;
-   `Version 1.0`;
-   `Last updated Sep 9, 2026` or equivalent locale-safe formatting
    without changing the underlying date;
-   collapsible/expandable `Contents` navigation on mobile;
-   section anchors;
-   numbered document sections;
-   readable long-form body typography.

Include restrained callout treatment for high-value safety/privacy
information, especially:

1.  Telegram privacy:
    `Goalstery does not request access to your Telegram messages, contacts, or phone number.`

2.  Crypto safety:
    `Goalstery will never ask for your seed phrase, private key, wallet password, or similar secret credentials.`

Do not convert every paragraph into a card. The document body should
remain editorial and calm.

## Terms of Use page

Use `TERMS_OF_USE_V1.md` as the authoritative content.

Required presentation:

-   eyebrow: `SUPPORT & LEGAL`;
-   title: `Terms of Use`;
-   concise subtitle;
-   version/date metadata;
-   collapsible `Contents`;
-   section anchors;
-   numbered sections;
-   readable long-form content.

Add a compact `Before you play` summary near the top. It must summarize,
not replace, the Terms:

-   18+ only;
-   free participation;
-   no wagering;
-   Cups have no monetary value;
-   Prize Cups may have regional restrictions.

Add a visually distinct Cups summary based on the reference:

Positive concepts: - earned through play; - used for rankings; - used to
compete.

Negative concepts: - cannot be purchased; - cannot be transferred; -
cannot be withdrawn; - no monetary value.

If a Fair Play summary is surfaced visually, preserve the approved
distinction:

Allowed: - statistics/research; - mathematical models; - AI-assisted
analysis.

Prohibited: - automated interaction/bots; - exploit abuse; -
multi-account abuse; - leaderboard/competition manipulation.

Do not state that Goalstery is legally "not gambling" in all
jurisdictions. The approved Terms intentionally describe the mechanics
instead of making that universal legal classification.

Preserve the right for Goalstery to restrict specific Prize Cups
geographically where applicable restrictions require it.

## Help & Support page

Use `HELP_SUPPORT_V1.md` as the authoritative content.

Unlike Privacy/Terms, this should feel like a Help Center rather than a
legal document.

Required top-level categories:

-   Predictions
-   Cups
-   Leaderboard
-   Account

These should act as navigation into the relevant Help content.

Provide a `Popular questions` section using useful questions from the
approved Help content, including at least:

-   How do predictions work?
-   When does a prediction lock?
-   How are Cups calculated?
-   What happens if a match is postponed?
-   Can I win real prizes?
-   How do I contact support?

Use accessible expandable FAQ/detail behavior where appropriate. Prefer
semantic/native behavior (`details`/`summary`) if it satisfies the
design and accessibility requirements without unnecessary client-side
state.

Include Help content covering:

-   predictions;
-   Cups/scoring;
-   leaderboard;
-   Prize Cups;
-   account;
-   Fair Play;
-   match data;
-   privacy/security;
-   troubleshooting;
-   contact support.

### Support CTA

Implement the prominent `Need more help?` / `Contact Support` CTA shown
in the references.

Do not invent a Telegram username or URL.

Locate the project's actual configured official Goalstery support
account if it already exists.

If no official support destination exists in the
repository/configuration, do not fabricate one. Centralize the missing
destination behind an explicit configuration/constant with a clear TODO
or fail-safe behavior consistent with project conventions, and report
this as a remaining product configuration requirement.

The UI must not direct users to an unverified support account.

The Help footer should link to `/privacy` and `/terms`.

## Profile entry points

Update the existing Profile → Support & Legal controls:

-   Help & Support → `/help`
-   Privacy Policy → `/privacy`
-   Terms of Use → `/terms`

Prefer Next.js `Link` for internal navigation.

Preserve the existing Support & Legal row styling and interaction
quality.

Remove the placeholder wiring for these three destinations from
`ProfileScreen` when no longer needed.

Do not perform a blind global replacement.

## Navigation/back behavior

The header should provide a clear return to Goalstery.

Use a robust public-route behavior: it must still work when a user opens
`/privacy`, `/terms`, or `/help` directly rather than arriving through
Profile history.

Do not implement a back control that becomes useless on direct deep
links.

Choose a deterministic fallback to the application's main Goalstery
route while preserving sensible browser-history behavior if the current
architecture supports it cleanly.

## Scrolling

Explicitly account for the existing global `overflow: hidden` behavior.

Privacy and Terms are long documents and must scroll reliably:

-   Telegram Mini App/mobile viewport;
-   ordinary mobile browser;
-   desktop browser.

Do not globally change scrolling in a way that breaks existing AppShell
screens.

Prefer a scoped public-page scroll container or an
architecture-compatible route layout.

## Responsive design

Primary reference is mobile, but desktop must be intentionally designed
rather than merely stretched.

For long-form Privacy/Terms content, constrain readable line length
(roughly the existing design-system equivalent of a 720--800 px document
column).

On wider viewports, a sticky contents/navigation treatment may be used
if it remains simple and consistent, but it is not required.

Help category cards should reflow cleanly across narrow and wide
layouts.

## Visual fidelity

Use:

-   `reference-dark.png`
-   `reference-light.png`

as the visual target.

Preserve:

-   generous but controlled whitespace;
-   strong title hierarchy;
-   compact metadata;
-   subtle bordered/elevated surfaces;
-   clear section separation;
-   high text contrast;
-   restrained accent use;
-   editorial legal-document body;
-   more product-oriented Help cards and CTA.

Do not copy artifacts from the generated mockups that conflict with
Goalstery's real UI conventions.

Do not add decorative gradients, shadows, or colors merely because they
appear in the generated reference if the project design system uses a
different equivalent treatment.

## Legal/content integrity

The three attached content specifications are approved product drafts.

Implementation must preserve their substantive meaning.

In particular, do not silently change:

-   18+ requirement;
-   free participation in Prize Cups;
-   no entry fee;
-   Cups having no monetary value;
-   Cups not being purchasable/transferable/withdrawable;
-   possible USDT/GRAM prizes;
-   manual prize claim through official Telegram support;
-   requirement to provide only a public wallet address for payout;
-   warning never to provide seed phrase/private key/wallet password;
-   geographic restrictions for specific Prize Cups;
-   Goalstery's final settlement determination;
-   unresolved/postponed/cancelled matches potentially remaining
    pending;
-   Fair Play rules;
-   account deletion by support request;
-   no current dedicated behavioral analytics/user-tracking system;
-   advertising language that does not invent a specific advertising
    provider;
-   English Terms as authoritative.

If implementation reveals a conflict between approved copy and actual
product behavior, do not silently rewrite the legal text to fit the
code. Report the mismatch clearly.

## Tests

Add or update tests consistent with the project's current testing
strategy.

At minimum verify where practical:

-   all three public routes render;
-   Profile Support & Legal links point to the correct routes;
-   Privacy/Terms section navigation targets exist;
-   Help category/FAQ interactions work;
-   support CTA does not use a fabricated destination;
-   public pages do not render AppShell bottom navigation;
-   theme rendering does not regress existing screens.

Avoid brittle screenshot tests unless the project already uses them
successfully.

## Documentation

Update relevant engineering documentation only where necessary to record
the new public-route/content architecture.

Do not move the approved public content into engineering specs.

Do not turn `docs/tasks/` into runtime application content.

## Validation

Run the project's standard checks, including at least:

-   typecheck;
-   unit tests;
-   lint;
-   production build.

Use the exact package scripts defined by the repository.

Fix regressions caused by this task.

## Out of scope

Do not:

-   introduce a general documentation CMS;
-   add Markdown/MDX dependencies solely for these pages;
-   create legal translations;
-   invent a legal entity, company address, governing jurisdiction, or
    governing-law clause;
-   invent an advertising provider;
-   invent an official Telegram support username;
-   redesign the authenticated Profile/AppShell beyond what is required
    to connect the three links;
-   change prediction/scoring/settlement mechanics;
-   implement cryptocurrency wallet connection;
-   automate cryptocurrency payouts;
-   add paid entry, subscriptions, Telegram Stars entry fees, or any
    other monetization mechanic;
-   change Prize Cup eligibility logic beyond what is necessary to
    present the approved public documentation.

## Completion report

When finished, report:

1.  exact files created/modified;
2.  architecture used for public content and public-page layout;
3.  how theme runtime is shared/reused outside AppShell;
4.  how long-page scrolling was solved without breaking AppShell;
5.  how Profile navigation was changed;
6.  the actual support destination found, or explicitly state that it
    remains unconfigured;
7.  tests/checks run and their results;
8.  any mismatch discovered between approved content and current
    application behavior;
9.  any remaining product/configuration TODOs.

Do not claim completion if the support destination was fabricated or if
any of the three pages are inaccessible on direct navigation.

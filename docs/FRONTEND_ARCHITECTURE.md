# Goalstery --- Frontend Architecture

**Frontend Architecture v0.1**

  ----------------------------------- -----------------------------------
  **Status**                          Authoritative frontend architecture
                                      specification

  **Platform**                        Telegram Mini App

  **Stack**                           Next.js + React + TypeScript

  **Product authority**               `docs/PRODUCT_SPEC.md`

  **Technical authority**             `docs/TECH_SPEC.md`

  **Testing authority**               `docs/TESTING_SPEC.md`

  **Visual authority**                `docs/design/DESIGN_SYSTEM.md` +
                                      approved component specs/references

  **Decision register**               `docs/DECISIONS.md`
  ----------------------------------- -----------------------------------

Этот документ определяет frontend code architecture: boundaries, data
flow, state ownership, dependencies, component structure и
implementation discipline.

Он не должен повторять product rules, backend contracts, detailed visual
geometry или полный testing contract.

------------------------------------------------------------------------

# 1. Frontend Contract

Goalstery frontend uses:

``` text
Next.js App Router
React
TypeScript
feature-oriented components
custom typed API client
selective Zustand
local React state
CSS Modules
Goalstery-owned components
Goalstery-owned/local SVG icons
localization + RTL
system/light/dark themes
```

Architectural defaults:

``` text
no third-party UI framework
no server-state fetching/cache framework
no optimistic UI by default
no form framework by default
no CSS-in-JS/styling-framework migration
no icon library
no speculative feature abstractions
```

Changing these defaults requires the project decision process defined by
`AGENTS.md` / `DECISIONS.md`.

------------------------------------------------------------------------

# 2. Ownership and Directory Boundaries

Frontend is organized primarily by product feature.

Preferred shape:

``` text
src/
├── app/
├── components/
│   ├── common/
│   ├── navigation/
│   ├── predict/
│   ├── cup/
│   ├── rating/
│   ├── profile/
│   └── settings/
├── lib/
│   ├── api/
│   ├── assets/
│   ├── telegram/
│   ├── i18n/
│   └── ...
└── stores/
```

Responsibility guide:

  Concern                                    Owner
  ------------------------------------------ -------------------------
  Routing/layout/Next.js route boundary      `app/`
  Goalstery HTTP communication               `lib/api/`
  Telegram browser integration               `lib/telegram/`
  Football asset resolution                  `lib/assets/`
  Localization infrastructure                `lib/i18n/`
  Shared application state                   `stores/`
  Feature UI                                 `components/<feature>/`
  Genuine shared UI concept                  `components/common/`
  Global visual tokens/reset/root behavior   global CSS
  Component geometry/presentation            component CSS Module

This is guidance, not a requirement to create files for trivial code.

Feature-specific UI stays with its feature. Move a component into
`common` only after it represents a stable concept with actual
cross-feature value.

Do not pre-build detailed Cup/Rating/Profile architecture before those
features have concrete product/design requirements.

Preferred evolution:

``` text
specific implementation
→ observed reuse
→ shared abstraction
```

------------------------------------------------------------------------

# 3. App Router and Client Boundaries

Goalstery uses Next.js App Router.

Route files should primarily own:

``` text
routing
layout
route-level composition
Next.js-specific boundaries
```

General feature implementation should normally remain outside `app/`.

Use Server Components where natural and Client Components where browser
runtime/interaction requires them.

Typical client requirements:

``` text
React state
event handlers
Zustand
Telegram WebApp runtime
browser APIs
effects
interactive controls
```

Do not add `"use client"` everywhere, but do not contort an interactive
Telegram Mini App into Server Components merely to minimize client code.

Use the smallest **practical** client boundary that preserves clear
ownership.

------------------------------------------------------------------------

# 4. Telegram Boundary

Telegram browser access stays behind the existing project abstraction:

``` text
Telegram WebApp runtime
→ src/lib/telegram/*
→ feature code
```

Do not scatter direct Telegram global access across components.

Raw `initData` is authentication material and is sent through the
established API mechanism:

``` text
X-Telegram-Init-Data
```

Frontend must never:

``` text
trust parsed Telegram user identity as server authentication
expose/send TELEGRAM_BOT_TOKEN
create production auth bypass
override authenticated identity with client-supplied userId
```

Detailed authentication correctness belongs to `TECH_SPEC.md`.

------------------------------------------------------------------------

# 5. API and Data Flow

Goalstery HTTP communication goes through the custom typed API boundary,
normally:

``` text
src/lib/api/
```

Preferred flow:

``` text
HTTP
→ typed API client
→ feature/screen orchestration
→ owned state
→ presentation model/props
→ presentation component
```

Do not scatter raw application `fetch()` calls through presentation
components.

Presentation components such as `MatchCard` do not fetch Goalstery
application data themselves.

API request/response types describe the actual HTTP contract. They are
not presentation models.

Conceptual separation:

``` text
Prisma model
≠ backend domain object
≠ HTTP DTO
≠ frontend presentation model
```

Frontend code must not import Prisma-generated models/types as its
application contract.

When the UI needs a different shape, derive a presentation model
explicitly rather than polluting the API DTO with presentation-only
fields.

------------------------------------------------------------------------

# 6. Fetching and Cache Policy

Do not add a server-state/fetch/cache framework without an approved
architecture decision.

Examples:

``` text
TanStack Query / React Query
SWR
Apollo Client
RTK Query
Relay
```

Do not recreate one as a hidden in-house framework either:

``` text
TTL cache layer
normalized entity cache
custom stale-while-revalidate engine
generic cache invalidation framework
```

Simple feature-owned in-memory state is allowed.

The current architecture intentionally prefers explicit
fetching/orchestration until measured complexity justifies a different
decision.

------------------------------------------------------------------------

# 7. State Ownership

Use the smallest appropriate owner.

## Local React state

Prefer for state naturally owned by one component/subtree:

``` text
temporary input
expanded/collapsed state
local modal visibility
local interaction state
small pending state
```

## Zustand

Use selectively when state is genuinely shared/stable at
feature/application level or must outlive a local component lifecycle.

Do not put every API response or every UI boolean into Zustand.

Server data is not automatically global state.

Avoid maintaining the same logical value independently in:

``` text
component state
+ Zustand
+ copied API state
```

without an explicit synchronization model.

Backend/domain state remains authoritative on the server.

------------------------------------------------------------------------

# 8. Mutation Policy

Correctness-sensitive mutations are not optimistic by default.

Preferred flow:

``` text
user action
→ pending state
→ server mutation
→ server confirmation
→ refresh/update authoritative data
→ render confirmed state
```

While pending:

``` text
prevent accidental duplicate submission
do not present success early
preserve understandable UI state
```

Current mutation→successful response→refetch/refresh behavior is
acceptable.

Do not remove duplicate-tap protection for visual convenience.

Frontend eligibility checks are UX only; backend rules remain
authoritative for quota, kickoff, participation, reward validity,
scoring and idempotency.

------------------------------------------------------------------------

# 9. Presentation Boundary

Presentation components receive explicit data and callbacks.

They may own:

``` text
rendering
accessible control state
callback invocation
component-local presentation behavior
```

They should not own:

``` text
HTTP implementation
Telegram authentication
database/domain rules
scoring calculation
quota authority
canonical asset identity generation
```

Props should express a cohesive presentation contract. Avoid both
extremes:

``` text
passing giant unrelated backend-shaped objects
```

and:

``` text
splitting one cohesive view model into dozens of meaningless primitives
```

Pure presentation transforms may be extracted when they improve
clarity/testability.

Current example:

``` text
src/components/predict/match-card-presentation.ts
```

Domain semantics must remain stable across presentation mappings:

``` text
HOME → 1
DRAW → X
AWAY → 2

domain Points
→ trophy icon + numeric value
```

Presentation terminology must not silently mutate backend/domain
contracts.

------------------------------------------------------------------------

# 10. Football Assets

Runtime football assets use canonical Goalstery identity:

``` text
Team.slug
→ /assets/teams/<slug>.webp

Competition.slug
→ /assets/competitions/<slug>.webp
```

Use the established resolver:

``` text
src/lib/assets/football-assets.ts
```

Do not derive canonical asset identity in frontend from:

``` text
slugify(displayName)
provider ID
provider CDN URL
```

Image loading failure must render an intentional fallback rather than a
broken-image icon.

Do not remove fallback behavior during visual refactoring.

------------------------------------------------------------------------

# 11. Component Architecture

A component should have a meaningful responsibility.

Extract when there is:

``` text
independent responsibility
real reuse
independent interaction/state
substantial presentation complexity
```

There is no arbitrary component/function line limit.

Avoid micro-components created only to reduce file length.

Avoid god components that combine unrelated concerns such as:

``` text
HTTP implementation
large transformation logic
all screen UI
asset resolution
error mapping
complex state orchestration
```

Use normal React props/state before reaching for imperative refs.

Refs are appropriate for real DOM/browser/integration needs such as
focus, measurement or intentionally designed imperative APIs.

Use effects for synchronization/side effects, not for values derivable
during render.

Do not add `useMemo`, `useCallback` or `React.memo` mechanically.
Optimize for a concrete reason.

Repeated entities use stable semantic keys, not array indexes when
stable IDs exist.

------------------------------------------------------------------------

# 12. Dependency Policy

Do not add an npm dependency merely to save a small amount of
implementation code.

Before adding one, determine whether:

``` text
the project already solves the problem
React/browser/CSS can solve it simply
it becomes an architectural dependency
the benefit justifies long-term cost
```

Without an approved architecture decision, do not add frontend
frameworks/libraries for:

``` text
UI components
icons
server-state fetching/cache
CSS-in-JS
utility styling migration
forms
general animation
```

Current explicit exclusions include families such as:

``` text
MUI / Ant Design / Chakra / Mantine / Bootstrap UI
shadcn/ui as imported application design system
Lucide / Font Awesome / Heroicons / Material Icons / Phosphor
styled-components / Emotion
Tailwind migration
React Hook Form / Formik
Framer Motion for ordinary UI state transitions
```

This list illustrates the policy; the architectural category matters
more than package spelling.

------------------------------------------------------------------------

# 13. Styling Architecture

Goalstery styling:

``` text
global CSS
→ reset
→ root/document behavior
→ semantic theme tokens
→ genuinely global primitives

CSS Modules
→ component geometry
→ component presentation
→ component states

inline style
→ genuinely runtime-computed values only
```

Do not move feature-specific geometry into global CSS.

Use semantic CSS class names.

Prefer semantic shared design tokens for genuinely shared concepts such
as:

``` text
surface
text
border
accent
reward
radius
spacing
```

Do not globalize every isolated component pixel value.

Exact colors, typography, spacing and visual component rules belong to
`DESIGN_SYSTEM.md` and approved component specs.

Ordinary interaction transitions should use CSS. Do not add an animation
framework for basic selected/hover/expand behavior.

------------------------------------------------------------------------

# 14. Icons

Production application icons are Goalstery-owned/local SVG assets or
maintained SVG React components.

Do not use third-party icon libraries without an approved architecture
decision.

Reusable icons may be small typed SVG components.

Decorative icons should be hidden from assistive technology where
appropriate; meaningful icons require accessible context.

Emoji are not substitutes for production UI icons where a proper SVG
exists or should exist.

------------------------------------------------------------------------

# 15. Forms and Frontend Validation

Do not add a form framework by default.

Simple forms use straightforward React state and existing application
architecture.

Frontend validation improves UX; backend validation remains
authoritative.

Frontend may validate obvious immediate constraints but should not
duplicate complex backend domain logic as a second authority.

Do not introduce frontend schema-validation infrastructure or duplicate
client/server schemas without a concrete requirement and appropriate
architecture decision.

------------------------------------------------------------------------

# 16. Localization and RTL

Supported production locales are defined by the current product/settings
contract:

``` text
en
ru
de
es
ar
```

User-facing production strings use the established localization system
rather than hardcoded feature strings.

Telegram language may initialize locale according to product behavior;
later Telegram profile synchronization must not overwrite a manual
locale choice.

RTL is first-class.

Prefer logical CSS properties where direction matters:

``` css
padding-inline
margin-inline
inset-inline-start
text-align: start
```

Layout direction must not alter domain meaning. In particular:

``` text
HOME → 1
DRAW → X
AWAY → 2
```

remains deterministic in RTL.

------------------------------------------------------------------------

# 17. Theme

Supported appearance:

``` text
system
light
dark
```

Use the existing application theme architecture.

Do not create feature-local competing theme systems.

Prefer semantic CSS/theme variables rather than repeated JS
`theme === "dark"` branches for ordinary color presentation.

New visual UI must remain functional in light and dark themes.

Exact visual palette/tokens belong to `DESIGN_SYSTEM.md`.

------------------------------------------------------------------------

# 18. Errors, Loading and Empty States

Frontend API behavior branches on stable API/domain error codes, not
human-readable server text or HTTP status alone.

Conceptually:

``` text
API error.code
→ centralized/feature-boundary interpretation
→ localized user-facing state/message
```

Do not duplicate slightly different error-code mappings across
presentation components.

Loading state belongs to the asynchronous operation/feature that owns
it. Avoid one unrelated global loading boolean.

Feature boundaries decide meaningful empty states; low-level repeated
components should not infer whole-screen emptiness independently.

Detailed HTTP error contract belongs to `TECH_SPEC.md` /
`API_CONTRACTS.md` when present.

------------------------------------------------------------------------

# 19. Accessibility and Mobile Interaction

Accessibility is part of component correctness.

Use semantic controls:

``` text
button → <button>
navigation → <nav>
```

rather than clickable generic elements when semantics exist.

Expose selected/disabled/expanded state appropriately and do not rely on
color alone.

Do not remove keyboard focus indication without an accessible
replacement.

Goalstery is mobile-first:

``` text
practical touch targets
no hover-only interaction
no precision-pointer dependency
```

Exact touch sizing and visual focus treatment belong to the Design
System.

------------------------------------------------------------------------

# 20. Performance Discipline

Prioritize meaningful performance issues:

``` text
unnecessary network requests
large-list rerenders
oversized assets
layout instability
unnecessary client boundaries
expensive repeated computation
```

Do not micro-optimize trivial expressions or add memoization by habit.

Performance architecture changes should be driven by measurement.

------------------------------------------------------------------------

# 21. Imports and Module Boundaries

Use the configured `@/` alias for imports from `src/`.

Prefer:

``` ts
import { MatchCard } from "@/components/predict/MatchCard";
```

over long relative paths.

Direct imports from the owning module are the default.

Do not create broad global barrel `index.ts` files by default; they
obscure ownership and can increase circular-dependency risk.

A small local barrel is acceptable only when it establishes a real
module boundary with concrete value.

------------------------------------------------------------------------

# 22. Frontend Testing Boundary

Frontend tests protect meaningful frontend behavior, not implementation
trivia.

Useful unit targets:

``` text
presentation mapping
state transitions
error mapping
localization behavior
RTL-sensitive semantics
theme resolution
asset resolution/fallback
```

Do not require a React unit test merely because a component exists.

Do not unit-test exact CSS pixels/classes as a substitute for visual
verification.

For significant UI work use browser/screenshot verification according to
`TESTING_SPEC.md` and the applicable design reference/spec.

Current primary mobile reference size:

``` text
390 × 844
```

Responsive sanity currently includes:

``` text
360
390
430
```

Significant layout work must preserve RTL and light/dark behavior and
should be exercised with realistic long sports names.

Detailed testing requirements belong to `TESTING_SPEC.md`.

------------------------------------------------------------------------

# 23. Visual Work Boundary

Visual implementation authority:

``` text
global:
docs/design/DESIGN_SYSTEM.md

component-specific:
approved component reference
+
approved component spec
```

For current MatchCard:

``` text
docs/design/predict-card-v2-reference.png
docs/design/predict-card-v2-spec.md
```

Visual work must preserve existing behavior unless the task explicitly
includes an approved behavior change.

Do not silently change during a visual task:

``` text
API requests
prediction mutation semantics
idempotency
quota behavior
kickoff locking
asset identity
localization/RTL semantics
theme persistence
authentication
```

Do not claim reference fidelity without rendering and comparing the
implementation.

------------------------------------------------------------------------

# 24. Scoped Changes

Do not opportunistically refactor unrelated frontend architecture during
a bounded feature/visual task.

If unrelated technical debt is discovered:

``` text
report it separately
do not silently expand scope
```

Similarly, do not create speculative abstractions for future
Cup/Rating/Profile features before actual requirements exist.

------------------------------------------------------------------------

# 25. MatchCard Architecture Example

Current MatchCard illustrates the intended separation:

``` text
Predict feature orchestration
→ fixture/prediction DTO data
→ presentation mapping
→ MatchCard props
→ MatchCard rendering
→ CSS Module/design tokens
```

MatchCard may own:

``` text
rendering
callback invocation
accessible control state
local presentation behavior
```

It must not own:

``` text
Telegram authentication
Goalstery HTTP fetching
quota/scoring authority
database behavior
asset slug generation
```

This is an example of the general architecture, not a universal
component template.

------------------------------------------------------------------------

# 26. Simplicity Rule

When two approaches are equally correct, prefer the one with:

``` text
fewer architectural concepts
fewer dependencies
clearer ownership
more explicit data flow
easier testing
easier modification
```

Do not optimize architecture for cleverness.

------------------------------------------------------------------------

# 27. Architecture Change Policy

Approved frontend architecture changes must follow the project
decision/change process.

Do not:

``` text
change implementation first
→ rewrite this document afterward to justify it
```

If an implementation task appears to require changing an Accepted
frontend architecture decision, stop before implementation and request
explicit approval according to `AGENTS.md`.

After approval, synchronize affected decision/spec/implementation/tests
in the same change where applicable.

------------------------------------------------------------------------

# 28. Source Boundaries

This document owns:

``` text
frontend code organization
client/server component boundaries
frontend data flow
state ownership
frontend dependency policy
presentation-model separation
styling architecture
frontend integration boundaries
frontend implementation discipline
```

It does not own:

``` text
product/domain behavior        → PRODUCT_SPEC.md
backend/runtime architecture   → TECH_SPEC.md
database schema                → DB_SCHEMA.md
detailed test matrix           → TESTING_SPEC.md
global visual language         → DESIGN_SYSTEM.md
component geometry             → component design specs
accepted/open decisions        → DECISIONS.md
endpoint DTO contract          → API_CONTRACTS.md when present
```

If these sources appear inconsistent, do not silently reinterpret them.
Follow the conflict/change policy in `AGENTS.md`.

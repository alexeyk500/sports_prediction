# Goalstery --- Design System

**Design System v0.1**

---

**Status** Authoritative global visual
specification

**Platform** Telegram Mini App

**Frontend architecture** `docs/FRONTEND_ARCHITECTURE.md`

**Testing** `docs/TESTING_SPEC.md`

**Component designs** `docs/design/*-spec.md` + approved
references

---

This document owns Goalstery's shared visual language: hierarchy,
semantic visual tokens, typography, spacing, surfaces, interaction
states, mobile/RTL/theme expectations and visual-reference workflow.

It does **not** own product behavior, HTTP/domain semantics,
persistence, authentication or frontend code architecture.

For visual implementation, precedence is:

```text
approved component reference
→ component-specific design spec
→ DESIGN_SYSTEM.md
→ existing implementation
```

A component-specific spec overrides this document only where the
override is explicit or required to reproduce its approved reference.

---

# 1. Visual Direction

Goalstery should feel:

```text
premium
modern
football-oriented
competitive
trustworthy
compact
calm
mobile-native
easy to scan
```

The visual language communicates:

```text
football + competition + skill + reward
```

not:

```text
betting/casino
neon crypto dashboard
generic admin UI
glow-heavy gaming UI
desktop UI squeezed into mobile
```

When visual goals conflict, prioritize:

```text
clarity
→ usability
→ information hierarchy
→ consistency
→ compactness
→ polish
→ decoration
```

Decoration must not reduce readability or interaction clarity.

---

# 2. Mobile Layout

Primary target:

```text
390 × 844
```

Required width sanity:

```text
360
390
430
```

Normal screen content must not horizontally overflow.

Primary containers normally use:

```css
width: 100%;
min-width: 0;
```

Recommended screen horizontal padding:

```text
16px
```

`16–20px` is acceptable at wider mobile widths.

Prefer a clear vertical hierarchy:

```text
screen context/header
→ summary/context
→ primary controls
→ main content
→ persistent bottom navigation
```

Avoid unnecessary nested visible cards/surfaces.

A surface should communicate grouping or hierarchy, not merely wrap
markup.

---

# 3. Application Shell, Scrolling and Safe Areas

The main mobile shell should normally behave as:

```text
application viewport
+ stable top context
+ primary vertical content scroll region
+ stable bottom navigation
```

Avoid nested vertical scrolling unless necessary.

Bottom navigation must not scroll with fixture content.

Respect mobile safe areas where applicable:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

Controls/navigation must remain usable around device home indicators and
Telegram viewport constraints.

---

# 4. Spacing

Preferred core spacing tokens:

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 32px;
```

Useful intermediate values such as:

```text
6, 10, 14, 18, 28px
```

are acceptable when they solve real component geometry.

Do not introduce arbitrary isolated spacing without a visual reason.

Component-specific approved specs may define exact values outside this
scale.

---

# 5. Typography

Use the application's established font/system stack unless a
product-wide font decision changes it.

Recommended hierarchy:

Role Size Line height Weight

---

Major numeric/display 28px 1.1 700
Screen title 24px 1.15 700
Section title 18px 1.2 700
Important component title 16px 1.2 700
Body 15px 1.35 400
Metadata 14px 1.3 500
Supporting text 12px 1.3 500

Preferred weights:

```text
400 body
500 metadata/control
600 emphasized metadata/button
700 heading/important value
```

Avoid routine `800/900`.

Normal application information should generally not be smaller than
`12px`.

Typography should create hierarchy without making repeated sports UI
oversized.

---

# 6. Long and Localized Text

Never assume team, competition or translated names are short.

Important entity names should normally tolerate up to two lines rather
than defaulting to single-line ellipsis.

Representative stress cases include:

```text
Manchester United
Paris Saint-Germain
Borussia Mönchengladbach
Atlético de Madrid
Wolverhampton Wanderers
```

Single-line truncation is appropriate only where the design
intentionally constrains vertical space and the full name is secondary.

Do not solve localization by globally shrinking typography.

---

# 7. Semantic Color Tokens

Components should consume semantic tokens rather than repeatedly
hardcoding palette values.

## Light baseline

```css
--page-bg: #f5f7fa;

--surface-primary: #ffffff;
--surface-secondary: #f8fafc;
--surface-raised: #ffffff;

--text-primary: #0f172a;
--text-secondary: #475569;
--text-muted: #64748b;
--text-disabled: #94a3b8;

--border-subtle: #dbe3ee;
--border-strong: #cbd5e1;
```

## Dark baseline

```css
--page-bg: #0f1724;

--surface-primary: #172233;
--surface-secondary: #1e2b3d;
--surface-raised: #243247;

--text-primary: #f8fafc;
--text-secondary: #cbd5e1;
--text-muted: #94a3b8;
--text-disabled: #64748b;

--border-subtle: #334155;
--border-strong: #475569;
```

Dark theme should remain navy/slate/cool-gray rather than pure black or
an unrelated visual language.

These values are global baselines. Existing equivalent semantic project
tokens may be retained/mapped rather than mechanically renamed.

---

# 8. Accent and Reward Colors

Primary interaction accent uses restrained teal/green.

Light baseline:

```css
--accent: #16856f;
--accent-hover: #117461;
--accent-soft: #e9f8f3;
--accent-text: #116b5b;
```

Dark baseline:

```css
--accent: #63e6c2;
--accent-soft: #143f39;
--accent-text: #d9fff3;
```

Use accent for interaction meaning such as:

```text
selected prediction
active navigation
primary positive action
focus/active control
```

Do not use accent decoratively everywhere.

Reward/competitive value uses warm gold:

```css
--reward-gold: #f6b817;
```

Gold communicates:

```text
potential points/trophies
prizes
rank achievement
competitive reward
```

Selection remains teal; do not turn reward/trophy visuals green merely
because an outcome is selected.

---

# 9. Semantic Status Colors

Baseline:

```css
--success: #16856f;
--success-soft: #e9f8f3;

--warning: #d69e16;
--warning-soft: #fff7d6;

--danger: #dc4c4c;
--danger-soft: #fff0f0;
```

Use semantic status colors only when the state carries that meaning.

Do not use red simply to attract attention, and do not style normal
states such as a post-kickoff locked prediction as an error unless the
interaction actually represents an error.

---

# 10. Radius, Borders and Shadows

Recommended radius system:

```css
--radius-sm: 10px;
--radius-md: 14px;
--radius-lg: 18px;
--radius-xl: 24px;
--radius-pill: 999px;
```

Typical usage:

```text
small control        10–14px
button               14–18px
outcome control      16–18px
main card            20–24px
pill/tab              999px
avatar/logo badge     50%
```

Default border:

```css
border: 1px solid var(--border-subtle);
```

Selected interactive border may use approximately:

```text
1.5–2px accent
```

Avoid double outlines, heavy decorative borders and needless radius
variation.

Shadows are restrained:

```css
/* card */
box-shadow: 0 10px 30px rgb(15 23 42 / 0.08);

/* smaller elevation */
box-shadow: 0 4px 14px rgb(15 23 42 / 0.08);
```

Avoid strong black shadows, neon halos and dramatic layered glow unless
an approved component reference explicitly requires them.

---

# 11. Cards and Information Density

Typical primary card baseline:

```css
.card {
  background: var(--surface-primary);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
}
```

Typical card padding:

```text
16–20px
```

Repeated football content should remain compact and scannable:

```text
metadata visually secondary
primary actions easy to compare
no oversized repeated headings
no oversized logos
no decorative empty vertical space
```

Avoid fixed card heights unless an approved design requires them.

---

# 12. Buttons and Touch Targets

Conceptual button hierarchy:

```text
primary
secondary
ghost
danger
specialized interactive control
```

Important mobile controls should generally provide approximately:

```text
44 × 44px
```

minimum practical touch area.

Primary baseline:

```css
.primaryButton {
  min-height: 48px;
  padding-inline: 18px;
  border: 0;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 700;
  background: var(--accent);
}
```

Secondary baseline:

```css
.secondaryButton {
  min-height: 44px;
  padding-inline: 16px;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  background: var(--surface-secondary);
  font-size: 15px;
  font-weight: 600;
}
```

Foreground must maintain accessible contrast.

Do not use gradients by default or make critical mobile controls
difficult to tap.

---

# 13. Interactive States

## Selected

Preferred treatment:

```text
soft accent background
+ single accent border
+ optional accent foreground
```

Example:

```css
.selected {
  background: var(--accent-soft);
  border-color: var(--accent);
}
```

Do not add redundant visible "Selected" labels when visual state plus
accessibility semantics already communicates selection.

## Disabled

Disabled controls remain readable but clearly inactive. Do not rely on
opacity alone when it damages legibility.

## Locked

Locked is not necessarily disabled/error styling.

A locked prediction may remain:

```text
visible
readable
selected state preserved
not editable
```

A restrained lock icon/status explanation is appropriate.

---

# 14. Icons and Trophy Presentation

Use a consistent local SVG icon language.

Typical visual sizes:

```text
14px inline metadata
16px compact UI
18px standard control
20px prominent control
24px navigation/major icon
```

Do not use emoji as production icons when a proper local SVG exists or
should exist.

Prediction points may be presented visually as:

```text
gold trophy SVG + numeric value
```

Typical trophy size:

```text
16–18px
```

Domain terminology remains `points`; the trophy is presentation only.

Detailed icon dependency/code architecture belongs to
`FRONTEND_ARCHITECTURE.md`.

---

# 15. Football Logos

Football logos are displayed from canonical local assets according to
the frontend asset contract.

Do not visually:

```text
recolor official logos
invent fake club logos
use neon glow as a contrast fix
```

Logo assets may have transparency, dark colors or irregular empty
margins, so use a neutral badge where needed.

Typical team presentation:

```text
outer badge ~52 × 52px
logo max ~44 × 44px
```

Light and dark themes may both use a light-neutral lifted badge when
necessary for crest legibility.

Image failure must produce an intentional fallback, not a browser
broken-image icon.

Canonical asset identity/path rules belong to `FRONTEND_ARCHITECTURE.md`
/ technical asset tooling rather than this visual document.

---

# 16. Tabs and Bottom Navigation

Tabs/segmented controls must make active state immediately
distinguishable without turning every item into an oversized independent
button.

Use combinations of:

```text
accent
stronger foreground
selected surface
concise indicator
```

Bottom navigation is persistent primary navigation.

Current product sections include:

```text
Matches
Cup
History
Profile
```

It should:

```text
remain separate from scrolling content
respect safe area
use consistent icon scale
clearly identify active section
```

Exact route behavior is outside this document.

---

# 17. Theme Requirements

Goalstery supports:

```text
system
light
dark
```

Components consume the resolved application theme and semantic tokens.

Every new visual component must be checked in light and dark, including:

```text
surface contrast
text hierarchy
borders
football logo visibility
selected/locked/disabled state
icons
focus state
shadows
```

Do not assume automatic inversion will create a good dark theme.

Implementation architecture for theme state belongs to
`FRONTEND_ARCHITECTURE.md`.

---

# 18. RTL and Localization Presentation

RTL is first-class.

Prefer logical CSS properties where direction matters:

```css
margin-inline
padding-inline
inset-inline-start
text-align: start
```

Layouts must tolerate translations longer than English.

Do not make important information hover-only.

Visual direction must never alter semantic prediction meaning; domain
mapping remains defined outside this document.

Use established localization/`Intl` utilities for localized
numbers/dates/times rather than hand-building locale strings.

Canonical business timezone remains a domain concern.

---

# 19. Accessibility and Focus

Visual fidelity must preserve semantic interaction.

Interactive states should not rely on color alone.

Use a visible restrained focus treatment, for example:

```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

Component-specific approved styling may override the exact geometry
while retaining visible focus.

Visual icon size may be smaller than its touch target.

Accessibility code architecture belongs to frontend implementation; this
document defines the visual requirement that accessible state remains
perceivable.

---

# 20. Motion

Motion is restrained and functional.

Typical simple transition:

```css
transition:
  background-color 150ms ease,
  border-color 150ms ease,
  color 150ms ease,
  transform 120ms ease;
```

Prefer CSS transitions for ordinary UI states.

Avoid decorative animation and excessive movement.

Respect reduced-motion preferences where meaningful.

Animation-library architecture belongs to `FRONTEND_ARCHITECTURE.md`.

---

# 21. Loading, Empty and Error Presentation

Loading UI should preserve layout stability where practical and remain
consistent with existing project conventions.

Do not invent a unique skeleton language for one isolated component
without a design need.

Empty states should concisely communicate:

```text
what is empty
what the user can do next, if applicable
```

Avoid oversized decorative illustrations by default.

Error UI should be user-facing and visually distinguish actual failure
from normal unavailable/locked states.

Detailed API error-code mapping belongs to frontend/technical contracts.

---

# 22. Rewarded and Competitive UI

Rewarded prediction UI must remain part of the same calm product
language.

Avoid:

```text
casino bonus aesthetics
flashing rewards
aggressive monetization prompts
```

The visual exchange should be understandable without sensational
styling.

Cup/Rating may use stronger hierarchy for:

```text
rank
trophy
league badge
points
prize
progression
```

but avoid metallic-gradient overload, glow, confetti and indiscriminate
gold.

Gold remains a meaningful reward signal.

Business mechanics belong to `PRODUCT_SPEC.md`.

---

# 23. CSS Visual Discipline

Component styling should use semantic classes and low specificity.

Good:

```text
matchCard
teamBadge
teamName
outcomeSelected
lockedStatus
```

Avoid purely visual/positional names such as:

```text
greenBox
bigText
leftThing
```

Prefer explicit state classes:

```text
selected
disabled
locked
active
loading
```

over fragile positional selectors such as `:nth-child(...)`.

Avoid `!important` except for a documented external constraint.

Detailed CSS/module ownership rules belong to
`FRONTEND_ARCHITECTURE.md`.

---

# 24. Design Tokens

Where a shared visual concept exists, prefer semantic variables.

Conceptual token groups:

```text
surfaces
text
borders
accent
reward
status
radius
spacing
```

Do not create a global token for every component-specific pixel.

Do not perform a broad token rename/refactor merely to make
implementation spellings match this document if equivalent semantic
project tokens already exist.

A component-specific spec may define local semantic tokens where it has
a distinct visual concept.

---

# 25. Component Reuse as a Visual Concept

Reuse visual components when they represent the same stable design
concept, for example:

```text
logo badge
trophy/value
status row
section header
bottom navigation item
```

Do not abstract components merely because two elements happen to share a
few CSS properties.

Code/component ownership details belong to `FRONTEND_ARCHITECTURE.md`.

---

# 26. Visual References

Approved visual artifacts live under:

```text
docs/design/
```

Obsolete references belong in:

```text
docs/design/archive/
```

Preferred naming:

```text
<component>-v<version>-reference.png
<component>-v<version>-spec.md
```

For a component with both reference and spec:

```text
reference → target appearance
spec      → implementation constraints/clarification
```

An approved reference is an implementation target, not loose
inspiration.

Target fidelity includes:

```text
geometry
spacing
hierarchy
density
radii
typography scale
surface relationships
state treatment
```

If a small numeric adjustment is needed to visually match the approved
reference, the reference may control within the component-specific
visual scope.

Meaningful deviations should be reported.

---

# 27. Visual Implementation Workflow

For approved reference-driven work:

```text
approved reference
+ component spec
+ DESIGN_SYSTEM
→ implementation
→ real browser render
→ screenshot
→ side-by-side comparison
→ correction pass
```

Compilation/tests alone do not prove visual completion.

Unless the component spec says otherwise, primary comparison uses:

```text
390 × 844
```

with responsive sanity at:

```text
360
430
```

Use realistic data, including long names.

Compare:

```text
outer geometry
padding/gaps
alignment/baselines
wrapping
border thickness
radius
visual weight
theme contrast
```

Do not claim pixel-close/pixel-perfect fidelity without actual rendered
comparison.

Detailed automated/browser testing requirements belong to
`TESTING_SPEC.md`.

---

# 28. Visual Acceptance

A component with an approved reference is visually acceptable when:

```text
major geometry and hierarchy match
spacing/density are consistent with the target
light/dark treatment is intentional
long content remains usable
mobile widths remain usable
RTL is not broken
accessibility semantics remain intact
```

"Approximately similar" is insufficient when the project has an approved
pixel-close target.

For components without a dedicated reference, consistency with this
Design System is the acceptance target.

---

# 29. Visual Implementation Constraints

Prefer ordinary deterministic HTML/CSS.

Do not introduce unnecessary:

```text
canvas rendering
runtime image analysis
dynamic logo color detection
complex layout measurement
ResizeObserver-driven geometry
JS-driven static CSS geometry
```

when normal CSS can implement the approved design.

Visual tasks must remain visual unless an explicit approved scope
includes behavior changes.

Do not silently change during visual work:

```text
database/domain behavior
prediction/quota/scoring rules
authentication
API contracts
fixture/tournament behavior
canonical asset identity
localization semantics
theme persistence
```

If a non-visual blocker is discovered, report it separately.

---

# 30. Existing Implementation vs Approved Design

Existing CSS/markup is not automatically visual authority.

If it conflicts with:

```text
approved component reference
or
approved component spec
```

the approved design controls visual implementation.

However, existing non-visual behavior such as:

```text
business behavior
accessibility semantics
localization
theme architecture
asset fallbacks
responsive behavior
```

must be preserved unless explicitly superseded through the appropriate
authority.

---

# 31. Current MatchCard Authority

Current prediction MatchCard visual authority:

```text
docs/design/predict-card-v2-reference.png
docs/design/predict-card-v2-spec.md
```

These override general MatchCard guidance in this document where
necessary.

Older MatchCard visual references are non-authoritative and should
remain archived rather than competing with the current reference.

---

# 32. Visual Review Report

For significant reference-driven visual work, the implementation report
should state relevant items such as:

```text
files changed
meaningful markup/DOM changes
key geometry/typography decisions
theme treatment
responsive/RTL impact
accessibility impact
screenshot viewport used
known remaining visual differences
verification/check status
```

Do not require boilerplate fields that are irrelevant to the task.

Do not report "pixel perfect" without actual comparison.

---

# 33. Source Boundaries

This document owns:

```text
global visual direction
semantic visual hierarchy
baseline visual tokens
typography/spacing/surfaces
visual interaction states
mobile visual requirements
theme/RTL visual expectations
visual-reference authority/workflow
visual acceptance criteria
```

It does not own:

```text
product behavior              → PRODUCT_SPEC.md
backend/runtime architecture  → TECH_SPEC.md
database schema               → DB_SCHEMA.md
frontend code architecture    → FRONTEND_ARCHITECTURE.md
detailed testing matrix       → TESTING_SPEC.md
accepted/open decisions       → DECISIONS.md
component-specific appearance → component reference/spec
```

If sources appear inconsistent, do not silently reinterpret them. Follow
`AGENTS.md` conflict/change policy.

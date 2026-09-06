# Goalstery — Predict Screen V2 Visual Specification

Status: Approved  
Scope: Predict screen presentation  
Primary target: Mobile Telegram Mini App  
Primary reference viewport: 390 × 844

Approved visual reference:

```text
docs/design/predict-screen-v2-reference.png
```

---

## 1. Purpose

This document defines the approved visual and presentation contract for the Goalstery Predict screen.

It does not redefine:

- prediction business rules;
- Daily Prediction quota semantics;
- rewarded-ad verification;
- fixture eligibility;
- kickoff locking;
- scoring;
- Points calculation;
- API contracts;
- persistence;
- Telegram authentication.

Those remain owned by their authoritative project specifications.

This document defines how already-approved product behavior is presented on the Predict screen.

---

## 2. Visual Authority

For the Predict screen, visual precedence is:

```text
docs/design/predict-screen-v2-reference.png
→ docs/design/predict-screen-v2-spec.md
→ docs/design/DESIGN_SYSTEM.md
→ existing implementation
```

The approved reference is the primary visual target.

Existing implementation is not visual authority when it conflicts with the approved reference/spec.

For MatchCard itself, its component-specific authority remains:

```text
docs/design/predict-card-v2-reference.png
→ docs/design/predict-card-v2-spec.md
```

This Predict Screen specification must not silently override the approved MatchCard V2 contract.

---

## 3. Design Direction

The Predict screen should feel:

- premium;
- modern;
- football-oriented;
- competitive;
- compact;
- trustworthy;
- calm;
- mobile-native;
- fast to scan.

It must not resemble:

- a betting terminal;
- a casino;
- a crypto trading interface;
- an admin dashboard;
- a generic form;
- a collection of unrelated cards.

The primary purpose of the screen is:

```text
understand today's prediction allowance
→ find today's available matches
→ make or review predictions quickly
```

---

## 4. Screen Hierarchy

The approved screen hierarchy is:

```text
Predict header
↓
Today's predictions / quota
↓
Available / My Picks segmented control
↓
Today / match-count context row
↓
Match feed
↓
fixed bottom navigation
```

This hierarchy should remain immediately understandable without explanatory text.

---

## 5. Screen Shell

Primary design viewport:

```text
390 × 844
```

Also verify:

```text
360px width
390px width
430px width
```

The screen must:

- fill the Telegram Mini App viewport;
- respect safe areas;
- have no horizontal overflow;
- keep bottom navigation fixed;
- allow the match feed to scroll naturally;
- prevent content from being hidden behind bottom navigation;
- preserve the same information hierarchy in light and dark themes.

The Predict screen must not introduce an independent nested-scroll experience unless required by the existing approved application shell.

---

## 6. Header

The Predict screen header is intentionally simple.

Approved primary title:

```text
Predict
```

Approved supporting copy:

```text
Make your picks for today
```

The supporting line is secondary and may be localized normally.

Do not show:

```text
WEEKLY CUP
```

as an eyebrow above the Predict title in this design.

The screen already exists within Goalstery's tournament context; the Predict header should focus on the user's immediate action.

The header should be compact and should not behave like a large hero section.

Visual hierarchy:

```text
Predict
→ supporting copy
```

The title must remain one of the strongest typography elements on the screen.

---

## 7. Development Controls

Development-only controls such as:

```text
Dev
```

are not part of the approved production Predict design.

If such controls are required in development builds, they must not influence production layout or visual acceptance.

---

## 8. Today's Predictions Block

The previous accounting-style presentation:

```text
Free predictions: 3 / 3
Rewarded predictions: 0 / 5
Total: 3 / 8
```

is not part of Predict Screen V2.

The approved design uses one compact quota/progress component.

Primary label:

```text
Today's predictions
```

Primary count:

```text
used / total
```

Example:

```text
3 / 8
```

The total is derived from the authoritative configured Daily Prediction limits.

The visual must not independently hardcode product limits.

---

## 9. Prediction Progress Indicator

The quota component visually represents the configured prediction slots.

Current MVP configuration is:

```text
FREE_PREDICTION_LIMIT = 3
REWARDED_PREDICTION_LIMIT = 5

DAILY_PREDICTION_LIMIT =
  FREE_PREDICTION_LIMIT + REWARDED_PREDICTION_LIMIT
```

Currently:

```text
3 FREE
5 REWARDED
8 TOTAL
```

These values are product/domain configuration, not immutable visual constants.

The frontend must render the progress representation from authoritative application data/configuration rather than relying on layout assumptions that only work for exactly 3 + 5.

### 9.1 Visual grouping

FREE and REWARDED slots must be visually distinguishable as two groups.

Conceptually:

```text
● ● ●  │  ○ ○ ○ ○ ○
 FREE       REWARDED
```

The divider is subtle.

The component must communicate:

- used slots;
- available slots;
- FREE group;
- REWARDED group.

The indicator should remain compact.

It must not resemble:

- gambling chips;
- currency;
- coins;
- a slot machine;
- a purchase meter.

---

## 10. Quota Labels

Below the progress indicator, show compact supporting information for both groups.

Example:

```text
Free (3 / 3)          Rewarded (0 / 5)
```

The exact localized wording may vary according to the localization system.

The labels are secondary metadata.

They must not compete visually with:

```text
Today's predictions
3 / 8
```

---

## 11. Quota States

The component must visually support at least these states.

### 11.1 Free predictions available

FREE slots remain available.

Rewarded advertising should not dominate the screen.

The component primarily communicates remaining quota.

### 11.2 Free predictions exhausted

When FREE slots are exhausted and REWARDED predictions remain available, the rewarded action may become visible.

Approved conceptual CTA:

```text
Watch an ad to unlock
another prediction              +1
```

The exact copy must use the project's localization system.

The CTA should be compact and contextual.

It must not visually dominate the match feed.

### 11.3 Rewarded predictions in use

When rewarded slots have been consumed, their progress state should be visible in the same quota indicator.

Example conceptual state:

```text
6 / 8

● ● ● │ ● ● ● ○ ○

Free (3 / 3)
Rewarded (3 / 5)
```

Do not introduce a separate quota dashboard.

### 11.4 Daily quota exhausted

When all configured slots are exhausted, the component should clearly communicate completion without presenting another rewarded unlock action.

Exact business behavior remains owned by Product Spec.

This specification only requires a clear completed visual state.

---

## 12. Rewarded CTA

The rewarded-ad action is contextual.

It should not permanently dominate the Predict screen when FREE predictions remain.

When shown, it should visually belong to the quota component.

Recommended presentation:

```text
video/ad icon
Watch an ad to unlock another prediction
+1
```

Use restrained Goalstery styling.

Do not use:

- flashing effects;
- casino styling;
- exaggerated gold;
- fake urgency;
- "BUY";
- monetary language.

Rewarded predictions are earned through the approved rewarded-ad flow, not purchased predictions.

---

## 13. Available / My Picks

The Predict screen uses a compact segmented control.

Segments:

```text
Available
My Picks
```

This is not a pair of large standalone form buttons.

It should visually read as one navigation/control unit.

### 13.1 Available

`Available` represents the available-match view according to existing product behavior.

When active:

- teal/Goalstery accent treatment;
- high text contrast;
- clear active state;
- no excessive glow;
- no double border.

### 13.2 My Picks

`My Picks` represents today's existing predictions according to current application behavior.

When predictions exist, show a compact count badge.

Example:

```text
My Picks  3
```

The count is derived from application data.

Do not hardcode it.

The badge should remain secondary to the segment label.

### 13.3 Segmented-control geometry

The control should:

- occupy the available content width;
- have balanced segments;
- remain compact;
- have a comfortable touch target;
- clearly distinguish active/inactive states;
- work in light and dark themes.

Target height:

```text
approximately 44–48px
```

The exact rendered geometry should follow the approved reference.

---

## 14. Today Context Row

Between the segmented control and the first MatchCard, show a compact contextual row.

Concept:

```text
Today · Sep 6                    7 matches
```

Left:

```text
current prediction day
```

Right:

```text
number of relevant matches in the current view
```

This is supporting navigation/context metadata.

It must not become a large section heading.

Date formatting must use the project's existing localization/time rules.

Do not implement a date picker as part of this design.

---

## 15. Match Feed

The match feed begins below the Today context row.

Every MatchCard must begin fully visible.

The first card must not:

- slide under the segmented control;
- be clipped by the context row;
- lose its competition header;
- begin behind another sticky element.

Maintain a clear but compact vertical gap between consecutive MatchCards.

The feed should feel continuous rather than like a stack of unrelated modal panels.

---

## 16. MatchCard

Predict Screen V2 uses the already-approved MatchCard V2.

Authoritative component sources:

```text
docs/design/predict-card-v2-reference.png
docs/design/predict-card-v2-spec.md
```

Do not redesign MatchCard while implementing Predict Screen V2.

Preserve its existing approved:

- competition header;
- team logo presentation;
- team-name layout;
- VS;
- 1 / X / 2 controls;
- trophy + Points presentation;
- selected state;
- locked state;
- local football asset handling;
- compact geometry.

Any MatchCard-specific conflict should be resolved using the MatchCard component authority rather than this screen-level specification.

---

## 17. Outcome Semantics

Predict Screen layout must not change the approved outcome mapping:

```text
HOME → 1
DRAW → X
AWAY → 2
```

This mapping remains semantic and must not be reversed in RTL.

---

## 18. Light Theme

Light theme uses:

- light neutral page background;
- white/light card surfaces;
- restrained borders;
- subtle shadows;
- dark navy typography;
- teal accent;
- gold only where semantically appropriate, such as trophy/Points reward cues.

The screen must not become a collection of strong floating white panels.

Elevation should remain restrained.

The quota component should integrate with the page rather than resemble an unrelated dashboard widget.

---

## 19. Dark Theme

Dark theme uses:

- deep navy page background;
- slightly differentiated navy surfaces;
- restrained borders;
- high-quality muted secondary text;
- teal accent;
- gold trophy/reward details.

Surface hierarchy should remain clear:

```text
page
→ quota / MatchCard surface
→ interactive controls
→ selected state
```

Do not use:

- pure black as the primary visual solution;
- bright gray outlines;
- neon glow;
- saturated blue panels.

Football-logo badge treatment remains governed by MatchCard V2.

---

## 20. Bottom Navigation

Bottom navigation contains:

```text
Predict
Cup
Rating
Profile
```

It remains fixed to the bottom of the application shell.

Each item should have:

```text
icon
label
```

All four items must feel like parts of one navigation system.

### 20.1 Active Predict state

Predict is active on this screen.

The active state should use:

- Goalstery teal;
- restrained mint/teal background treatment where appropriate;
- clear active icon;
- clear active label.

Do not use:

- thick focus-like double borders;
- oversized circular icon treatment;
- strong elevation;
- glow.

The active state must be obvious but calm.

### 20.2 Inactive navigation items

Cup, Rating and Profile use secondary icon/text treatment.

They must remain readable and tappable but visually subordinate to Predict.

Use Goalstery-owned SVG icons according to frontend architecture decisions.

Do not introduce an icon library.

---

## 21. Bottom Navigation Safe Area

Bottom navigation must respect device safe-area inset.

Scrollable content must include sufficient bottom spacing so the final MatchCard/content is not obscured by the fixed navigation.

The navigation itself must not cause horizontal overflow.

---

## 22. Typography Hierarchy

Approximate hierarchy:

```text
Predict
→ strongest screen title

team names / important match content
→ primary content

Today's predictions / quota count
→ strong supporting content

Available / My Picks
→ interactive navigation

competition / date / Today context
→ secondary metadata

Free / Rewarded labels
→ supporting metadata

locked state
→ supporting status
```

Do not make all labels bold and equally prominent.

The user should immediately see:

```text
Predict
quota state
available matches
prediction controls
```

---

## 23. Spacing and Density

Predict is a high-frequency scanning screen.

Vertical space must be used carefully.

Prefer:

```text
compact header
compact quota
compact segmented control
compact context row
dense but readable MatchCards
```

Avoid:

- large hero spacing;
- oversized quota cards;
- large empty gaps;
- form-like button spacing;
- repeated explanatory copy;
- excessive padding between sections.

The result must remain comfortable rather than cramped.

---

## 24. Responsive Behavior

Verify at:

```text
360px
390px
430px
```

At all supported widths:

- no horizontal overflow;
- quota indicator remains legible;
- Free/Rewarded grouping remains understandable;
- segmented control remains on one row;
- My Picks count remains visible;
- context row remains usable;
- MatchCards remain valid;
- bottom navigation remains balanced.

Do not design only for the 390px screenshot.

---

## 25. Localization

All user-facing copy must use the existing localization system.

Do not hardcode English strings inside presentation components.

The design must tolerate longer localized strings.

Particular attention:

- Today's predictions;
- Available;
- My Picks;
- Rewarded;
- Locked after kickoff;
- match-count copy;
- rewarded CTA.

Do not reduce text to unreadable sizes merely to preserve English geometry.

---

## 26. RTL

Arabic/RTL is a first-class visual state.

Verify the full Predict screen in RTL.

RTL should correctly affect presentation/layout where appropriate.

It must NOT alter domain semantics.

Specifically:

```text
HOME → 1
DRAW → X
AWAY → 2
```

remains unchanged.

Quota semantics also remain:

```text
FREE
REWARDED
```

even if their visual presentation follows the application's established RTL layout conventions.

Bottom navigation behavior must remain semantically correct.

---

## 27. Accessibility

Interactive elements must retain appropriate semantic controls.

Requirements include:

- real buttons/links where appropriate;
- visible focus treatment;
- sufficient contrast;
- selected state not communicated only by color;
- disabled/locked state understandable;
- touch targets suitable for mobile;
- rewarded CTA accessible;
- segmented control understandable to assistive technology.

Do not remove accessibility semantics for visual fidelity.

---

## 28. Loading State

Loading should preserve the approximate screen hierarchy and avoid disruptive layout shifts.

Appropriate skeleton/loading presentation may be used for:

- quota;
- context;
- MatchCards.

Do not introduce a visually unrelated full-screen spinner unless required by existing application behavior.

---

## 29. Empty States

The screen must support clear empty presentation for:

```text
no available matches
no picks yet
```

Empty states should be concise and integrated with the Predict visual system.

Do not create oversized illustration-heavy empty pages for MVP.

Exact product wording remains owned by localization/product copy.

---

## 30. Error State

Errors should use the existing stable application error handling.

Predict Screen must not display raw backend/internal exceptions.

Error presentation should remain visually consistent with the screen and should not destroy the surrounding layout unnecessarily.

Detailed error semantics remain owned by technical/API specifications.

---

## 31. State Ownership

This visual specification does not change frontend architecture.

Continue to follow:

```text
docs/FRONTEND_ARCHITECTURE.md
```

In particular:

```text
HTTP
→ typed API client
→ orchestration/state
→ presentation model
→ presentation components
```

Presentation components must not become responsible for fetching application data.

---

## 32. No New Product Behavior

Implementing this design must not change:

- Daily Prediction limits;
- FREE/REWARDED eligibility;
- rewarded-ad verification;
- fixture eligibility;
- prediction creation;
- prediction editing;
- kickoff locking;
- scoring;
- Points;
- tournament participation;
- API semantics;
- Telegram authentication.

If reproducing the reference appears to require such a change:

```text
STOP
identify the conflict
request explicit approval
```

Do not silently modify product behavior to fit the mockup.

---

## 33. No New Dependencies

Predict Screen V2 does not justify introducing:

- third-party UI library;
- icon library;
- CSS-in-JS;
- Tailwind/styling framework;
- form framework;
- animation framework;
- server-state/cache framework.

Use the existing approved frontend stack.

---

## 34. Visual Verification

Implementation is not visually complete after:

```text
typecheck
lint
tests
build
```

Actual browser verification is required.

Primary comparison:

```text
390 × 844
```

Render at least:

```text
390 × 844 — Light
390 × 844 — Dark
```

Also sanity-check:

```text
360px
430px
RTL
```

Compare directly with:

```text
docs/design/predict-screen-v2-reference.png
```

---

## 35. Visual Comparison Checklist

Verify:

```text
screen title position and hierarchy
supporting subtitle
quota component size
3 / 8 hierarchy
Free/Rewarded slot grouping
progress indicator
rewarded CTA state
segmented-control dimensions
Available active state
My Picks count badge
Today/date row
match count
first MatchCard not clipped
MatchCard spacing
bottom navigation
active Predict state
safe-area behavior
light-theme surfaces
dark-theme surfaces
RTL
long localized text
360 / 390 / 430 widths
```

Perform screenshot → comparison → correction iteration.

Do not claim reference fidelity without actual browser comparison.

---

## 36. Approved Reference States

The approved reference includes the following design concepts.

### Standard quota state

```text
Today's predictions                     3 / 8

● ● ● │ ○ ○ ○ ○ ○

Free (3 / 3)               Rewarded (0 / 5)
```

### Rewarded usage

```text
6 / 8

● ● ● │ ● ● ● ○ ○

Free (3 / 3)               Rewarded (3 / 5)
```

### Free exhausted / rewarded available

The quota component may expose the contextual:

```text
Watch an ad to unlock another prediction
+1
```

action.

### Segmented control

```text
Available
My Picks [count]
```

### Today context

```text
Today · localized date
match count
```

These examples define presentation intent.

Dynamic values must come from authoritative application state.

---

## 37. Visual Acceptance Criteria

Predict Screen V2 is accepted when:

- the screen closely follows the approved reference;
- Predict is immediately identifiable as the screen purpose;
- quota is understandable without three accounting-style rows;
- FREE and REWARDED capacity is visually understandable;
- rewarded CTA appears contextually rather than dominating the screen;
- Available/My Picks reads as a segmented control;
- My Picks can display the current count;
- today's date and match count are visible but secondary;
- first MatchCard is never clipped by upper controls;
- MatchCard V2 remains visually unchanged except where explicitly required by its own authority;
- match feed is compact and easy to scan;
- bottom navigation forms one coherent component;
- Predict active state is clear without a heavy focus-like border;
- light and dark themes both match the approved visual direction;
- 360/390/430 layouts work;
- RTL works;
- accessibility remains intact;
- no business/API/domain behavior was silently changed.

---

## 38. Implementation Principle

Predict Screen V2 is a presentation redesign of existing approved Goalstery behavior.

The implementation should prefer:

```text
clear hierarchy
compact density
semantic styling
existing application state
existing architecture
few moving parts
```

over:

```text
new abstractions
new dependencies
duplicated business rules
hardcoded quota assumptions
decorative complexity
```

When implementation and approved visual reference differ, correct the presentation rather than changing product semantics.

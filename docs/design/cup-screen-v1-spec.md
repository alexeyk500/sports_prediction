# Goalstery — Cup Screen V1 Visual Specification

Status: Approved  
Scope: Cup screen presentation  
Primary target: Mobile Telegram Mini App  
Primary reference viewport: 390 × 844

Approved visual reference:

```text
docs/design/cup-screen-v1-reference.png
```

---

## 1. Purpose

This document defines the approved visual and presentation contract for the Goalstery Cup screen.

It covers:

- Current Cup presentation;
- user's current Cup position;
- prize pool presentation;
- Cup countdown;
- participant count;
- live leaderboard presentation;
- top-3 visual treatment;
- pinned user row;
- Cup History presentation;
- completed Cup summary cards;
- final standings entry point.

It does not redefine:

- Cup boundaries;
- scoring;
- participant eligibility;
- ranking rules;
- prize distribution by place;
- Telegram identity/authentication;
- payout mechanics;
- prediction business rules;
- Global Rating.

Those remain owned by their authoritative project specifications and accepted decisions.

---

## 2. Visual Authority

For the Cup screen, visual precedence is:

```text
docs/design/cup-screen-v1-reference.png
→ docs/design/cup-screen-v1-spec.md
→ docs/design/DESIGN_SYSTEM.md
→ existing implementation
```

Existing implementation is not visual authority when it conflicts with the approved reference/spec.

Accepted product decisions remain authoritative over visual presentation.

If reproducing this reference appears to require a product/domain/API change, stop and request approval rather than changing behavior silently.

---

## 3. Design Direction

The Cup screen should feel:

- competitive;
- emotional;
- premium;
- football-oriented;
- energetic;
- trustworthy;
- compact;
- easy to scan.

It may use stronger trophy/reward emphasis than Predict.

It must still remain within the Goalstery visual system.

Avoid:

- casino aesthetics;
- betting-terminal styling;
- neon;
- excessive glow;
- exaggerated crypto styling;
- cluttered statistics dashboards.

The Cup screen should communicate:

```text
the Cup is live
→ there is something meaningful to compete for
→ show me where I stand
→ show me who is ahead
→ let me inspect past Cups
```

---

## 4. Screen Modes

Cup has two primary modes:

```text
Current Cup
History
```

`Current Cup` is the default mode.

Use a compact segmented control near the top of the screen.

The screen title remains:

```text
Cup
```

Approved supporting copy:

```text
Compete. Climb. Win together.
```

All copy must use the existing localization system.

---

## 5. Current Cup Hierarchy

The approved Current Cup hierarchy is:

```text
Cup header
↓
Current Cup / History segmented control
↓
Weekly Cup hero
↓
participant/context strip
↓
Your Position card
↓
Leaderboard
↓
pinned user row when needed
↓
fixed bottom navigation
```

The screen should remain compact enough to expose meaningful leaderboard content without excessive scrolling.

---

## 6. Weekly Cup Hero

The hero is the strongest visual element on the Current Cup screen.

It should include:

```text
Weekly Cup
date range
countdown
countdown end-date metadata
Prize pool
prize amount
```

Approved reference example:

```text
Weekly Cup
Sep 8 – Sep 14, 2026

2d 14h 27m
Ends Sep 14 · 23:59

Prize pool
10 TON
```

Dynamic values must come from authoritative application data.

Do not hardcode the reference dates or countdown.

---

## 7. Countdown

Countdown is the primary time indicator.

It should visually dominate the exact end date.

Preferred hierarchy:

```text
2d 14h 27m
Ends Sep 14 · 23:59
```

The exact Cup boundary remains owned by Product/Decision docs.

Do not introduce a new Cup boundary in frontend code.

Use existing authoritative time/date utilities.

---

## 8. Prize Pool

Prize Pool is a prominent element of the Cup hero.

Approved presentation:

```text
Prize pool
10 TON
```

The screen may show the total prize pool.

Do not show prize amounts by rank unless exact Prize Distribution is separately approved.

Prize Distribution remains outside this visual specification.

Do not imply:

- user stakes;
- entry fee;
- purchase requirement;
- wagering;
- random lottery.

---

## 9. Cup Hero Visual Treatment

The hero may use stronger visual storytelling than Predict:

- trophy;
- football motif;
- subtle teal/navy gradient or layered surface;
- restrained gold reward accents.

The visual should feel premium and competitive.

Avoid:

- photorealistic clutter;
- casino chips;
- excessive coins;
- neon glows;
- large crypto logos;
- gambling-table motifs.

Decorative visual assets must not overpower readable information.

---

## 10. Participant Context Strip

Below the hero, show compact Cup context.

Approved content:

```text
participant count
short motivational/context copy
```

Reference example:

```text
1,284 participants
Make your picks to climb the leaderboard!
```

Participant count must come from application data.

Supporting copy is secondary and localized.

The row should not become another large card.

---

## 11. Your Position Card

When the user participates in the current Cup, show a compact personal summary card.

Approved structure:

```text
YOUR POSITION

avatar

#24
Rank

186
Points

14 predictions
9 correct
5 wrong
```

Do not show accuracy percentage in V1.

The card should be visually important but smaller than the Weekly Cup hero.

The most important values are:

```text
Rank
Points
```

Prediction/correct/wrong counts are supporting statistics.

---

## 12. User Not Yet Participating

If the user has not made any prediction in the current Cup, replace the position metrics with a clear participation state.

Approved concept:

```text
You're not in this Cup yet

Make your first prediction
to enter automatically.

[ Make a prediction ]
```

The CTA navigates to Predict.

Do not add Cup registration.

The user joins according to existing product behavior.

---

## 13. User Avatar

If an avatar is available, show it in the personal position card and leaderboard.

If no avatar exists, use an approved neutral fallback.

Do not use fake/near-copy portraits.

Avatar treatment should remain compact and secondary to ranking information.

---

## 14. Telegram Player Link

Player identity may be interactive when the application has a valid Telegram profile/chat target.

Clicking/tapping the player identity should use the standard supported Telegram navigation/deep-link behavior.

If no valid Telegram profile/chat target exists, the row/name must remain non-interactive.

Do not invent usernames or links.

Do not make the entire leaderboard row appear clickable unless it actually is.

---

## 15. Leaderboard

The leaderboard is the main competitive content area.

Approved columns:

```text
#
Player
Correct / Wrong
Points
```

Example:

```text
1   Alex      18 / 3     342
2   Max       17 / 4     318
3   Anna      16 / 5     301
4   Dmitry    15 / 6     287
```

Ranking is determined by existing authoritative Cup ranking rules.

Correct/Wrong is supporting information only unless product rules say otherwise.

Do not change ranking logic in order to match the reference.

---

## 16. Leaderboard Density

The leaderboard should be compact and highly scannable.

Avoid large cards per player.

Prefer:

- one row per player;
- subtle separators;
- compact avatars;
- aligned statistics;
- clear rank;
- strong Points value.

Do not make the leaderboard feel like an admin table.

It should feel like a mobile competition ranking.

---

## 17. Top 3 Treatment

Top three places should receive distinct but restrained premium treatment.

Approved hierarchy:

```text
#1 → gold
#2 → silver
#3 → bronze
```

Use:

- medal/rank accent;
- subtle row tint/accent;
- optional avatar ring/accent.

Do not use:

- oversized podium graphics;
- neon;
- heavy shadows;
- animated celebration in the default list.

The top 3 should stand out immediately while remaining part of the same leaderboard.

---

## 18. Pinned User Row

If the current user is not visible in the currently rendered top leaderboard region, show a pinned user row near the bottom of the leaderboard area.

Approved concept:

```text
24   You      9 / 5      186
```

This row should:

- remain visually distinct;
- use a restrained teal accent;
- show the user's actual rank;
- show actual correct/wrong values;
- show Points;
- not distort ranking semantics.

If the user's normal leaderboard row is already visible, do not duplicate it unnecessarily.

---

## 19. Current User Naming

Within the user's own row, `You` may be used as localized presentation text.

Do not replace another player's real display name with `You`.

The personal position card remains the primary personal summary.

---

## 20. History Mode

History is the second Cup mode.

Approved hierarchy:

```text
Cup header
↓
Current Cup / History segmented control
↓
Past Cups heading
↓
completed Cup list
↓
fixed bottom navigation
```

Do not mix live leaderboard and history into one long feed.

---

## 21. Cup History List

Each completed Cup should be shown as a compact summary card/row.

Approved content:

```text
date range
Cup number/name
participant count
user result
user Points when participated
chevron/navigation affordance
```

Example:

```text
Sep 1 – Sep 7, 2026
Weekly Cup #18
1,284 participants

Your result
#24
186 pts
```

If the user did not participate:

```text
Your result
Didn't participate
```

Do not show fake result data.

---

## 22. History Ordering

Completed Cups should be shown newest first.

History must scale to many Cups.

Do not create one permanent horizontal tab for every Cup.

Use the Current Cup / History mode switch and a vertically scrollable history list.

---

## 23. History Cup Navigation

Tapping a completed Cup opens its final standings/detail view.

Conceptual destination:

```text
Cup #18
FINAL

Your result
#24
186 Points
14 correct · 5 wrong

Final Standings
...
```

The final-detail screen may be implemented separately if not already in scope.

The History list itself must clearly communicate that a completed Cup can be opened.

Do not invent backend/API support if it does not yet exist.

---

## 24. Final Standings Semantics

A completed Cup is final.

Use wording such as:

```text
Final Standings
Final
```

Do not show a live countdown for completed Cups.

Do not reuse Current Cup live-state copy in History detail.

---

## 25. Segmented Control

Use the same general interaction language as Predict V2.

Segments:

```text
Current Cup
History
```

Target:

- compact;
- balanced;
- clear active state;
- Goalstery teal accent;
- no giant standalone buttons;
- no glow;
- no double outline.

The active mode must be obvious.

---

## 26. Bottom Navigation

Bottom navigation remains:

```text
Predict
Cup
Rating
Profile
```

Cup is active on this screen.

Use the same approved bottom-navigation system as Predict V2.

Do not redesign the global navigation specifically for Cup.

Cup active state:

- teal active icon/text;
- restrained mint/teal background;
- no thick double border;
- no oversized circular icon treatment.

---

## 27. Light Theme

Light theme should use:

- light neutral page background;
- white/light surfaces;
- restrained borders;
- subtle shadows;
- dark navy text;
- teal accent;
- gold/silver/bronze only where semantically justified.

The hero may carry more visual weight than other cards.

Leaderboard rows should remain clean and readable.

---

## 28. Dark Theme

Dark theme should use:

- deep navy page background;
- layered navy surfaces;
- restrained borders;
- teal active state;
- gold/silver/bronze rank accents;
- high-contrast Points values;
- muted secondary metadata.

Avoid:

- pure black as the main visual solution;
- bright gray outlines;
- neon;
- excessive glow;
- saturated blue panels.

---

## 29. Typography Hierarchy

Approximate hierarchy:

```text
Cup
→ screen title

Weekly Cup
→ hero title

countdown / Prize Pool amount
→ primary hero metrics

Rank / Points
→ primary personal metrics

Leaderboard Points
→ strong row value

player name
→ primary row identity

Correct / Wrong
→ secondary competitive statistic

dates / participant count / labels
→ supporting metadata
```

Do not make all metrics equally strong.

---

## 30. Statistics

V1 uses:

```text
Predictions
Correct
Wrong
```

Do not add:

- accuracy percentage;
- streak;
- expected score;
- Global Rating delta;
- probability;
- league tier;
- badges/achievements;

unless separately approved.

The Cup screen should remain focused on Cup competition.

---

## 31. Responsive Behavior

Primary target:

```text
390 × 844
```

Also verify:

```text
360px
430px
```

Requirements:

- no horizontal overflow;
- hero remains readable;
- countdown and Prize Pool do not collide;
- personal card remains compact;
- leaderboard columns remain legible;
- player names truncate gracefully if needed;
- pinned user row fits;
- history cards remain readable;
- bottom nav remains balanced.

---

## 32. Localization

All user-facing copy must use the existing localization system.

At minimum support existing locales:

```text
en
ru
de
es
ar
```

Particular attention:

- Cup;
- subtitle;
- Current Cup;
- History;
- Weekly Cup;
- Ends;
- Prize pool;
- participants;
- Your Position;
- Rank;
- Points;
- predictions;
- correct;
- wrong;
- Leaderboard;
- Past Cups;
- Your result;
- Didn't participate;
- Make a prediction;
- not-yet-participating copy.

Do not hardcode English strings in presentation components.

---

## 33. RTL

Arabic/RTL is a first-class state.

Verify:

- Cup hero;
- segmented control;
- personal metrics;
- leaderboard alignment;
- history list;
- bottom navigation.

Do not alter ranking semantics.

Numeric values, Cup ranks, Points, correct/wrong values must remain logically correct.

---

## 34. Accessibility

Use appropriate semantics for:

- tabs/segmented control;
- player links;
- history navigation;
- CTA;
- bottom navigation.

Requirements:

- accessible names;
- visible keyboard focus where relevant;
- sufficient contrast;
- top-3 distinction not communicated only by color;
- player links only interactive when actionable;
- touch targets appropriate for mobile.

---

## 35. Loading State

Loading should preserve layout hierarchy and minimize shift.

Skeletons/placeholders may be used for:

- Cup hero;
- personal position;
- leaderboard;
- history list.

Avoid a visually unrelated full-screen spinner unless already required by the application shell.

---

## 36. Empty / Edge States

Support at least:

```text
user not participating yet
no leaderboard entries
no Cup history yet
player without avatar
player without Telegram link
user rank outside visible leaderboard
```

Presentation should remain compact and consistent with the reference.

Do not invent product behavior to fill missing data.

---

## 37. State Ownership

Continue to follow:

```text
docs/FRONTEND_ARCHITECTURE.md
```

Presentation components must not fetch data directly.

Use the approved frontend flow:

```text
HTTP
→ typed API client
→ orchestration/state
→ presentation model
→ presentation components
```

Do not introduce a new state framework for Cup V1.

---

## 38. No New Product Behavior

Implementing Cup Screen V1 must not silently change:

- Cup start/end rules;
- Cup auto-entry behavior;
- prediction quota;
- scoring;
- leaderboard ranking;
- Points;
- participant eligibility;
- Prize Distribution;
- PrizeClaim/payout;
- Global Rating;
- Telegram authentication.

If a required data field/API does not exist, report the gap.

Do not invent backend data or silently change API contracts.

---

## 39. No New Dependencies

Do not add:

- UI library;
- icon library;
- CSS-in-JS;
- Tailwind/styling framework;
- form framework;
- animation framework;
- server-state/cache framework;

for this design.

Use the existing approved frontend stack.

---

## 40. Visual Verification

Implementation is not visually complete after:

```text
lint
typecheck
tests
build
```

Actual browser verification is required.

Render at minimum:

```text
390 × 844 — Current Cup Light
390 × 844 — Current Cup Dark
390 × 844 — History Light
360px sanity
430px sanity
Arabic/RTL sanity
```

Compare directly against:

```text
docs/design/cup-screen-v1-reference.png
```

Perform:

```text
render
→ screenshot
→ side-by-side comparison
→ correction
```

before claiming completion.

---

## 41. Visual Acceptance Checklist

Verify:

```text
Cup title hierarchy
subtitle
Current Cup / History segmented control
Weekly Cup hero
countdown hierarchy
end date metadata
Prize Pool amount
participant count
Your Position card
Rank / Points hierarchy
Predictions / Correct / Wrong
Top-3 visual distinction
leaderboard density
player avatars
player Telegram interaction
Points alignment
pinned user row
History list
history result summary
Didn't participate state
bottom navigation
safe area
Light theme
Dark theme
360 / 390 / 430
RTL
```

---

## 42. Acceptance Criteria

Cup Screen V1 is accepted when:

- Current Cup opens by default;
- Current Cup and History are clearly separated;
- countdown is the primary time signal;
- exact end date is secondary;
- Prize Pool is visible and prominent;
- user position is easy to understand;
- personal stats remain compact;
- leaderboard clearly shows rank, player, correct/wrong, and Points;
- top three are visually distinct with gold/silver/bronze treatment;
- player's Telegram identity is interactive only when valid;
- the user's row remains visible via pinned treatment when outside the visible top region;
- History scales vertically to many Cups;
- history rows show user's result or non-participation;
- visual design remains consistent with Goalstery Predict V2;
- Light/Dark themes both work;
- RTL works;
- no business/API/domain behavior was silently changed.

---

## 43. Implementation Principle

Prefer:

```text
clear competition hierarchy
compact density
high-value statistics
semantic accents
existing application state
existing architecture
few moving parts
```

over:

```text
dashboard complexity
new product rules
unapproved metrics
decorative overload
new dependencies
duplicated domain logic
```

The Cup screen should feel more emotional than Predict, but still unmistakably part of the same Goalstery product.

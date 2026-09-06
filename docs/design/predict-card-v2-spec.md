# Predict Match Card V2 — Visual Specification

## Status

Approved design.

This document and:

`docs/design/predict-card-v2-reference.png`

are the only authoritative visual sources of truth for the current MatchCard design.

Older MatchCard references must not be used when implementing this version.

The PNG defines the visual composition.

This document defines geometry, typography, colors, responsive behavior, and component states.

---

# 1. Scope

This specification applies only to the football match prediction card.

It does not redefine:

- Predict page header
- quota panel
- Available / My Picks tabs
- bottom navigation
- backend behavior
- prediction rules
- scoring
- API contracts
- asset identity
- football data ingestion

MatchCard business behavior must remain unchanged.

---

# 2. Primary Target

Primary mobile viewport:

`390px`

Additional validation widths:

- `360px`
- `430px`

The card must not use a fixed width.

```css
width: 100%;
min-width: 0;
```

No horizontal overflow is allowed.

---

# 3. Design Principles

The MatchCard should feel:

- compact
- premium
- calm
- modern
- information-dense without looking cramped
- clearly readable in light and dark themes

Visual hierarchy:

1. Team names / matchup
2. Prediction outcomes
3. Competition / kickoff
4. Locked or secondary state information

Do not preserve legacy MatchCard geometry if it conflicts with this specification or the approved reference.

---

# 4. Card Container

Recommended implementation:

```css
.matchCard {
  width: 100%;
  min-width: 0;

  padding: 18px 20px 20px;

  border: 1px solid var(--match-card-border);
  border-radius: 24px;

  background: var(--match-card-bg);

  box-shadow:
    0 10px 30px rgb(15 23 42 / 0.08);
}
```

Do not set a large fixed `height` or `min-height`.

Card height must be content-driven.

The card should be significantly more compact than the previous inline-logo MatchCard design.

---

# 5. Header

Visual structure:

```text
[competition badge] Competition Name              Kickoff
```

Implementation:

```css
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 12px;

  min-width: 0;
}
```

Competition group:

```css
.competition {
  display: flex;
  align-items: center;

  gap: 10px;

  min-width: 0;
}
```

Competition badge:

```css
.competitionBadge {
  width: 36px;
  height: 36px;

  flex: 0 0 36px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: var(--logo-badge-bg);

  box-shadow:
    0 4px 14px rgb(15 23 42 / 0.08);
}
```

Competition logo:

```css
.competitionLogo {
  width: 28px;
  height: 28px;

  object-fit: contain;
}
```

Competition name:

```css
.competitionName {
  min-width: 0;

  font-size: 14px;
  line-height: 1.2;
  font-weight: 600;

  color: var(--match-meta);
}
```

Kickoff:

```css
.kickoff {
  flex: 0 0 auto;

  font-size: 14px;
  line-height: 1.2;
  font-weight: 600;

  text-align: end;

  color: var(--match-meta);
}
```

Competition and kickoff text are secondary information.

They must not compete visually with the team names.

---

# 6. Matchup Layout

This is the required V2 layout.

Do NOT use:

```text
[logo] Team Name     VS     Team Name [logo]
```

Use:

```text
       [home logo]                 [away logo]

       Home Team        VS         Away Team
```

Recommended grid:

```css
.matchup {
  display: grid;

  grid-template-columns:
    minmax(0, 1fr)
    32px
    minmax(0, 1fr);

  align-items: end;

  column-gap: 8px;

  margin-top: 20px;
}
```

Each team:

```css
.team {
  min-width: 0;

  display: flex;
  flex-direction: column;
  align-items: center;

  text-align: center;
}
```

This layout exists specifically to provide enough horizontal space for long football club names.

---

# 7. Team Logo Badge

Team badge outer size:

`52 × 52px`

Team logo maximum size:

`44 × 44px`

```css
.teamBadge {
  width: 52px;
  height: 52px;

  flex: 0 0 52px;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: var(--logo-badge-bg);

  box-shadow:
    0 5px 16px rgb(15 23 42 / 0.10);
}
```

Logo:

```css
.teamLogo {
  width: 44px;
  height: 44px;

  max-width: 44px;
  max-height: 44px;

  object-fit: contain;
}
```

Do not recolor club logos.

Do not modify downloaded WebP files.

Do not apply neon glow.

The badge exists to guarantee contrast for logos with:

- dark elements
- black elements
- transparency
- uneven visual bounds

---

# 8. Team Logo Badge — Light Theme

Light theme badge:

```css
--logo-badge-bg: #ffffff;
```

The badge may visually blend gently with the white card, but its soft shadow should still separate the logo from the card.

Do not add a strong gray border.

---

# 9. Team Logo Badge — Dark Theme

Dark theme must protect dark club crests from blending into the card.

Use a lifted light-neutral badge surface.

Recommended:

```css
--logo-badge-bg: #eef2f6;
```

The club logo itself remains unchanged.

The badge must not become dark just because the application theme is dark.

This is intentional.

Examples that must remain clearly visible:

- black monochrome marks
- dark navy crests
- dark portions of multicolor crests
- transparent logos with dark elements

---

# 10. Team Names

Team names appear under their logos.

```css
.teamName {
  min-width: 0;

  margin-top: 8px;

  font-size: 16px;
  line-height: 1.15;
  font-weight: 700;

  text-align: center;

  color: var(--match-primary);
}
```

Important:

Do NOT force team names into one line.

Do NOT use aggressive single-line ellipsis.

Allow up to two lines.

Recommended:

```css
.teamName {
  display: -webkit-box;

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  overflow: hidden;
}
```

The following names should remain usable:

- Manchester United
- Paris Saint-Germain
- Atlético de Madrid
- Borussia Mönchengladbach

Long names may use two lines.

Do not solve long names by globally reducing font size.

Both team blocks should reserve compatible name space so that a two-line name on one side does not destroy the visual alignment of the matchup.

---

# 11. VS

Recommended:

```css
.vs {
  align-self: end;

  padding-bottom: 2px;

  font-size: 16px;
  line-height: 1;
  font-weight: 600;

  text-align: center;

  color: var(--match-meta);
}
```

`VS` must sit visually between the team names, not between the logos.

This is important to match the approved reference.

---

# 12. Matchup Vertical Rhythm

Approximate target:

```text
Header
↓ 20px
Team logos
↓ 8px
Team names + VS
↓ 18px
Outcome controls
```

Avoid excessive whitespace.

Do not add independent large margins to every child element.

---

# 13. Outcome Controls

Layout:

```css
.outcomes {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 9px;

  margin-top: 18px;
}
```

Every outcome has exactly the same width.

Buttons must fill the available content width.

---

# 14. Outcome Button Geometry

```css
.outcome {
  min-width: 0;
  height: 80px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  border: 1.5px solid var(--outcome-border);
  border-radius: 17px;

  background: var(--outcome-bg);

  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 120ms ease;
}
```

The controls must look horizontal and compact.

They must NOT look like tall vertical tiles.

---

# 15. Outcome Label

`1`, `X`, `2`

```css
.outcomeLabel {
  font-size: 27px;
  line-height: 1;
  font-weight: 700;

  color: var(--match-primary);
}
```

Do not make these labels significantly larger than `28px` at the primary mobile viewport.

---

# 16. Trophy / Points Row

Visual structure:

```text
🏆 14
```

Recommended:

```css
.outcomePoints {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 7px;

  margin-top: 9px;

  font-size: 18px;
  line-height: 1;
  font-weight: 700;

  color: var(--match-primary);
}
```

Trophy:

```css
.trophy {
  width: 17px;
  height: 17px;

  flex: 0 0 auto;

  color: var(--trophy);
}
```

Trophy color is always gold.

Do NOT use selected-state green for the trophy.

The trophy represents potential reward, not selection state.

---

# 17. Selected Outcome

Selected outcome should be obvious but restrained.

```css
.outcomeSelected {
  border-color: var(--selected-border);
  background: var(--selected-bg);
}
```

Selected label:

```css
.outcomeSelected .outcomeLabel {
  color: var(--selected-text);
}
```

Requirements:

- one border only
- no double outline
- no inset second border
- no heavy glow
- trophy remains gold
- points remain high contrast

Do not display visible text such as:

- Selected Home
- Selected Draw
- Selected Away

Selection is already communicated by the selected button.

Accessibility text may remain visually hidden.

---

# 18. Locked State

Locked predictions remain visible.

The controls must remain readable.

Below the outcome row:

```text
🔒 Locked after kickoff
```

Recommended:

```css
.lockedStatus {
  display: flex;
  align-items: center;

  gap: 8px;

  margin-top: 13px;

  font-size: 14px;
  line-height: 1.2;
  font-weight: 600;

  color: var(--match-meta);
}
```

Lock icon:

```css
.lockIcon {
  width: 15px;
  height: 15px;

  flex: 0 0 auto;
}
```

Locked state is secondary information and must not create a large empty footer area.

---

# 19. Light Theme Tokens

Recommended baseline:

```css
:root {
  --match-card-bg: #ffffff;
  --match-card-border: #dbe3ee;

  --match-primary: #0f172a;
  --match-meta: #64748b;

  --outcome-bg: #f8fafc;
  --outcome-border: #d7e0ea;

  --selected-bg: #e9f8f3;
  --selected-border: #16856f;
  --selected-text: #116b5b;

  --trophy: #f6b817;

  --logo-badge-bg: #ffffff;
}
```

If equivalent semantic project tokens already exist, prefer mapping to them rather than duplicating values.

The visual result must remain consistent with these values.

---

# 20. Dark Theme Tokens

Recommended baseline:

```css
[data-theme='dark'] {
  --match-card-bg: #172233;
  --match-card-border: #334155;

  --match-primary: #f8fafc;
  --match-meta: #a8b6ca;

  --outcome-bg: #1e2b3d;
  --outcome-border: #41516a;

  --selected-bg: #143f39;
  --selected-border: #63e6c2;
  --selected-text: #d9fff3;

  --trophy: #f6b817;

  --logo-badge-bg: #eef2f6;
}
```

Do not use pure black for the page or card surfaces.

Dark theme should feel navy/slate, not black.

---

# 21. Image Failure Fallback

Existing fallback behavior must remain.

If a team image fails:

- do not display a broken-image icon
- retain existing team fallback

If a competition image fails:

- retain existing competition fallback

The fallback must fit inside the same badge geometry.

---

# 22. Responsive Behavior — 360px

At `360px`:

- keep 3 equal outcome columns
- preserve approximately `9px` gap unless overflow requires a very small reduction
- team names may wrap to 2 lines
- no horizontal overflow
- logos remain visually balanced
- do not aggressively shrink logos

Do not switch back to inline-logo/name layout.

---

# 23. Responsive Behavior — 430px

At `430px`:

Do not scale the card elements dramatically.

Keep approximately the same:

- logo sizes
- font sizes
- outcome heights
- badge sizes

Allow the extra width to become breathing room.

The design must not look stretched.

---

# 24. RTL

Existing RTL support must remain functional.

Do not derive domain mapping from CSS direction.

Domain semantics remain:

```text
HOME
DRAW
AWAY
```

UI labels remain:

```text
1
X
2
```

Do not mutate prediction values because of RTL layout.

---

# 25. Accessibility

Interactive outcome buttons must retain:

- semantic button behavior
- accessible name
- disabled state
- focus state

Do not remove accessibility semantics for visual fidelity.

Visible selected-state text is unnecessary, but screen-reader state may be preserved.

---

# 26. Implementation Scope

Preferred files:

```text
src/components/predict/MatchCard.tsx
src/components/predict/match-card-presentation.ts
relevant MatchCard CSS Module
```

A shared visual badge component may be updated if required.

Do not use this task to refactor:

- PredictScreen
- page header
- navigation
- Zustand
- API client
- backend
- DB
- prediction workflow

---

# 27. Pixel-Close Acceptance Process

Implementation is not accepted only because the CSS values compile.

Required process:

1. Run the application.
2. Open Predict at viewport `390 × 844`.
3. Render representative cards.
4. Capture a screenshot.
5. Compare side-by-side with:

   `docs/design/predict-card-v2-reference.png`

6. Adjust obvious differences.
7. Repeat until the current UI visually resembles the reference.

Pay special attention to:

- card radius
- card height
- card padding
- header positioning
- logo badge size
- team-name vertical position
- VS baseline
- long-name wrapping
- outcomes width/height
- selected background
- dark-theme contrast
- vertical rhythm

The approved reference has priority over legacy MatchCard geometry.

---

# 28. Required Visual Test Cases

At minimum verify:

## Light theme

- Manchester United vs Paris Saint-Germain
- a selected prediction
- a locked prediction

## Dark theme

- dark/black logo elements
- colorful club logo
- selected prediction
- locked prediction

Long names must not be aggressively ellipsized.

---

# 29. Validation

After implementation run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Also run existing browser/frontend sanity checks if available.

Do not create brittle pixel-value unit tests for CSS.

---

# 30. Final Design Contract

Football asset identity:

```text
Team.slug
→ /assets/teams/<slug>.webp

Competition.slug
→ /assets/competitions/<slug>.webp
```

Presentation:

```text
competition header
       ↓
team logo       team logo
team name  VS   team name
       ↓
1          X          2
🏆 value   🏆 value   🏆 value
       ↓
optional locked status
```

`docs/design/predict-card-v2-reference.png` defines the intended appearance.

`docs/design/predict-card-v2-spec.md` defines the implementation constraints.

Together they are the authoritative MatchCard V2 design.

Older MatchCard design references are non-authoritative and must not be used to override this design.
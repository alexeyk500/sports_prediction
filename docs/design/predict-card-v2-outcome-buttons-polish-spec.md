# Goalstery — MatchCard V2 Outcome Buttons Polish

Status: Approved  
Scope: MatchCard V2 outcome-button visual polish only  
Reference: `docs/design/predict-card-v2-outcome-buttons-polish-reference.png`

## 1. Purpose

This is a narrow visual correction to the already approved MatchCard V2.

The current 1 / X / 2 outcome labels are visually too dominant, while the trophy icon and Points value are too small. The approved correction rebalances hierarchy inside each outcome button without changing MatchCard behavior or overall design.

## 2. Authority

For this specific correction:

```text
docs/design/predict-card-v2-outcome-buttons-polish-reference.png
→ docs/design/predict-card-v2-outcome-buttons-polish-spec.md
→ docs/design/predict-card-v2-reference.png
→ docs/design/predict-card-v2-spec.md
→ docs/design/DESIGN_SYSTEM.md
→ existing implementation
```

This override applies only to the internal typography/icon hierarchy of the 1 / X / 2 outcome buttons.

All other MatchCard V2 rules remain unchanged.

## 3. Approved visual change

Inside each outcome button:

- reduce the visual dominance of `1`, `X`, `2`;
- increase the trophy icon size;
- increase the Points number size and weight;
- keep the outcome label as the primary action identifier, but make the trophy + Points row substantially easier to scan;
- preserve centered alignment and balanced vertical rhythm;
- preserve the selected/unselected button treatment.

The intended hierarchy is approximately:

```text
1 / X / 2
   ↓
🏆 36
```

with a much smaller size gap between the outcome label and the Points row than before.

## 4. Geometry

Do not make the outcome buttons taller.

Prefer keeping the currently approved compact button/card geometry. If necessary, reduce internal vertical gaps slightly so the larger Points row fits without increasing MatchCard height.

Do not change:

- three-column layout;
- button widths;
- inter-button gap unless required by a tiny optical correction;
- button radius;
- border model;
- MatchCard width;
- MatchCard overall vertical rhythm.

## 5. Typography and icon sizing

Use the approved reference as the visual target rather than treating these as immutable pixel values.

Target direction:

- `1 / X / 2`: approximately 22–24px, bold;
- trophy icon: approximately 19–21px;
- Points number: approximately 19–21px, bold/strong;
- gap between trophy and Points value: compact but clearly separated;
- vertical gap between outcome label and Points row: compact.

The final values should be chosen by browser comparison against the reference.

Avoid restoring the previous hierarchy where the outcome label is oversized and the Points row looks like minor metadata.

## 6. Trophy / Points semantics

Preserve the existing Goalstery convention:

```text
trophy SVG + numeric Points value
```

Do not add the visible text `pts` or `points` inside the outcome button.

Preserve the existing semantic gold treatment for the trophy.

The numeric Points value remains normal foreground text appropriate to the theme/selected state.

## 7. Selected state

Do not redesign the selected state.

Preserve:

- approved pale mint/teal or dark teal selected surface;
- single green/teal border;
- readable outcome label;
- readable trophy;
- readable Points number;
- no glow;
- no double border.

The larger Points row must work equally well in selected and unselected buttons.

## 8. Light and dark themes

Apply the same hierarchy correction in both themes.

Verify that:

- the larger trophy remains visually clean on light and dark surfaces;
- Points values have sufficient contrast;
- the selected state does not reduce readability;
- the outcome label no longer overwhelms the button.

## 9. Responsive behavior

Verify at least:

```text
360px
390px
430px
```

The larger trophy + Points row must not overflow, wrap, collide, or distort the three-column layout.

## 10. No behavior changes

Do not change:

- HOME → 1;
- DRAW → X;
- AWAY → 2;
- prediction creation/editing;
- locking;
- scoring;
- Points calculation;
- selected outcome state logic;
- API/domain models;
- RTL outcome semantics;
- accessibility semantics.

## 11. No unrelated visual changes

Do not modify during this task:

- competition header;
- team logos/badges;
- team names;
- VS;
- locked row;
- MatchCard surface;
- logo badge treatment;
- Predict screen quota;
- segmented control;
- bottom navigation;
- feed spacing.

## 12. Acceptance criteria

The correction is accepted when:

- `1 / X / 2` are visibly smaller and less dominant than before;
- trophy icons are visibly larger;
- Points numbers are visibly larger and stronger;
- the Points row becomes an important, immediately scannable part of each choice;
- buttons remain compact;
- MatchCard height does not grow materially;
- selected and unselected states remain consistent with MatchCard V2;
- light and dark themes both look balanced;
- 360/390/430 widths have no overflow;
- no product/domain/API behavior changes occur.

Browser screenshot comparison against the approved polish reference is required.

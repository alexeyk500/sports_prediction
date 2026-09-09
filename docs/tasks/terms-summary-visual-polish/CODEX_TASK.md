# Codex Task — Terms Summary Visual Polish

## Goal

Fine-tune the two summary sections on `/terms` so they visually match the approved design much more closely:

1. `Before you play`
2. `Cups`

The current implementation is structurally close, but the visual tuning is still noticeably off — especially the `Cups` section.

This task is **visual refinement only**. Do not redesign the rest of the Terms page.

## Task folder

Place this task at:

`docs/tasks/terms-summary-visual-polish/`

## Required files

Use these files from the task folder:

- `current-state.png` — current implementation that still needs refinement.
- `target-design.png` — approved visual target and primary source of truth.
- `icons/age-18.svg`
- `icons/free-participation.svg`
- `icons/no-wagering.svg`
- `icons/cups-no-monetary-value.svg`
- `icons/regional-restrictions.svg`
- `icons/trophy.svg`
- `icons/check.svg`
- `icons/x.svg`

## Priority

When deciding between the current CSS and the reference, follow this order:

1. `target-design.png`
2. attached SVG geometry
3. existing Goalstery semantic tokens/design system
4. current implementation

Do not preserve current spacing, colors, or proportions merely because they already exist.

---

# 1. Before you play — visual tuning

The current structure is now broadly correct: one shared card, five facts in a row, compact icons.

However, it still needs tuning to match `target-design.png`.

## 1.1 Container

Target characteristics:

- neutral dark surface, not teal;
- subtle cool-gray border;
- restrained radius matching the rest of the public legal UI;
- no strong accent border;
- slightly more generous internal vertical breathing room than current;
- title/subtitle and fact row should feel like one editorial card, not a dashboard widget.

Do not increase the overall height unnecessarily.

## 1.2 Title and subtitle

Match the reference hierarchy:

- `Before you play` should remain strong and prominent;
- subtitle must be clearly secondary;
- avoid excessive title/subtitle gap;
- maintain the same left alignment as the contents card and document body.

Use the existing public-page typography scale; tune spacing rather than inventing a new font system.

## 1.3 Five-fact row

The current row is too visually compressed and slightly too bold.

Tune it so that:

- five columns are evenly distributed across the inner width;
- every icon is optically centered above its label;
- icon-to-label spacing is consistent;
- labels use regular/medium weight rather than heavy bold;
- labels have slightly looser line-height than current;
- each item gets enough width for natural wrapping;
- vertical baselines feel balanced across all five entries.

The target should read as five small informational facts, not five badges.

## 1.4 Icon sizing

Current icons are slightly undersized relative to the approved target.

Aim for an optical size around the target reference, approximately:

- 32–36 px visual footprint for most icons;
- consistent stroke width;
- no single icon should dominate.

The `18+` circle, gift, prohibition sign, trophy, and globe should look optically equal in weight.

Use the provided SVG geometry exactly.

## 1.5 Semantic colors

Match the approved visual meaning:

- `18+` → green/turquoise positive accent
- `Free participation` → green/turquoise positive accent
- `No wagering` → coral/red
- `Cups have no monetary value` → amber/orange
- `Prize Cups may have regional restrictions` → blue

Use project tokens where available.

Avoid muted colors that make the icons disappear in dark theme.

## 1.6 Responsive behavior

At the target mobile width, keep all five facts in one row exactly as shown in `target-design.png`.

Only allow wrapping/grid fallback on meaningfully narrower widths where the five-column composition becomes unreadable.

Do not revert to card-per-item UI.

---

# 2. Cups — major visual correction

This section is the main problem.

The current implementation is too cyan/teal, too flat, and too close to a generic info card. It does not match the approved `target-design.png`.

## 2.1 Overall card appearance

The target `Cups` section is a warm, prize-oriented highlight card.

Dark-theme target:

- very dark warm brown/olive surface;
- subtle amber/orange tint;
- amber/orange border;
- no cyan/teal border;
- no bright teal fill;
- card remains dark and premium, not loud.

The current cyan/teal card background must be removed.

Use semantic theme tokens if suitable ones exist. If no suitable semantic surface exists, add narrowly scoped semantic tokens for this public legal/prize summary rather than scattering hardcoded colors through the component.

The target should feel like a restrained amber-highlighted legal summary.

## 2.2 Card geometry

Match target proportions:

- slightly tighter vertical height than current;
- compact top padding;
- compact bottom padding;
- horizontal content should use the available width efficiently;
- border radius consistent with `Before you play`;
- one-pixel/subtle border, not heavy outline.

Do not make the card taller than necessary.

## 2.3 Header layout

The target has a compact horizontal header:

- amber trophy icon on the left;
- to its right:
  - `Cups`
  - `Goalstery scoring points`

Current implementation has too much empty space and a weaker relationship between icon and text.

Tune to:

- trophy approximately 28–32 px;
- title visually aligned with trophy;
- subtitle directly under title;
- compact icon-to-text gap;
- title heavier than body;
- subtitle secondary and lighter.

The header must feel like one unit.

Use `icons/trophy.svg` exactly.

## 2.4 Two-column rule layout

This must match the reference closely.

Below the header:

### Left column

- green check
- `Earned through play`
- green check
- `Used for rankings`
- green check
- `Help you compete`

### Right column

- coral/red X
- `Cannot be purchased`
- coral/red X
- `Cannot be transferred`
- coral/red X
- `Cannot be withdrawn`
- coral/red X
- `No monetary value`

The current implementation has too much wrapping and uneven item heights.

Tune column widths so that, at the target mobile width:

- `Earned through play` should fit on one line;
- `Used for rankings` should fit on one line;
- `Help you compete` should fit on one line;
- `Cannot be purchased` should fit on one line;
- `Cannot be transferred` should fit on one line;
- `Cannot be withdrawn` should fit on one line;
- `No monetary value` should fit on one line if the reference width permits.

The intended target is compact horizontal reading, not stacked multi-line blocks.

## 2.5 Divider

The center divider must match `target-design.png`:

- thin;
- low-contrast amber/warm divider;
- begins below the card header;
- does not run edge-to-edge;
- vertically aligns with the rules block;
- visually separates positive vs prohibited rules without dominating.

The current cold gray divider should be replaced with a warmer, subtler divider consistent with the card accent.

## 2.6 Check/X icons

Use:

- `icons/check.svg`
- `icons/x.svg`

Target behavior:

- compact, approximately 16–20 px;
- green/turquoise checks;
- coral/red X;
- aligned to the first text baseline;
- consistent icon-to-label gap;
- no bullets;
- no oversized glyphs.

Do not use text characters such as `✓` or `×` if the current implementation does that internally. Use the supplied SVG geometry.

## 2.7 Typography

Current rule text is too large/heavy and wraps too often.

Match the target more closely:

- regular/medium body text;
- compact line-height;
- no unnecessary bold;
- title remains strong;
- subtitle and rule text remain readable but subordinate.

The target card is dense but not cramped.

## 2.8 Internal spacing

Tune precisely:

- reduce vertical gap between title/subtitle and rules;
- use consistent row spacing within each column;
- keep equal left/right column rhythm;
- reduce oversized side padding if it causes wrapping;
- preserve safe touch/readability margins.

The target should look materially shorter and more balanced than the current implementation.

---

# 3. Light theme

The screenshots are dark-theme references, but the same hierarchy must work in light theme.

Do not simply use the dark theme values on light.

Required light-theme behavior:

- `Before you play`: neutral light surface, clear border, strong readable text;
- `Cups`: warm subtle amber/cream-tinted surface;
- amber border/accent remains visible;
- green checks and red X maintain sufficient contrast;
- no washed-out low-contrast text.

Reuse semantic tokens and existing light-theme conventions.

---

# 4. Exact icon requirement

The attached SVG files are the approved geometry.

Codex must preserve the exact shapes/strokes.

Allowed:

- import SVG directly;
- port exact SVG paths into an existing icon component;
- use `currentColor`.

Not allowed:

- substitute another icon library shape;
- use emoji;
- use Unicode pictograms;
- redraw icons from memory;
- alter proportions/stroke geometry;
- revert to the earlier bulky icons.

If integration requires JSX, copy path geometry exactly.

---

# 5. Visual acceptance criteria

Before completion, compare the implementation directly against `target-design.png`.

The task is not complete unless all of the following are true.

## Before you play

- one neutral shared card;
- five evenly spaced facts;
- no per-fact card backgrounds;
- icons close to target scale;
- labels not over-bold;
- semantic colors match target;
- row density is close to target.

## Cups

- warm amber/brown dark surface, not teal;
- amber border;
- compact trophy/title/subtitle header;
- two rule columns;
- warm subtle vertical divider;
- green SVG checks;
- red/coral SVG X icons;
- rule text mostly one line at reference width;
- visibly more compact than current;
- spacing/proportions close to `target-design.png`.

If the implementation still resembles `current-state.png` more than `target-design.png`, continue tuning.

---

# 6. Scope

Change only what is needed for these two summary sections.

Do not modify:

- Terms legal copy;
- Terms sections below the summary cards;
- Contents;
- page header;
- Privacy;
- Help;
- Profile;
- routing;
- theme runtime;
- public-page scrolling;
- product logic.

No unrelated refactors.

---

# 7. Implementation guidance

Inspect the current component and CSS first.

Prefer to tune the existing structure rather than rewrite the page.

If the facts/rules are data-driven, preserve that model.

Keep CSS ownership within the existing Terms/public-document component architecture.

Use CSS grid/flex intentionally:

- `Before you play`: five equal visual columns at the target width;
- `Cups`: two balanced rule columns with a separator.

Avoid magic absolute positioning.

---

# 8. Validation

Run the exact project scripts from `package.json`, including at least:

- typecheck;
- unit tests;
- lint;
- production build.

Also manually verify:

- dark theme;
- light theme;
- target mobile width;
- one narrower mobile width;
- no horizontal overflow;
- no clipped labels.

---

# Completion report

Report:

1. exact files changed;
2. CSS/layout changes for `Before you play`;
3. CSS/layout changes for `Cups`;
4. how the warm Cups surface/border is implemented;
5. confirmation that supplied SVG geometry is preserved;
6. dark/light verification;
7. viewport widths manually checked;
8. validation commands and results;
9. confirmation that no unrelated page content was changed.

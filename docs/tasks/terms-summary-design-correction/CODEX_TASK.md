# Codex Task — Terms Summary Design Correction

## Goal

Correct the `/terms` page so that **`Before you play` and `Cups` match the approved target design**, instead of the current oversized tile implementation.

This is a targeted visual correction task. Do not redesign the rest of the page.

## Folder

Place this task at:

`docs/tasks/terms-summary-design-correction/`

## Required reference files

Use all files in this folder:

- `current-state.png` — the current incorrect implementation.
- `target-design.png` — the **approved visual target**. This is the primary source of truth for layout and visual composition.
- `icons/age-18.svg`
- `icons/free-participation.svg`
- `icons/no-wagering.svg`
- `icons/cups-no-monetary-value.svg`
- `icons/regional-restrictions.svg`
- `icons/trophy.svg`
- `icons/check.svg`
- `icons/x.svg`

The attached SVGs are intentionally drawn to match the target design: thin rounded outline, compact proportions, no bulky filled pictograms.

## Priority of references

When there is any ambiguity:

1. `target-design.png` — visual source of truth.
2. SVG files from `icons/` — icon shape/source of truth.
3. Existing project semantic tokens/components.
4. Current implementation.

Do **not** preserve the current oversized icon/card layout when it conflicts with `target-design.png`.

---

# 1. Before you play — required redesign

## Current problem

`current-state.png` is wrong because:

- each rule is rendered as a large independent card;
- icons are extremely oversized;
- the icons are visually heavy and do not match the approved design;
- the five items consume excessive vertical space;
- the section no longer matches the compact horizontal composition of the approved mockup.

## Required target

Rebuild this block to match `target-design.png`.

The block itself is one shared rounded container with:

- heading `Before you play`;
- subtitle `A quick overview of the key rules.`;
- a **single horizontal five-item summary row** on the target mobile width;
- no individual card/border/background around each rule item;
- compact semantic icons above the labels;
- centered labels below each icon;
- even horizontal distribution.

Required order:

1. `18+ only`
2. `Free participation`
3. `No wagering`
4. `Cups have no monetary value`
5. `Prize Cups may have regional restrictions`

### Required icon mapping

Use the attached icon geometry:

- `18+ only` → `icons/age-18.svg`
- `Free participation` → `icons/free-participation.svg`
- `No wagering` → `icons/no-wagering.svg`
- `Cups have no monetary value` → `icons/cups-no-monetary-value.svg`
- `Prize Cups may have regional restrictions` → `icons/regional-restrictions.svg`

Do not replace these with the previously generated bulky icons.

If the repository imports SVGs through an icon component, reproduce these paths in that component rather than using a different icon shape.

### Icon styling

Match the target:

- compact icon footprint, approximately 28–36 CSS px depending on the existing scale;
- thin rounded outline;
- no filled white glyphs;
- no huge circles;
- no huge trophy;
- consistent optical weight across all five icons.

Use the semantic accent colors already available in the project. Target intent:

- `18+` — green;
- `Free participation` — green;
- `No wagering` — coral/red;
- `Cups have no monetary value` — amber/orange;
- `Regional restrictions` — blue.

Do not hardcode arbitrary new palette values if equivalent semantic tokens already exist.

### Text styling

The labels must visually match `target-design.png`:

- centered;
- regular/medium body weight, not oversized bold labels;
- compact line-height;
- multi-line wrapping only where needed;
- sufficient width so phrases wrap naturally.

The target is a visual summary, not five CTA cards.

### Responsive behavior

At the existing mobile Terms width shown in `target-design.png`, retain the five-column horizontal composition.

On narrower exceptional widths where five columns become genuinely unreadable, degrade gracefully to a compact wrapped grid. Do not return to the large-card layout.

---

# 2. Cups — required redesign

## Current problem

The current Cups section does not follow the approved target closely enough.

## Required target

Match the `Cups` block in `target-design.png`.

It must be one compact highlighted card, visually distinct from the neutral `Before you play` card.

### Header

Left header area:

- compact amber trophy icon;
- `Cups` title;
- `Goalstery scoring points` subtitle.

Use:

`icons/trophy.svg`

The trophy must be the compact thin-outline version supplied with this task.

### Rules layout

Below the heading, create two columns separated by a subtle vertical divider.

**Left / positive column**

- green `check.svg`
- `Earned through play`
- green `check.svg`
- `Used for rankings`
- green `check.svg`
- `Help you compete`

**Right / prohibited column**

- red/coral `x.svg`
- `Cannot be purchased`
- red/coral `x.svg`
- `Cannot be transferred`
- red/coral `x.svg`
- `Cannot be withdrawn`
- red/coral `x.svg`
- `No monetary value`

Use the provided:

- `icons/check.svg`
- `icons/x.svg`

Do not use bullet dots.

### Card styling

Follow `target-design.png`:

- dark theme: subtle green-tinted/dark highlighted surface;
- restrained border/accent;
- compact spacing;
- vertical divider between the positive and prohibited columns;
- title/content hierarchy matching the target;
- no giant amber/brown panel like the earlier generated mockup;
- no oversized icon.

Use project semantic tokens wherever possible.

Light theme must use the equivalent semantic treatment with adequate contrast.

---

# 3. Exact icon requirement

The SVG files supplied with this task are the required icon design.

Codex must **not**:

- substitute random icons from another library;
- use emoji;
- use Unicode symbols;
- use CSS-drawn approximations;
- use the previously generated bulky `18+`, gift, dollar-slash, crossed trophy, or globe-with-X icons;
- modify the SVG geometry unless required only for integration into an existing project SVG component.

If the repository's icon system requires JSX path data, port the supplied SVG geometry exactly.

The visual result must preserve the same shape, stroke weight, rounded caps/joins, and proportions as the supplied SVG.

---

# 4. Scope boundaries

Change only the components/styles/data required for:

- `Before you play`;
- `Cups`;
- the icon assets/components used by these sections.

Do not modify:

- legal copy;
- Terms section text below these cards;
- `Contents`;
- Terms header;
- Privacy;
- Help;
- Profile;
- routes;
- theme runtime;
- scrolling architecture.

Do not perform unrelated refactors.

---

# 5. Accessibility

These icons duplicate adjacent text meaning and should be decorative:

- use `aria-hidden="true"` or the project's equivalent;
- do not add redundant screen-reader labels.

Keep text readable under browser zoom and accessibility font scaling.

---

# 6. Implementation guidance

Inspect the current implementation first.

If `Before you play` is rendered from an array/data model, keep it data-driven and add the exact icon reference and semantic tone to each entry.

If the Cups positive/negative rules are data-driven, preserve that pattern.

Avoid creating five independent React components for the five facts.

Use existing Goalstery layout primitives/design tokens where they help reproduce `target-design.png`.

Visual fidelity to the target matters more than preserving the current internal CSS structure.

---

# 7. Visual acceptance criteria

Before considering this task complete, compare the result directly against `target-design.png`.

The implementation is not accepted if:

- Before-you-play facts still look like five large cards;
- icons remain large/heavy;
- the five facts are not presented as a compact visual summary;
- icon shapes differ materially from the supplied SVGs;
- Cups does not have the two-column check/X structure;
- Cups lacks the center divider;
- Cups uses bullet points instead of check/X icons;
- spacing/density is substantially taller than the target;
- dark theme does not resemble the target composition.

Test both dark and light themes.

---

# 8. Validation

Run the project's standard checks using the scripts in `package.json`, including at least:

- typecheck;
- unit tests;
- lint;
- production build.

Fix regressions caused by this correction.

---

# Completion report

Report:

1. exact files changed;
2. where each supplied SVG was integrated;
3. final Before-you-play layout behavior;
4. final Cups two-column layout behavior;
5. confirmation that the SVG geometry was preserved;
6. dark/light theme verification;
7. all validation commands and results;
8. confirmation that no unrelated Terms/Privacy/Help content changed.

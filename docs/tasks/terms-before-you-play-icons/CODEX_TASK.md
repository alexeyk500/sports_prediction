# Codex Task — Terms “Before you play” Icon Fix

## Goal

Fix only the `Before you play` summary block on the public `/terms` page so that it matches the approved visual direction and uses semantic icons for all five rules.

Do not redesign the rest of the Terms page.

## Task folder

This task is intended to live at:

`docs/tasks/terms-before-you-play-icons/`

## Input files

Use the files in this task folder:

- `current-state.png` — current implementation that needs correction
- `icons/age-18.svg`
- `icons/free-participation.svg`
- `icons/no-wagering.svg`
- `icons/no-monetary-value.svg`
- `icons/regional-restrictions.svg`

The screenshot is the current state, not the target.

## Current problem

The current `/terms` page renders the `Before you play` block as five text-only tiles:

- 18+ only
- Free participation
- No wagering
- Cups have no monetary value
- Prize Cups may have regional restrictions

This loses an important part of the approved visual hierarchy. Each tile must include a semantic icon.

The `Cups` block below already uses an icon correctly. Do not remove or restyle that block as part of this task.

## Required mapping

Use these semantic icon references:

- `18+ only` → `icons/age-18.svg`
- `Free participation` → `icons/free-participation.svg`
- `No wagering` → `icons/no-wagering.svg`
- `Cups have no monetary value` → `icons/no-monetary-value.svg`
- `Prize Cups may have regional restrictions` → `icons/regional-restrictions.svg`

If the repository already has an existing project icon component/library with a visually equivalent icon, prefer the existing project icon rather than adding duplicate runtime SVG assets. In that case, use the attached SVG as the approved visual reference and mention the substitution in the completion report.

Do not add a new third-party icon library.

## Visual requirements

Each tile must contain:

- one semantic icon;
- the existing rule text;
- clear alignment consistent with Goalstery;
- enough spacing so the icon does not feel decorative or cramped;
- proper contrast in both dark and light themes.

Preserve the existing two-column tile layout where space allows.

On narrow widths, the content must remain readable and must not overflow.

The fifth item may occupy a single grid cell or span the available width depending on the existing responsive implementation, but it must remain visually balanced.

Do not make icons oversized. They should act as compact semantic markers.

Use `currentColor` behavior or the existing icon component color system so the icons work naturally across themes.

Use semantic theme tokens. Do not hardcode theme-specific hex colors unless the current design system already requires that pattern.

## Color semantics

Preserve the approved visual meaning:

- `18+ only` — neutral/strong informational treatment
- `Free participation` — positive
- `No wagering` — restrictive/warning
- `Cups have no monetary value` — restrictive/informational
- `Prize Cups may have regional restrictions` — caution/informational

Do not turn the block into five unrelated bright-colored cards. Keep the overall section restrained and consistent with Goalstery.

## Scope

Change only what is necessary for this correction.

Do not:

- rewrite Terms copy;
- change the Terms content structure;
- change the `Contents` control;
- change page metadata;
- redesign the `Cups` summary block;
- alter Privacy or Help pages;
- change route behavior;
- change public-page scrolling;
- change theme runtime;
- modify legal meaning;
- introduce animations unless the current tile component already uses them.

## Accessibility

Icons must not create redundant screen-reader noise.

If the text already communicates the complete meaning, treat the icon as decorative with the project-equivalent of `aria-hidden="true"`.

Maintain keyboard/focus behavior of the page.

## Implementation preference

First inspect the current `/terms` implementation and determine whether the five rules are rendered from data.

If they are data-driven, extend that data structure with icon references rather than hardcoding five independent markup blocks.

Keep React component ownership consistent with the project's existing conventions.

Avoid unnecessary component extraction for a five-item summary if the current component is already appropriately scoped.

## Validation

Run the repository's standard checks relevant to this change, including at least:

- typecheck;
- unit tests;
- lint;
- production build.

Use the exact scripts defined in `package.json`.

## Completion report

Report:

1. exact files changed;
2. whether attached SVGs or existing project icons were used;
3. the final icon mapping for all five rules;
4. confirmation that dark and light themes both work;
5. validation commands and results;
6. confirmation that no other Terms/Privacy/Help content was changed.

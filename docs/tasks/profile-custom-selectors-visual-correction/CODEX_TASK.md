# CODEX TASK — Profile Custom Selectors Visual Correction

## Task folder

```text
docs/tasks/profile-custom-selectors-visual-correction/
```

## Goal

Bring the already implemented Profile `Language` and `Appearance` custom
bottom-sheet selectors into visual alignment with the previously approved
Profile Custom Selectors V1 design.

This is a **visual correction pass only**.

Do not redesign ProfileScreen.
Do not change locale/theme persistence semantics.
Do not change API/backend/domain behavior.
Do not add dependencies.
Do not replace the custom selectors with native `<select>` controls.

---

# 1. Read first

Read:

```text
AGENTS.md
docs/FRONTEND_ARCHITECTURE.md
docs/design/DESIGN_SYSTEM.md

docs/tasks/profile-custom-selectors-v1/CODEX_TASK.md
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-spec.md
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Then compare the current implementation against the two screenshots attached to
this correction task:

```text
docs/tasks/profile-custom-selectors-visual-correction/current-language-selector.png
docs/tasks/profile-custom-selectors-visual-correction/current-appearance-selector.png
```

The **approved target remains**:

```text
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Do not treat the current screenshots as a new design target. They document the
implementation gaps to fix.

---

# 2. Preserve the interaction contract

Keep the already approved behavior:

```text
tap Language/Appearance row
→ open custom Goalstery bottom sheet

tap one option
→ apply using existing authoritative settings flow
→ selected state updates
→ sheet closes
```

There must still be no:

```text
Done
Apply
Save
Confirm
```

button.

Keep:

```text
close button
drag handle
backdrop/scrim
Escape/backdrop behavior if already implemented
```

Do not change persistence semantics.

---

# 3. CURRENT IMPLEMENTATION DIFFERENCES — LANGUAGE SELECTOR

The current `Language` selector differs materially from the approved reference.

## 3.1 Sheet is far too tall

Current screenshot:

```text
current-language-selector.png
```

shows a sheet occupying a very large part of the viewport with excessive empty
vertical space.

The approved reference uses a compact, content-driven bottom sheet.

### Fix

Do not use a large fixed/minimum viewport height such as a visually equivalent
`70vh`, `75vh`, full remaining viewport, or oversized `min-height`.

The language sheet should size primarily to its content plus safe-area padding.

Target behavior:

```text
sheet starts only as high as required by:
handle
header
5 language rows
bottom safe-area
```

There should not be large blank space between rows or after the last row.

---

## 3.2 Language option rows are too vertically sparse

Current rows have oversized gaps and read like five isolated text blocks.

The approved reference uses compact list rows.

### Fix

Each language option should be approximately one compact touch row:

```text
~56–60 px visual row height
```

Use consistent vertical rhythm.

Rows should sit directly one after another.

Use subtle separators between unselected rows where shown in the reference.

Do not create huge `padding-block` / `gap` values between language options.

---

## 3.3 Selected language state is missing visually

In the current screenshot `English` is selected, but the sheet does not show the
approved selected-row treatment.

The approved reference clearly shows:

```text
selected row background
+
check indicator at inline end
```

### Fix

For the active language:

- render a soft accent selected surface;
- use a rounded selected-row shape;
- render the approved check indicator at the inline end;
- keep text readable in both light and dark themes.

The selected state must not be communicated only by hidden state or text value
outside the sheet.

---

## 3.4 Language list typography is too heavy / oversized

Current language labels appear heavier and more dominant than the approved
reference.

### Fix

Match the reference hierarchy:

```text
sheet title → strongest
option label → medium/semibold
```

Do not make every option visually equivalent to a section heading.

Keep localized/native names:

```text
English
Русский
Deutsch
Español
العربية
```

Do not add country flags.

---

# 4. CURRENT IMPLEMENTATION DIFFERENCES — APPEARANCE SELECTOR

The current `Appearance` selector also differs materially from the approved
reference.

## 4.1 Appearance options are plain list items instead of designed option cards

Current screenshot:

```text
current-appearance-selector.png
```

renders `System`, `Light`, and `Dark` as largely unframed rows floating inside
the sheet.

The approved reference uses three distinct, compact selector rows/cards.

### Fix

Each appearance option must have its own visual row container with:

```text
rounded rectangle
subtle border/surface
icon tile at inline start
title
description
check at inline end when selected
```

Unselected rows remain subdued but still have visible structure.

The selected row receives the accent selected surface.

---

## 4.2 Selected Appearance state is incomplete

Current `Dark` state only shows a checkmark.

The approved target requires:

```text
selected surface + checkmark
```

### Fix

When selected:

- apply the blue/teal selected row background from the reference/design tokens;
- preserve readable title + description;
- keep visible check at inline end.

Do not rely on the check alone.

---

## 4.3 Theme icons are visually wrong

Current implementation uses bare white outline icons directly on the sheet.

The approved reference uses **icons inside colored rounded-square tiles**.

### Fix

Match the approved hierarchy:

```text
System:
blue/cool icon tile
monitor icon

Light:
warm/yellow icon tile
sun icon

Dark:
purple/violet icon tile
moon icon
```

Use the SVG geometry already supplied in:

```text
docs/tasks/profile-custom-selectors-v1/icons/SystemIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/LightIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/DarkIcon.svg
```

or the corresponding React components already created from those files.

Do not redraw different icon geometry.

Do not create a new icon dumping ground.

---

## 4.4 Appearance rows need tighter composition

Current layout has too much vertical air between options and the content sits too
loosely inside the sheet.

### Fix

Target approximately:

```text
option row height: compact mobile card
icon tile: ~44–48 px
gap between rows: ~8–10 px
title + description grouped tightly
```

The sheet should feel compact and deliberate, not like a large settings page
inside a modal.

---

# 5. SHEET-LEVEL VISUAL DIFFERENCES

Apply these corrections to both selectors.

## 5.1 Backdrop is too dark/heavy

The current background content is almost blacked out.

The approved reference keeps the underlying Profile visible while clearly
de-emphasized.

### Fix

Reduce scrim opacity to match the approved reference more closely.

Do not remove the backdrop.

Do not let background content compete with the sheet.

---

## 5.2 Sheet border is too pronounced

Current dark sheet has a visible blue-gray outline around the whole sheet.

The approved reference uses a softer surface boundary.

### Fix

Use the existing semantic border/surface tokens to make the sheet edge subtle.

Avoid a conspicuous bright outline.

---

## 5.3 Sheet corner radius / top shape

Preserve the bottom-sheet form, but match the approved reference:

```text
large rounded top corners
flat bottom attached to viewport
```

Do not make it look like a centered modal/card.

---

## 5.4 Handle

Keep the drag handle, but match the reference:

```text
short
centered
low-contrast
small top margin
```

Do not make it overly wide or bright.

---

## 5.5 Header

Current header is generally correct structurally, but tune it to the reference.

Target:

```text
title aligned at inline start
close button aligned at inline end
compact top/bottom padding
```

The close button should be a restrained circular control, not a dominant action.

Use the existing/supplied CloseIcon geometry.

---

# 6. TARGET STRUCTURE — LANGUAGE SHEET

Visually it should read approximately as:

```text
╭──────────────────────────────╮
│            ━━━               │
│ Select language          ×   │
│                              │
│ English                  ✓   │  ← selected surface
│ Русский                      │
│ ───────────────────────────  │
│ Deutsch                      │
│ ───────────────────────────  │
│ Español                      │
│ ───────────────────────────  │
│ العربية                      │
│                              │
╰──────────────────────────────╯
```

Important:

```text
compact height
no giant empty space
selected-row background
visible check
tight row rhythm
```

---

# 7. TARGET STRUCTURE — APPEARANCE SHEET

Visually it should read approximately as:

```text
╭────────────────────────────────╮
│             ━━━                │
│ Select appearance          ×   │
│                                │
│ [monitor] System            ✓  │
│           Use device settings  │
│                                │
│ [sun]     Light                │
│           Always use light...  │
│                                │
│ [moon]    Dark                 │
│           Always use dark...   │
│                                │
╰────────────────────────────────╯
```

Each of the three options is a real visual row/card.

Selected option:

```text
accent surface + check
```

---

# 8. LIGHT THEME

The provided current screenshots are dark-theme examples, but this correction
must also align the light theme to the approved reference.

Verify:

```text
white/light-neutral sheet
subtle neutral border
selected option uses pale accent surface
text hierarchy remains clear
icon tiles keep semantic colors
scrim is restrained
```

Do not derive light mode by simply lowering dark-mode opacity.

Use semantic tokens.

---

# 9. CSS / architecture guardrails

This correction should stay within the selector component ownership boundary.

Do not refactor unrelated Profile components.

Follow current architecture:

```text
React.FC
interface I<ComponentName>Props
component-local CSS Modules
component/icon ownership
no generic dumping-ground modules
```

If there is a local shared bottom-sheet component already used by both selectors,
fix shared sheet-level styles there.

Language-only visual rules belong to the Language selector owner.

Appearance-only visual rules belong to the Appearance selector owner.

Do not move everything into `ProfileScreen.module.css`.

Do not add dependencies.

---

# 10. Do not change

Do not change:

```text
locale values
theme values
locale persistence
theme persistence
settings API
Telegram locale initialization
RTL semantics
Profile section order
Profile cards outside Preferences
Support & Legal
Prizes & Wallet
Bottom Navigation
```

Do not redesign the whole Profile screen while fixing the selectors.

---

# 11. Required browser verification

After implementation, render and compare directly against:

```text
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Required screenshots/checks:

```text
Language selector — light — 390×844
Language selector — dark — 390×844
Appearance selector — light — 390×844
Appearance selector — dark — 390×844

360 width sanity
430 width sanity
Arabic RTL sanity
```

Specifically verify:

```text
Language sheet has content-driven compact height
Language selected row is visibly highlighted
Language selected check is visible
Language rows are compact

Appearance rows have visible option containers
Appearance icons use colored icon tiles
Appearance selected row has selected surface + check

scrim is not excessively dark
sheet outline is subtle
no native browser/OS popup appears
no Done/Apply button exists
no horizontal overflow
no console errors
```

Do a visual comparison, not only CSS inspection.

---

# 12. Checks

Run:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Use project equivalents if scripts differ.

Do not weaken tests.

---

# 13. Definition of Done

Complete only when the visible implementation matches the approved selector
reference materially better and all of the following are true:

```text
language selector is compact
language rows are not excessively spaced
selected language has accent row + check
appearance options are proper designed rows/cards
appearance selected row has accent surface + check
System/Light/Dark use colored icon tiles
sheet backdrop matches intended restrained dimming
sheet border is subtle
header/handle/corners match reference hierarchy
single-tap apply remains intact
auto-close remains intact
no confirmation button exists
light/dark work
RTL works
360/390/430 work
lint passes
typecheck passes
tests pass
build passes
```

---

# 14. Final report

Report:

1. Exact CSS/layout causes of the oversized Language sheet.
2. Exact changes made to sheet sizing.
3. Final Language row height/padding/gap.
4. How selected Language state is rendered.
5. Exact changes made to Appearance option containers.
6. Final icon-tile implementation for System/Light/Dark.
7. How selected Appearance state is rendered.
8. Scrim opacity/treatment before and after.
9. Sheet border/surface changes.
10. Files modified.
11. Any shared local sheet component modified and why.
12. 390×844 Language light comparison.
13. 390×844 Language dark comparison.
14. 390×844 Appearance light comparison.
15. 390×844 Appearance dark comparison.
16. 360 sanity result.
17. 430 sanity result.
18. RTL result.
19. Console result.
20. lint result.
21. typecheck result.
22. tests result.
23. build result.

STOP after this visual correction.

Do not continue with unrelated Profile polish.

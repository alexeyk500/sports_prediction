# CODEX TASK — Profile Language Selector Visual Fix

## Task folder

```text
docs/tasks/profile-language-selector-visual-fix/
```

## Goal

Fix **only the Language selector** on Profile so it matches the already approved
Profile Custom Selectors V1 reference.

The Appearance selector is now accepted and MUST NOT be changed.

This task is a narrow visual correction + root-cause investigation for the
Language selector.

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

docs/tasks/profile-custom-selectors-visual-correction/CODEX_TASK.md
```

Then inspect the current screenshot attached to this task:

```text
docs/tasks/profile-language-selector-visual-fix/current-language-selector.png
```

The approved target remains:

```text
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Do not treat the current screenshot as a new target.

---

# 2. HARD SCOPE RULE

Change only the Language selector implementation and, if strictly necessary,
the shared selector-shell code that causes the Language selector mismatch.

Do NOT change the accepted Appearance selector.

Specifically:

```text
AppearanceSelector.tsx
AppearanceSelector.module.css
Appearance option layout
Appearance icon tiles
Appearance selected-state visuals
Appearance spacing
Appearance typography
Appearance sheet height
```

must remain visually unchanged.

If Language and Appearance share a common sheet component and a shared style
change would alter Appearance, do NOT make that shared change blindly.

Instead:

```text
identify the shared cause
move the differing rule to Language ownership
or add a narrow explicit variant/prop
preserve Appearance output exactly
```

No unrelated ProfileScreen changes.

---

# 3. FIRST: INVESTIGATE WHY LANGUAGE STILL DIFFERS

Before editing, identify the exact cause of the mismatch.

Inspect:

```text
LanguageSelector component
LanguageSelector CSS Module
shared bottom-sheet component, if any
shared option-row component, if any
shared selector CSS
data-driven class names / variants
selected-state classes
row separators
height/min-height/max-height rules
padding/gap rules
```

Pay special attention to whether Language is accidentally inheriting generic
settings/list-row styles instead of the approved Language-specific compact list
styles.

Also check whether a shared selector shell was tuned around Appearance and is
forcing incorrect spacing/geometry into Language.

In the final report, state the root cause explicitly.

---

# 4. CURRENT VISUAL PROBLEMS TO FIX

The current screenshot shows these concrete mismatches.

## 4.1 Selected row is too tall and too card-like

Current `Русский` selected row is a large blue pill/card.

In the approved reference, the selected language row is much more compact.

### Fix

Target:

```text
selected row height approximately 56–60 px
compact horizontal padding
moderate corner radius
soft accent selected surface
check at inline end
```

Do not make selected Language look like an Appearance option card.

Language is a compact list, not a card selector.

---

## 4.2 Unselected rows are too tall

Current English / Deutsch / Español / العربية rows have excessive vertical
height.

### Fix

Use a consistent compact row height approximately:

```text
56–60 px
```

or equivalent padding that visually matches the approved reference.

There should not be oversized blank vertical space above/below labels.

---

## 4.3 Row spacing is inconsistent

Current list has:

```text
large gap between English and selected Русский
large gap before Deutsch
then separators only for some later rows
```

This breaks list rhythm.

### Fix

All 5 language options must follow one consistent list rhythm.

Preferred structure:

```text
English
Русский
Deutsch
Español
العربية
```

with no arbitrary large gaps between rows.

Use the same spacing model for every row.

---

## 4.4 Separators are inconsistent

Current screenshot shows separators after some rows, but not consistently.

The approved design uses subtle separators as a coherent list treatment.

### Fix

Apply one clear rule:

```text
unselected list rows may use subtle separators
selected row remains visually self-contained
```

Do not show random separators based on index/class leakage.

The list should look intentional and uniform.

---

## 4.5 Typography is too heavy

Current language option labels are visually too bold/heavy.

The approved reference has:

```text
sheet title = strongest text
option labels = medium / semibold
```

### Fix

Reduce option label weight/size to match the reference and existing Profile
typography.

Do not make every language label look like a heading.

---

## 4.6 Selected check is too dominant

Current selected check sits inside a bright blue circle and is visually heavy.

The approved target uses a restrained check indicator.

### Fix

Match the approved reference:

```text
small check indicator
aligned at inline end
clear but not dominant
```

If the current shared `CheckIcon` is correct, keep the geometry and fix only its
container/size/presentation.

Do not redesign the shared icon if Appearance depends on it.

---

## 4.7 Sheet height still feels oversized

Current Language sheet remains taller than necessary.

### Fix

Language sheet must be content-driven.

It should contain only:

```text
drag handle
header
5 compact rows
bottom safe-area padding
```

Avoid:

```text
large min-height
viewport-relative height
flex: 1 expansion
large bottom padding
oversized row gaps
```

The sheet should end shortly after the Arabic row + safe-area inset.

Do NOT change Appearance sheet height.

---

# 5. TARGET LANGUAGE SELECTOR

Target visual structure:

```text
╭──────────────────────────────╮
│            ━━━               │
│ Select language          ×   │
│                              │
│ English                      │
│ Русский                  ✓   │  ← compact selected surface
│ Deutsch                      │
│ Español                      │
│ العربية                      │
│                              │
╰──────────────────────────────╯
```

Key characteristics:

```text
compact
content-driven height
consistent row rhythm
selected row only slightly emphasized
no large card geometry
no large blank gaps
no random separator behavior
check aligned cleanly
```

---

# 6. LIGHT + DARK

Fix both themes.

Dark target:

```text
deep navy sheet
subtle separators
soft blue selected surface
white/secondary text hierarchy
```

Light target:

```text
white/light-neutral sheet
subtle neutral separators
pale blue selected surface
dark text hierarchy
```

Use semantic theme tokens.

Do not hardcode a duplicate theme system.

---

# 7. RTL

Language selector must still work in Arabic RTL.

Verify:

```text
title/header layout
close control
selected check placement
row text alignment
sheet padding
```

The selected check should appear at logical inline-end.

Do not hardcode physical left/right where logical properties are required.

---

# 8. Architecture rules

Follow the current repository rules:

```text
React.FC
interface I<ComponentName>Props
component ownership
component-local CSS Modules
icon ownership
no generic dumping grounds
```

If the fix is Language-specific, keep it under the Language selector owner.

Do not move Language-specific visual rules into ProfileScreen.module.css.

Do not add dependencies.

---

# 9. Preserve behavior

Do not change:

```text
locale values
locale persistence
settings API
single-tap selection
auto-close
Arabic RTL activation
Profile section structure
Appearance selector
```

There must still be no:

```text
Done
Apply
Save
Confirm
```

button.

Do not reintroduce native `<select>`.

---

# 10. Required browser verification

After implementation, verify:

```text
Language selector — 390×844 — dark
Language selector — 390×844 — light
Language selector — 360 width
Language selector — 430 width
Language selector — Arabic RTL
```

Compare directly against:

```text
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Also verify Appearance after the fix only as a regression check:

```text
Appearance selector — 390×844 dark
Appearance selector — 390×844 light
```

The Appearance selector should look unchanged from the accepted current
implementation.

---

# 11. Specific visual acceptance checklist

Language selector must satisfy all of these:

```text
selected row is compact, not oversized
all rows use the same vertical rhythm
no arbitrary large gaps between rows
row height is approximately 56–60 px
selected state uses soft accent surface
check is visible but restrained
separators follow one consistent rule
option typography is lighter than current implementation
sheet height is content-driven
sheet ends shortly after Arabic row + safe-area
no horizontal overflow
RTL is correct
```

Appearance selector regression check:

```text
no visual change
no layout change
no icon-tile change
no selected-state change
no spacing change
```

---

# 12. Checks

Run:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Do not weaken tests.

---

# 13. Definition of Done

Complete only when:

```text
root cause of Language mismatch is identified
Language layout is corrected
Language selected row matches approved compact treatment
Language row spacing is uniform
Language separators are consistent
Language typography matches hierarchy
Language check is restrained
Language sheet height is content-driven
light/dark are correct
RTL is correct
Appearance selector is unchanged
single-tap apply still works
auto-close still works
no native select exists
lint passes
typecheck passes
tests pass
build passes
```

---

# 14. Final report

Report:

1. Exact root cause of the Language selector mismatch.
2. Exact files responsible.
3. Whether the cause was Language-local or shared selector-shell styling.
4. Why Appearance looked correct while Language did not.
5. Changes made to Language row height/padding.
6. Changes made to selected Language row.
7. Changes made to separators.
8. Changes made to typography.
9. Changes made to check presentation.
10. Changes made to Language sheet height.
11. Confirmation that Appearance selector was not visually changed.
12. 390×844 dark Language result.
13. 390×844 light Language result.
14. 360 width result.
15. 430 width result.
16. RTL result.
17. Appearance dark regression result.
18. Appearance light regression result.
19. Console result.
20. lint result.
21. typecheck result.
22. test result.
23. build result.

STOP after fixing the Language selector.

Do not continue with any other Profile polish.

# CODEX TASK — Profile Custom Selectors V1

## Task folder

```text
docs/tasks/profile-custom-selectors-v1/
```

## Goal

Replace the current native/default Profile language and appearance `<select>`
controls with Goalstery-owned custom bottom-sheet selectors matching the approved
reference.

This is a frontend UI implementation task.

Do not redesign the rest of ProfileScreen.

---

## 1. Read first

Read:

```text
AGENTS.md
docs/FRONTEND_ARCHITECTURE.md
docs/design/DESIGN_SYSTEM.md
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-spec.md
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Then inspect:

```text
current ProfileScreen implementation
current Preferences component/rows
current locale settings flow
current appearance/theme settings flow
existing modal/dialog primitives
existing shared icons under src/assets/icons/
existing i18n keys
```

Do not introduce a parallel settings architecture.

---

## 2. Replace native selectors

Remove native/default select UI for:

```text
Language
Appearance
```

The Preferences rows remain visually consistent with the approved Profile V1
screen.

Tapping the row opens a Goalstery custom bottom sheet.

Do not use native `<select>` as the production interaction.

Do not add a third-party selector/modal library.

---

## 3. Interaction contract

Both selectors use immediate single-tap selection:

```text
tap option
→ call existing authoritative settings action
→ update selected value
→ close sheet
```

There is NO:

```text
Done
Apply
Save
Confirm
```

button.

Closing without selecting must preserve the current setting.

---

## 4. Language selector

Implement bottom sheet:

```text
Select language

English
Русский
Deutsch
Español
العربية
```

Use the existing supported locale configuration as the authoritative source when
available rather than duplicating locale lists unnecessarily.

Do NOT use country flags.

Selected row:

```text
accent/selected surface
visible check icon
```

Changing to Arabic must continue to activate existing RTL behavior.

---

## 5. Appearance selector

Implement bottom sheet:

```text
Select appearance

System
Use device settings

Light
Always use light theme

Dark
Always use dark theme
```

Use existing theme values and persistence.

Use the provided SVG sources:

```text
icons/SystemIcon.svg
icons/LightIcon.svg
icons/DarkIcon.svg
```

Do not add new theme values.

---

## 6. Bottom-sheet behavior

Required:

```text
backdrop/scrim
rounded sheet
drag handle
title
close button
option rows
```

Use the existing project dialog/modal primitive if one already exists and fits
the visual/interaction contract.

Otherwise implement the smallest local accessible sheet necessary for Profile.

Do not create a generalized application-wide bottom-sheet framework unless
existing reuse already justifies it.

Close behavior:

```text
close icon
backdrop click if consistent with project conventions
Escape where applicable
```

Preserve sensible focus behavior/accessibility.

---

## 7. Component ownership

Follow current Goalstery ownership rules exactly.

A likely structure is something like:

```text
ProfileScreen/
└── PreferencesSection/
    ├── PreferencesSection.tsx
    ├── PreferencesSection.module.css
    ├── LanguageSelector/
    │   ├── LanguageSelector.tsx
    │   └── LanguageSelector.module.css
    └── AppearanceSelector/
        ├── AppearanceSelector.tsx
        └── AppearanceSelector.module.css
```

If there is a meaningful shared sheet shell used by both selectors, it may be
owned locally by the Preferences component tree.

Do not force this exact tree if the current Profile ownership tree has a clearer
equivalent.

Do not create generic buckets:

```text
components/
ui/
internal/
selectors/
```

merely for categorization.

Do not move Profile-specific selector implementation into global common scope
without demonstrated cross-screen reuse.

---

## 8. React component declaration convention

Every new/materially modified UI component must use:

```tsx
interface ILanguageSelectorProps {
  ...
}

const LanguageSelector: React.FC<ILanguageSelectorProps> = (...) => {
  ...
};

export { LanguageSelector };
```

Same rule for Appearance and any shared local sheet component.

Do not use:

```tsx
export function LanguageSelector(...)
```

Do not use inline props object types.

Do not use `type LanguageSelectorProps = ...`.

---

## 9. Icons

The task includes SVG source assets:

```text
docs/tasks/profile-custom-selectors-v1/icons/SystemIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/LightIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/DarkIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/CheckIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/CloseIcon.svg
docs/tasks/profile-custom-selectors-v1/icons/ChevronRightIcon.svg
```

Before creating React SVG components:

1. search existing `src/assets/icons/`;
2. reuse an equivalent Goalstery icon if it already exists;
3. component-only icons remain with their owner;
4. genuinely reused icons may live under `src/assets/icons/`.

Do not create:

```text
SelectorIcons.tsx
ProfileIcons.tsx
Icons.tsx
```

as icon dumping grounds.

Preserve supplied SVG geometry.

Use CSS/currentColor for theme color where appropriate.

---

## 10. CSS ownership

Each selector owns its internal CSS.

Parent Preferences CSS owns only placement/composition of its children/triggers.

Do not put all bottom-sheet internals into `ProfileScreen.module.css`.

Use existing semantic design tokens.

Do not create a separate Profile selector theme system.

---

## 11. Localization

All selector titles/descriptions and Profile row labels must use existing i18n.

Add translations where required for all currently supported production locales.

Do not hardcode production English strings inside presentation components.

For the language option labels themselves, display their native language names:

```text
English
Русский
Deutsch
Español
العربية
```

---

## 12. Preserve existing settings behavior

Do not change:

```text
settings API contract
theme persistence semantics
locale persistence semantics
Telegram locale initialization rules
manual locale override behavior
RTL architecture
```

The new selectors are presentation/interaction replacements for the existing
controls.

Do not add optimistic server state if the current settings flow is not optimistic.

If existing setting mutation is asynchronous, preserve correct pending/error
behavior and prevent conflicting duplicate actions.

---

## 13. Scope guardrail

Do not redesign:

```text
Profile Identity
Prizes & Wallet
Support & Legal
App Information
Bottom Navigation
```

except for minimal composition changes strictly required to connect the new
selectors.

Do not change backend/domain/API/database code unless you discover a genuine
existing bug that blocks the task; if so, stop and report it before expanding
scope.

---

## 14. Visual verification

Required browser checks:

```text
Language selector — 390×844 — light
Appearance selector — 390×844 — light
Language selector — 390×844 — dark
Appearance selector — 390×844 — dark
360 width sanity
430 width sanity
Arabic / RTL sanity
```

Compare directly against:

```text
docs/tasks/profile-custom-selectors-v1/profile-custom-selectors-v1-reference.png
```

Verify:

```text
no native OS/browser popup appears
no Done/Apply button exists
single tap applies selection
sheet closes after successful selection
selected row/check is correct
theme visually changes correctly
language visually/localization updates correctly
no horizontal overflow
no console errors
```

---

## 15. Checks

Run project equivalents of:

```text
npm run lint
npm run typecheck
npm run test
npm run build
```

Do not weaken tests.

Add focused frontend tests if the existing testing architecture has appropriate
coverage for settings interactions.

---

## 16. Definition of Done

Complete only when:

```text
native Language select is removed from production UI
native Appearance select is removed from production UI
Language uses custom Goalstery bottom sheet
Appearance uses custom Goalstery bottom sheet
single-tap immediate selection works
no confirmation button exists
existing settings flow is reused
existing persistence behavior is preserved
Arabic RTL still works
light/dark selector visuals match reference
React.FC + I<ComponentName>Props convention is followed
icon ownership rules are followed
no icon dumping ground is introduced
CSS ownership is correct
no third-party dependency is added
360/390/430 work
lint passes
typecheck passes
tests pass
build passes
browser verification passes
```

---

## 17. Final report

Report:

1. Native selector implementation found before change.
2. Final selector component tree.
3. Files created/moved/removed.
4. Components and their ownership.
5. Props interfaces created.
6. Existing settings actions/store/API reused.
7. Language option source.
8. Appearance option source.
9. Icons reused from existing shared assets.
10. Icons created from supplied SVGs and their final paths.
11. Confirmation no icon collector was introduced.
12. Bottom-sheet implementation/primitive used.
13. Selection/persistence/close flow.
14. Error/pending behavior.
15. Localization changes.
16. RTL result.
17. 390×844 light Language result.
18. 390×844 light Appearance result.
19. 390×844 dark Language result.
20. 390×844 dark Appearance result.
21. 360 sanity result.
22. 430 sanity result.
23. Confirmation no native popup remains.
24. Confirmation no Done/Apply button exists.
25. Console result.
26. lint.
27. typecheck.
28. tests.
29. build.

STOP after implementing these selectors.

Do not continue with unrelated Profile redesign.

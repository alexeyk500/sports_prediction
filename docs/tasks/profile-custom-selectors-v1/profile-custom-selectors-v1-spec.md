# Goalstery — Custom Selectors V1 Spec

## Status

Approved implementation target for Profile language and appearance selectors.

Visual authority:

```text
profile-custom-selectors-v1-reference.png
→ this spec
→ docs/design/DESIGN_SYSTEM.md
→ existing implementation
```

## 1. Problem

The current Profile settings use native/default select controls.

That produces browser/OS-specific popups and styling that does not match the
Goalstery visual system.

Replace those native selects with Goalstery-owned custom selectors.

## 2. Selector type

Both selectors open as a mobile bottom sheet.

Required chrome:

```text
scrim/backdrop
rounded top sheet
small drag handle
title
close button
option rows
```

No confirmation button.

## 3. Interaction

Selection is single-tap and immediate:

```text
tap option
→ persist through the existing settings flow
→ selected state updates
→ selector closes
```

Do not add `Done`, `Apply`, or `Save`.

The current value is shown in Profile Preferences before opening the sheet.

## 4. Language selector

Title:

```text
Select language
```

Options are the currently supported production locales:

```text
English
Русский
Deutsch
Español
العربية
```

Do not use country flags. A language is not equivalent to one country.

Selected option:

```text
subtle accent surface
check indicator at inline end
```

Unselected options remain visually quiet.

Language change must continue using the existing locale/settings implementation.

Arabic must activate the existing RTL behavior.

## 5. Appearance selector

Title:

```text
Select appearance
```

Options:

```text
System
Use device settings

Light
Always use light theme

Dark
Always use dark theme
```

Use supplied SVG sources:

```text
icons/SystemIcon.svg
icons/LightIcon.svg
icons/DarkIcon.svg
```

Selected option uses the same accent/check treatment as the language selector.

Theme change must continue using the existing appearance/settings implementation.

## 6. Close behavior

The selector may be closed without changing the value by:

```text
close button
backdrop tap, if consistent with existing modal conventions
Escape key / equivalent accessibility behavior where applicable
```

If the project already has an accessible modal/sheet primitive, reuse it.

Do not add a third-party modal library.

## 7. Light and dark themes

The sheet must render natively in both current Goalstery themes.

Use existing semantic tokens.

Do not hardcode a separate duplicate theme system.

The reference shows the desired relationship:

```text
light → white/light-neutral sheet, subtle separators
dark  → deep navy/charcoal sheet, controlled contrast
```

## 8. Architecture

Follow:

```text
AGENTS.md
docs/FRONTEND_ARCHITECTURE.md
```

The selector should live at the narrowest meaningful owner.

If Language and Appearance share a genuinely identical selector-shell
responsibility, a local reusable component under the Profile preferences owner
is appropriate.

Do not create a global abstraction merely because two instances currently use it.

Do not create:

```text
Selectors.tsx
ProfileSelectors.tsx
components/
ui/
internal/
```

as generic dumping grounds.

## 9. React declaration style

For every new/materially modified React UI component:

```tsx
interface IComponentNameProps {
  ...
}

const ComponentName: React.FC<IComponentNameProps> = (...) => {
  ...
};

export { ComponentName };
```

Do not use inline props typing or `export function ComponentName(...)`.

## 10. Icon ownership

Use the supplied SVG geometry.

Apply current ownership rules:

```text
component-only icon
→ owning component directory

genuinely reused icon
→ src/assets/icons/
```

Before creating `CheckIcon`, `CloseIcon`, or `ChevronRightIcon` as shared icons,
inspect existing `src/assets/icons/` and reuse an equivalent current icon if it
already exists.

Do not create an icon collector such as:

```text
SelectorIcons.tsx
ProfileIcons.tsx
Icons.tsx
```

## 11. Accessibility

The selector must not be implemented as a visual-only div stack.

Use an accessible dialog/sheet pattern.

Options must be semantic interactive controls.

Expose current selection programmatically.

Focus must move into the sheet when opened and return to the trigger when closed
if the existing application modal conventions support that behavior.

Do not rely on color alone for selected state; include the check indicator.

## 12. Responsive target

Primary:

```text
390 × 844
```

Sanity:

```text
360
430
```

No horizontal overflow.

Long localized labels must remain readable.

RTL must remain coherent.

## 13. Visual fidelity

Compare browser renders directly against:

```text
profile-custom-selectors-v1-reference.png
```

Match as closely as practical:

```text
bottom-sheet height/density
rounded top corners
drag handle
title/close layout
option spacing
selected surface
check placement
theme icons
separator treatment
light/dark balance
```

Do not rasterize the selector UI.

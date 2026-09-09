# Profile Custom Selectors V1 — SVG assets

These SVG files are approved source geometry for the selector implementation.

```text
SystemIcon.svg
LightIcon.svg
DarkIcon.svg
CheckIcon.svg
CloseIcon.svg
ChevronRightIcon.svg
```

Ownership is NOT determined by this task folder.

Codex must classify usage under the current architecture:

```text
component-only usage
→ owning component directory

genuine independent reuse
→ src/assets/icons/
```

Before creating any React icon component, inspect existing `src/assets/icons/`
and reuse an equivalent Goalstery-owned icon when available.

Do not create `SelectorIcons.tsx`, `ProfileIcons.tsx`, or `Icons.tsx`.

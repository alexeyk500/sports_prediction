# Codex Task — Align Cup Prizes UI with approved design

## References

Before changing code, compare these files side by side:

- `approved-design.png` — **source of truth** for composition, density, proportions and visual hierarchy.
- `current-implementation.png` — current implementation that must be corrected.

Do not redesign the screen. The goal is to bring the current implementation materially closer to `approved-design.png` while preserving real DB/API data.

## Main problems in the current implementation

The current screen is too large, loose and vertically stretched. The approved design is substantially denser and keeps the entire Prizes experience compact.

### 1. Overall scale and vertical rhythm

Current implementation:
- oversized header and typography;
- excessive vertical gaps between sections;
- oversized cards and rows;
- content stretches far beyond the intended viewport;
- too much empty space before bottom navigation.

Fix:
- reduce section spacing and component heights;
- use the approved screenshot as the target for relative proportions;
- keep the layout compact rather than merely shrinking random fonts;
- preserve safe-area/bottom-nav behavior.

### 2. Header

Approved:
- `Cup` is smaller and less dominant;
- subtitle is compact and close to title;
- segmented control starts shortly below subtitle.

Current:
- title/subtitle and their spacing are too large.

Match the approved hierarchy and spacing.

### 3. Current Cup / Prizes segmented control

Approved:
- shorter overall height;
- smaller corner radius;
- active `Prizes` occupies roughly half the control cleanly;
- compact typography.

Current control is too tall and visually heavy.

Reduce height/padding/radius to match the reference. Do not change its behavior.

### 4. Prize Pool card

This is one of the largest mismatches.

Approved:
- much shorter card;
- trophy sits in a compact circular icon container;
- content is horizontally compact;
- `Prize pool`, amount and subtitle form a tight block;
- card does not dominate the page.

Current:
- card is much too tall;
- icon and text are oversized;
- padding is excessive.

Reduce height, padding, icon size, amount size and internal gaps. Preserve dynamic `10.5 USDT` data.

### 5. Podium

The approved screenshot is the source of truth.

Approved:
- podium scene begins immediately after the Prize Pool card;
- image is taller/narrower in mobile composition;
- all three trophies/pedestals are fully visible;
- dynamic prize labels sit **below the podium image/scene**, on the dark page area:
  - left: amount, then `2nd place`;
  - center: amount, then `1st place`;
  - right: amount, then `3rd place`;
- labels do not cover the podium numbers.

Current:
- podium image is too wide/short;
- image crop/composition differs;
- labels are overlaid on top of the podium/pedestals and collide visually with numbers `1/2/3`;
- section loses the clean separation shown in approved design.

Fix the podium container/aspect/crop so it visually matches the approved composition. Position dynamic labels like the approved design. Do not alter the production background artwork itself unless the existing CSS crop/object-position is the cause.

Prize values remain API-driven:
- 2nd: `2 USDT`
- 1st: `3 USDT`
- 3rd: `1 USDT`

Do not hardcode them.

### 6. Other prizes

Approved:
- heading is smaller;
- rows are considerably shorter;
- icons are smaller;
- text is more compact;
- cards have tighter padding/radius;
- rows are separated by a small gap.

Current:
- heading and cards are oversized;
- rows are too tall;
- people icon is too large;
- chevron is too prominent;
- typography is too large.

Bring row height, icon scale, typography, padding and gaps close to the approved reference.

Keep actual API values:
- 4th–10th: `0.5 USDT each`
- 11th–20th: `0.1 USDT each`.

### 7. Informational card

Approved:
- compact height;
- small gift icon;
- text fits naturally in two lines;
- tighter horizontal and vertical padding.

Current card is too large and spacious.

Reduce it to the approved density. Keep text dynamic.

### 8. Typography

Do not solve this with one global scale transform.

Establish the correct hierarchy per component:
- screen title;
- subtitle;
- segmented-control labels;
- Prize Pool label/value/subtitle;
- podium amount/place;
- Other prizes heading;
- tier label/value;
- informational text.

Current implementation generally uses type that is too large/heavy. Match the approved screenshot while continuing to use the project's typography tokens where possible.

### 9. Widths, margins and radii

Approved design uses modest mobile side margins and compact radii.

Current implementation has:
- larger side margins in several sections;
- larger card radii;
- heavier visual framing.

Align section widths consistently and reduce radii where necessary to match the approved screenshot.

### 10. Bottom navigation

Do not redesign bottom navigation as part of this task.

Preserve existing project navigation, routes, icons and active-state logic. Only ensure the Prizes content above it has the correct spacing and does not create unnecessary empty vertical space.

## Data and behavior

This is a visual-alignment task. Do not regress the already implemented prize data architecture.

Preserve:
- DB prize distribution;
- `bootstrap/current-cup`;
- decimal-safe total calculation;
- dynamic currency;
- dynamic `Top N`;
- TOP 3 mapping;
- API order for other tiers;
- empty state;
- light/dark theme support.

Do not replace dynamic values with screenshot constants.

## Responsive requirement

The approved screenshot is the primary mobile visual target, but do not implement a fixed screenshot-sized canvas.

Use responsive CSS/components. At nearby mobile widths the composition should retain the same density, hierarchy and podium alignment without overflow.

## Verification

After implementation:

1. Open the Prizes tab at the same/similar mobile viewport.
2. Capture a new screenshot.
3. Compare it side by side with `approved-design.png`.
4. Specifically verify:
   - overall vertical density;
   - header scale;
   - segmented-control height;
   - Prize Pool card height;
   - podium aspect/crop;
   - TOP 3 label placement;
   - Other prizes row height;
   - informational card height;
   - spacing above bottom navigation.
5. Verify both dark and light themes.

Do not consider the task complete while the screen still looks materially closer to `current-implementation.png` than to `approved-design.png`.

## Acceptance criteria

- Visual composition is recognizably aligned with `approved-design.png`.
- Screen is compact rather than vertically stretched.
- Prize Pool card matches approved proportions.
- Podium composition/crop matches the approved reference closely.
- TOP 3 labels no longer overlap podium numbers/artwork.
- Other-prize rows and info card match approved density.
- Dynamic DB/API values remain intact.
- No fixed-canvas or screenshot-specific hack is introduced.
- Bottom navigation behavior is unchanged.
- Both themes remain functional.

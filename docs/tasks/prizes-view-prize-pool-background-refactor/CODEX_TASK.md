# Codex Task — Refactor PrizesView Prize Pool card background

## Goal

Refactor the Prize Pool card inside `PrizesView` to use the new production image asset:

```text
public/assets/screens/prize-pool-background.webp
```

The new image already contains the decorative trophy and visual background for the card.

## Required changes

### 1. Use the new background asset

Set:

```text
/assets/screens/prize-pool-background.webp
```

as the visual background of the Prize Pool card in `PrizesView`.

The image must:

- cover the full card area;
- preserve the intended composition with the trophy on the left and free space for dynamic text;
- scale responsively;
- not stretch or distort;
- use an appropriate `background-size`, `background-position`, or equivalent image treatment to keep the trophy composition correct on mobile widths.

Prefer CSS `background-image` if that fits the existing component architecture.

Do not convert the asset into base64 or duplicate it elsewhere without a technical reason.

### 2. Remove the existing `poolIcon`

The currently rendered trophy/icon (`poolIcon`) is obsolete because the new background already contains the trophy.

Remove:

- the rendered `poolIcon`;
- its wrapper/container;
- icon-specific spacing/padding that is no longer needed;
- related imports/styles if they become unused.

If `poolIcon` or its styles are used elsewhere, do not remove shared code needed by other components.

### 3. Keep Prize Pool data dynamic

The background image is decorative only.

Keep these values rendered as normal React text from the current prize data:

- `Prize pool`;
- computed total, e.g. `10.5 USDT`;
- `Top N players get rewarded`.

Do not bake or hardcode any amount, currency, or rewarded-player count based on the image.

Preserve:

- decimal-safe prize pool calculation;
- dynamic `prizeCurrency`;
- dynamic `Top N`;
- current DB/API/bootstrap source of truth.

### 4. Layout alignment

After removing `poolIcon`, adjust the text block so it sits in the free area of the new background and does not overlap the trophy.

Use the approved visual direction:

- trophy is part of the image on the left;
- text is positioned to the right of it;
- card remains compact;
- amount remains the strongest text;
- subtitle remains readable;
- do not increase card height unnecessarily.

The text layout should work for both `10.5 USDT` and other realistic prize totals/currencies without immediately colliding with the trophy.

### 5. Theme behavior

The supplied asset is the production background for this card.

Integrate it into the existing `PrizesView` without breaking light/dark theme behavior around the card.

Do not add an SVG trophy fallback on top of the image.

### 6. Preserve scope

Do not change:

- podium section;
- `Other prizes`;
- prize distribution logic;
- Cup routes/navigation;
- bottom navigation;
- DB schema/API contracts.

This task is only a visual refactor of the Prize Pool card in `PrizesView`.

## Cleanup

After implementation:

- remove unused `poolIcon` import/component references;
- remove obsolete icon wrapper CSS;
- remove any now-unused variables/classes caused specifically by this refactor;
- keep shared code if it is still used elsewhere.

## Verification

Verify the Prize Pool card at mobile widths and confirm:

- `/assets/screens/prize-pool-background.webp` loads correctly;
- the full card uses the image background;
- the image is not distorted;
- the trophy is clearly visible on the left;
- `poolIcon` is no longer rendered;
- text does not overlap the trophy;
- dynamic `10.5 USDT` / currency / Top N values still come from prize data;
- card remains visually compact;
- no regressions appear in the rest of `PrizesView`.

## Acceptance criteria

- `PrizesView` Prize Pool card uses `public/assets/screens/prize-pool-background.webp`.
- Existing `poolIcon` trophy is removed from the card.
- No duplicate trophy/icon appears.
- Dynamic Prize Pool text remains React-rendered and API-driven.
- Background scales/crops correctly on mobile.
- Obsolete icon-specific code is cleaned up.
- No unrelated Prizes functionality or UI is changed.

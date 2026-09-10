# Matches Prediction Card Ambient Background Refactor

## Goal

Refactor the prediction/match cards on the **Matches** screen so that cards in both tabs/sections — **Available** and **My Picks** — receive the approved subtle team-specific ambient background treatment.

The visual target is the blurred oversized club crests shown in:

- `references/final-approved-matches-ambient.png` — **final approved reference; highest priority**
- `references/target-ambient-card.png` — earlier close-up reference

The current Matches screen is shown in:

- `references/current-matches-screen.png`

The redesign must preserve the existing layout, behavior, data flow, interaction logic, prediction state, and responsive behavior. This is a **visual/card-component refactor**, not a domain or API change.

## Important geometry constraint

The cards in **Available** and **My Picks** do **not** have identical geometry/content structure.

Do **not** force both variants into one rigid DOM/layout if doing so changes their current geometry.

Instead:

1. Inspect the current implementations of the Available-card and My-Picks-card variants.
2. Identify the shared visual shell/background logic that can safely be reused.
3. Preserve each variant's current spacing, height, content blocks, controls, status/result rows, and interaction affordances.
4. Apply the ambient background independently to each geometry so both look intentional.

A shared wrapper/background primitive is preferred only if it does not distort either card variant.

## Approved visual direction

Use the existing home/away team crest assets already available to the card.

Each card should have two decorative background watermarks:

### Home team watermark

- Oversized version of the home team crest.
- Anchored on the **left side**, but its visible top must begin **below the league icon/name row plus a small visual gap**. It must NOT start at the card top edge or behind the league header.
- Intentionally cropped by the left card boundary.
- Softly blurred.
- Very low opacity.
- Should feel like an ambient colored shape, not like a second readable logo.

### Away team watermark

- Oversized version of the away team crest.
- Anchored to the **bottom-right**. Its visible lower edge should start/terminate against the bottom region of the card with a **small inset/padding**, rather than floating vertically in the middle.
- Intentionally cropped by the right/bottom card boundary.
- Softly blurred.
- Very low opacity.
- Should feel like an ambient colored shape, not like a second readable logo.

Use `references/final-approved-matches-ambient.png` as the **primary and final visual reference**. Preserve the real card geometry shown there; do not stretch cards to match earlier generated mockups.


## Final positioning clarification

The approved composition is **fixed for every card**, not alternating:

- **Home:** left-side oversized blurred crest, beginning vertically *after* the league icon/name header row + a small gap.
- **Away:** oversized blurred crest in the lower-right, aligned toward the card bottom + a small inset.
- Do not put the home watermark behind the league badge/name.
- Do not vertically center the away watermark.
- Do not alternate positions between consecutive cards.
- Keep the existing solid navy card background underneath the ambient layers.
- Preserve the current production card width, height, padding, controls and spacing. The supplied final screenshot is intentionally based on the real Matches geometry.
- Apply the same visual rule to both **Available** and **My Picks**, while adapting offsets/size to each variant's existing geometry rather than forcing identical dimensions.

## Visual requirements

The foreground UI must remain visually dominant.

The decorative crest layers must:

- sit behind all card content;
- never capture pointer events;
- be clipped by the card border radius;
- not alter the foreground team-logo rendering;
- not reduce readability of league name, date/time, club names, prediction buttons, trophy values, status/result text, or any My Picks-specific content;
- not cause horizontal/vertical overflow;
- remain subtle on both small and large mobile widths.

Recommended implementation range — tune by eye against the supplied reference rather than treating these as mandatory constants:

- decorative crest opacity: roughly `0.08–0.16` after blur/compositing;
- blur: roughly `6–14px`;
- decorative crest scale: large enough to extend beyond the card edge;
- home anchor: left edge + vertical position derived from the league header height; begin below the league icon/name row with a small gap;
- away anchor: right/bottom with a small bottom inset;
- use the **same Home ↖ / Away ↘ composition on every card**; do not alternate watermark positions by card index.

Avoid a hard rectangular image footprint. If needed, combine blur/opacity with a CSS mask or soft gradient fade so the watermark dissolves naturally into the card background.

## Preserve the existing card base

Keep the existing dark solid card background as the base layer.

The new crest treatment is an **ambient overlay**, not a replacement background image.

Do not add:

- stadium photos;
- player photos;
- strong full-card gradients;
- bright neon borders;
- animated background effects;
- additional decorative icons.

## Foreground team crests

The normal team logos displayed next to the club names remain crisp and unchanged.

The decorative watermarks are additional background instances of those assets and must be visually separated from the foreground logo styling.

Do not blur or lower the opacity of the normal foreground logos.

## Available card

Apply the approved ambient treatment to every match card in **Available**.

Preserve exactly the existing:

- competition row;
- date/time placement;
- home/away team alignment;
- `vs` placement;
- `1 / X / 2` prediction controls;
- trophy/reward values;
- computed/status pill if present;
- selected/pressed/disabled states;
- card padding and current responsive geometry.

The supplied `current-matches-screen.png` is a reference for the current Available geometry.

## My Picks card

Apply the same visual language to cards in **My Picks**, but adapt the watermark placement/scale to the actual My Picks geometry.

Do not simply copy absolute pixel positions from the Available card.

Preserve all My Picks-specific UI, including whichever of the following currently exist in the repository:

- chosen prediction state;
- locked/submitted state;
- settlement/result state;
- correct/wrong indication;
- reward/cup values;
- match status;
- any result metadata or action row.

The ambient crests must remain behind these elements and must not interfere with state colors.

## Component architecture

Before editing, inspect the Matches card hierarchy and determine where card variants live.

Preferred approach:

- keep semantic/card-specific components intact;
- extract only the decorative background into a small reusable primitive if appropriate, for example `TeamAmbientBackground` / `MatchCardAmbientBackground`;
- make the primitive accept the existing home/away crest URLs/assets rather than introducing duplicate asset-loading logic;
- let each card variant provide its own positioning/size tokens if their geometry requires it.

Do not perform a broad component rewrite solely to share code.

## CSS / stacking requirements

Use an explicit, robust stacking model.

Suggested structure:

- card root: `position: relative`, `overflow: hidden`;
- ambient layer: absolute/inset layer at the lowest internal z-index;
- foreground content: relative layer above ambient decoration.

Ensure:

- card borders remain crisp;
- border-radius clipping still works;
- interactive controls remain clickable;
- focus rings are not clipped unexpectedly;
- hover/pressed/selected styles remain above the ambient layer.

If the project already has tokens for card background, borders, opacity, radii, etc., reuse them instead of introducing arbitrary one-off values.

## Theme behavior

Primary target is the current **dark theme** shown in the supplied references.

If the same card component is also rendered in the light theme, do not regress it.

For light theme either:

- provide a suitably subtle theme-aware ambient treatment, or
- intentionally reduce/disable the decorative opacity if that produces the cleaner result.

Do not hard-code dark-theme colors into shared foreground content.

## Asset/data fallbacks

Handle missing or broken team crest assets gracefully.

If either team lacks a usable crest:

- omit only that decorative watermark;
- keep the normal card layout intact;
- do not render broken-image UI;
- do not invent/generated-placeholder club logos.

## Accessibility

The ambient watermarks are decorative.

They must not be exposed to screen readers as meaningful duplicate images. Use an appropriate decorative implementation (`aria-hidden`, CSS background, empty alt where applicable).

Do not change accessible names of existing match controls.

## Performance

Avoid introducing a new network request for the decorative image when the same crest URL/asset is already available to the card and browser caching/reuse is possible.

Do not use canvas, runtime image processing, or generated bitmap effects.

Prefer CSS transforms/filter/opacity around the existing crest image.

## Testing / verification

After implementation, verify at minimum:

1. Matches → Available with multiple cards from different clubs.
2. Matches → My Picks with its actual card geometry.
3. A card with strongly colored crests and a card with mostly white/light crests.
4. Long club names.
5. Narrow mobile viewport.
6. Existing prediction selection interaction in Available.
7. Existing state/result rendering in My Picks.
8. Missing crest fallback if practical with fixtures/mock data.
9. Dark theme.
10. Light theme if supported by the same components.

Run the project's existing checks relevant to the touched code, including typecheck, tests, lint, and build where available.

## Visual acceptance criteria

The result is accepted when:

- both Available and My Picks cards have a consistent team-specific ambient identity;
- home crest visually originates from the top-left;
- away crest visually originates from the bottom-right;
- both decorative crests are enlarged, cropped, blurred, and subdued;
- the effect is close in character to `references/target-ambient-card.png`;
- the current solid card background remains visible and dominant;
- foreground content is at least as readable as before;
- the two card geometries remain unchanged unless a tiny spacing adjustment is strictly required to prevent visual collision;
- no match/prediction/domain behavior changes.

## Non-goals

Do not change:

- Matches screen business logic;
- prediction submission logic;
- API contracts;
- cup/reward calculation;
- match fetching;
- tab behavior;
- routing;
- localization architecture;
- leaderboard/Cup/History/Profile behavior.

## Deliverable

Implement the visual refactor in the existing codebase and report:

- files changed;
- component/CSS structure used for the ambient layer;
- how Available and My Picks geometry differences were handled;
- tests/checks executed and their results.

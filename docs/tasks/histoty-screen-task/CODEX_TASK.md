# History Screen — Codex Task

## Goal

Replace the global `Rating` screen with a new `History` screen that explains the current player's result in the active Cup.

The screen must show the player's prediction history for the **current Cup only**, from the newest day back to the first day of the Cup, using a vertical timeline UI.

The screen should visually match the existing Predict/Cup product language and use the supplied History Hero artwork as a production asset.

---

## Source files / references

Task directory:

`docs/tasks/histoty-screen-task/`

Visual sketch:

`docs/tasks/histoty-screen-task/history-screen-sketch.png`

Final Hero background asset:

`docs/tasks/histoty-screen-task/history-screen-hero.webp`

The sketch is a reference for **layout, spacing, hierarchy, timeline composition and card structure**.

The Hero background asset is authoritative for the final Hero artwork.

---

## Important: History Hero background

Use this exact image as the background of the History Hero card:

`docs/tasks/histoty-screen-task/history-screen-hero.webp`

Requirements:

- Do **not** generate, recreate, redraw, approximate or replace the Hero artwork.
- Do **not** use the Cup Hero artwork as a substitute.
- Copy/move the supplied asset into the appropriate application asset directory if required by the current project structure (for example under `public/images/...`).
- Preserve the source file in the task directory.
- Do not recompress or modify the image unless technically necessary.
- All dynamic Hero content must remain normal React/HTML UI layered over the background image.
- Do not bake title, dates, rank, cups or result statistics into the image.
- Implement responsive background positioning/cropping in CSS so the important artwork remains visible on supported mobile viewport widths.
- A dark overlay/gradient may be added only when needed for text readability and should remain consistent with the visual language already used in Predict/Cup.
- The Hero must work within the application's existing light/dark theme system.

The supplied `history-screen-hero.webp` is the final visual source for the Hero.  
Do not attempt to reproduce the Hero background from the sketch.

---

## Product behavior

### Screen name

`History`

Suggested subtitle:

`Your predictions in this Cup`

Use existing project typography and spacing patterns.

---

## Navigation

Replace the global `Rating` destination in the main bottom navigation with `History`.

Expected primary navigation:

- Predict
- Cup
- History
- Profile

Use the existing navigation architecture and icons/components where possible.

Do not break existing routing behavior.

---

## Scope of history

History is **strictly for the current Cup**.

Do not implement:

- global all-time player rating;
- previous seasons;
- previous Cups archive;
- Cup selector;
- season selector.

The current Cup context should come from the existing backend/domain model.

---

## Data rules

Do not add frontend mock data.

Use existing backend/API/domain data where available.

Before implementing, inspect:

- current Cup bootstrap/data flow;
- TournamentParticipant / Cup participant data;
- Prediction entities and DTOs;
- prediction settlement/result fields;
- existing score / cups calculation logic;
- Predict screen data sources;
- Cup leaderboard endpoints and DTOs.

If the History screen requires additional server data, extend the backend/API cleanly instead of fetching a full dataset and filtering on the client.

---

## History ordering

Use reverse chronological ordering.

Example:

1. Today · Sep 8
2. Yesterday · Sep 7
3. Sep 6
4. Sep 5
5. ...

Days with no predictions must not be rendered.

Within a day, order entries consistently from newest/later match to earlier match unless the existing backend already defines an equivalent deterministic order.

---

## Timeline UI

Use a vertical timeline similar to the supplied sketch.

Each history item should be visually attached to a vertical status rail.

Settled prediction status markers:

- Correct → green success marker / check
- Wrong → red error marker / cross

Pending predictions remain in the History list, but must use a neutral visual state and must not affect settled statistics in the Hero.

Do not make timeline items clickable.

There is no History detail screen in this task.

---

## Prediction card content

Each prediction card must be self-contained.

Show:

- competition/league;
- match date/time when relevant;
- home team;
- away team;
- team crests if already supported by current match data;
- final score for settled matches;
- user's prediction;
- prediction type / market;
- result state: Correct / Wrong / Pending;
- earned reward in **cups**.

Do not display points as the reward unit for predictions.

Use the same trophy/cup terminology and iconography already used by the Predict experience.

---

## Pending behavior

A prediction must appear in History immediately after the user submits it.

Pending predictions:

- remain visible in chronological history;
- do not participate in player rating calculation;
- do not participate in Hero Correct/Wrong summary;
- show potential reward in cups where the product already has that value available;
- should not introduce live-match tracking into History.

History is not a duplicate of the Predict/Matches live screen.

For an unsettled match, use the existing match start/date-time information instead of pretending a final score exists.

---

## Hero card

The Hero should visually communicate the player's current Cup story.

Display dynamic content such as:

- Cup title, e.g. `Weekly Cup`;
- Cup date range;
- player position/rank;
- current accumulated Cup result;
- settled Correct / Wrong counts.

Pending must not be included in the Correct/Wrong summary.

Use the supplied Hero artwork:

`history-screen-hero.webp`

Suggested information hierarchy:

- Cup name
- Cup date range
- `Your position`
- `#12`
- accumulated result / cups value
- `12 correct · 6 wrong`

Match the supplied visual direction, but use real data.

---

## Important scoring terminology

Prediction rewards are shown in **cups**, not points.

Do not introduce misleading `pts` labels where the product concept is a cup reward.

Where leaderboard/ranking internals still use an existing score field, preserve backend compatibility, but present the correct product-facing terminology defined by the current app.

---

## Card styling

Do not use the previously rejected separate tinted footer panel at the bottom of each History card.

The lower information row should remain part of the same card surface.

Use subtle separators if needed.

Match existing project tokens for:

- background;
- borders;
- radii;
- typography;
- spacing;
- text colors;
- success/error states.

Avoid introducing an unrelated design system.

---

## Light / dark theme

The current application supports both themes.

The History screen must integrate with the existing theme system.

Do not hardcode a dark-only screen implementation.

The supplied sketch can represent the preferred dark appearance, but component colors must use the existing theme variables/tokens wherever possible.

The Hero artwork remains the same supplied image in both themes unless the current project architecture requires a theme-specific overlay for readability.

---

## Component architecture

Follow the existing project conventions.

Before creating new abstractions, inspect nearby React components and reuse established patterns.

Prefer small focused components where appropriate, for example:

- HistoryHero
- HistoryDayGroup
- HistoryTimeline
- HistoryPredictionCard
- HistoryStatusMarker

Names are illustrative only; follow the project's actual component naming conventions.

Do not over-engineer.

Use CSS Modules if that is the established pattern in the surrounding feature.

---

## API / backend

Use server-side filtering for the current player's current-Cup history.

Do not:

- download all players' predictions;
- download all historical predictions and filter them in the browser;
- introduce frontend mocks.

If a new endpoint is required, make it narrowly scoped to the authenticated/current user and current Cup.

Keep DTOs explicit and typed.

---

## Empty / loading / error states

Use existing application patterns.

At minimum:

- loading state;
- empty history state if the player has not made any prediction in the current Cup;
- error state consistent with the rest of the product.

Do not render artificial placeholder predictions.

---

## Responsive requirements

Primary target is the current Telegram/mobile viewport used by Predict and Cup.

Ensure:

- no horizontal overflow;
- long team/competition names do not break layout;
- status labels do not wrap awkwardly;
- reward values remain readable;
- Hero background crops safely;
- bottom navigation does not cover the final History item.

Reuse existing mobile layout constraints and safe-area handling.

---

## Acceptance criteria

The task is complete when:

1. The global `Rating` navigation entry is replaced with `History`.
2. The History screen is routed and accessible from bottom navigation.
3. The screen uses real current-Cup player prediction data.
4. No frontend mock data is used.
5. Predictions are grouped by day in reverse chronological order.
6. Days without predictions are omitted.
7. Pending predictions appear immediately after creation.
8. Pending does not affect Hero Correct/Wrong values or rating.
9. Correct/Wrong/Pending are visually distinguishable.
10. Prediction rewards are displayed in cups.
11. Each card shows enough information to explain the result without opening another screen.
12. Cards are not clickable.
13. There is no separate tinted footer area inside prediction cards.
14. The Hero uses exactly the supplied `history-screen-hero.webp` artwork.
15. Hero text/stats are real React/HTML content, not embedded into the image.
16. Existing Predict and Cup behavior remains intact.
17. The screen works with the existing light/dark theme.
18. TypeScript passes.
19. Lint passes if configured.
20. Production build passes if configured.

---

## Implementation process

Before changing code:

1. Inspect the current Predict screen.
2. Inspect the current Cup screen and Cup leaderboard.
3. Inspect bottom navigation/routing.
4. Inspect prediction and Cup API/DTO/domain models.
5. Inspect existing theme tokens and CSS Modules patterns.
6. Inspect how image assets are stored and referenced.

Then implement the smallest coherent set of backend/frontend changes required.

After implementation, run the project's available checks, including TypeScript, lint and build, and fix regressions caused by the task.

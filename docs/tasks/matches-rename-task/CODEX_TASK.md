# Rename Predict Screen to Matches — Codex Task

## Goal

Rename the current `Predict` product section to `Matches` across the application, including user-facing labels, routes where appropriate, React components, module/file names, imports, tests, and related documentation.

The purpose is to make the information architecture clearer:

- Matches — today's football matches and prediction actions
- Cup — current championship and leaderboard
- History — player's current-Cup prediction history
- Profile — player profile

This task is a refactor/rename. Do not change prediction mechanics or business behavior.

---

## Product decision

The main navigation should become:

- Matches
- Cup
- History
- Profile

The current `Predict` screen is semantically a Matches screen because its primary entity is the list of available/current matches, while predicting is an action performed on a match.

---

## User-facing copy

Replace the main screen title:

`Predict`

with:

`Matches`

Keep the current subtitle:

`Make your picks for today`

unless there is an existing centralized copy source that should be updated consistently.

The existing hero text such as:

`Today's predictions`

may remain unchanged because it describes the daily prediction allowance/state rather than the section name.

Bottom navigation label:

`Predict` → `Matches`

Do not rename prediction-specific copy where `predict`, `prediction`, `pick`, etc. are semantically correct.

Examples that should generally remain prediction terminology:

- prediction
- predictions
- My Picks
- Today's predictions
- Your pick
- prediction limits
- prediction DTOs/entities
- prediction settlement

The rename applies to the **screen/section concept**, not the domain concept of a prediction.

---

## Component and file renaming

Rename screen-level React components/files/modules whose responsibility is the current Predict screen/section.

Examples, depending on the actual project structure:

- `PredictPage` → `MatchesPage`
- `PredictScreen` → `MatchesScreen`
- `PredictView` → `MatchesView`
- `PredictHeader` → `MatchesHeader`
- `PredictSection` → `MatchesSection`

Rename corresponding files/directories where the current naming represents the screen/feature rather than the prediction domain.

Do not mechanically rename every symbol containing `Predict` or `Prediction`.

Before renaming, classify each usage:

### Rename
Screen/route/navigation/component names that mean “the Predict section”.

### Keep
Domain/business names that mean an actual prediction/pick.

Examples likely to keep:

- `Prediction`
- `PredictionType`
- `PredictionService`
- `PredictionRepository`
- `createPrediction`
- `submitPrediction`
- prediction API routes
- settlement logic
- prediction limits

The refactor must preserve semantic correctness.

---

## Route naming

Inspect the current route structure before changing routes.

If the UI route is currently something like:

`/predict`

rename it to:

`/matches`

only if this can be done safely and consistently within the existing routing architecture.

Update:

- navigation hrefs
- active-tab detection
- redirects
- route constants
- tests
- internal links
- any Telegram Mini App deep-link handling if applicable

If backward compatibility for `/predict` is useful and easy within the current framework, add a redirect from `/predict` to `/matches`.

Do not change backend prediction API endpoint names merely because the UI screen was renamed.

---

## Bottom navigation

Update the bottom navigation item:

`Predict` → `Matches`

The selected/active state must continue to work correctly.

Use the current football/match icon if it still fits the visual system.

Do not introduce a new icon dependency unless necessary.

---

## Imports and exports

Update all imports/exports affected by file or component renames.

Follow the project convention already established for React component exports.

If the project rules specify default exports for standalone React component files, preserve that convention after renaming.

Avoid compatibility aliases such as:

`export { MatchesPage as PredictPage }`

unless a temporary alias is genuinely required by existing architecture.

Prefer a clean rename.

---

## CSS Modules

Rename CSS module files/classes only when their names are screen-specific and the rename improves consistency.

Examples:

- `Predict.module.css` → `Matches.module.css`

Do not rename generic prediction-card classes that represent prediction-domain UI.

Update imports accordingly.

Do not alter visual styling as part of this task unless required by the renamed label width/layout.

---

## Types and domain model

Do not rename prediction-domain types/entities to “Match” types.

A `Prediction` is still a Prediction.

A `Match` is still a Match.

Preserve the distinction.

This task must not change:

- prediction calculation;
- prediction rewards;
- daily free/rewarded limits;
- match fetching;
- settlement;
- Cup participation;
- leaderboard scoring;
- History behavior.

---

## API/backend

No backend business changes should be necessary.

Do not rename prediction API endpoints or server-domain services unless a specific symbol is actually a UI/screen abstraction incorrectly named `Predict`.

Backend prediction terminology should remain prediction terminology.

---

## Tests

Update tests, snapshots, selectors, fixtures, and route assertions affected by the rename.

Do not weaken tests merely to make them pass.

Add/adjust coverage where useful for:

- `/matches` route
- bottom navigation active state
- old `/predict` redirect if implemented

---

## Documentation

Search project documentation for references to the UI section named `Predict`.

Update only references that mean the screen/section.

Do not replace domain-language uses of “predict/prediction” that remain correct.

If there are architecture/navigation docs, ensure they reflect:

`Matches | Cup | History | Profile`

---

## Search strategy

Before editing, inspect all relevant references.

Useful searches may include:

- `Predict`
- `predict`
- `/predict`
- `PredictPage`
- `PredictScreen`
- navigation definitions
- route constants

Review each match semantically before renaming.

Do not perform a blind global replacement.

---

## Acceptance criteria

The task is complete when:

1. The user-facing screen title is `Matches`.
2. Bottom navigation shows `Matches` instead of `Predict`.
3. The screen/section-level React components are renamed from Predict-oriented names to Matches-oriented names.
4. Screen-specific files/directories are renamed where appropriate.
5. Imports/exports are clean and consistent after the rename.
6. If the frontend route was `/predict`, the primary route is now `/matches`.
7. Internal navigation uses the new route.
8. `/predict` redirects to `/matches` if backward compatibility is implemented.
9. Prediction-domain entities/services/types/API names remain semantically correct and are not blindly renamed.
10. Existing prediction mechanics are unchanged.
11. Existing Cup and History behavior is unchanged.
12. Existing light/dark theme behavior is unchanged.
13. No duplicate legacy Predict components remain without a clear reason.
14. TypeScript passes.
15. Lint passes if configured.
16. Production build passes if configured.
17. Relevant tests pass.

---

## Implementation process

1. Inspect the current Predict screen implementation.
2. Inspect bottom navigation and route configuration.
3. Search all `Predict` / `/predict` references.
4. Classify every relevant usage as screen terminology vs prediction-domain terminology.
5. Rename screen-level components/files/routes.
6. Update navigation/imports/tests/docs.
7. Verify no prediction-domain concepts were incorrectly renamed.
8. Run TypeScript, lint, tests, and production build.
9. Fix regressions caused by the refactor.

Do not introduce unrelated refactors in this task.

# Codex Task — Cup Prizes Tab

Implement the Cup `Prizes` tab according to `SPEC.md`.

## Read before implementation

Before changing code, inspect all files supplied with this task:

- `CODEX_TASK.md` — implementation task;
- `SPEC.md` — functional/data specification;
- `prizes-dark.png` — approved dark-theme design;
- `prizes-light.png` — approved light-theme design;
- `podium-background.png` — production podium background asset.

The two design screenshots are visual references. Reproduce their composition, hierarchy, spacing and component structure as closely as practical within the existing Goalstery design system. Do not copy image-generation artifacts into the UI.

## Goal

Replace only the `History` tab inside the Cup screen with:

```text
Current Cup | Prizes
```

Do not modify the bottom-navigation `History` item or standalone History screen.

## Database

Add persistent prize configuration for each Cup.

Required semantics:
- Cup-level `prizeCurrency` enum: `USDT | TON`;
- default: `USDT`;
- persistent `prizeDistribution`;
- tier `amount` stored as Decimal.

Use the schema structure that best fits the existing project architecture while preserving the API contract in `SPEC.md`.

Do not implement business validation/normalization of administrator prize ranges.

### Initial prize distribution

As part of this task, immediately create/seed the prize distribution for the current Cup:

```ts
prizeCurrency: "USDT"

prizeDistribution: [
  { fromRank: 1,  toRank: 1,  amount: "3" },
  { fromRank: 2,  toRank: 2,  amount: "2" },
  { fromRank: 3,  toRank: 3,  amount: "1" },
  { fromRank: 4,  toRank: 10, amount: "0.5" },
  { fromRank: 11, toRank: 20, amount: "0.1" }
]
```

These values must exist in the database after the project's normal migration/seed/bootstrap procedure.

Use the existing project mechanism for development/current-Cup initialization. Do not create a parallel initialization system if one already exists.

Do not put these values into frontend mocks or fallback constants.

The distribution computes to `10.5 USDT`, but the UI must derive that value dynamically.

## API / bootstrap

Extend the existing `bootstrap/current-cup` payload with:

```ts
prizeCurrency
prizeDistribution
```

Do not add a separate frontend HTTP request for prizes.

Serialize Decimal `amount` values as strings.

## Frontend

Implement:
1. Prize Pool summary card.
2. Fixed TOP 3 podium.
3. `Other prizes`.
4. Dynamic informational block.
5. Empty state.

Use `podium-background.png` as the production background asset for the podium section.

Dynamic prize amounts/currency must be rendered by React from API data, not baked into the image.

## Prize pool

Remove the old hardcoded/independent `Prize pool 10 TON` source.

Compute total pool exclusively from `prizeDistribution` using decimal-safe arithmetic.

For the initial data the UI should naturally compute:

```text
10.5 USDT
```

Do not hardcode `10.5`.

## Podium mapping

TOP 3 always exist.

Map:
- rank 2 -> left / silver;
- rank 1 -> center / gold;
- rank 3 -> right / bronze.

Podium geometry and heights are fixed.

For the initial DB data the UI should render:
- 1st: `3 USDT`;
- 2nd: `2 USDT`;
- 3rd: `1 USDT`.

These values still come exclusively from the API.

## Other tiers

Render all remaining tiers in API order.

For the initial data this produces:
- `4th–10th` -> `0.5 USDT each`;
- `11th–20th` -> `0.1 USDT each`.

Do not sort, merge, split or normalize these tiers.

## Informational block

Derive both values dynamically:

```text
Top N players will receive {currency} prizes after the cup ends.
```

For the initial data it will render:

```text
Top 20 players will receive USDT prizes after the cup ends.
```

Do not hardcode `20` or `USDT` in the component.

## Empty state

When distribution is empty:
- Hero Prize pool: `—`;
- keep `Prizes` tab;
- show `Prize distribution is not available yet`;
- do not render the podium/tier list as if data existed.

## Design implementation

Review `prizes-dark.png` and `prizes-light.png` before coding.

Implement both themes using existing Goalstery theme tokens.

Use `podium-background.png` for the podium section.

Do not invent a separate visual language, hardcode generated screenshot colors unnecessarily, or bake dynamic data into assets.

## Tests

Add/update tests for at least:
- DB/current-Cup seed prize data;
- `bootstrap/current-cup` prize fields;
- Decimal -> string serialization;
- decimal-safe total calculation;
- expected `10.5 USDT` result from the seeded distribution;
- max rewarded rank;
- TOP 3 mapping;
- ordinary tiers preserve API order;
- empty state;
- Cup-internal `History` -> `Prizes`;
- bottom-nav History and standalone History remain unaffected.

## Acceptance criteria

- Current Cup selector is `Current Cup | Prizes`.
- Only Cup-internal History is replaced.
- Prize configuration is persistent in DB.
- Current Cup is seeded with `3 / 2 / 1 / 0.5 / 0.1 USDT` distribution.
- `bootstrap/current-cup` supplies all prize data.
- Currency is Cup-level enum.
- Amount is Decimal in DB and string in API.
- No frontend prize mocks/fallbacks.
- Hero prize pool is derived from distribution.
- Seeded distribution dynamically produces `10.5 USDT`.
- Prize Pool card is dynamic.
- Fixed podium uses the supplied production asset.
- TOP 3 values are dynamic.
- Other tiers preserve API order.
- `Top N` and currency are dynamic.
- Empty state matches `SPEC.md`.
- Light/dark designs follow supplied visual references.
- Existing History navigation/screen and unrelated behavior remain unchanged.

# Cup Prizes Tab — Specification

## Scope

Replace the `History` tab inside the Cup screen with a new `Prizes` tab.

Do **not** modify:
- the `History` item in bottom navigation;
- the standalone prediction History screen;
- routes or navigation behavior outside the Cup screen.

The Cup selector becomes:

```text
Current Cup | Prizes
```

## Data model

Prize configuration is stored in the database for each Cup and may be changed by an administrator at any time.

### Currency

Currency belongs to the Cup, not to individual prize tiers.

Supported enum:

```ts
type PrizeCurrency = "USDT" | "TON";
```

Default:

```text
USDT
```

Conceptual payload:

```ts
interface Cup {
  prizeCurrency: "USDT" | "TON";
  prizeDistribution: PrizeTier[];
}

interface PrizeTier {
  fromRank: number;
  toRank: number;
  amount: string;
}
```

`amount` is stored as `Decimal` in the database and serialized by the API as a string.

## Initial prize distribution

The current Cup must be initialized in the database with:

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

These must be real DB/seed data, not frontend mocks, fallbacks or hardcoded UI constants.

This distribution totals `10.5 USDT`, but `10.5` must never be used as an independent source of truth.

## Backend behavior

`bootstrap/current-cup` must include:

```ts
prizeCurrency
prizeDistribution
```

Do not add a separate request only for prizes.

`prizeDistribution` may be changed at any time by an administrator.

Do not add backend business validation or normalization for:
- overlapping ranges;
- gaps between ranges;
- ordering;
- rank continuity;
- distribution semantics.

The administrator is responsible for the stored configuration.

Persist `amount` as a decimal type and serialize it to the frontend as a string.

## Frontend source of truth

The frontend displays `prizeDistribution` as received from the API.

Do not:
- sort ordinary tiers;
- normalize ranges;
- merge tiers;
- split tiers;
- repair administrator data.

The only special mapping is the fixed TOP 3 podium:
- rank `1` -> center / gold;
- rank `2` -> left / silver;
- rank `3` -> right / bronze.

TOP 3 are guaranteed to exist.

All remaining tiers are rendered below the podium in API order.

## Prize pool calculation

Remove any independent/hardcoded prize pool value.

Both the Cup Hero and the `Prizes` tab derive total prize pool from `prizeDistribution`.

For each tier:

```text
winners = toRank - fromRank + 1
tierTotal = winners * amount
```

Total:

```text
sum(tierTotal)
```

Money calculations must be decimal-safe. Do not use ordinary JavaScript floating-point `number` arithmetic.

Use the project's existing decimal-safe utility/library if one exists; otherwise introduce the smallest suitable solution consistent with the architecture.

Formatting must remove insignificant trailing zeroes:

```text
3 USDT
0.5 USDT
0.1 USDT
```

For the initial distribution the computed result is:

```text
1 × 3     = 3 USDT
1 × 2     = 2 USDT
1 × 1     = 1 USDT
7 × 0.5   = 3.5 USDT
10 × 0.1  = 1 USDT

Total = 10.5 USDT
```

## Prize Pool card

The `Prizes` tab starts with a Prize Pool summary card.

It displays:
- trophy icon;
- `Prize pool`;
- computed total + `prizeCurrency`;
- `Top N players get rewarded`.

`N = max(prizeDistribution.toRank)`.

For the initial DB data this renders `Top 20 players get rewarded`, but `20` must not be hardcoded.

## Podium section

The podium is always present for a non-empty distribution.

Use the supplied production asset:

```text
podium-background.png
```

The asset is decorative. Do not bake dynamic amounts, currency or API data into it.

Overlay dynamic TOP 3 data from the API:
- left silver: rank 2;
- center gold: rank 1;
- right bronze: rank 3.

Podium geometry/heights are fixed and must not depend on prize amounts.

Use a dedicated podium component.

## Other prizes

Render all tiers except TOP 3 below the podium in API order.

For the initial DB data:

```text
4th–10th place
0.5 USDT each

11th–20th place
0.1 USDT each
```

The UI may format ordinal/range labels, but must not modify the underlying ranges.

## Informational block

At the bottom show:

```text
Top N players will receive {currency} prizes after the cup ends.
```

Where:
- `N = max(toRank)`;
- `{currency} = prizeCurrency`.

No hardcoded rank or currency.

## Empty state

If `prizeDistribution` is empty:

Hero:

```text
Prize pool
—
```

The `Prizes` tab remains visible.

Instead of podium/distribution show:

```text
Prize distribution is not available yet
```

## Themes and approved design

Implement both light and dark themes.

Visual references supplied with the task:
- `prizes-dark.png`
- `prizes-light.png`

These are the approved visual direction and must be reviewed before implementation.

Gold/silver/bronze podium visuals remain consistent across themes. All other UI should use existing Goalstery semantic/theme tokens.

Do not introduce an isolated dark visual system into light theme.

## Non-goals

Do not change:
- bottom-navigation `History`;
- standalone History screen;
- prediction History logic;
- tournament leaderboard logic;
- routes;
- match/prediction mechanics.

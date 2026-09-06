# Goalstery --- Project Decisions

**Status:** Authoritative decision register

This document records significant approved product, architecture,
domain, infrastructure, frontend and presentation decisions, plus known
unresolved decisions.

Detailed current-system behavior belongs to the relevant specification.
This register records **what was deliberately decided, why, and what
future work must not silently change**.

------------------------------------------------------------------------

# 1. Decision Guardrail

## Accepted decisions

A decision with `Status: Accepted` is authoritative until explicitly
superseded.

Accepted decisions are historically immutable. Do not silently:

``` text
modify
reinterpret
weaken
replace
supersede
"improve"
work around
effectively bypass
```

an Accepted decision.

If implementation appears to require such a change, stop before
implementing it and request explicit approval. The proposal must
identify:

``` text
affected decision
proposed change
reason
expected benefit
product/technical consequences
migration/compatibility impact, if any
whether it supersedes the existing decision
```

After approval, add a new decision with:

``` text
Supersedes: D-xxx
```

and annotate the old record with:

``` text
Superseded by: D-yyy
```

without rewriting its historical rationale/content.

## Open decisions

`Status: Open` records a known unresolved choice.

Do not silently resolve an Open Decision when the answer materially
affects product behavior or architecture. If implementation requires it,
stop and request an explicit decision.

## What belongs here

Record durable choices where meaningful alternatives existed and
changing direction later would have material product/architecture
consequences.

Do not use this register for ordinary implementation details such as CSS
pixels, class/function names, minor refactors or temporary debugging
choices.

------------------------------------------------------------------------

# 2. Decision Record Format

Accepted records use:

``` text
D-xxx — Title
Status
Date
Decision
Rationale
Consequences
```

Optional:

``` text
Supersedes
Superseded by
```

Open records use `OD-xxx` and state the unresolved question plus
already-approved constraints.

------------------------------------------------------------------------

# 3. Reading This File Efficiently

Do **not** read every decision for every task.

Read the decision IDs relevant to the task, together with the
authoritative specification routed by `AGENTS.md`.

Task-oriented groups:

``` text
Product / tournament / quota / prediction / prizes
D-001..D-014

Time / identity
D-015..D-017

Sports provider / outcome evaluation
D-018..D-020
OD-003 when mathematical-model work is involved

Football assets
D-020..D-024

Backend / infrastructure / concurrency / API
D-025..D-035

Telegram authentication
D-036..D-037

Frontend architecture
D-038..D-051

UI / presentation / MatchCard
D-052..D-059

Testing
D-060..D-062

Weekly Cup boundary
D-002 + OD-001

Changed/postponed fixture behavior
D-005..D-006 + OD-002

Prize distribution / payout
D-013..D-014 + OD-004

Rating expectation / calibration
D-011..D-012 + OD-003 + OD-005
```

When a task crosses several concerns, read all affected groups.

This routing is only a context optimization. It does not weaken
decisions outside the selected group.

------------------------------------------------------------------------

# Product Decisions

## D-001 --- Goalstery is free-to-play

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery is a free-to-play football prediction competition.

Users do not stake money or cryptocurrency to participate.

The product must not require:

-   stakes
-   deposits
-   entry fees
-   payment to make ordinary predictions
-   purchasing prediction points
-   conversion of prediction points into money
-   random prize lottery mechanics

TON is used for predetermined tournament prizes.

### Rationale

The core product is a skill-based football prediction competition rather
than a betting product.

The user's result is determined by football predictions and the
scoring/ranking rules.

### Consequences

Future monetization must not silently turn predictions into paid stakes.

Rewarded advertising may provide additional prediction opportunities
according to the product rules, but users are not wagering money.

Any proposal that changes this boundary requires an explicit new
decision.

------------------------------------------------------------------------

## D-002 --- Goalstery uses continuous Weekly Cups

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The core competition format is a sequence of continuous Weekly Cups.

When one Cup ends, the next Cup begins.

There is no participant registration gate.

A user's first prediction in an active Cup automatically creates
participation in that Cup.

Users may join after the Cup has started.

There is no late-entry compensation.

### Rationale

Participation should have minimal friction.

Users should be able to open Goalstery, make a prediction, and
immediately participate.

### Consequences

Tournament participation is created as a consequence of the first valid
prediction rather than through a separate registration workflow.

The exact weekly boundary remains an open decision.

------------------------------------------------------------------------

## D-003 --- Daily prediction quota is 3 free plus up to 5 rewarded

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Each user receives per Goalstery business day:

``` text
3 FREE prediction slots
+
up to 5 REWARDED prediction slots
=
maximum 8 new predictions
```

Unused quota does not carry over to another day.

Editing an existing prediction does not consume another slot.

### Rationale

The model provides meaningful free participation while allowing rewarded
advertising to extend daily engagement.

### Consequences

Quota enforcement is server-authoritative.

FREE and REWARDED slot identity must remain persisted and auditable.

------------------------------------------------------------------------

## D-004 --- Predictions are limited to the current Daily Match Pool

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

New predictions may only be created for fixtures belonging to the
current Goalstery calendar day's Daily Match Pool.

The calendar day is determined using Goalstery's canonical business
timezone.

### Rationale

The product is designed around a simple daily prediction experience
rather than arbitrary future fixture selection.

### Consequences

The backend must enforce Daily Match Pool membership.

Frontend filtering alone is not sufficient.

------------------------------------------------------------------------

## D-005 --- Prediction editing is locked strictly by kickoff time

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

An existing prediction may be edited according to:

``` text
now < fixture.kickoffAt
→ edit allowed

now >= fixture.kickoffAt
→ PREDICTION_LOCKED
```

`Fixture.status === OPEN` is not an additional edit condition.

### Rationale

Fixture lifecycle status must not prematurely prevent a user from
editing a prediction that is still before kickoff.

Kickoff time is the clear user-facing lock boundary.

### Consequences

The server must validate the rule transactionally.

Frontend editable state is informational and does not replace server
validation.

------------------------------------------------------------------------

## D-006 --- Editing preserves the original scoring snapshot

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Editing a prediction changes the selected outcome but preserves the
original:

-   `outcomeSnapshotId`
-   `slotType`
-   quota consumption
-   participant accounting
-   associated rewarded-ad consumption

Probability and potential points are recalculated for the newly selected
outcome using the same immutable snapshot.

### Rationale

A user must not gain access to later market information merely by
editing an existing prediction.

### Consequences

Outcome snapshots are immutable scoring evidence.

Prediction editing is not equivalent to deleting and creating a new
prediction.

------------------------------------------------------------------------

## D-007 --- MVP supports seven football competitions

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The initial supported competition set is:

1.  Premier League
2.  La Liga
3.  Serie A
4.  Bundesliga
5.  Ligue 1
6.  UEFA Champions League
7.  UEFA Europa League

### Rationale

This provides broad coverage of major European club football while
keeping initial scope manageable.

### Consequences

Runtime fixture eligibility must be constrained to supported active
competitions.

Adding competitions later does not inherently require a new project
decision unless it changes the product model.

------------------------------------------------------------------------

## D-008 --- Goalstery scoring uses normalized probabilities and bounded points

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery scoring probabilities are normalized after bookmaker overround
removal.

Potential points are calculated as:

``` ts
points = Math.round(
  Math.min(50, Math.max(7, 6.5 / probability))
)
```

where:

``` text
probability ∈ (0, 1]
```

A correct prediction receives its calculated points.

An incorrect prediction receives:

``` text
0
```

There are no negative points, streak multipliers, or other scoring
multipliers in the current model.

### Rationale

Harder predictions should provide larger rewards while point values
remain understandable and bounded.

### Consequences

Scoring must be reproducible from the persisted scoring snapshot and
scoring version.

------------------------------------------------------------------------

## D-009 --- Scoring snapshots are immutable

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Once an `OutcomeSnapshot` is published and used for scoring, it is
immutable.

Scoring stores sufficient information to reproduce the point values used
for a prediction.

### Rationale

Prediction scoring must remain auditable even when external odds or
model inputs later change.

### Consequences

Do not update historical snapshots in place.

A new market/scoring state requires a new snapshot.

------------------------------------------------------------------------

## D-010 --- Scoring calculations use persisted quantized probability

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Scoring persistence uses:

``` text
rawOdds       DECIMAL(12,6)
probabilities DECIMAL(10,8)
```

with:

``` text
ROUND_HALF_UP
```

Potential points are calculated from the quantized persisted
probability.

### Rationale

The value used to reproduce scoring must be exactly the value persisted
as scoring evidence.

### Consequences

Do not calculate final persisted points from a higher-precision
transient probability and then persist a different rounded probability.

------------------------------------------------------------------------

## D-011 --- Global Rating measures performance relative to expected difficulty

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Global Rating is based on performance relative to the expected value and
variance of the user's predictions rather than raw Cup points alone.

For prediction `i`:

``` text
E_i = p_i × points_i

Var_i = p_i × (1 - p_i) × points_i²
```

For a qualified Weekly Cup:

``` text
Z =
(ActualPoints - ExpectedPoints)
/
sqrt(sum Var_i)
```

A user requires at least:

``` text
10 predictions
```

in the Cup to qualify for rating calculation.

Qualified users are ranked by Z.

Actual percentile is compared with expected percentile using the rating
model.

Rating delta:

``` text
K × (ActualPercentile - ExpectedPercentile)
```

with:

``` text
K = 120 for the first 5 qualified Cups
K = 80 afterwards
```

Initial internal rating:

``` text
1500
```

The rating remains hidden until the user's first qualified Cup.

### Rationale

The system should reward prediction skill relative to prediction
difficulty instead of primarily rewarding users who repeatedly select
favorites.

### Consequences

Global Rating and Weekly Cup raw ranking represent different concepts.

Do not substitute raw Cup points for rating performance.

------------------------------------------------------------------------

## D-012 --- Rating leagues are derived from rating thresholds

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Rating league thresholds are:

``` text
<1200      BRONZE_III
1200       BRONZE_II
1300       BRONZE_I
1400       SILVER_III
1450       SILVER_II
1500       SILVER_I
1550       GOLD_III
1650       GOLD_II
1750       GOLD_I
1850       PLATINUM_III
1925       PLATINUM_II
2000       PLATINUM_I
2075       DIAMOND_III
2150       DIAMOND_II
2225       DIAMOND_I
2300       MASTER
2450+      LEGEND
```

### Rationale

League labels provide understandable progression over the continuous
numerical rating.

### Consequences

League identity is derived from rating and should not become an
independent manually mutable progression system.

------------------------------------------------------------------------

## D-013 --- Prize amounts use nanoTON integer storage

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

TON prize amounts are persisted as integer nanoTON values using
`BigInt`.

``` text
1 TON = 1,000,000,000 nanoTON
```

The UI may present less precision than the storage representation.

### Rationale

Monetary/cryptocurrency amounts must not use binary floating-point
persistence.

### Consequences

Do not persist prize amounts using JavaScript `number`/database
floating-point types.

Presentation precision and persistence precision are separate concerns.

------------------------------------------------------------------------

## D-014 --- MVP TON payouts use manual PrizeClaim workflow

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The MVP does not automatically transfer TON immediately after tournament
settlement.

Prizes and claims are persisted, and payout is handled through the
PrizeClaim workflow.

A wallet is required when claiming a prize rather than as a prerequisite
for ordinary participation.

### Rationale

This keeps wallet integration and payout risk isolated from the core
prediction experience during MVP development.

### Consequences

Ordinary users can participate without connecting a TON wallet.

Automated on-chain payout can be considered later as a separate
decision.

------------------------------------------------------------------------

# Time and Identity Decisions

## D-015 --- Europe/London is the canonical business timezone

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery uses:

``` text
Europe/London
```

as its canonical business timezone.

Database timestamps remain UTC/timezone-aware.

Business-day calculations are derived using Europe/London.

### Rationale

A single explicit timezone is required for deterministic daily quotas,
match pools, and tournament boundaries.

### Consequences

Do not use:

-   device timezone
-   server local timezone
-   browser timezone
-   fixed UTC offset

as the authoritative Goalstery business calendar.

DST must be handled using timezone-aware logic.

------------------------------------------------------------------------

## D-016 --- Business time uses an injectable Clock abstraction

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Time-sensitive business logic uses:

``` ts
interface Clock {
  now(): Date;
}
```

with implementations such as:

``` text
SystemClock
FixedClock
```

### Rationale

Prediction locking, quotas, tournament boundaries, and London calendar
behavior must be deterministic and testable.

### Consequences

Do not scatter direct `new Date()` calls through business-domain
services when the time affects business correctness.

------------------------------------------------------------------------

## D-017 --- Internal database entities use UUID identity

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery uses internal UUID identifiers for primary application
entities.

External provider identities and Telegram identities are stored
separately.

### Rationale

Goalstery entity identity must not depend on a third-party provider's
identifier space.

### Consequences

Provider IDs must not become Goalstery primary keys.

------------------------------------------------------------------------

# External Provider and Football Data Decisions

## D-018 --- External sports providers are behind an adapter boundary

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

External sports data integration must use an internal provider
abstraction.

Goalstery domain/application services must not depend directly on
API-Football-specific response structures.

Current development may use an in-memory provider implementation for
tests.

### Rationale

External provider contracts, plans, availability, and pricing can
change.

Goalstery business logic should depend on its own internal sports-data
contract.

### Consequences

Provider-specific parsing and identifiers remain inside provider
integration boundaries.

Changing sports-data provider should not require rewriting core
prediction-domain logic.

------------------------------------------------------------------------

## D-019 --- Match acquisition and outcome evaluation are separate concerns

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery separates:

``` text
fixture / competition / team data acquisition
```

from:

``` text
outcome probability evaluation
```

An external football-data provider may supply factual football data
required to discover and maintain fixtures.

Goalstery's outcome evaluation is an independent application concern.

The long-term direction is to evaluate match outcomes using Goalstery's
own mathematical model and historical data rather than making an
external provider's prediction product the core prediction engine.

The exact mathematical model is not defined by this decision.

### Rationale

Fixture data and predictive intelligence have different requirements.

Separating them prevents Goalstery's scoring/product model from becoming
dependent on a provider's proprietary predictions.

It also allows the predictive model to evolve independently.

### Consequences

Do not design the sports-provider adapter as though provider predictions
are necessarily the authoritative Goalstery probability source.

Future mathematical-model architecture requires separate design and
approval.

------------------------------------------------------------------------

## D-020 --- API-Football IDs are provider identities, not Goalstery presentation identities

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

API-Football league/team IDs may be persisted or mapped as provider
identities.

They must not be used as Goalstery's canonical presentation identity.

### Rationale

Provider IDs are meaningful inside the provider boundary but are
unsuitable as stable application presentation identifiers.

### Consequences

Assets and presentation identity use Goalstery canonical slugs.

------------------------------------------------------------------------

# Football Asset Decisions

## D-021 --- Football assets use Goalstery canonical slugs

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Teams and competitions have stable Goalstery canonical slugs.

Examples:

``` text
arsenal
manchester-united
paris-saint-germain
premier-league
uefa-champions-league
```

Slugs are:

-   lowercase
-   ASCII
-   kebab-case
-   human-readable
-   stable
-   provider-independent

### Rationale

Display names may change and external provider IDs belong to external
identity domains.

Goalstery needs a stable presentation identity.

### Consequences

Do not generate canonical slugs at runtime from current display names.

A name change does not automatically imply a slug change.

------------------------------------------------------------------------

## D-022 --- Football assets are local runtime assets

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery runtime football logos are served from local application
assets:

``` text
/assets/teams/<slug>.webp
/assets/competitions/<slug>.webp
```

The canonical manifest maps provider identity to Goalstery canonical
asset identity.

### Rationale

Runtime UI should not depend on provider CDN availability or
provider-specific URL structure.

### Consequences

Provider logo URLs may exist in tooling/download reports but are not
frontend runtime asset contracts.

------------------------------------------------------------------------

## D-023 --- Frontend must not derive asset identity from names or provider IDs

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Frontend asset resolution uses canonical slugs supplied by the
application/API.

Frontend must not:

``` text
slugify(team.name)
```

or construct runtime asset paths from provider IDs.

### Rationale

Presentation identity must be explicit and deterministic.

### Consequences

Unknown/unmapped provider entities must be handled explicitly rather
than silently assigned an inferred canonical asset identity.

------------------------------------------------------------------------

## D-024 --- Source football logos are not visually rewritten

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery does not recolor or create fake near-copies of
team/competition logos merely to fit a theme.

Contrast is provided by Goalstery's surrounding presentation, such as
neutral logo badges.

### Rationale

Team/competition identity should remain visually recognizable and should
not be distorted by application theming.

### Consequences

Dark-mode compatibility is solved by component presentation rather than
destructive logo recoloring.

Commercial use of third-party marks remains subject to appropriate
rights/trademark review.

------------------------------------------------------------------------

# Backend and Infrastructure Decisions

## D-025 --- Goalstery uses PostgreSQL as its application database

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

PostgreSQL is the primary persistent database for Goalstery.

### Rationale

The product requires transactional consistency, relational constraints,
concurrency control, and durable historical data.

### Consequences

Core application correctness should use PostgreSQL capabilities where
appropriate rather than recreating database guarantees in memory.

------------------------------------------------------------------------

## D-026 --- Prisma is the database access layer

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery uses Prisma for application database access.

The currently approved project version is pinned according to the
technical specification/project configuration.

### Rationale

Prisma provides the project's typed database client and migration
workflow.

### Consequences

Do not introduce a parallel ORM/query architecture without explicit
approval.

Direct SQL remains acceptable where required for database capabilities
such as locking/advisory locking that are not appropriately expressed
through the ordinary ORM API.

------------------------------------------------------------------------

## D-027 --- No mechanical repository layer over Prisma

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery does not require a repository wrapper around every Prisma
model.

### Rationale

A mechanical repository layer would add indirection without creating a
meaningful domain boundary.

### Consequences

Services may use Prisma through the established database boundary.

Create an abstraction only when it provides real semantic or integration
value.

------------------------------------------------------------------------

## D-028 --- Backend HTTP API remains inside the Next.js project for MVP

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The Goalstery frontend and HTTP backend are implemented within the same
Next.js project.

Next.js App Router route handlers provide the current HTTP API.

### Rationale

A separate backend service would add deployment and development
complexity without current product benefit.

### Consequences

Do not split the HTTP backend into a separate service merely for
architectural purity.

A future split would require a new explicit decision.

------------------------------------------------------------------------

## D-029 --- Background workers may run as separate Node processes

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Background processing that should not live in request/response route
handlers may run as separate Node processes.

Production processes may be managed independently, for example through
systemd.

### Rationale

Long-running/background work has a different lifecycle from HTTP
requests while not requiring a separate microservice architecture.

### Consequences

Separate worker processes do not imply separate microservices or
separate domain ownership.

------------------------------------------------------------------------

## D-030 --- Redis is not part of the MVP architecture

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery MVP does not use Redis.

### Rationale

Current concurrency, idempotency, quota, and persistence requirements
can be implemented using PostgreSQL and application processes without
introducing another infrastructure dependency.

### Consequences

Do not add Redis for:

-   caching
-   locks
-   quota counters
-   idempotency
-   queues

merely as a conventional infrastructure choice.

If a concrete future requirement justifies Redis, it requires a new
explicit decision.

------------------------------------------------------------------------

## D-031 --- Goalstery does not use premature distributed architecture

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Do not introduce architecture such as:

-   microservices
-   Kafka
-   Kubernetes
-   event sourcing
-   CQRS

without a concrete requirement and explicit approval.

### Rationale

The current product does not justify the operational and conceptual
complexity of distributed infrastructure.

### Consequences

Prefer the simplest architecture that satisfies actual correctness and
scaling requirements.

------------------------------------------------------------------------

## D-032 --- Database constraints and application validation are complementary

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery uses both:

``` text
database constraints
+
application validation
```

where appropriate.

Database constraints protect durable invariants.

Application validation provides domain semantics and useful errors.

### Rationale

Application checks alone are insufficient under concurrency, while raw
database errors alone provide poor domain behavior.

### Consequences

Do not remove a meaningful database constraint merely because equivalent
application validation exists.

------------------------------------------------------------------------

## D-033 --- Concurrency-sensitive workflows must be concurrency-aware by design

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Workflows such as:

-   prediction creation
-   quota consumption
-   rewarded slot consumption
-   idempotency
-   scoring snapshot publication

must be designed for concurrent requests.

PostgreSQL transactional locking/advisory locking may be used where
appropriate.

### Rationale

Sequential unit-test correctness does not guarantee correctness under
simultaneous user requests.

### Consequences

Concurrency behavior is part of domain correctness and must be tested
where meaningful.

------------------------------------------------------------------------

## D-034 --- API operations use stable typed error codes

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery HTTP APIs expose stable machine-readable error codes.

General shape:

``` json
{
  "error": {
    "code": "PREDICTION_LOCKED",
    "message": "Prediction is locked",
    "details": {}
  }
}
```

### Rationale

Frontend behavior and localization must not depend on arbitrary
exception strings.

### Consequences

Frontend maps stable error codes to localized presentation.

Do not use raw backend exception messages as the UI contract.

------------------------------------------------------------------------

## D-035 --- Prediction creation is idempotent

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Prediction creation requires an idempotency key.

Idempotency is scoped by the appropriate user/operation/key identity and
must remain correct under concurrent requests.

### Rationale

Mobile/network retries and duplicate taps must not create duplicate
business effects.

### Consequences

Idempotency is a server correctness feature, not merely frontend
duplicate-button protection.

------------------------------------------------------------------------

# Authentication Decisions

## D-036 --- Telegram initData is the Mini App authentication boundary

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery authenticates Telegram Mini App API requests using Telegram
`initData`.

The frontend sends raw initData using:

``` text
X-Telegram-Init-Data
```

The backend validates it using Telegram's authentication rules and the
server-only bot token.

### Rationale

Client-supplied Telegram user profile fields are not trusted
authentication evidence.

### Consequences

Do not trust a separately supplied:

``` text
userId
telegramUserId
username
```

as authentication.

Bot token must never be exposed to the frontend.

------------------------------------------------------------------------

## D-037 --- Production has no Telegram authentication bypass

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Development tooling may provide controlled development initData support.

Production must not contain a bypass that skips Telegram initData
verification.

### Rationale

Development convenience must not weaken the production authentication
boundary.

### Consequences

Environment-specific development helpers must fail closed in production.

------------------------------------------------------------------------

# Frontend Architecture Decisions

## D-038 --- Frontend uses feature-oriented component organization

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery frontend components are primarily organized by product
feature.

Examples:

``` text
components/predict/
components/cup/
components/rating/
components/profile/
components/settings/
```

`components/common/` is reserved for genuinely shared UI concepts.

### Rationale

Feature ownership is easier to understand and modify than a large
generic component taxonomy.

### Consequences

Do not prematurely move feature-specific components into global shared
directories.

------------------------------------------------------------------------

## D-039 --- Goalstery uses practical Server/Client Component boundaries

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Next.js Server Components are used where natural.

Interactive Telegram/browser feature boundaries use Client Components.

The project does not attempt to make all frontend code server-rendered,
nor does it make the entire application client-only by default.

### Rationale

Goalstery is a highly interactive Telegram Mini App but still benefits
from clear Next.js boundaries.

### Consequences

`"use client"` should be introduced where required, at the smallest
practical understandable boundary.

------------------------------------------------------------------------

## D-040 --- Presentation components do not fetch application data

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Frontend data flow follows:

``` text
typed API client
→ feature/screen orchestration
→ state
→ presentation component
```

Presentation components such as MatchCard do not independently fetch
Goalstery API data.

### Rationale

Networking and presentation are separate responsibilities.

### Consequences

Feature components receive prepared data and callbacks rather than
owning HTTP implementation.

------------------------------------------------------------------------

## D-041 --- Goalstery uses a custom typed API client without a fetching/cache framework

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery uses its existing custom typed API client and explicit feature
orchestration.

Do not add:

-   TanStack Query / React Query
-   SWR
-   Apollo Client
-   RTK Query
-   Relay
-   equivalent fetching/cache frameworks

without an explicit future decision.

Do not build an ad hoc replacement cache framework merely to bypass this
decision.

### Rationale

Current application requirements do not justify another server-state
abstraction.

### Consequences

If dedicated client caching becomes necessary, it must be evaluated as
an explicit architectural change.

------------------------------------------------------------------------

## D-042 --- Zustand is used selectively

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Zustand is used for state that genuinely requires shared
application/feature ownership.

Local component state remains ordinary React state.

Server data is not automatically copied into Zustand.

### Rationale

Globalizing all state creates unnecessary synchronization and ownership
complexity.

### Consequences

Every mutable frontend state should have a clear owner.

------------------------------------------------------------------------

## D-043 --- Goalstery does not use optimistic UI by default

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Correctness-sensitive mutations are not shown as successfully persisted
until the server confirms success.

Typical flow:

``` text
user action
→ pending
→ server request
→ server confirmation
→ authoritative UI refresh/update
```

### Rationale

Prediction creation/editing affects quota, scoring evidence, rewarded
slots, idempotency, and tournament state.

Incorrect optimistic state would be misleading.

### Consequences

Pending controls should prevent accidental duplicate actions.

Selective optimistic behavior in the future requires an explicit
decision where appropriate.

------------------------------------------------------------------------

## D-044 --- HTTP DTOs and frontend presentation models are separate

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery treats these as separate concepts:

``` text
Prisma model
≠
backend domain model
≠
HTTP DTO
≠
frontend presentation model
```

Frontend code must not import Prisma-generated model types as its UI
contract.

### Rationale

Persistence structure, HTTP contract, and presentation requirements
evolve for different reasons.

### Consequences

Presentation mapping is explicit where the UI requires a representation
different from the raw HTTP DTO.

------------------------------------------------------------------------

## D-045 --- Goalstery does not use a third-party UI component library

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery's production UI is built using:

``` text
React
+
CSS Modules
+
Goalstery components
+
Goalstery design system
```

Do not add a third-party UI component framework without an explicit
future decision.

### Rationale

Goalstery has its own product-specific visual identity and approved
design system.

### Consequences

Do not introduce MUI, Ant Design, Chakra, Mantine, Bootstrap component
frameworks, shadcn/ui as an application design system, or similar
libraries as an implementation shortcut.

------------------------------------------------------------------------

## D-046 --- Goalstery uses CSS Modules

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Component presentation uses CSS Modules.

Global CSS is reserved for genuinely global concerns such as reset, root
behavior, and semantic theme tokens.

Inline styles are reserved for genuinely runtime-computed values.

### Rationale

CSS Modules provide explicit component-local styling without introducing
runtime styling infrastructure.

### Consequences

Do not introduce CSS-in-JS or migrate to Tailwind as part of unrelated
work.

------------------------------------------------------------------------

## D-047 --- Goalstery uses its own SVG icons

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery does not use a third-party icon library.

Application icons are local SVG assets or Goalstery-maintained SVG React
components.

### Rationale

The application currently does not need an additional icon dependency
and should maintain consistent visual control.

### Consequences

Do not add Lucide, Font Awesome, Heroicons packages, Material Icons,
Phosphor, or similar icon libraries without explicit approval.

------------------------------------------------------------------------

## D-048 --- Goalstery does not use a form framework by default

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Simple frontend forms use ordinary React state and the established
application architecture.

Do not add a form framework solely for future convenience.

### Rationale

Current forms do not justify another architectural dependency.

### Consequences

If genuinely complex form requirements appear later, form tooling can be
evaluated separately.

Backend validation remains authoritative.

------------------------------------------------------------------------

## D-049 --- Frontend uses `@/` source imports and direct module imports

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Internal source imports use the project's:

``` text
@/
```

alias where appropriate.

Direct module imports are preferred over broad barrel files.

Example:

``` ts
import { MatchCard } from "@/components/predict/MatchCard";
```

### Rationale

Direct ownership is easier to understand and reduces hidden
dependency/circular-import risk.

### Consequences

Do not create broad `index.ts` barrels merely to shorten imports.

------------------------------------------------------------------------

## D-050 --- Components are split by responsibility, not arbitrary line count

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery has no arbitrary maximum component line count.

Components are extracted when there is a meaningful responsibility,
reuse boundary, interaction boundary, or presentation concept.

### Rationale

Both god components and excessive micro-component fragmentation reduce
maintainability.

### Consequences

Codex must not refactor components solely to satisfy an invented
file/function size rule.

------------------------------------------------------------------------

## D-051 --- Future feature abstractions are created from actual requirements

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Cup, Rating, Profile, achievements, prizes, and other future feature UI
architecture are not generalized in advance.

Preferred evolution:

``` text
specific requirement
→ specific implementation
→ observed stable reuse
→ shared abstraction
```

### Rationale

Premature abstractions force unknown future requirements into
assumptions made too early.

### Consequences

Do not build speculative universal sports components merely because
future screens might need them.

------------------------------------------------------------------------

# UI and Presentation Decisions

## D-052 --- Prediction outcomes are presented as 1 / X / 2

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Prediction outcome presentation uses:

``` text
HOME → 1
DRAW → X
AWAY → 2
```

Domain semantics remain:

``` text
HOME
DRAW
AWAY
```

### Rationale

`1 / X / 2` is compact and familiar football prediction notation.

### Consequences

Do not rename domain values to `1`, `X`, and `2`.

The mapping must be explicit and must not depend on DOM direction or RTL
layout.

------------------------------------------------------------------------

## D-053 --- Domain points are presented as trophy plus numeric value

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The domain and backend continue to use:

``` text
points
```

The prediction UI presents potential scoring as:

``` text
trophy SVG + numeric value
```

For example:

``` text
[trophy] 10
```

rather than:

``` text
10 pts
10 оч.
```

### Rationale

The trophy treatment provides a compact language-independent reward
representation while preserving correct domain terminology.

### Consequences

Do not rename backend/domain points to trophies.

The trophy is a presentation metaphor only.

------------------------------------------------------------------------

## D-054 --- Selected prediction state uses visual state rather than redundant status text

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

A selected prediction outcome is communicated through the approved
selected-state styling and accessibility state.

Do not add redundant visible labels such as:

``` text
Selected Draw
Selected Home
```

unless a future product requirement explicitly requires them.

### Rationale

The selected control itself already communicates the choice.

Additional status text adds vertical noise to a compact mobile
interface.

### Consequences

Accessibility state must still communicate selection without relying
solely on color.

------------------------------------------------------------------------

## D-055 --- Team logos use a neutral contrast badge

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Team logos are rendered on a neutral/lifted badge that preserves
contrast in both light and dark themes.

In dark theme, the badge intentionally remains light-neutral rather than
forcing the source logo to adapt to the dark surface.

### Rationale

Many football logos contain dark elements that disappear directly
against a dark card.

A neutral badge provides consistent contrast without recoloring
trademarks.

### Consequences

Do not implement automatic logo recoloring/darkness detection merely to
solve ordinary theme contrast.

------------------------------------------------------------------------

## D-056 --- MatchCard uses logo-above-name team layout

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

The approved MatchCard layout places:

``` text
team logo
↓
team name
```

on each side, with:

``` text
VS
```

between the team-name regions.

Team names support up to two lines rather than being forced into
one-line ellipsis.

### Rationale

Football team names are frequently too long for a horizontal
logo-plus-name layout on mobile.

The vertical team identity layout gives names sufficient width while
preserving prominent club logos.

### Consequences

MatchCard implementation must follow the approved component
reference/specification rather than reverting to horizontal team
identity layout.

------------------------------------------------------------------------

## D-057 --- Goalstery is mobile-first with 390 px as the primary visual target

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery UI is designed mobile-first.

Primary visual verification target:

``` text
390 × 844
```

Required width sanity checks for significant UI work:

``` text
360
390
430
```

### Rationale

Goalstery is primarily a Telegram Mini App running on phones.

### Consequences

Desktop-style layouts squeezed into mobile width are not acceptable.

Additional width should normally provide breathing room rather than
radically changing the mobile interaction model.

------------------------------------------------------------------------

## D-058 --- Light, dark, localization, and RTL are first-class UI requirements

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery production UI supports:

``` text
appearance:
system
light
dark

locales:
en
ru
de
es
ar
```

Arabic RTL is a first-class supported layout.

### Rationale

These capabilities are part of the product rather than optional
post-launch polish.

### Consequences

Significant UI changes must preserve:

-   light theme
-   dark theme
-   localization
-   RTL
-   stable domain semantics

------------------------------------------------------------------------

## D-059 --- Approved visual references are implementation targets

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

When a component has an approved reference image and component-specific
design specification, they are authoritative implementation targets.

The reference is not merely visual inspiration.

For current MatchCard V2:

``` text
docs/design/predict-card-v2-reference.png
docs/design/predict-card-v2-spec.md
```

are authoritative.

### Rationale

Text-only visual instructions leave too much room for interpretation.

### Consequences

Visual implementation should include browser rendering and screenshot
comparison where the environment permits it.

Do not claim pixel-close fidelity without actual comparison.

Obsolete references under:

``` text
docs/design/archive/
```

are non-authoritative.

------------------------------------------------------------------------

# Testing Decisions

## D-060 --- Testing follows responsibility boundaries

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Goalstery testing follows the conceptual split:

``` text
domain/backend tests
→ business correctness

frontend unit tests
→ meaningful presentation/state transformations

integration/browser tests
→ critical user interactions

visual screenshot sanity
→ approved visual fidelity
```

### Rationale

Different classes of defects are best caught at different layers.

### Consequences

Do not duplicate every business rule at every test layer.

Do not write frontend tests merely because a React component exists.

------------------------------------------------------------------------

## D-061 --- Concurrency correctness is explicitly tested

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Concurrency-sensitive workflows require tests that exercise simultaneous
operations where practical.

This particularly includes:

-   prediction creation
-   idempotency
-   quota consumption
-   rewarded slot consumption
-   snapshot publication

### Rationale

Sequential tests cannot detect important race conditions.

### Consequences

A workflow is not considered fully validated merely because
single-request tests pass.

------------------------------------------------------------------------

## D-062 --- Visual geometry is verified visually rather than through brittle CSS unit tests

**Status:** Accepted\
**Date:** 2026-09-06

### Decision

Exact component geometry from approved visual specifications is not
validated through brittle unit assertions against CSS implementation
details.

Visual fidelity is verified through:

-   component specification
-   browser rendering
-   screenshot comparison
-   required viewport sanity checks

### Rationale

Tests asserting individual CSS pixel values provide little protection
against actual visual regressions and strongly couple tests to
implementation details.

### Consequences

Do not create unit tests solely to assert values such as:

``` text
border-radius = 24px
padding = 20px
```

when the requirement is visual fidelity.

------------------------------------------------------------------------

# Open Decisions

Open Decisions are known unresolved project decisions.

They are not Accepted decisions.

Codex must not silently choose an answer to an Open Decision when the
answer materially affects product behavior or architecture.

If implementation requires resolving an Open Decision, Codex must stop
and request an explicit decision.

------------------------------------------------------------------------

## OD-001 --- Exact Weekly Cup boundary

**Status:** Open

### Question

What exact weekday and Europe/London local time define the boundary
between consecutive Weekly Cups?

### Current constraint

Weekly Cups are continuous.

When one Cup ends, the next begins.

The exact boundary has not yet been approved.

------------------------------------------------------------------------

## OD-002 --- Postponed / cancelled / abandoned / rescheduled fixture policy

**Status:** Open

### Question

How should Goalstery handle predictions when a fixture is:

-   postponed
-   cancelled
-   abandoned
-   rescheduled
-   otherwise materially changed after publication

### Current constraint

Existing prediction editing is governed by the approved kickoff-lock
decision.

This Open Decision must not be resolved by silently adding
`Fixture.status` as an additional prediction-edit lock condition.

------------------------------------------------------------------------

## OD-003 --- Goalstery mathematical outcome model

**Status:** Open

### Question

What mathematical/statistical model will Goalstery use to independently
estimate football match outcome probabilities?

### Current constraint

Fixture acquisition and outcome evaluation are separate concerns under
D-019.

The model may use historical football data and Goalstery-owned
calculations.

The exact model, feature set, training/calibration methodology, update
cadence, and validation methodology have not yet been approved.

------------------------------------------------------------------------

------------------------------------------------------------------------

## OD-004 --- Exact Prize Distribution by winning rank

**Status:** Open

### Question

How should the fixed Weekly Cup Prize Pool be distributed between winning
ranks?

### Current constraint

The Prize Pool itself is fixed before Tournament start.

The exact rank → amount distribution has intentionally been deferred and
must not be inferred from historical examples, seed data or implementation.

MVP payout execution remains manual according to `D-014`.

------------------------------------------------------------------------

## OD-005 --- Global Rating expected-percentile model and calibration

**Status:** Open

### Question

What exact model converts a player's current rating relative to the
qualified field into `expectedPercentile`, and how should the model and
League thresholds be calibrated?

### Current constraint

`D-011` remains authoritative for the accepted Global Rating structure:

```text
performance Z
→ actualPercentile
→ compare with expectedPercentile
→ ratingDelta
```

The exact `expectedPercentile` calculation is not yet approved.

This decision should be resolved together with the planned mathematical
model/simulation/calibration work. Codex must not invent the formula or
silently recalibrate League thresholds.


# Decision Index

## Accepted

`D-001` --- Goalstery is free-to-play `D-002` --- Goalstery uses
continuous Weekly Cups `D-003` --- Daily prediction quota is 3 free plus
up to 5 rewarded `D-004` --- Predictions are limited to the current
Daily Match Pool `D-005` --- Prediction editing is locked strictly by
kickoff time `D-006` --- Editing preserves the original scoring snapshot
`D-007` --- MVP supports seven football competitions `D-008` ---
Goalstery scoring uses normalized probabilities and bounded points
`D-009` --- Scoring snapshots are immutable `D-010` --- Scoring
calculations use persisted quantized probability `D-011` --- Global
Rating measures performance relative to expected difficulty `D-012` ---
Rating leagues are derived from rating thresholds `D-013` --- Prize
amounts use nanoTON integer storage `D-014` --- MVP TON payouts use
manual PrizeClaim workflow `D-015` --- Europe/London is the canonical
business timezone `D-016` --- Business time uses an injectable Clock
abstraction `D-017` --- Internal database entities use UUID identity
`D-018` --- External sports providers are behind an adapter boundary
`D-019` --- Match acquisition and outcome evaluation are separate
concerns `D-020` --- API-Football IDs are provider identities, not
Goalstery presentation identities `D-021` --- Football assets use
Goalstery canonical slugs `D-022` --- Football assets are local runtime
assets `D-023` --- Frontend must not derive asset identity from names or
provider IDs `D-024` --- Source football logos are not visually
rewritten `D-025` --- Goalstery uses PostgreSQL as its application
database `D-026` --- Prisma is the database access layer `D-027` --- No
mechanical repository layer over Prisma `D-028` --- Backend HTTP API
remains inside the Next.js project for MVP `D-029` --- Background
workers may run as separate Node processes `D-030` --- Redis is not part
of the MVP architecture `D-031` --- Goalstery does not use premature
distributed architecture `D-032` --- Database constraints and
application validation are complementary `D-033` ---
Concurrency-sensitive workflows must be concurrency-aware by design
`D-034` --- API operations use stable typed error codes `D-035` ---
Prediction creation is idempotent `D-036` --- Telegram initData is the
Mini App authentication boundary `D-037` --- Production has no Telegram
authentication bypass `D-038` --- Frontend uses feature-oriented
component organization `D-039` --- Goalstery uses practical
Server/Client Component boundaries `D-040` --- Presentation components
do not fetch application data `D-041` --- Goalstery uses a custom typed
API client without a fetching/cache framework `D-042` --- Zustand is
used selectively `D-043` --- Goalstery does not use optimistic UI by
default `D-044` --- HTTP DTOs and frontend presentation models are
separate `D-045` --- Goalstery does not use a third-party UI component
library `D-046` --- Goalstery uses CSS Modules `D-047` --- Goalstery
uses its own SVG icons `D-048` --- Goalstery does not use a form
framework by default `D-049` --- Frontend uses `@/` source imports and
direct module imports `D-050` --- Components are split by
responsibility, not arbitrary line count `D-051` --- Future feature
abstractions are created from actual requirements `D-052` --- Prediction
outcomes are presented as 1 / X / 2 `D-053` --- Domain points are
presented as trophy plus numeric value `D-054` --- Selected prediction
state uses visual state rather than redundant status text `D-055` ---
Team logos use a neutral contrast badge `D-056` --- MatchCard uses
logo-above-name team layout `D-057` --- Goalstery is mobile-first with
390 px as the primary visual target `D-058` --- Light, dark,
localization, and RTL are first-class UI requirements `D-059` ---
Approved visual references are implementation targets `D-060` ---
Testing follows responsibility boundaries `D-061` --- Concurrency
correctness is explicitly tested `D-062` --- Visual geometry is verified
visually rather than through brittle CSS unit tests

## Open

`OD-001` --- Exact Weekly Cup boundary `OD-002` --- Postponed /
cancelled / abandoned / rescheduled fixture policy `OD-003` ---
Goalstery mathematical outcome model

------------------------------------------------------------------------

# Maintenance

When a significant decision is explicitly approved:

``` text
1. assign the next sequential D-xxx
2. record date, decision, rationale and meaningful consequences
3. update this index
4. synchronize affected authoritative specifications in the same change
```

When it replaces an Accepted decision:

``` text
1. do not rewrite the old record
2. create the new record
3. add Supersedes: D-xxx to the new record
4. add Superseded by: D-yyy to the old record
5. update specs/implementation only after approval
```

Codex must never infer approval merely because another approach appears
technically preferable.

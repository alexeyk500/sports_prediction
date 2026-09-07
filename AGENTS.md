# AGENTS.md

# Goalstery — Agent Instructions

Этот файл обязателен для любого AI coding agent, работающего с repository.

Цель файла — быть коротким router + guardrail document. Подробные product, architecture, database, testing и visual rules принадлежат соответствующим authoritative docs и не должны дублироваться здесь.

---

## 1. Read Relevant Sources Before Changing Code

Всегда сначала определить тип задачи и прочитать только релевантные authoritative sources.

### Product / domain behavior

```text
docs/PRODUCT_SPEC.md
docs/DECISIONS.md — relevant decisions
```

При необходимости также:

```text
docs/TECH_SPEC.md
docs/DB_SCHEMA.md
docs/TESTING_SPEC.md
```

### Backend / architecture / integrations / workers

```text
docs/TECH_SPEC.md
docs/DECISIONS.md — relevant decisions
```

При затрагивании persistence:

```text
docs/DB_SCHEMA.md
prisma/schema.prisma
```

### Database / Prisma / migrations

```text
docs/DB_SCHEMA.md
prisma/schema.prisma
docs/DECISIONS.md — relevant decisions
docs/TESTING_SPEC.md — relevant database/concurrency rules
```

### Frontend implementation

```text
docs/FRONTEND_ARCHITECTURE.md
docs/DECISIONS.md — relevant decisions
```

При необходимости также:

```text
docs/PRODUCT_SPEC.md — relevant behavior
docs/TECH_SPEC.md — relevant API/integration contract
```

### Frontend visual work

```text
docs/FRONTEND_ARCHITECTURE.md
docs/design/DESIGN_SYSTEM.md
approved component-specific spec/reference, if present
docs/DECISIONS.md — relevant decisions
```

### Testing work

```text
docs/TESTING_SPEC.md
```

и authoritative spec той функциональности, которая тестируется.

Не требуется читать все project docs целиком для каждой задачи. Не загружать нерелевантные sections без необходимости.

---

## 2. Source of Truth

При обычном конфликте specification и implementation:

```text
1. docs/PRODUCT_SPEC.md
2. docs/TECH_SPEC.md
3. docs/DB_SCHEMA.md
4. docs/TESTING_SPEC.md
5. prisma/schema.prisma
6. implementation code
```

Если implementation расходится со spec, исправлять implementation.

Дополнительные scoped authorities:

```text
docs/FRONTEND_ARCHITECTURE.md
→ frontend implementation architecture

docs/design/DESIGN_SYSTEM.md
→ global frontend visual system

approved component-specific design spec/reference
→ visual authority for that component

docs/DECISIONS.md
→ authoritative register of significant Accepted/Open decisions
```

`docs/DECISIONS.md` не является дополнительной ступенью линейного priority list.

Accepted decisions должны соблюдаться совместно с применимыми specs.

Если Accepted decision и другой authoritative source выглядят конфликтующими:

```text
STOP
identify exact conflict
do not choose silently
do not rewrite either source
ask for explicit clarification
```

---

## 3. Accepted Decision Guardrail

Decision с:

```text
Status: Accepted
```

в `docs/DECISIONS.md` является обязательным.

Codex не может без explicit user approval:

```text
change
reinterpret
weaken
replace
supersede
"improve"
work around
silently bypass
```

Accepted decision.

Это относится и к документации, и к implementation, которое фактически меняет решение.

Если Codex считает, что решение следует изменить:

```text
STOP before implementation
identify affected D-xxx
describe proposed change
explain reason and expected benefit
explain product/technical consequences
explain migration/compatibility impact, if any
state whether it supersedes existing decision
ask for explicit approval
```

Technical preference, cleaner architecture, best practice, optimization, convenience или новая library не являются approval.

Accepted decisions исторически immutable.

После approved superseding decision:

```text
keep old decision
add new D-xxx
new: Supersedes D-xxx
old: Superseded by D-yyy
update affected specs/code/tests
```

---

## 4. Open Decisions

Open Decisions находятся в:

```text
docs/DECISIONS.md
```

Если задача требует разрешить `Status: Open` decision:

```text
STOP
identify the Open Decision
explain why task depends on it
ask for explicit decision
```

Не выбирать product/architecture behavior молча.

Если найден новый существенный unresolved вопрос, который влияет на product behavior, architecture, persistence, compatibility или external contract, surface it before implementation.

---

## 5. Project Architecture Guardrails

Goalstery — modular monolith.

Current core stack:

```text
Next.js
React
TypeScript
App Router
PostgreSQL
Prisma
Zustand
CSS Modules
Vitest
Playwright
npm
```

Backend HTTP API находится внутри Next.js application через:

```text
/api/*
```

Route Handlers должны быть thin:

```text
authenticate
parse/validate input
call application/domain service
map result/error to HTTP
```

Business logic, complex transactions, scoring, quota, settlement, rating и prize logic не должны жить в Route Handlers или UI.

HTTP backend и Workers используют общий application/domain code. Worker не должен вызывать собственный backend через HTTP, если тот же code можно вызвать напрямую.

External systems должны быть изолированы adapter boundaries. Relevant details live in `TECH_SPEC.md` and Accepted decisions.

---

## 6. Frontend Guardrails

Frontend architecture определяется:

```text
docs/FRONTEND_ARCHITECTURE.md
```

Ключевые ограничения:

```text
feature-oriented components
custom typed API client
presentation components do not fetch application data
Zustand only for genuinely shared state
local React state for local state
no optimistic UI by default
HTTP DTO != presentation model != Prisma model
CSS Modules
Goalstery-owned UI components
Goalstery-owned SVG icons
complex screens composed from responsibility-scoped UI components
```

### UI composition and filesystem guardrail

React UI filesystem structure следует component ownership.

Screen components являются корнями своих UI trees и должны иметь собственные
component directories, например:

```text
src/components/CupScreen/
src/components/PredictScreen/
```

Meaningful child UI component должен находиться внутри directory своего
непосредственного owning component.

Не создавать generic organizational nesting вроде:

```text
components/
ui/
internal/
```

внутри component directory только ради группировки файлов.

Каждый meaningful standalone UI component:

```text
имеет собственный .tsx functional component
имеет собственный component-specific .module.css
получает external data/actions через explicit typed props/callbacks
не fetch'ит Goalstery application data напрямую, если это presentation component
```

### React component declaration guardrail

Новые и materially modified Goalstery UI components используют единый declaration style.

Компонент с props:

```tsx
interface ICupHeroProps {
  title: string;
  onClick: () => void;
}

const CupHero: React.FC<ICupHeroProps> = ({ title, onClick }) => {
  // ...
};

export default CupHero;
```

Компонент без props:

```tsx
const CupHeader: React.FC = () => {
  // ...
};

export default CupHeader;
```

React components declared in their own component files MUST use default exports:

```tsx
import CupHero from "./CupHero";
```

Do not use named component exports/imports as the default style:

```tsx
export { CupHero };
import { CupHero } from "./CupHero";
```

Named exports remain appropriate for utilities, types, constants, hooks,
formatters and modules with multiple semantically equal exports. Barrel files
may re-export a default component as a named public API when necessary:

```tsx
export { default as CupHero } from "./CupHero";
```

Для UI components не использовать как основной стиль:

```text
export function ComponentName(...)
inline props object type in component signature
type ComponentNameProps = ... when defining React component props
```

Props interface именуется:

```text
I<ComponentName>Props
```

Это правило относится к React UI components и не требует `React.FC` для обычных
non-component functions.

### Icon ownership guardrail

Icons следуют тем же ownership rules, что и UI components.

Не создавать screen/feature-level dumping-ground modules вроде:

```text
CupIcons.tsx
PredictIcons.tsx
Icons.tsx
```

только для сбора unrelated SVG components одного экрана.

Если icon используется только одним component:

```text
оставить icon в directory owning component
```

Если icon действительно переиспользуется independent components/screens:

```text
reuse/move to src/assets/icons/
```

Перед созданием нового shared icon проверить, нет ли уже эквивалентного
Goalstery-owned icon.

Preferred evolution:

```text
component-local icon
→ observed reuse
→ shared src/assets/icons/
```

Не выносить icons в shared scope speculative и не дублировать existing shared
icon локально.

Screen component должен в первую очередь orchestrate/compose дочерние UI blocks,
а не содержать detailed markup + styling всего сложного экрана в одной паре:

```text
Screen.tsx
Screen.module.css
```

Parent CSS отвечает за screen/composition concerns; child CSS — за internal
presentation своего компонента.

Не дробить trivial markup на бессмысленные micro-components.

Граница компонента определяется UI responsibility, а не количеством строк.

Component-scoped UI task должен оставаться внутри responsibility этого
компонента. Не redesign/refactor/restyle sibling components без необходимой
dependency и явного расширения scope.

Feature/component-specific types, formatters и helpers должны оставаться рядом
с owning feature/component. Выносить их в shared project modules только после
подтверждённого cross-feature reuse и только в responsibility-specific modules.

Не создавать catch-all shared dumping grounds вроде:

```text
src/utils.ts
src/helpers.ts
src/types.ts
```

Подробные правила component composition, filesystem ownership, CSS ownership и
shared extraction определены в:

```text
docs/FRONTEND_ARCHITECTURE.md
```

Без explicit approved decision не добавлять:

```text
third-party UI library
icon library
fetching/cache framework
CSS-in-JS framework
form framework
styling framework migration
```

Frontend не является authority для business rules.

Server/database remain authoritative.

---

## 7. Frontend Visual Guardrails

Global visual source:

```text
docs/design/DESIGN_SYSTEM.md
```

Если у компонента есть approved component-specific design spec + reference image, они имеют visual priority над global design system для этого компонента.

Current MatchCard authority:

```text
docs/design/predict-card-v2-spec.md
docs/design/predict-card-v2-reference.png
```

Files under:

```text
docs/design/archive/
```

non-authoritative.

Visual task не должен opportunistically менять backend/domain/API behavior.

Если reference image существует, visual fidelity проверяется browser rendering/screenshot comparison согласно design/testing docs. Не заявлять pixel-perfect/pixel-close без фактического comparison.

---

## 8. Database and Persistence Guardrails

Database/persistence authority:

```text
docs/DB_SCHEMA.md
prisma/schema.prisma
```

Использовать:

```text
database constraints
application validation
transactions
appropriate indexes
concurrency-aware mutations
```

Application checks не заменяют database invariants.

Не добавлять mechanical Repository layer поверх Prisma.

Direct SQL допустим, когда нужен database capability, который нецелесообразно выражать обычным Prisma API.

Historical gameplay data нельзя cascade-delete, если authoritative schema/spec не говорит иначе.

Schema changes выполняются migrations. Не использовать `db push` как normal production migration strategy.

При изменении schema проверять manually maintained SQL constraints/indexes в migrations.

---

## 9. Concurrency and Idempotency

Concurrency-sensitive workflows должны быть correct under simultaneous execution.

Если race condition может создать duplicate/corrupt business effect:

```text
design transaction/locking explicitly
add concurrency coverage required by TESTING_SPEC
```

Idempotent workflows должны оставаться safe при:

```text
retry
duplicate execution
process restart
partial failure
```

Не полагаться на frontend double-click protection как на server correctness mechanism.

Detailed workflow rules принадлежат product/technical/testing specs.

---

## 10. Time, Numeric and Money Safety

Canonical business timezone и time rules определяются specs/Accepted decisions.

Не использовать device/server local timezone или fixed UTC offset как business-calendar authority.

Time-sensitive business logic должно использовать approved Clock abstraction.

Не использовать binary floating point как persistence source of truth там, где authoritative schema требует exact Decimal/BigInt semantics.

Не выполнять unsafe:

```text
BigInt -> Number
Decimal -> Number
```

когда precision может иметь значение.

Detailed TON/scoring representation belongs in `PRODUCT_SPEC.md` / `DB_SCHEMA.md` / Accepted decisions.

---

## 11. Security

Treat as untrusted:

```text
client input
Telegram/browser data
external provider payloads
```

Server-side authentication/validation/authorization remain authoritative.

Never expose or log:

```text
Telegram bot token
full Telegram initData
database password
TON private keys
provider secrets
other credentials
```

Never trust client-calculated:

```text
identity
points
quota
rating
prize
ad reward
fixture eligibility
```

Do not introduce production authentication bypasses.

---

## 12. Error Contracts

Expected business failures должны использовать stable typed/domain error codes.

Clients branch on:

```text
error.code
```

not human-readable messages.

Не создавать ad-hoc API error shapes и не показывать raw internal exceptions пользователю.

Detailed HTTP contract belongs in the relevant technical/API specification.

---

## 13. Dependency and Infrastructure Policy

Before adding a dependency:

```text
confirm real need
check existing project solution
check maintenance/security/license
check bundle/runtime/operational impact
prefer small internal solution when appropriate
```

Do not introduce premature infrastructure such as:

```text
Redis
Kafka
RabbitMQ
microservices
Kubernetes
event sourcing
CQRS
```

without concrete requirement + explicit approved architecture decision.

Do not add dependencies as opportunistic "improvements" during unrelated work.

---

## 14. Engineering Style

Prefer:

```text
correct
simple
explicit
readable
maintainable
testable
type-safe
secure
cohesive
low-coupling
```

Apply SOLID/design patterns pragmatically, only where they solve an actual problem.

Avoid:

```text
god services/components
business-rule duplication
premature abstraction
premature generalization
premature optimization
hidden side effects
magic values
unsafe casts
catch-all utility dumping grounds
circular dependencies
N+1 queries
unbounded queries
client-authoritative business logic
```

Use domain terminology from authoritative specs consistently.

Prefer self-explanatory code. Comments should explain `why`, invariants, concurrency reasoning, provider limitations, or non-obvious workarounds—not restate code.

---

## 15. Refactoring Scope

Small local refactors needed for the requested task are allowed.

Do not perform unrelated large-scale refactors.

If existing code blocks a safe implementation:

```text
identify problem
perform smallest appropriate behavior-preserving refactor
cover behavior with tests where required
implement requested change
```

A refactor must not change, weaken, reinterpret, bypass, or supersede an Accepted decision.

If it would, STOP and ask for explicit approval first.

Do not modify specs merely to make an incorrect implementation appear compliant.

---

## 16. Testing

Testing authority:

```text
docs/TESTING_SPEC.md
```

Product/domain changes require corresponding tests as defined there.

Critical database workflows use real PostgreSQL integration tests where required.

Do not mock Prisma for workflows that require real database behavior.

Concurrency tests are mandatory where race conditions can corrupt state.

Business-time tests use controllable Clock rather than real wall-clock time.

For discovered production bugs:

```text
write failing regression test
fix implementation
verify test passes
keep regression test
```

Do not create brittle tests for implementation details when behavior/visual verification is the actual requirement.

---

## 17. Documentation Synchronization

Documentation is part of Definition of Done.

After an **approved** change, update every affected authoritative document in the same change.

Ownership:

```text
PRODUCT_SPEC.md
→ user-facing/product/domain behavior

TECH_SPEC.md
→ backend architecture, services, integrations, workers,
  auth/security, infrastructure, operational behavior, API architecture

DB_SCHEMA.md + prisma/schema.prisma
→ persistence model, relations, enums, constraints, indexes,
  retention/delete rules

FRONTEND_ARCHITECTURE.md
→ frontend architecture, boundaries, state/data flow,
  dependency/styling conventions

TESTING_SPEC.md
→ testing strategy and mandatory scenarios

DESIGN_SYSTEM.md
→ global UI/visual rules

component-specific design spec/reference
→ approved component visual contract

DECISIONS.md
→ significant Accepted/Open project decisions

AGENTS.md
→ repository-wide agent routing and guardrails
```

Do not duplicate detailed rules across documents when a clear owner already exists.

When moving/removing duplicated documentation, preserve the authoritative owner.

---

## 18. Changing an Approved Decision

If implementation reveals that an Accepted decision should change:

```text
1. STOP before changing code/specs
2. identify exact decision/rule
3. explain limitation/conflict
4. propose change
5. explain benefits/consequences
6. explain migration/compatibility impact
7. state whether it supersedes D-xxx
8. obtain explicit user approval
9. update DECISIONS.md
10. update all affected specs
11. implement
12. update/add tests
```

Codex must never infer approval from a technically preferable alternative.

Routine implementation choices that remain inside Accepted decisions/specs do not require approval.

---

## 19. Definition of Done

A change is complete only when all relevant items are satisfied:

```text
implementation matches authoritative specs
Accepted decisions are respected
no Open Decision was silently resolved
no new significant product/architecture decision was silently invented
scope remains appropriate
architecture boundaries are preserved
security implications are handled
database invariants are preserved
transactionality/idempotency/concurrency are handled where relevant
affected documentation is synchronized
types pass
lint passes
required tests exist
tests pass
build passes
migration exists if schema changed
visual verification is completed when required
```

---

## 20. Final Self-Check

Before finalizing, check only items relevant to the task:

```text
Did I read the relevant authoritative sources?
Did I accidentally rely on an unrelated/outdated document?
Did I change or bypass an Accepted decision?
Did I resolve an Open Decision without approval?
Did I introduce a new product/architecture decision?
Did I keep business logic out of UI/Route Handlers?
Did I preserve transactionality/idempotency/concurrency where relevant?
Did I preserve database invariants?
Did I preserve frontend architecture/design contracts where relevant?
Did I validate untrusted input and protect secrets?
Did I avoid unnecessary dependency/infrastructure/refactor?
Did I add the tests required by TESTING_SPEC?
Did I update every affected authoritative document?
Did typecheck/lint/tests/build required for this task pass?
```

Resolve relevant problems before finalizing.

---

## 21. Core Principle

Goalstery is specification-driven.

Keep:

```text
code
database
tests
documentation
Accepted decisions
```

consistent.

`AGENTS.md` intentionally stays compact. Detailed product, architecture, database, testing, frontend and visual rules belong to their dedicated authoritative documents.

When two solutions are equally correct, prefer the one with fewer moving parts, clearer ownership, explicit invariants, lower coupling and simpler failure modes.

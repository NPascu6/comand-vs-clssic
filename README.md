# Atlas validation: classic patterns vs. functional commands

A companion code repository for the presentation **"Designing Atlas validation:
functional commands over classic validation chains."**

Four .NET 10 projects implement **the exact same business operation** —
*commit capital to a co-investment, in a fund, against a deal* — three of
them in the "classic" styles the team uses today, and one in a functional
command + async-validation + handler style. Same upstream data, same three test
scenarios, so the comparison is apples-to-apples.

> **No third-party libraries in the production code.** No FluentValidation, no
> MediatR, no Serilog, no AutoMapper, no Moq — the shipping code is vanilla .NET /
> BCL. The test project uses only xUnit (notably **no Moq**: rules are tested with
> hand-written stubs).
> That constraint is deliberate — it mirrors the team's stance on coupling, and
> it proves the functional approach needs nothing you don't already own.

---

## Why this operation?

`CommitCapital` was chosen because **every rule that matters needs upstream
data**, so validation is inherently asynchronous:

| Rule | Needs upstream? | Why |
|------|-----------------|-----|
| 1. Structural shape | no | pure check on the payload |
| 2. Fund is Open | **yes** | fund book of record |
| 3. Currency permitted | **yes** | fund's permitted-currency list |
| 4. Deal investable + matches | **yes** | deal pipeline state + window |
| 5. Co-investment headroom | **yes** | hierarchy node cap vs. committed |
| 6. Within appetite | **yes** | exposure engine + appetite policy |

That single fact — *real validation is async I/O* — is the hinge of the whole
argument. `DataAnnotations` / `IValidatableObject` cannot `await`, so business
rules cannot live there, and the classic codebases fragment as a result.

Both Atlas and the existing DMS are **downstream APIs**: they own no source data,
they call upstream services and compose answers. The
[`Atlas.Upstream.Contracts`](src/Atlas.Upstream.Contracts) project models that
boundary with client interfaces and deterministic in-memory fakes.

---

## Repository map

```
Atlas.Patterns.sln
├── src/
│   ├── Atlas.Upstream.Contracts/      shared boundary — Domain/ · Ports/ · Sources/ (CRM·DMS·Ledger·PolicyHub) · Composition/ (binds ports to sources)
│   ├── Atlas.Classic.DataAnnotations/ CLASSIC #1 — Model/ · Validation/
│   ├── Atlas.Classic.AdapterChaining/ CLASSIC #2 (DMS style) — Facade/ · Adapters/ · Domain/ · Contracts/ · Validation/
│   ├── Atlas.Classic.ValidatorFactory/CLASSIC #3 — Framework/ · Validators/
│   ├── Atlas.Classic.NTier/           CLASSIC #4 (full N-tier) — Controllers·Dtos·Mapping·Services·Repositories·Validation·Configuration (29 files)
│   ├── Atlas.Functional.Commands/     NEW — Core/ (owned framework + Spec: declarative validators) · Commitments/Rules/ · Pipelines/ (deal-stage state machine)
│   └── Atlas.Api/                     minimal ASP.NET API over the functional handler + backend-served i18n (:5179)
├── tests/
│   └── Atlas.Functional.Commands.Tests/  23 tests: each rule in isolation + end-to-end + audit trace + the upstream composition + the declarative Spec
└── web/                            React monorepo (pnpm): shared `core` + `@atlas/i18n` (backend-served) + one package per business domain
```

> Each project's folders narrate its pattern — see the **Repository map** slide in the
> backend deck for the deck↔code walk-through.

Each `src` project has its own `README.md` with an honest Pros/Cons section.

---

## Run it

```bash
# everything builds and the tests pass
dotnet build Atlas.Patterns.sln
dotnet test  tests/Atlas.Functional.Commands.Tests

# see each approach handle the same three scenarios
dotnet run --project src/Atlas.Classic.DataAnnotations
dotnet run --project src/Atlas.Classic.AdapterChaining
dotnet run --project src/Atlas.Classic.ValidatorFactory
dotnet run --project src/Atlas.Functional.Commands     # also prints the decision-trace JSON
```

---

## The three scenarios, and what each approach reports

- **A — valid**: a clean $10M PE commitment. Everyone says VALID.
- **B — two simultaneous breaches**: co-investment headroom ($20M) *and* appetite
  (230M + 25M > 250M) are both broken by one $25M request.
- **C — structural + state pileup**: negative amount, bad currency, empty user,
  past date, draft fund, closed deal, missing co-investment node.

| | Classic: DataAnnotations | Classic: AdapterChaining | Classic: ValidatorFactory | **Functional Commands** |
|---|---|---|---|---|
| Scenario B errors surfaced | 2 of 2 | **1 of 2** (short-circuit) | 2 of 2 | **2 of 2** |
| Scenario C errors surfaced | 10 | **4** (business never runs) | **4** (early return) | **10** |
| Async business validation | split into a service | in adapters | shoe-horned (sync iface + prefetch) | **native** |
| All failures in one pass | yes* | no | inconsistent (per-rule throw/add) | **yes, always** |
| Per-rule audit trail | no | no | no | **yes (DecisionTrace → JSON)** |
| Test ONE rule in isolation | hard (buried in service) | hard (mock 3-4 layers) | not a unit (whole validator) | **trivial (one stub)** |
| Add a 7th rule means editing | attribute **and** service | a new/edited adapter **and** the facade | the one 180-line method | **one new factory + one line** |
| Third-party dependencies | none | none | none | none |
| Code for *this one feature* | 498 LOC / 4 files | 856 LOC / 12 files | 570 LOC / 4 files | 316 LOC feature **+ 469 reusable core** |

\* DataAnnotations aggregates well here only because the hand-written service
deliberately accumulates; nothing in the pattern enforces it, and the shape
checks (attributes) and business checks (service) live in two different places.

**The honest summary:** the classic approaches are not *wrong* — competent teams
ship them every day (the samples here are written straight, not as strawmen).
But each one fragments async business logic, makes a single rule hard to test
alone, and produces no structured trail of *why* a decision was made. For Atlas —
where traceability is a first-class requirement and the rule set will only grow —
those three properties are exactly the ones that compound into a "Frankenstein".

---

## What the functional approach actually is

Seven small pieces in [`Core/`](src/Atlas.Functional.Commands/Core), ~470 lines the
team **owns outright** (no library to be coupled to):

- **`Result` / `Result<T>`** — success or a *set* of errors; `Combine` aggregates.
- **`Error`** — an error is data (code, message, field), not an exception.
- **`Rule<T>`** — a named, async validation rule as a *value* you can test and compose.
- **`Validator<T>`** — runs the rules, aggregates every error, and builds the trace.
- **`DecisionTrace`** — a trading-grade audit record, serialized with in-box `System.Text.Json`.
- **`CommandHandler<TCommand,TResult>`** — the pipeline: validate → (if approved) execute.
- **`Spec<T>`** — an optional declarative builder (`RuleFor(...)`, `.When`, `MustAsync`) that produces `Rule<T>` — FluentValidation-style ergonomics, no library.

A feature is then just: the
[command](src/Atlas.Functional.Commands/Commitments/CommitCapitalCommand.cs), the
[six rules](src/Atlas.Functional.Commands/Commitments/Rules) (one file each, ~10 lines,
all in one folder), and a thin
[handler](src/Atlas.Functional.Commands/Commitments/CommitCapitalHandler.cs) that
lists the rules and says what to do on success. Business logic, not plumbing.

---

## Presentation

Two focused decks — one per meeting — each paired with an architecture doc and an agenda:

| Meeting | Deck | Architecture doc | Agenda |
|---|---|---|---|
| **Backend** design review | [`Atlas-Backend.pptx`](Atlas-Backend.pptx) (32 slides) | [docs/architecture-backend.md](docs/architecture-backend.md) | [docs/meeting-backend.md](docs/meeting-backend.md) |
| **Frontend** architecture review | [`Atlas-Frontend.pptx`](Atlas-Frontend.pptx) (18 slides) | [docs/architecture-frontend.md](docs/architecture-frontend.md) | [docs/meeting-frontend.md](docs/meeting-frontend.md) |

The **backend** deck argues functional commands + async validation over the classic stack: the
cost-of-change thesis → the classic styles + the N-tier layer cake → the owned core (rules ·
validator · decision trace · the declarative `Spec`) → a dedicated **Pluggable & scalable** section
(the ports/adapters seam, the one-line upstream swap, a 2nd feature on the same core, the axes
of change) → operability → honest trade-offs → grounding (Microsoft Learn + Robert
C. Martin's *Functional Design* / *The Clean Coder*). Three concrete side-by-sides
make the case re-measurable: short-circuit vs aggregate (Scenario B → 1 of 2 vs 2 of
2), testability (five fakes vs a four-line stub), and a *right tool for the job* matrix
(where Data Annotations & adapters still win).

The **frontend** deck argues an owned `core` design system (MUI → Tailwind behind a stable API) +
one vertical slice per domain: the slice registry → a slice mirroring the backend → composable,
resizable views → backend-served i18n → honest trade-offs.

Both decks are generated from code, so they stay in sync with the repo:

```bash
cd deck && npm install        # once (pulls pptxgenjs)
node build-backend.js         # writes ../Atlas-Backend.pptx   (32 slides)
node build-frontend.js        # writes ../Atlas-Frontend.pptx  (18 slides)
```

---

## Frontend ([`web/`](web/README.md))

The same philosophy, applied to the UI. A **pnpm workspace** with a shared
design system (`@atlas/core`) and **one package per business domain** — each a
vertical slice that owns its UI, data client, and manifest.

- **`@atlas/core`** owns the design tokens + Tailwind preset and is being
  **decoupled from MUI → Tailwind behind a stable API** (`@atlas/core` vs
  `@atlas/core/legacy`) — the frontend's mirror of the backend's "own your core,
  no library coupling" story. The running app has a **Design System** page
  showing the 1:1 before/after.
- **Slices** — `commit-capital` (the flagship write use-case, reusing the same
  decision-trace shape as the backend), `coinvestment` (a **navigable** fund &
  co-investment hierarchy — fund selector, drill-down, breadcrumb, holdings of
  different investment types), `appetite` (the restrictions dashboard),
  `deal-pipeline` (a deal-stage **state machine** board, backed by the
  `Pipelines/` command), and
  `workspace` (a **customizable dashboard** of pluggable, **resizable** panels — a
  panel registry + view-as-data + one generic frame; no layout library). Grouped in
  the nav under **Fund Construction** and **Fund Management**.
- **`@atlas/i18n`** — UI translations are **served by the backend** (`GET /api/i18n/…`).
  The switcher lists whatever the backend offers; adding a language is a JSON file on
  the backend, with **zero frontend change**. The FE ships only English offline.
- **Data source** — a header toggle switches every slice between a deterministic
  **Mock** (mirrors the backend seed + rules, works offline) and the **Live
  API** (`Atlas.Api`). The decision-trace UI renders identically from either.

```bash
cd web && pnpm install && pnpm dev      # http://localhost:5173 (Mock works offline)
dotnet run --project src/Atlas.Api        # optional: the Live API on :5179
```

# comand-vs-clssic
# demo-app

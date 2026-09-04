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
│   ├── Atlas.Upstream.Contracts/      shared boundary — Domain/ · Ports/ · Sources/ (CRM·DMS·Ledger·PolicyHub) · Composition/ (binds ports to sources) — see its README.md
│   ├── Atlas.Classic.DataAnnotations/ CLASSIC #1 — Model/ · Validation/
│   ├── Atlas.Classic.AdapterChaining/ CLASSIC #2 (DMS style) — Facade/ · Adapters/ · Domain/ · Contracts/ · Validation/
│   ├── Atlas.Classic.ValidatorFactory/CLASSIC #3 — Framework/ · Validators/
│   ├── Atlas.Classic.NTier/           CLASSIC #4 (full N-tier) — Controllers·Dtos·Mapping·Services·Repositories·Validation·Configuration (29 files)
│   ├── Atlas.Functional.Commands/     NEW — Core/ (owned framework + Spec: declarative validators) · Commitments/Rules/ · Pipelines/ (deal-stage state machine) — see its README.md
│   ├── Atlas.Functional.Commands.Demo/ console walk-through of the three scenarios over the library
│   └── Atlas.Api/                     minimal ASP.NET API over the functional handler + backend-served i18n (:5179) — I18nCatalog (pure rules) · I18nStore (JSON on disk) · I18nEndpoints · Dockerfile (the atlas-api image: multi-stage .NET 10, non-root, :8080)
├── tests/
│   ├── Atlas.Functional.Commands.Tests/  23 tests: each rule in isolation + end-to-end + audit trace + the upstream composition + the declarative Spec
│   ├── Atlas.Api.Tests/                  xUnit: the i18n catalog rules + the store (versions, audit trail, If-Match, config)
│   └── Atlas.Web.Tests/                  Deno: the design-tokens transform, the design vocabulary and the token → component usage map (what CI runs)
├── deno.jsonc                      CI config — `deno lint` over web/, deck/ + tests/, `deno test -A` over tests/
├── azure-pipelines.yml             the CI gate (Azure DevOps): every unit builds, tests and lints on PRs and main — nothing deploys
├── .azure-pipelines/               one deploy pipeline per unit — web app · storybook · api · packages · infra — plus templates/ (shared steps)
├── infra/                          Terraform: one independently deployable stack per unit (foundation, api, web-app, storybook), environments via infra/env/*.tfvars, azurerm state backend
└── web/                            React monorepo (pnpm): `@atlas/design-tokens` (Figma variables → four generated targets) · `@atlas/core` (an owned API over MUI 9 — the theme, the primitives, the frame and the controls, all token-driven) · `@atlas/figma-sync` (an export → a reviewed, versioned token release) · `@atlas/commands` · `@atlas/i18n` · `@atlas/platform` · `@atlas/contracts` · the showcase app that consumes them
```

> Each project's folders narrate its pattern — see the **Repository map** slide in the
> backend deck for the deck↔code walk-through.

Each classic project's `README.md` has an honest Pros/Cons section;
[`Atlas.Functional.Commands`](src/Atlas.Functional.Commands/README.md) explains how a
command is handled (rules, errors, trace, memoization, the deal-stage machine) and
[`Atlas.Upstream.Contracts`](src/Atlas.Upstream.Contracts/README.md) the ports / sources /
composition seam.

---

## Code conventions

The same discipline the decks argue for, applied to the code itself:

- **TypeScript only** — no `.js` / `.mjs` / `.jsx` sources anywhere, the deck scripts included.
- **Strict types, no ambiguity** — a union or template-literal type over `string`, a typed record over an index signature, no `any`; **`unknown` only at a boundary** — parsed JSON or a caught error — narrowed at once by a typed parse function or a type guard; never `as unknown as X`.
- **Comments as close to zero as possible** — no doc comments on props, no section banners, no restating the code. One survives only where a reader would otherwise get the behaviour *wrong*, and then it is one line; the explanation belongs in the README or in Storybook.
- **Functional paradigm** — pure functions and function components, no classes, `const` over `let`, no parameter mutation, `map` / `filter` / `reduce` / spread over imperative accumulation; side effects at the edges.
- **150 lines per file, hard; 100 preferred** — split by responsibility into siblings named for what they are (`buttonSurface.ts`, `colorTokens.ts`, `dealTones.ts`), never "part 1 / part 2". Generated files and data catalogues are exempt.
- **No util modules** — no `util/`, no `helpers.ts`, no `misc.ts`; a function lives with the concept that owns it.
- **Names that read as sentences** — `const translate = useT()`, `index`, `error`, `dataSource`; no one- or two-letter identifiers.
- **No styling outside `@atlas/core`** — application code holds behaviour only: no `sx`, no `style`, no `@mui/*` import, no CSS file, no colour or `px` literal. Arrangement is `Stack` / `Split` / `Columns`, type is `Text`, the frame is `AppHeader` / `Page`; the tokens decide every colour and every gap, and an application re-skins by passing token values. The gate is one line: `git grep -nP "sx=|from '@mui|style=\{\{" web/apps`.
- **Each package builds and deploys on its own** — its own build output, runtime config, pipeline and Terraform stack (see [Deploy](#deploy)).

---

## Run it

```bash
# everything builds and the tests pass
dotnet build Atlas.Patterns.sln
dotnet test  tests/Atlas.Functional.Commands.Tests
dotnet test  tests/Atlas.Api.Tests                    # the i18n catalog rules + the store

# what CI runs (.github/workflows/deno.yml), from the repo root
deno lint                                             # web/apps, web/packages, web/build, tests
deno test -A                                          # tests/Atlas.Web.Tests (the design-tokens export ⇔ generated check)

# see each approach handle the same three scenarios
dotnet run --project src/Atlas.Classic.DataAnnotations
dotnet run --project src/Atlas.Classic.AdapterChaining
dotnet run --project src/Atlas.Classic.ValidatorFactory
dotnet run --project src/Atlas.Functional.Commands.Demo # also prints the decision-trace JSON
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

Seven small pieces in [`Core/`](src/Atlas.Functional.Commands/Core), ~300 lines the
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
| **Frontend** architecture review | [`Atlas-Frontend.pptx`](Atlas-Frontend.pptx) (22 slides) | [docs/architecture-frontend.md](docs/architecture-frontend.md) | [docs/meeting-frontend.md](docs/meeting-frontend.md) |

The **backend** deck argues functional commands + async validation over the classic stack: the
cost-of-change thesis → the classic styles + the N-tier layer cake → the owned core (rules ·
validator · decision trace · the declarative `Spec`) → a dedicated **Pluggable & scalable** section
(the ports/adapters seam, the one-line upstream swap, a 2nd feature on the same core, the axes
of change) → operability → honest trade-offs → grounding (Microsoft Learn + Robert
C. Martin's *Functional Design* / *The Clean Coder*). Three concrete side-by-sides
make the case re-measurable: short-circuit vs aggregate (Scenario B → 1 of 2 vs 2 of
2), testability (five fakes vs a four-line stub), and a *right tool for the job* matrix
(where Data Annotations & adapters still win).

The **frontend** deck argues an owned `core` design system (MUI 9 behind an API we own, driven
by Figma tokens, with light / dark / high contrast that every component reads): the split that
makes it work — **the designer / developer boundary** (designers own the values, developers own
the behaviour, the system owns the mapping and CI enforces it) → the **customization levels**
(props → tokens → slots → `className`, and why `sx` is not one) → the application layer holds
behaviour, core serves every pixel → the palette served over HTTP for consumers that are not
React → backend-served, versioned and audited i18n → honest trade-offs.

Both decks are generated from code, so they stay in sync with the repo:

```bash
(cd deck && npm ci)           # once (pulls pptxgenjs)
node deck/build-backend.ts    # from the repo root — writes ./Atlas-Backend.pptx   (32 slides)
node deck/build-frontend.ts   # from the repo root — writes ./Atlas-Frontend.pptx  (22 slides; slide builders in deck/frontend/)
```

---

## Frontend ([`web/`](web/README.md))

The same philosophy, applied to the UI. A **pnpm workspace** holding the token export,
the design system built on it, and one application that consumes both.

- **`@atlas/core`** is an **owned API over MUI 9**: the theme, the layout primitives
  (`Stack`, `Split`, `Columns`, `Text`), a granular frame (`AppHeader`, `Brand`,
  `Page`) and the basic controls — deliberately small, so every token it ships has a
  reader and the whole surface stays reviewable. **Light / dark / high contrast**
  come from one token export, so the header's theme switcher restyles everything at
  once. One tone vocabulary (`primary · secondary · success · warning · danger · info
  · neutral`) and one spacing scale (`xs`…`xl` → 4/8/16/24/32 px) run through every
  component. Customization is, in order: the component API (variant · tone · size ·
  state), **token overrides** (`tokens` on the provider for the whole application,
  `AtlasTokenScope` for one subtree, and they compose), slots, and `className` as the
  deliberately exceptional escape hatch — **no component takes an `sx` prop**, which
  would pin the contract to MUI and let a call site invent values the tokens do not
  know. The application imports only `@atlas/core`, never `@mui/*`, and holds
  **behaviour only** — no `sx`, no `style`, no CSS, no colour or `px` literal.
- **Design tokens** are **owned in Figma**, one file per mode, in two classes:
  *global* tokens (colour, spacing, radius, typography — reusable everywhere) and
  *component* tokens (`button.paddingInlineMd`, `input.focusBorderColor`,
  `header.height`), plus a **semantic vocabulary of the domain** (`status.*`,
  `performance.*`, `exposure.*`, `assetClass.*`, `region.*`) aliased onto the palette.
  `@atlas/design-tokens` transforms the export into **four targets** at build time —
  the typed theme inputs, CSS custom properties, a flat JSON bundle and a C# package —
  resolving each token through `Atlas.<Mode> → Atlas.Base`. A component **colour**
  token stays an alias and arrives as the palette path (`'primary.main'`), not a hex,
  so one token is right in all three palettes. Every generated target is committed
  next to the export; CI refuses a stale one, and refuses a component token no
  component reads. Who owns what, and how a token PR is reviewed:
  [docs/design-tokens-governance.md](docs/design-tokens-governance.md).
- **Figma → a pull request.** `@atlas/figma-sync` reads the Figma Variables API,
  converts it to DTCG files, and runs the change through the same command → rules →
  handler pattern the backend uses: the export must be well formed, satisfy the theme
  contract, match the ledger, name its designer, and still clear WCAG AA. It versions
  the release (removed or retyped tokens = major, added = minor, values = patch),
  records it in `figma/tokens.lock.json` with the author and the Figma version, and
  writes only the files whose token *values* changed.
- **The palette is served.** `GET /api/design-tokens/{mode}` returns the same values
  flat, with the export's version as the ETag, and the API renders artefacts with them
  (a fund's exposure factsheet as SVG) — so a report, an export or an email template
  paints with the design system instead of its own copy of it.
- **Translations are a backend capability.** `@atlas/i18n` fetches the locale list
  and the chosen catalog from `Atlas.Api` (`GET /api/i18n/…`); the switcher lists
  whatever the backend offers, so adding a language is a JSON file on the backend
  with **zero frontend change** (the FE ships only English offline). Catalogs are
  **versioned** (append-only history per locale), **configurable** (enable/disable
  a locale, its fallback chain) and **audited** (who / when / what / before / after /
  reason) through GET / PUT / DELETE / rollback endpoints; storage is JSON on disk —
  no database, no packages.

```bash
cd web && pnpm install && pnpm dev         # http://localhost:5174
pnpm --filter @atlas/core storybook        # the design system on :6006, toolbar: light / dark / high contrast
pnpm --filter @atlas/design-tokens build   # figma/*.tokens.json → the four generated targets
pnpm --filter @atlas/design-tokens check   # exit 1 if a target is stale (what CI asserts)
dotnet run --project src/Atlas.Api         # optional: the served palette + translations on :5179
```

CI (`.github/workflows/deno.yml`) runs `deno lint` over `web/` and `deno test -A` over
`tests/Atlas.Web.Tests` (the design-tokens export ⇔ generated check, the design
vocabulary and the token → component usage map); the .NET tests
(`Atlas.Functional.Commands.Tests`, `Atlas.Api.Tests`) run with `dotnet test`.

---

## Deploy

Five deployable units, one Azure DevOps pipeline each, Terraform for the Azure side: the web
app and Storybook each go to their own Static Web App, the API ships as a container image to a
Container App (its translations on an Azure Files share), and the npm + NuGet packages go to
Azure Artifacts feeds. `azure-pipelines.yml` is the CI gate — nothing
deploys from it; the deploy pipelines under `.azure-pipelines/` trigger on the paths of their
own unit.

```bash
docker build -f src/Atlas.Api/Dockerfile -t atlas-api:local .            # the API image, from the repo root
docker run --rm -p 8080:8080 -v atlas-i18n:/data/i18n atlas-api:local    # http://localhost:8080/healthz ; translations seeded into the volume
```

The guide — units and artefacts, build once / configure at deploy, path triggers, variable
groups, the Terraform bootstrap, environments and approvals, a runbook — is
[docs/deployment.md](docs/deployment.md); the reference for each half is
[.azure-pipelines/README.md](.azure-pipelines/README.md) and [infra/README.md](infra/README.md).

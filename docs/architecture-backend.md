# Atlas Backend Architecture

> Functional commands + async validation + handlers, over classic validation chains.
> Companion to the **`Atlas-Backend.pptx`** deck.

## 1. Context

Atlas (Central Fund Management) spans liquid and illiquid markets — private equity,
private credit, and some public/liquid ETFs, across regions. A fund manager
constructs funds, sets appetite restrictions and forecasts, and manages
hierarchical co-investment relationships.

Atlas is a **downstream API**: it owns no source data. It composes answers by calling
upstream systems (a deal pipeline, a document/fund store, an exposure engine, an
appetite/policy store, …). Almost every meaningful rule needs data that lives upstream —
so **validation is asynchronous and business-heavy**, not shape-only. That single fact
drives the whole design.

## 2. The problem we are designing against

Enterprise systems rot as they grow: each feature makes the next one more expensive
until the system resists change. The classic .NET stack accelerates that rot for Atlas
because it answers an async, policy-heavy problem with sync, layer-heavy machinery:

- **DataAnnotations** validate *shape*, but cannot `await` — so business rules leak into
  a fat service of `if`-chains. Validation ends up split across attributes **and** a service.
- **Facade + adapter chaining** scatters rules across gateways; the first failure throws,
  so the caller sees one breach, not all of them.
- **Homegrown validator factory** puts all rules in one ~180-line method (a merge magnet,
  ordering traps), and fights async because the interface is sync.
- **Full N-tier** (Controller → DTO → Mapper → Service → Repository → Entity → …) spreads
  **one feature across ~8 layers / ~29 files** (see `src/Atlas.Classic.NTier`).

Shared failure mode: logic fragments, no rule is a testable unit, and there is no
structured decision trail — which matters for a trading-adjacent, audited system.

## 3. The shape

```
HTTP → endpoint → CommandHandler.HandleAsync(command)
                     ├─ Validator runs the Rules → aggregated Result + DecisionTrace
                     └─ if approved → ExecuteAsync (the business action)
                  → Result<T> → HTTP
```

A **command** is immutable data ("commit this capital to this co-investment"). A **rule**
is a small, named, independently testable function returning a `Result`. A **handler**
declares *which* rules apply and *what* to do once they pass. Errors are values; the
decision trail is produced automatically.

## 4. The core you own (`src/Atlas.Functional.Commands/Core/`, ~300 lines, zero third-party deps)

| Piece | Responsibility |
|---|---|
| `Error` | An error as a value: `Code`, `Message`, `Severity`, `Field`. |
| `Result` / `Result<T>` | Success or a **set** of errors; `Combine` aggregates (railway-oriented). |
| `Rule<T>` | `Name` + `Description` + `Kind` + an async `Check`. A rule is a value, not a place in a call chain. |
| `Validator<T>` | Runs the rules, aggregates **all** errors, builds the trace; a throwing rule becomes a recorded error (never hides the rest). |
| `DecisionTrace` | Per-rule outcome + timing + messages, serialized with in-box `System.Text.Json`. The audit record — no Serilog. |
| `CommandHandler<TCommand,TResult>` | The pipeline: validate → (if approved) execute. A feature implements only `Rules()` and `ExecuteAsync()`. |
| `Spec<T>` | A declarative, FluentValidation-style builder (`RuleFor(command => command.Field).NotEmpty()...`, `.When`, `MustAsync`, `Include`) that produces `Rule<T>` — same machinery, no library. |

This is plain C#. There is no framework to be coupled to — the team owns it outright and
can change it.

## 5. Ports & adapters — pluggable upstreams (`src/Atlas.Upstream.Contracts/`)

The upstream boundary is **ports and adapters** (hexagonal):

- **`Ports/`** — narrow interfaces in Atlas's own vocabulary (`IFundClient`, `IDealClient`,
  `ICoInvestmentClient`, `IAppetiteClient`, `IExposureClient`, `IUpstream`). Rules and handlers
  depend **only** on these.
- **`Sources/`** — one adapter per real upstream, named for it (e.g. a deal-pipeline source, a
  document-store source, an exposure source, a policy source). Each is the **only** file that
  knows that source's shape; mapping into our canonical `Domain/` snapshots happens there.
- **`Composition/`** — the composition root that binds each port to a source
  (`InMemoryUpstream`). The composition root is the single place that decides which source
  backs which port.

When a source changes (new field, v2 API, replacement), **one adapter** changes — never a
rule or a handler. A swap is one line at the composition root.

## 6. A feature, anatomy (`Commitments/`)

`CommitCapital` = a command + six rules + a thin handler:

- `CommitCapitalCommand` / `CommitmentReceipt` — immutable records.
- `Commitments/Rules/` — **one file per rule** (Structural, FundMustBeOpen,
  CurrencyMustBePermitted, DealMustBeInvestable, CoInvestmentMustHaveHeadroom,
  CommitmentMustBeWithinAppetite). Each is a `static partial class CommitCapitalRules`
  factory taking only the port(s) it needs.
- `CommitCapitalHandler` — lists the rules (`Rules =>`) and `ExecuteAsync`.
- `CommitCapitalSpec` — the same rules written declaratively on `Spec<T>` (the alternative style).

**Two rule styles, one core.** One-file-per-rule (max isolation) or the declarative `Spec`
(max density) — both produce `Rule<T>` and run on the identical `Validator` + trace. Choose
per feature; the agreement is the *shape*, not your logic.

State machines fit the same pattern: `Pipelines/` drives deal-stage transitions
(`AdvanceDealStage` = a command + a transition rule + a handler), with the lifecycle stored
as **data** (`DealStageMachine`).

## 7. Why it scales

Growth is **additive**, because the pattern governs the seams, not the logic:

| When you need to… | Functional (one seam) | Classic (ripples) |
|---|---|---|
| Add an upstream source | one adapter behind the port | rewire gateways + facade + mappers |
| Change a model / contract field | one record — the compiler finds every use | hunt across DTOs, mappers, adapters |
| Add / change a business rule | +1 rule file, +1 line | edit the ~180-line method / facade |
| Add a whole new command | command + rules + handler, reuse Core | new orchestration, copy plumbing |
| Add a policy / language / limit | change data | change + redeploy code |

The deeper reasons (per Robert C. Martin, *Functional Design*, 2023):

- **Immutability / values** (`Result`, `Error`, commands) → no shared mutable state →
  predictable, **local reasoning**.
- **Pure functions** (rules) → trivially testable and composable; systems grow by
  **adding** pure pieces, not modifying shared ones (OCP).
- **Side effects at the boundary** → a pure core; I/O behind ports; change stays contained.
- SOLID and the GoF patterns still apply (the book revisits them functionally); patterns
  become values (a Command/Strategy is just data + a function).

## 8. Operability (production answers)

| Concern | Answer |
|---|---|
| Partial upstream failure | Fail-closed; a throwing rule becomes a recorded `RULE_THREW` (never hides the rest); retry/circuit-breaker behind the port. |
| Per-command deadline | Wrap validation in a linked `CancellationTokenSource(timeout)` — the token is already threaded to every rule. |
| Validate-then-execute race (TOCTOU) | The write is the source of truth: `ExecuteAsync` commits under optimistic concurrency and rejects on conflict. Validation is the pre-check. |
| Authorization | An early rule (or pre-handler step) rejects a forbidden caller before the upstream fan-out. |
| Observability | Emit `System.Diagnostics.Activity` spans + `Meter` counters — in-box BCL, not Serilog. `DecisionTrace` is the audit record; OpenTelemetry is the live telemetry. |
| Command & contract versioning | Records evolve additively (add fields); old `DecisionTrace`s stay readable; nothing breaks on the wire. |

## 9. Trade-offs (honest)

- **Learning curve** — `Result`/rules is new to an OO team → but it's plain C#; the core is
  ~300 lines read in an afternoon.
- **You own the framework** — no vendor to file bugs against → ~470 tested lines; no new
  CVE / supply-chain surface.
- **More concepts up front** — Command/Result/Rule/Spec → overkill for shape-only CRUD; keep
  DataAnnotations there. It earns its keep on async business policy.
- **Up-front structure** — you design the seams first → a little more ceremony for the first
  slice; it pays back on every slice after, as the app grows.
- **Discipline required** — two rule styles can fragment → one agreed style per area, enforced
  in review; the trace makes drift visible.

It is **not** a silver bullet. For shape-only CRUD the classic stack is fine.

## 10. Grounding

- **Microsoft Learn** — *Common web application architectures* critiques traditional N-layer
  ("the BLL … is dependent on data access … testing … requires a test database") and
  recommends **Clean Architecture** (it cites Robert C. Martin's *The Clean Architecture* by
  name). *Architectural principles* (SRP, DIP, Explicit Dependencies, Persistence Ignorance,
  Bounded Contexts). *.NET Microservices* (a command handler per command; the app layer
  coordinates only).
- **Robert C. Martin** — *Functional Design: Principles, Patterns, and Practices* (2023):
  FP + SOLID + patterns = better, more scalable systems; FP and OO are complementary.
  *The Clean Coder* (2011): professionalism, TDD as a minimum discipline, saying "no" to the
  mess — how teams meet deadlines over years.

## 11. Run it

```bash
dotnet build Atlas.Patterns.sln
dotnet test  tests/Atlas.Functional.Commands.Tests          # 23 green
dotnet run   --project src/Atlas.Classic.AdapterChaining    # B reports only 1 of 2 breaches
dotnet run   --project src/Atlas.Functional.Commands.Demo   # all errors in one pass + the trace JSON
dotnet run   --project src/Atlas.Api                        # the live CommitCapital API on :5179
```

### Repository map (backend)

```
src/Atlas.Upstream.Contracts/   Domain/ · Ports/ · Sources/ · Composition/ (binds ports to sources)
src/Atlas.Classic.DataAnnotations/   classic #1 — attributes + a fat service
src/Atlas.Classic.AdapterChaining/   classic #2 — facade + gateways
src/Atlas.Classic.ValidatorFactory/  classic #3 — factory + one big method
src/Atlas.Classic.NTier/             classic #4 — the full layer cake (~29 files)
src/Atlas.Functional.Commands/   Core/ (owned framework + Spec) · Commitments/Rules/ · Pipelines/
src/Atlas.Api/                   minimal API over the functional handler
tests/Atlas.Functional.Commands.Tests/   23 tests — each rule in isolation + end-to-end + trace
```

## 12. Deployment

The API is one deployable unit. `src/Atlas.Api/Dockerfile` (multi-stage, .NET 10, non-root, port
8080) builds the `atlas-api` image; `.azure-pipelines/deploy-api.yml` pushes it to the container
registry and applies the API's own Terraform stack (`infra/stacks/api`, its own state) with that
tag, which rolls the Azure Container App — dev first, prod after an approval.
Configuration is environment variables (`ASPNETCORE_URLS`, `Cors__Origins__0..n`, `I18n__Folder`),
the probes hit `GET /healthz`, and the translation catalogs live on an Azure Files share mounted at
`/data/i18n`, which the API seeds from its bundled `i18n/` on the first start and never overwrites
after. `Atlas.Functional.Commands` and `Atlas.Upstream.Contracts` are packed to a NuGet feed by
`publish-packages.yml`; the Azure side is Terraform under `infra/`, one stack per deployable unit.
See [deployment.md](deployment.md).

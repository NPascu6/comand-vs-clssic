# Atlas.Classic.NTier — the full classic N-tier stack

This project implements **one** business operation — `CommitCapital` (a fund
manager commits capital to a co-investment node, in a fund, against a deal,
subject to 6 rules) — using the **complete classic enterprise N-tier layering**
a competent .NET team reaches for by default: Controller → DTO → Mapper →
Service → ValidatorFactory → Repositories (+ their own Entities + mappers) → JSON
config. It is the exhibit for "what one feature costs in the layered OO style",
to be compared against the functional command pipeline.

This is **not** a strawman. Every layer here is idiomatic, every interface is a
real testability seam, every mapper is the honest by-hand equivalent of what
AutoMapper would generate. The point is that even done *well*, the layering taxes
a single feature heavily — and that the tax compounds over a 5+ year Atlas lifetime.

## The call path for ONE request

```
CommitCapitalDto (wire, DataAnnotations)
   │  Controller.Submit: Validator.TryValidateObject  ← structural rule, pass #1
   │  CommitmentMapper.ToRequest                       ← DTO → domain
   ▼
CommitCapitalRequest (domain)
   │  CommitmentService.CommitAsync
   │    ├─ ValidatorFactory.GetValidator → CommitCapitalRequestValidator ← structural, pass #2
   │    ├─ FundRepository  → IFundClient  → ToEntity → FundEntity   (rules 2,3)
   │    ├─ DealRepository       → IDealClient       → ToEntity → DealEntity        (rule 4)
   │    ├─ CoInvestmentRepository → ICoInvestmentClient → ToEntity → CoInvestmentEntity (rule 5)
   │    ├─ ExposureRepository   → IExposureClient   → ToEntity → ExposureEntity    (rule 6)
   │    └─ AppetiteConfig (from appetite.config.json via AppetiteConfigFactory)    (rule 6)
   ▼
CommitmentResult (domain)
   │  CommitmentMapper.ToResponse                      ← domain → wire
   ▼
CommitmentResponseDto (wire, HTTP-ish: 200 / 400 / 422)
```

## Count the layers for this ONE feature

| # | Artifact | Folder |
|---|----------|--------|
| 1 | `CommitmentController` | Controllers/ |
| 2 | `CommitCapitalDto` (request DTO + DataAnnotations) | Dtos/ |
| 3 | `CommitmentResponseDto` (response DTO) | Dtos/ |
| 4 | `CommitmentMapper` (6 hand-rolled mappings) | Mapping/ |
| 5 | `CommitmentService` (the god service, rules 2-6) | Services/ |
| 6 | `ICommitmentService` | Services/ |
| 7 | `IValidator<T>` / `IValidatorFactory` / `ValidatorFactory` / `ValidationResult` | Validation/ |
| 8 | `CommitCapitalRequestValidator` (structural rule 1) | Validation/ |
| 9 | `IFundRepository` + `FundRepository` | Repositories/ |
| 10 | `IDealRepository` + `DealRepository` | Repositories/ |
| 11 | `ICoInvestmentRepository` + `CoInvestmentRepository` | Repositories/ |
| 12 | `IExposureRepository` + `ExposureRepository` | Repositories/ |
| 13 | `FundEntity` / `DealEntity` / `CoInvestmentEntity` / `ExposureEntity` | Repositories/Entities/ |
| 14 | `AppetiteConfig` + `AppetiteLimitConfig` (typed options) | Configuration/ |
| 15 | `AppetiteConfigFactory` (loads + deserializes JSON) | Configuration/ |
| 16 | `appetite.config.json` (externalised policy) | Configuration/ |
| 17 | `CommitCapitalRequest` + `CommitmentResult` (domain shapes) | Domain/ |
| 18 | `Program.cs` (manual composition root: ~10 construction steps) | / |

That is **Controller + 2 DTOs + Mapper + Service (+iface) + Factory(4 types) +
Validator + 4 Repositories + 4 Repository ifaces + 4 Entities + 4 entity-mappers
+ JSON config + config factory + 2 domain shapes + composition root** — roughly
**15+ files across ~8 layers** for a single operation, before any test project.

## Where the same data shape is restated

The ten request fields exist as **three** separate types — `CommitCapitalDto`,
`CommitCapitalRequest`, and (in the other samples) `CommitCapitalInput` — copied
between by hand. Each upstream snapshot is restated as a near-identical repository
Entity (4 of them), with `Headroom` / `CommittedIn` / the bucket-key convention
**re-implemented** on the entity because it must not depend on the contracts type
it mirrors. The outcome travels through **three** result shapes (`ValidationResult`
→ `CommitmentResult` → `CommitmentResponseDto`).

## Pros (why teams choose this, honestly)

- **Familiar.** Any .NET hire has shipped exactly this stack; onboarding is cheap.
- **Clear separation of concerns.** Wire shape, domain shape, persistence shape,
  policy and validation each have an obvious home.
- **Testable in principle.** Every collaborator is behind an interface, so the
  service, the repos and the controller can each be unit-tested with fakes.
- **Layer-swappable.** The repository ports mean the upstream source can change
  without the service noticing; policy lives in config, not code.
- **No magic.** Hand-rolled mappers and factory are step-through-able in a
  debugger — no reflection, no source generators, no third-party DSL.

## Cons (the long-term cost, especially for Atlas)

- **One feature touches ~15+ files across ~8 layers.** The ceremony-to-logic
  ratio is high: most files are plumbing, not rules.
- **A model/contract change ripples.** Add one field to a deal and you edit the
  upstream snapshot, `DealEntity`, the `ToEntity(DealSnapshot)` mapper, possibly
  `CommitCapitalDto` + `CommitCapitalRequest` + `ToRequest`, and the service —
  a shotgun edit across the whole vertical for one column.
- **Logic sprawls in the god service.** Rules 2-6 live in one long imperative
  method with six dependencies; a 7th rule edits it, two devs collide in it, and
  there is no per-rule unit to test in isolation — you test "the service".
- **Validation is duplicated.** DataAnnotations on the DTO **and** the homegrown
  `CommitCapitalRequestValidator` both assert structural rule 1, in two error
  vocabularies, kept in sync by hand — and neither owns it fully (the date check
  lives *only* in the validator; the rest overlap).
- **Deep call chains.** Controller → mapper → service → factory → validator, and
  service → 4×(repository → upstream client → mapper → entity). Following one
  request means opening a dozen files.
- **No structured decision trail.** Every result is a flat `bool + List<string>`
  of prose — no rule id, no severity, no machine-readable code, no record of
  which rules ran vs were short-circuited. For a trading-adjacent, audit-driven
  system like Atlas that missing trail is a genuine gap, not a nicety.
- **Inconsistent short-circuit vs aggregate.** Structural + fund failures
  `return` early; currency/deal/headroom/appetite accumulate. The UX (one error
  vs all errors) is decided per-rule by whichever the author reached for that day.

## Run it

```bash
dotnet build src/Atlas.Classic.NTier/Atlas.Classic.NTier.csproj   # 0 warnings, 0 errors
dotnet run   --project src/Atlas.Classic.NTier
```

Three scenarios run through the **controller** (identical inputs to every other
sample): **A** a clean PE commitment → `SUCCESS (HTTP 200)`; **B** simultaneous
headroom + appetite breaches → `FAILURE (HTTP 422)` reporting **both**; **C** a
structural pileup → `FAILURE (HTTP 400)`, rejected at the DTO boundary by
DataAnnotations before the service is ever called.

---

**Bottom line:** one operation, **29 `.cs` files / ~1,210 LOC across ~8 layers**
(plus a JSON config and the composition root) — the baseline the functional
command pipeline is measured against.

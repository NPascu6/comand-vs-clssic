# Atlas.Classic.DataAnnotations

> **Folder layout:** `Model/` (the request record + custom attributes) · `Validation/` (the async business service) · `Program.cs`.

The **classic "DataAnnotations + model validation"** take on validating a Atlas
`CommitCapital` business operation. One of several samples in this solution that
validate the *same* six rules against the *same* seeded upstream, so the
approaches can be compared honestly. This one is the baseline every .NET
developer already knows.

## What the pattern is

`System.ComponentModel.DataAnnotations` lets you declare validation rules as
**attributes on a model** (`[Required]`, `[Range]`, custom `ValidationAttribute`
subclasses), then run them with `Validator.TryValidateObject(...)`. It is the
same machinery ASP.NET Core uses to auto-validate action parameters during model
binding. Zero packages, zero ceremony.

## How this sample is structured

The six rules don't all fit the same place, and that split is the whole point:

| Layer | File | Rules | Sync/async |
|-------|------|-------|------------|
| Shape (declarative) | `CommitCapitalRequest.cs` + `CustomAttributes.cs` | 1 (structural) | **synchronous** |
| Business (imperative) | `CommitCapitalService.cs` | 2–6 (fund open, currency permitted, deal investable, headroom, appetite) | **asynchronous** |

- **Rule 1 (structural)** maps cleanly onto attributes: `[Required]` for the four
  string ids, `[Range]` for `Amount > 0`, and two small custom attributes —
  `[CurrencyCode]` (length == 3) and `[NotPastDate]`.
- **Rules 2–6** each need awaited upstream I/O (fund book, deal pipeline,
  co-investment hierarchy, appetite policy, exposure engine). Attributes are
  synchronous and **cannot await**, so these live in `CommitCapitalService` as a
  hand-written sequence of async `if` checks that accumulate errors into a
  `List<string>`.

### The `[NotPastDate]` awkwardness (read the comments)

The past-date rule needs a *deterministic* "today" (`2026-06-13`). Attributes are
constructed with compile-time constants, so they **cannot take a runtime value**.
`CommitCapitalService` smuggles `today` in via `ValidationContext.Items`, and the
attribute falls back to a hard-coded date otherwise. Both options are bad; the
comments in `CustomAttributes.cs` spell out why. In plain code, `today` is just a
parameter.

### The anti-pattern, on display

`Program.cs` ends with a **commented-out** `FundMustBeOpenAttribute` showing
the trap teams reach for: resolve a client from `ValidationContext` and
`.GetAwaiter().GetResult()` on the async call. It is service-locator +
sync-over-async (thread-pool starvation / deadlock risk) + no error accumulation.
Labelled clearly as the WRONG way.

## Running it

```bash
dotnet run --project src/Atlas.Classic.DataAnnotations
```

Three scenarios: **A** valid, **B** two simultaneous business breaches (headroom
*and* appetite), **C** a structural + upstream-state pileup (10 errors).

## Pros / Cons for Atlas

### Pros

- **Declarative and familiar** — every .NET dev reads it instantly; nothing to learn.
- **Zero dependencies** — `System.ComponentModel.DataAnnotations` is built in.
- **Excellent for DTO shape** — required fields, ranges, lengths, formats.
- **Free with ASP.NET Core model binding** — `[ApiController]` rejects malformed
  payloads before the handler runs. Ideal as the first gate at the HTTP edge.

### Cons (why it doesn't carry Atlas on its own)

- **Cannot do async business validation.** The rules that actually matter are all
  upstream I/O; attributes are synchronous, full stop. This is the disqualifier.
- **Validation logic is split in two places** — attributes *and* a service. To
  understand "what makes a commit valid" you must read both layers.
- **Attributes can't carry runtime context or compose.** No clean way to inject
  `today`, share a single fund fetch across rules 2 and 3, or express
  "rule 6 depends on rule 2 passing." The dependency order is implicit in the
  ordering of `if` statements.
- **Business rules buried in an if-chain are hard to unit-test in isolation.**
  There are no first-class "rule" objects — testing the appetite rule means
  standing up the whole service and faking all five clients.
- **No structured, per-rule audit trail.** Errors are flat strings. Atlas is
  trading-grade and needs to record *which* rule denied a commitment, with what
  inputs, for compliance and post-trade review. A `List<string>` can't carry that.

**Bottom line:** keep DataAnnotations for what it's great at — shape-checking the
DTO at the edge — and put the business rules somewhere that can `await`, compose,
and be audited. The other samples in this solution explore exactly that.

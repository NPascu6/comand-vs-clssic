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

### The `[NotPastDate]` awkwardness

The past-date rule needs a *deterministic* "today" (`2026-06-13`). Attributes are
constructed with compile-time constants, so they **cannot take a runtime value**.
That leaves three bad options:

1. **Hard-code the date in the attribute** — couples a reusable attribute to one
   operation's clock, and rots the moment "today" moves on.
2. **Read `DateTime.Today` inside `IsValid`** — the same payload validates
   differently tomorrow, and it is untestable without faking the system clock
   globally.
3. **Fish a clock out of `ValidationContext.Items`** — works, but the attribute
   now silently depends on the caller having stuffed the right key in, which is
   exactly the hidden coupling attributes were meant to avoid.

`NotPastDateAttribute` implements (3) with a fallback to (1), because ASP.NET
model binding never populates `Items`; `CommitCapitalService` smuggles `today`
in through `ValidationContext.Items` on every call. In plain code, `today` is
just a parameter.

### The anti-pattern to avoid

When teams first hit "I can't await in an attribute", the tempting move is to
resolve a client from the `ValidationContext` and block on the async call. It
compiles, it passes a quick demo, and it is wrong on three axes:

```csharp
public sealed class FundMustBeOpenAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext context)
    {
        // Service locator: the dependency is invisible at the call site, and
        // silently a no-op if nobody wired GetService.
        var client = (IFundClient?)context.GetService(typeof(IFundClient));
        if (client is null) return ValidationResult.Success;

        var fundId = (string?)value ?? string.Empty;

        // Sync-over-async: burns a thread per call, deadlocks under a
        // SynchronizationContext, and hides a network round-trip inside a
        // property check the caller assumes is cheap and pure.
        var snapshot = client.GetFundAsync(fundId).GetAwaiter().GetResult();

        // No accumulation, no context: rules cannot depend on each other,
        // cannot share the fund fetch, and have nowhere to record an audit trail.
        return snapshot is { Status: FundStatus.Open }
            ? ValidationResult.Success
            : new ValidationResult("Fund is not open.");
    }
}
```

The correct home for rules 2–6 is the async service. Attributes stay pure and
synchronous; business validation stays explicit, awaitable and testable.

### File by file

- **`Model/CommitCapitalRequest.cs`** — the same record would serve as the
  ASP.NET Core action parameter, letting `[ApiController]` reject a bad shape
  before the handler runs. `[Range]` is inclusive, so `Amount > 0` is expressed
  with an epsilon floor and a custom message (the default one leaks the raw
  bounds). The enums need no attribute because an invalid value cannot be
  constructed here; over HTTP you would add `[EnumDataType]`.
- **`Model/CustomAttributes.cs`** — `[CurrencyCode]` checks length only; a
  lookup against a real currency table would be I/O, and so belongs in the
  service. It lets `[Required]` own the null case so nothing is reported twice.
- **`Validation/CommitCapitalService.cs`** — accumulates every violation rather
  than bailing on the first, so a fund manager sees all problems at once
  (scenario B) instead of fixing one, resubmitting and discovering the next.
  The price is more upstream round-trips per attempt, and because the rules
  have data dependencies the service still short-circuits *within* a rule and
  skips rules whose preconditions failed. The fund is fetched once for rules 2
  and 3. `Validator.TryValidateObject` needs `validateAllProperties: true`, or
  only `[Required]` runs. The in-memory upstream is read-only, so a valid
  request only signals success.

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

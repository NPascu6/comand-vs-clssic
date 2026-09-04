# Atlas.Classic.ValidatorFactory

A **homegrown validator-factory** approach to validating the Atlas `CommitCapital`
operation. This is one of several samples that validate the *same six rules*
against the *same seeded upstream*, so different styles can be compared head to
head.

## The pattern

A classic, hand-rolled validation abstraction — the kind a competent enterprise
team writes when it has decided, as policy, **not** to depend on a third-party
validation library:

- **`IValidator<T>`** with `ValidationResult Validate(T instance)`.
- **`ValidationResult`** — a hand-rolled `bool IsValid` + `List<string> Errors`.
- **`IValidatorFactory` / `ValidatorFactory`** — a dictionary-backed registry
  that resolves a validator by its target type. No DI container, no library.
- **`CommitCapitalValidator`** — all six rules inlined into one imperative
  `Validate` method: nested `if`s, top-to-bottom order, manual error collection.

> This is deliberately **NOT FluentValidation**. The team avoids library
> coupling, so the validator base, the result type, and the factory are all
> hand-rolled. That is a legitimate choice — and this sample shows both what it
> buys you and what it costs.

## The async problem (the hinge of the whole thing)

`IValidator<T>.Validate` is **synchronous** — the natural shape, and the one most
teams write first. But every Atlas business rule needs **awaited upstream I/O**
(fund, deal, co-investment node, appetite limits, exposure). A sync method
cannot `await`. A real team resolves this one of three ugly ways:

1. block on async inside `Validate` (`.GetAwaiter().GetResult()`) — deadlock risk
   and a burned thread per call;
2. **pre-fetch** everything into a context object on a *separate async path*, then
   hand that to a sync validator;
3. define a *parallel* `IAsyncValidator<T>` and maintain two hierarchies forever.

This sample uses **(2)**, the most defensible option (`CommitCapitalContext.LoadAsync`).
The price is visible in `Program.cs`: the caller must run the async prefetch
**first**, then build the factory, then validate. The "validator" no longer
validates the raw input — it validates input **plus a bag of data someone else
assembled in the right order**.

## What this sample demonstrates honestly

- **Aggregation works *sometimes*.** Scenario B reports **both** the headroom
  breach and the appetite breach — because rules 5 and 6 call `AddError` and keep
  going. But rule 2 (fund open) **throws** and short-circuits, so a
  fund problem can never be reported alongside anything else. Same codebase,
  opposite UX, decided purely by whether a given author reached for `throw` or
  `AddError`.
- **Structural errors pile up cleanly; state errors don't.** Scenario C reports
  the four structural problems and stops — rule 1's early-return means the draft
  fund / missing node / closed deal are never even evaluated.

## Running it

```bash
dotnet build src/Atlas.Classic.ValidatorFactory/Atlas.Classic.ValidatorFactory.csproj
dotnet run   --project src/Atlas.Classic.ValidatorFactory
```

## Pros / Cons for Atlas

### Pros
- **Rules centralized per type.** Everything about `CommitCapitalInput` lives in
  one class — easy to find.
- **No library dependency.** Nothing to audit, version, or get locked into; the
  whole abstraction is ~150 lines you own.
- **Factory enables resolution / DI.** Callers resolve `IValidator<T>` by type
  without naming a concrete class; you could register per-tenant variants or
  swap implementations. This is the strongest part of the pattern.
- **Unit-testable in principle.** `Validate` is a pure function of input +
  context, so you can feed it a fixed context and assert on the result.

### Cons
- **The `Validate` method is if-soup that everyone edits.** Every new rule means
  editing the *same* method; two devs adding rules in one sprint collide. There
  is no per-rule unit of code — you only ever test "the validator", all rules at
  once.
- **The sync interface fights async upstream I/O.** `Validate` can't `await`, so
  fetching leaks out into a prefetch context the caller must remember to build
  first — forget it and the validator NREs on null data instead of returning a
  clean error.
- **Exceptions for control flow.** Rule 2 throws `ValidationException` to abort.
  That forces every caller into `try/catch` and makes one rule's failure swallow
  every other rule's result.
- **Order-dependence / fragility.** Later rules assume earlier ones passed and
  dereference nullable context. Reorder the blocks and you get a
  `NullReferenceException` or a wrong answer rather than a tidy message. The
  invariants are maintained only by *reading the method top to bottom*, not by
  the type system. (Each hazard is marked `ORDERING TRAP` in the code.)
- **Hard to compose or run rules independently.** You cannot ask "run just the
  appetite rule" or "run all rules and give me everything" — the method is one
  monolithic sequence with baked-in short-circuits.
- **Aggregation is manual and inconsistent.** There is no framework collecting
  errors; `AddError` vs `return` vs `throw` are chosen ad hoc, so some failures
  aggregate and some short-circuit (see Scenario B vs the rule-2 throw).
- **No structured per-rule audit trail.** `ValidationResult` is prose strings
  only — no rule id, no severity, no record of which rules *ran* vs were
  short-circuited. Atlas is trading-adjacent and needs **trading-grade
  traceability** ("which checks passed, which failed, with what inputs"); this
  shape cannot provide it without a rewrite.

## Folder layout

- `Framework/` — the homegrown abstraction: `ValidationResult.cs`, `IValidator.cs`,
  `ValidationException.cs`, `ValidatorFactory.cs`.
- `Validators/` — `CommitCapitalInput.cs`, `CommitCapitalContext.cs` (the async
  prefetch), and `CommitCapitalValidator.cs` (the big imperative method — the
  centerpiece to read).
- `GlobalUsings.cs`, `Program.cs` — at the root; `Program.cs` runs the three scenarios.

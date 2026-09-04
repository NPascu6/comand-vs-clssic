# Atlas.Classic.AdapterChaining

> **Folder layout:** `Facade/` (entry point) · `Adapters/` (the gateway chain + base) · `Domain/` (mapped contexts + typed properties) · `Contracts/` · `Validation/` (structural) · `Program.cs`.

The **classic "facade + adapter chaining"** take on the Atlas `CommitCapital`
operation. It deliberately mirrors how a **SharePoint-wrapping Document
Management System (DMS)** is usually built: one facade the web tier calls, and
beneath it a chain of adapters/gateways that wrap each upstream service and map
its data into strongly-typed internal models. This is the sibling of the
`Functional.Commands` project; both validate the *same* six rules against the
*same* seeded upstream, so the two styles can be compared on equal ground.

## How it is wired

```
Web tier
   │  CommitCapitalRequest
   ▼
CommitmentFacade.SubmitCommitmentAsync   ← orchestration + rule 1 (structural)
   ├─ FundGateway   : AdapterBase → IFundClient     ← rules 2, 3
   ├─ DealGateway        : AdapterBase → IDealClient          ← rule 4
   ├─ CoInvestmentGateway: AdapterBase → ICoInvestmentClient  ← rule 5
   └─ AppetiteGateway    : AdapterBase → IAppetiteClient      ← rule 6
            └─ ExposureGateway : AdapterBase → IExposureClient   (chained)
```

Each gateway hand-maps an upstream `*Snapshot` record into an internal
`*Context` model, and each gateway owns the rule(s) that need its data. The
facade threads the mapped contexts (and the request fields each rule needs)
from one adapter to the next.

### The "configurable strongly-typed properties" flavour

To echo the real DMS design, `FundGateway` doesn't expose snapshot fields
directly — it projects them into a `TypedPropertyBag` keyed by
`PropertyDescriptor<T>` (see `TypedProperties.cs`). That mirrors how the DMS
wraps SharePoint's configurable field definitions as a typed bag. It reads as
tidy enterprise code; it is also a second typed representation of data that was
already typed on the snapshot — exactly the kind of indirection a wrapper
accumulates.

### File by file

What the code itself does not say, because each point is a property of the
pattern rather than of any one line:

- **`Facade/CommitmentFacade.cs`** — `FromUpstream` is the composition root,
  kept in code so the chain is easy to see; a DI container would own it in
  production. Every business rule needs request fields the adapter does not
  hold (`Currency` for rule 3, four fields for rule 4, `FundId` and `Amount`
  for rule 5, `Amount` for rule 6), so each rule is split between the adapter
  (the data) and the facade (the input).
- **`Adapters/AdapterBase.cs`** — the "must exist" half of rules 2, 4 and 5 is
  a base-class helper that throws. It is the first rule fragment to leave the
  rules and live inside an adapter.
- **`Adapters/FundGateway.cs`** — `FundStatus.Open` is flattened to `IsOpen`
  during mapping, so what "open" means is decided in the mapping layer, not
  where the rule reads it.
- **`Adapters/DealGateway.cs`**, **`Adapters/CoInvestmentGateway.cs`** — one
  rule, several throwing checks: a deal with the wrong status *and* the wrong
  asset class, or a suspended node that *also* lacks headroom, reports only
  the check that runs first. The short-circuit happens within a rule, not just
  between rules. `Headroom` is copied as a value, so if its definition changes
  upstream the context keeps the old one until someone updates the mapping.
- **`Adapters/AppetiteGateway.cs`** — "no limit configured" is a flag set
  during mapping, while the decision that it means fail-closed sits in the rule
  one layer down; the policy lives apart from the data that triggers it.
- **`Domain/TypedProperties.cs`** — a mismatched `Set<T>`/`Get<T>` pair fails
  at runtime in `Get`, not at compile time.
- **`Contracts/CommitmentContracts.cs`** — `CommitmentClock.Today` is fixed so
  the demo is deterministic; a real wrapper would inject a clock and still have
  to thread it through every adapter that needs it. Validation-as-exception
  lets a deep chain abort without every caller inspecting a return value, at
  the cost of using control flow for expected business outcomes.
- **`Program.cs`** — pins `CultureInfo.InvariantCulture` so amounts and dates
  print identically on every machine. Scenario C fails structurally (blank
  `RequestedBy`, negative `Amount`, two-letter `Currency`, past date), so the
  full structural list is returned and the draft fund, missing node and closed
  deal are never evaluated.

## Where this pattern shines

It is the natural shape when you are genuinely *wrapping* a volatile upstream and
want the rest of the app insulated from it — which is precisely the DMS-over-
SharePoint situation. Familiar layering, clear ownership per adapter, and a
single facade method per operation make it easy to onboard onto and easy to pass
code review.

## Run it

```bash
dotnet build src/Atlas.Classic.AdapterChaining/Atlas.Classic.AdapterChaining.csproj
dotnet run   --project src/Atlas.Classic.AdapterChaining
```

Three scenarios print: **A** valid; **B** invalid (breaks headroom *and*
appetite, but see below); **C** invalid (structural pile-up).

## Pros / Cons for Atlas

**Pros**

- **Isolates upstream changes** — an upstream rename or reshape is absorbed in
  one gateway's mapping; the facade and rules don't move.
- **Strongly typed end to end** — internal `*Context` models and the
  `TypedPropertyBag` keep callers off raw, stringly-typed upstream data.
- **Familiar layering** — facade → adapter → client is what most enterprise
  .NET teams already build and review without friction.
- **Encapsulation** — each adapter hides one upstream's quirks (auth, paging,
  error shapes) behind a clean method.

**Cons (the honest ones, and why they bite Atlas)**

- **Deep call chains are hard to follow** — a single appetite check is four hops:
  `facade → AppetiteGateway → ExposureGateway → IExposureClient`. Tracing "where
  did this number come from?" means walking layers.
- **Lots of hand-mapping boilerplate** — every field is copied snapshot →
  context by hand. A new upstream field means editing the snapshot, the context,
  *and* the mapping before a rule can even see it.
- **Business rules scattered across adapters** — rules 2–6 live in four
  different gateway files and rule 1 lives in the facade. **There is no single
  place to read all the rules for committing capital.** Adding a 7th rule, or
  flipping appetite from fail-closed to fail-open, means hunting across layers.
- **Testing one rule means standing up many layers** — to unit-test the appetite
  rule you must construct/mock the appetite client *and* the exposure gateway
  *and* its client. The facade depends on four adapters; exercising one rule
  drags in the rest.
- **Tends to grow into a "Frankenstein"** — every new upstream or rule adds
  another adapter, another context, another mapping, another hop. It stays
  reasonable in review and bloats over time.
- **No structured per-rule audit trail** — rules throw, the facade catches the
  *first* exception and returns a bag of strings. There is no record of which
  rule id failed, which others *would* have failed, or the values evaluated. Atlas
  needs trading-grade traceability ("show every check this trade passed/failed,
  with inputs"); this shape cannot carry it without a rewrite.

### The short-circuit, made visible (scenario B)

Scenario B breaks **two** rules at once: `CI-SLEEVE-PC` has only 20M headroom
(request is 25M) **and** PrivateCredit|Emea sits at 230M of a 250M appetite
ceiling (+25M = 255M). Because the business phase is a `try/catch` around
adapters that **throw on the first breach**, the facade checks headroom (rule 5)
before appetite (rule 6) and reports **only the headroom breach**. That is not a
bug — it is the defining limitation of chained orchestration, and it is the gap
the functional/command approach is meant to close by collecting all failures.

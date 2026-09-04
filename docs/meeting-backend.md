# Meeting agenda — Atlas Backend design review

**Goal:** agree to build Atlas's backend on **functional commands + async validation** (vs the classic validation/N-tier stack).
**Deck:** `Atlas-Backend.pptx` (32 slides) · **Pre-read:** [architecture-backend.md](architecture-backend.md)
**Length:** ~55 min · **Format:** deck + live demo

## Attendees & roles
- **You** — presenter / proposer.
- **Lead architect** — primary decision-maker (owns the software-development-cycle standards).
- **Engineering manager** — delivery/timeline lens (optional).

## Before the meeting
- Send the pre-read (architecture-backend.md) + the deck 24h ahead.
- Pre-flight the demo: `dotnet build Atlas.Patterns.sln && dotnet test tests/Atlas.Functional.Commands.Tests` (23 green). Have two terminals ready.

## Agenda (timeboxed)
| Min | Segment | Deck / demo |
|---|---|---|
| 0–5 | **Frame the problem** — Atlas is async, policy-heavy; enterprise systems rot; cost of change over 5 years. | §1 (problem, cost-of-change) |
| 5–15 | **The classic stack & where it bloats** — 3 validation styles + the N-tier layer cake. | §2 + run `dotnet run --project src/Atlas.Classic.AdapterChaining` → **B reports only 1 of 2 breaches** |
| 15–25 | **The functional core** — owned core, a rule, errors-as-values, traceability; two styles one core; "convention, not a cage". | §3 + run `dotnet run --project src/Atlas.Functional.Commands` → **all errors in one pass + the decision-trace JSON** |
| 25–40 | **Pluggable & scalable** — ports & adapters, the one-line upstream swap, a 2nd feature on the same core, axes of change; the right tool per job. | §5/§7 + open `Composition/InMemoryUpstream.cs` + `Pipelines/` |
| 40–48 | **Operability + honest trade-offs** — failure policy, timeout, validate→execute race, authz, observability; the real costs. | §4 (operability + cons) |
| 48–53 | **Grounding & the ask** — Microsoft's own guidance + Uncle Bob (*Functional Design* / *The Clean Coder*). | §4 + close |
| 53–55 | **Decision & next steps.** | — |

## The ask
Adopt the functional command + async-validation pattern for Atlas's backend, and greenlight **one real vertical slice** (e.g. CommitCapital) end-to-end behind ports, as the reference implementation.

## Anticipated questions → responses
- **"Isn't this just MediatR / CQRS?"** — Same command-handler *shape* Microsoft endorses, but ~330 lines we own — no library, async-native, with a built-in decision trace.
- **"Why not FluentValidation / Serilog?"** — We keep their ergonomics (declarative validators, structured audit) without the dependency; the team has a no-coupling policy.
- **"Learning curve / hiring?"** — It's plain C#; the core is read in an afternoon; a rule is simpler than the 190-line method it replaces.
- **"Performance?"** — Not the driver here, and Atlas's volumes are modest. The case is structural — completeness, rule isolation, traceability, low cost-of-change. (If pushed: a few small allocations, negligible at this volume.)
- **"When is it the wrong choice?"** — Shape-only CRUD — keep DataAnnotations there. This earns its keep on async business policy.
- **"Migration / coexistence with existing systems?"** — Each existing system is one more upstream behind a port; adopt the pattern greenfield, slice by slice.

## Decision sought & next steps
- ✅ Decision: adopt the pattern for Atlas backend (or a time-boxed spike to de-risk).
- Next: build the first vertical slice + a port for one real upstream; review in 2 weeks.

## Live-demo checklist
```bash
dotnet test  tests/Atlas.Functional.Commands.Tests        # 23 green
dotnet run   --project src/Atlas.Classic.AdapterChaining  # classic: B → only 1 breach
dotnet run   --project src/Atlas.Functional.Commands      # functional: all errors + trace
dotnet run   --project src/Atlas.Api                      # live CommitCapital API on :5179
```
Open during the talk: `src/Atlas.Functional.Commands/Core/` · `…/Commitments/Rules/` · `src/Atlas.Upstream.Contracts/Ports/` + `Sources/`.

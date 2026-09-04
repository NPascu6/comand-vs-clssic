# Atlas.Functional.Commands

A command pipeline in plain .NET: declarative validators, async rules, aggregated
errors and a decision trace. No third-party packages.

## Layout

```
Core/           Result · Error · Rule · Validator · CommandHandler · DecisionTrace · Spec
Commitments/    CommitCapitalCommand · CommitCapitalHandler · CommitCapitalSpec · Rules/ (one file per rule)
Pipelines/      AdvanceDealStageCommand · AdvanceDealStageHandler · DealStageMachine · Rules/
```

## How a command is handled

1. A **command** is an immutable record carrying only the data needed to decide.
   No annotations, no framework types, so it is trivial to construct in a test.
2. A **handler** answers two questions: which `Rule<T>`s govern the command
   (`Rules`), and what to do once every rule has approved (`ExecuteAsync`).
   `CommandHandler<TCommand, TResult>` does the rest.
3. The **validator** runs every rule concurrently (`Task.WhenAll`) and aggregates
   every error. Wall-clock is roughly the slowest rule, not the sum of all upstream
   calls, and the caller sees the complete picture in one pass. A rule that throws
   is recorded as a `RULE_THREW` failure so it can never hide the other findings.
4. The **decision trace** records, per command, every rule that ran, its outcome,
   how long it took and the exact messages. It is plain data serialized with
   System.Text.Json; where it goes (file, event, database column) is the caller's
   choice.

## Rules

A rule is a value: a name and description for the trace, a `RuleKind` (structural
or upstream) and an async `RuleCheck`. Async is the default because almost every
rule that matters consults an upstream service.

Each rule lives in its own file under `Rules/`, as one factory on a static partial
class. A factory takes only the client interface it needs, so a rule is tested with
one hand-written stub; no container, no mocking framework. Adding a rule is a new
file plus one line in the handler; no existing file changes.

Two ways to declare the same thing, both producing `Rule<T>`:

- one file per rule, listed in the handler (`CommitCapitalHandler`);
- a `Spec<T>` with `RuleFor(x => x.Field).NotEmpty()` chains for structure and
  `Add(...)` for the shared async rules (`CommitCapitalSpec`).

## Errors and results

`Error` is a record with a stable `Code`, a `Message`, a `Severity` and the `Field`
it relates to. `Result` and `Result<T>` carry success or a set of errors;
`Result.Combine` aggregates across many results instead of stopping at the first.
An `Error` converts implicitly to a failed `Result`, so a rule can `return error;`.

## Request-scoped memoization

Rules are independent and each fetches what it needs, so two rules reading the same
fund would call upstream twice. Wrap the upstream in `MemoizedUpstream` (from
Atlas.Upstream.Contracts) once per command and concurrent readers of the same key
share a single in-flight call.

## Deal-stage machine

`Pipelines/` applies the same pieces to a state-machine transition. The lifecycle is
data (`DealStageMachine.Allowed`): add a stage or an edge there and the command,
rule and handler stay unchanged.

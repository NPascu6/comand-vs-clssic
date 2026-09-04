# `@atlas/commands` — the TypeScript twin of `Atlas.Functional.Commands.Core`

The same shape as the .NET core, in the browser and in the tooling:

```
command ──► rules ──► validator ──► handler
                       (aggregates    (executes only
                        every error,    once every rule
                        builds the      approved)
                        trace)
```

- **`Rule<TCommand>`** — a value: a name, a description, a kind, and a check that returns
  the violations it found. Testable alone, listed by a handler, recorded by name in the trace.
- **`validate`** — runs every rule, aggregates every error and builds the `DecisionTrace`.
  Nothing short-circuits: a command that breaks four rules reports four failures, not the
  first one.
- **`handle`** — validate, then execute only if every rule approved.

The trace types (`DecisionTrace`, `TraceEntry`, `RuleKind`, `DomainError`, `Severity`) come
from `@atlas/contracts` — the same JSON the ASP.NET API emits — so a trace built here and a
trace returned by the .NET handler are the same value, and one UI renders both.

## Severity

Only `Severity: 'Error'` rejects a command. A rule may return a `'Warning'` instead: it is
aggregated, written into the trace and shown to the reviewer, but it does not block. That
is how `TextRemainsReadable` reports supporting copy that sits just under WCAG AA without
stopping a brand change.

## Two differences from the .NET core

- **Synchronous.** The .NET rules run concurrently because each one calls upstream. Here
  every rule reads data the caller already holds, so they run in order — and the trace keeps
  that order.
- **`latencyMs`.** A rule standing in for a network call (the browser's offline mock of the
  commit-capital rules) states the latency it represents, so the trace reads like the real
  one. In-memory rules leave it unset and the validator times them.

## Used by

- [`@atlas/figma-sync`](../figma-sync) — the five gates a Figma change passes before it may become a pull request.

// A rule is a value: testable alone with one stub, listed by a handler, recorded by name
// in the trace. Mirrors Rule<T> in Atlas.Functional.Commands.Core.

import type { DomainError, RuleKind, Severity } from '@atlas/contracts';

/** No errors means the rule approved. */
export type RuleCheck<TCommand> = (command: TCommand) => DomainError[];

export interface Rule<TCommand> {
  name: string;
  description: string;
  kind: RuleKind;
  check: RuleCheck<TCommand>;
  /**
   * What the upstream round-trip costs. In-memory rules leave it unset and the validator
   * times them; a rule standing in for a network call states the latency it represents.
   */
  latencyMs?: number;
}

export const violation = (code: string, message: string, field?: string, severity: Severity = 'Error'): DomainError =>
  ({ code, message, field, severity });

/** Reads at the call site as `structural('Structural', 'Command is well-formed', check)`. */
export const structural = <TCommand>(name: string, description: string, check: RuleCheck<TCommand>): Rule<TCommand> =>
  ({ name, description, kind: 'Structural', check });

export const upstream = <TCommand>(
  name: string,
  description: string,
  check: RuleCheck<TCommand>,
  latencyMs?: number,
): Rule<TCommand> => ({ name, description, kind: 'Upstream', check, ...latencyMs === undefined ? {} : { latencyMs } });

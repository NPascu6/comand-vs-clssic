// Every rule runs and every error is aggregated — never short-circuited. The .NET core
// runs its rules concurrently because they call upstream; here every rule reads data the
// caller already holds, so they run in order and the trace keeps that order.

import type { DecisionTrace, DomainError, TraceEntry } from '@atlas/contracts';
import type { Rule } from './rule.ts';
import { violation } from './rule.ts';

export interface Validation {
  approved: boolean;
  /** Everything the rules found, blocking or not. */
  errors: DomainError[];
  trace: DecisionTrace;
}

/** Only an Error rejects the command; a Warning is recorded in the trace for the reviewer to weigh. */
const blocks = (error: DomainError): boolean => error.severity === 'Error';

export function validate<TCommand>(
  command: TCommand,
  rules: readonly Rule<TCommand>[],
  commandName: string,
  correlationId: string,
): Validation {
  const entries = rules.map((rule) => run(rule, command));
  const errors = entries.flatMap((entry) => entry.errors);
  const approved = !errors.some(blocks);
  const passed = entries.filter((entry) => !entry.errors.some(blocks)).length;

  return {
    approved,
    errors,
    trace: {
      correlationId,
      command: commandName,
      entries: entries.map((entry) => entry.entry),
      approved,
      passed,
      failed: entries.length - passed,
      totalRuleMs: round(entries.reduce((total, entry) => total + entry.entry.elapsedMs, 0)),
    },
  };
}

function run<TCommand>(rule: Rule<TCommand>, command: TCommand): { errors: DomainError[]; entry: TraceEntry } {
  const started = performance.now();
  let errors: DomainError[];
  try {
    errors = rule.check(command);
  } catch (thrown) {
    // A misbehaving rule becomes data, not an exception that hides the other findings.
    errors = [violation('RULE_THREW', `${rule.name} threw: ${thrown instanceof Error ? thrown.message : String(thrown)}`)];
  }
  return {
    errors,
    entry: {
      rule: rule.name,
      description: rule.description,
      kind: rule.kind,
      outcome: errors.some(blocks) ? 'Failed' : 'Passed',
      elapsedMs: rule.latencyMs ?? round(performance.now() - started),
      messages: errors.map(message),
    },
  };
}

const message = (error: DomainError): string =>
  `[${error.code}]${blocks(error) ? '' : ' (warning)'} ${error.field ? `${error.field}: ` : ''}${error.message}`;

const round = (value: number): number => Math.round(value * 100) / 100;

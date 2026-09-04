// The pipeline: validate, then — only if every rule approved — execute. Mirrors
// CommandHandler<TCommand, TResult> in Atlas.Functional.Commands.Core.

import type { DecisionTrace, DomainError } from '@atlas/contracts';
import type { Rule } from './rule.ts';
import { validate } from './validator.ts';

export interface CommandDefinition<TCommand, TResult> {
  /** The name the trace records, e.g. `CommitCapitalCommand`. */
  name: string;
  rules: readonly Rule<TCommand>[];
  /** Runs only after every rule has approved. */
  execute: (command: TCommand) => TResult;
}

export interface HandlerOutcome<TResult> {
  approved: boolean;
  /** `null` whenever the outcome was rejected. */
  value: TResult | null;
  errors: DomainError[];
  trace: DecisionTrace;
}

export function handle<TCommand, TResult>(
  definition: CommandDefinition<TCommand, TResult>,
  command: TCommand,
  correlationId: string,
): HandlerOutcome<TResult> {
  const { approved, errors, trace } = validate(command, definition.rules, definition.name, correlationId);
  return { approved, value: approved ? definition.execute(command) : null, errors, trace };
}

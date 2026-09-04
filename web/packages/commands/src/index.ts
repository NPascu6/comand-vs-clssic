// The command pattern this repository is written in, as three small pieces:
//
//   rule.ts       a named check over one input, and the kinds of failure it can report
//   validator.ts  runs every rule, collecting failures instead of stopping at the first
//   handler.ts    runs the rules, then the effect, and returns the decision trace either way
//
// Pure: a rule is a function, the validator does no I/O, and the handler's effect is the caller's.

export { structural, upstream, violation } from './rule.ts';
export type { Rule, RuleCheck } from './rule.ts';
export { validate } from './validator.ts';
export type { Validation } from './validator.ts';
export { handle } from './handler.ts';
export type { CommandDefinition, HandlerOutcome } from './handler.ts';

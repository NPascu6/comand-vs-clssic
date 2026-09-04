import assert from 'node:assert/strict';
import { referenceData } from '@atlas/contracts';
import { evaluateCommit } from '../../web/slices/commit-capital/src/rules.ts';
import { scenarios } from '../../web/slices/commit-capital/src/scenarios.ts';

// Mirrors CommitCapitalHandlerTests: the in-browser rules must give the .NET handler's outcome for each scenario.

const scenario = (scenarioId: string) => scenarios.find((candidate) => candidate.id === scenarioId)!.command;
const codes = (errors: { code: string }[]) => errors.map((error) => error.code);

Deno.test('Scenario A: a valid commitment is approved with a receipt and a full trace', () => {
  const outcome = evaluateCommit(scenario('A'), referenceData, 'SCN-A');

  assert.equal(outcome.approved, true);
  assert.equal(outcome.commitmentId, 'CMT-PF-APAC-CREDIT-DEAL-PE-NA-02-10000000');
  assert.deepEqual(outcome.errors, []);
  assert.equal(outcome.trace.passed, 6);
  assert.equal(outcome.trace.failed, 0);
  assert.equal(outcome.trace.correlationId, 'SCN-A');
});

Deno.test('Scenario B: BOTH breaches are reported in a single pass', () => {
  const outcome = evaluateCommit(scenario('B'), referenceData, 'SCN-B');
  const found = codes(outcome.errors);

  assert.equal(outcome.approved, false);
  assert.equal(outcome.commitmentId, null);
  // The headline: short-circuiting validators lose one of these.
  assert.ok(found.includes('COINVEST_NO_HEADROOM'), found.join());
  assert.ok(found.includes('APPETITE_BREACH'), found.join());
});

Deno.test('Scenario C: structural and state failures are aggregated together', () => {
  const outcome = evaluateCommit(scenario('C'), referenceData, 'SCN-C');
  const found = codes(outcome.errors);

  assert.equal(outcome.approved, false);
  // PF-DRAFT exists but is Draft; CI-MISSING does not exist; DEAL-CLOSED-04 is Closed.
  for (const expected of ['REQUIRED', 'AMOUNT_NONPOSITIVE', 'CURRENCY_FORMAT', 'DATE_IN_PAST', 'FUND_NOT_OPEN', 'COINVEST_NOT_FOUND', 'DEAL_NOT_INVESTABLE']) {
    assert.ok(found.includes(expected), `${expected} missing from ${found.join()}`);
  }
  assert.equal(outcome.trace.failed, 6);
});

Deno.test('Every rule appears in the trace exactly once, in order, with its kind', () => {
  const outcome = evaluateCommit(scenario('A'), referenceData, 'SCN-T');

  assert.deepEqual(
    outcome.trace.entries.map((entry) => entry.rule),
    ['Structural', 'FundMustBeOpen', 'CurrencyMustBePermitted', 'DealMustBeInvestable', 'CoInvestmentMustHaveHeadroom', 'CommitmentMustBeWithinAppetite'],
  );
  assert.deepEqual(outcome.trace.entries.map((entry) => entry.kind), ['Structural', 'Upstream', 'Upstream', 'Upstream', 'Upstream', 'Upstream']);
  assert.ok(outcome.trace.totalRuleMs > 0);
});

Deno.test('Trace messages carry the error code and the offending field', () => {
  const outcome = evaluateCommit(scenario('C'), referenceData, 'SCN-M');
  const structural = outcome.trace.entries.find((entry) => entry.rule === 'Structural')!;

  assert.equal(structural.outcome, 'Failed');
  assert.ok(structural.messages.some((message) => message.startsWith('[AMOUNT_NONPOSITIVE] amount:')), structural.messages.join('\n'));
});

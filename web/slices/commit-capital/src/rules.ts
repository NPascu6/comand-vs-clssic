import type { CommitCapitalCommand, CommitOutcome, DomainError, ReferenceData, RuleKind, TraceEntry } from '@atlas/contracts';
import { bucketKey, seedAppetite, seedExposure } from '@atlas/contracts';

// ---------------------------------------------------------------------------
// A deterministic, in-browser stand-in for the backend's six rules, so the UI
// is fully interactive offline and produces the SAME outcome (and a real
// decision trace) as the .NET handler. In "Live API" mode this is not used —
// the trace comes from the server, but the UI renders it identically.
// ---------------------------------------------------------------------------

const TODAY = '2026-06-13';

interface RuleEval {
  name: string;
  description: string;
  kind: RuleKind;
  elapsedMs: number;
  errors: DomainError[];
}

const err = (code: string, message: string, field?: string): DomainError => ({ code, message, field, severity: 'Error' });

export function evaluateCommit(cmd: CommitCapitalCommand, ref: ReferenceData, correlationId: string): CommitOutcome {
  const evals: RuleEval[] = [
    structural(cmd),
    fundMustBeOpen(cmd, ref),
    currencyMustBePermitted(cmd, ref),
    dealMustBeInvestable(cmd, ref),
    coInvestmentMustHaveHeadroom(cmd, ref),
    commitmentMustBeWithinAppetite(cmd),
  ];

  const entries: TraceEntry[] = evals.map((e) => ({
    rule: e.name,
    description: e.description,
    kind: e.kind,
    outcome: e.errors.length === 0 ? 'Passed' : 'Failed',
    elapsedMs: e.elapsedMs,
    messages: e.errors.map((x) => `[${x.code}] ${x.field ? x.field + ': ' : ''}${x.message}`),
  }));

  const errors = evals.flatMap((e) => e.errors);
  const approved = errors.length === 0;
  const passed = entries.filter((e) => e.outcome === 'Passed').length;

  return {
    approved,
    commitmentId: approved ? `CMT-${cmd.fundId}-${cmd.dealId}-${cmd.amount}` : null,
    errors,
    trace: {
      correlationId,
      command: 'CommitCapitalCommand',
      entries,
      approved,
      passed,
      failed: entries.length - passed,
      totalRuleMs: Math.round(entries.reduce((a, e) => a + e.elapsedMs, 0) * 100) / 100,
    },
  };
}

function structural(cmd: CommitCapitalCommand): RuleEval {
  const errors: DomainError[] = [];
  if (!cmd.fundId.trim()) errors.push(err('REQUIRED', 'FundId is required', 'fundId'));
  if (!cmd.coInvestmentId.trim()) errors.push(err('REQUIRED', 'CoInvestmentId is required', 'coInvestmentId'));
  if (!cmd.dealId.trim()) errors.push(err('REQUIRED', 'DealId is required', 'dealId'));
  if (!cmd.requestedBy.trim()) errors.push(err('REQUIRED', 'RequestedBy is required', 'requestedBy'));
  if (cmd.amount <= 0) errors.push(err('AMOUNT_NONPOSITIVE', `Amount must be greater than 0 (was ${cmd.amount.toLocaleString('en-US')})`, 'amount'));
  if (cmd.currency.length !== 3) errors.push(err('CURRENCY_FORMAT', `Currency must be a 3-letter code (was '${cmd.currency}')`, 'currency'));
  if (cmd.commitmentDate < TODAY) errors.push(err('DATE_IN_PAST', `CommitmentDate ${cmd.commitmentDate} is before today (${TODAY})`, 'commitmentDate'));
  return { name: 'Structural', description: 'Command is well-formed', kind: 'Structural', elapsedMs: 0.2, errors };
}

function fundMustBeOpen(cmd: CommitCapitalCommand, ref: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const pf = ref.funds.find((p) => p.fundId === cmd.fundId);
  if (!pf) errors.push(err('FUND_NOT_FOUND', `Fund '${cmd.fundId}' was not found`, 'fundId'));
  else if (pf.status !== 'Open') errors.push(err('FUND_NOT_OPEN', `Fund '${cmd.fundId}' is ${pf.status}, must be Open`, 'fundId'));
  return { name: 'FundMustBeOpen', description: 'Fund exists upstream and is Open', kind: 'Upstream', elapsedMs: 5.8, errors };
}

function currencyMustBePermitted(cmd: CommitCapitalCommand, ref: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const pf = ref.funds.find((p) => p.fundId === cmd.fundId);
  if (pf && !pf.permittedCurrencies.includes(cmd.currency)) {
    errors.push(err('CURRENCY_NOT_PERMITTED', `Currency '${cmd.currency}' is not permitted for '${cmd.fundId}' (permitted: ${pf.permittedCurrencies.join(', ')})`, 'currency'));
  }
  return { name: 'CurrencyMustBePermitted', description: "Currency is on the fund's permitted list", kind: 'Upstream', elapsedMs: 5.9, errors };
}

function dealMustBeInvestable(cmd: CommitCapitalCommand, ref: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const deal = ref.deals.find((d) => d.dealId === cmd.dealId);
  if (!deal) {
    errors.push(err('DEAL_NOT_FOUND', `Deal '${cmd.dealId}' was not found`, 'dealId'));
  } else {
    if (deal.status !== 'Investable') errors.push(err('DEAL_NOT_INVESTABLE', `Deal '${cmd.dealId}' is ${deal.status}, must be Investable`, 'dealId'));
    if (cmd.commitmentDate < deal.investableFrom || cmd.commitmentDate > deal.investableTo)
      errors.push(err('DEAL_WINDOW', `CommitmentDate ${cmd.commitmentDate} is outside the deal window [${deal.investableFrom}..${deal.investableTo}]`, 'commitmentDate'));
    if (cmd.assetClass !== deal.assetClass) errors.push(err('ASSETCLASS_MISMATCH', `Asset class ${cmd.assetClass} does not match deal ${deal.assetClass}`, 'assetClass'));
    if (cmd.region !== deal.region) errors.push(err('REGION_MISMATCH', `Region ${cmd.region} does not match deal ${deal.region}`, 'region'));
    if (cmd.liquidity !== deal.liquidity) errors.push(err('LIQUIDITY_MISMATCH', `Liquidity ${cmd.liquidity} does not match deal ${deal.liquidity}`, 'liquidity'));
  }
  return { name: 'DealMustBeInvestable', description: 'Deal is Investable in-window and matches the commitment', kind: 'Upstream', elapsedMs: 5.7, errors };
}

function coInvestmentMustHaveHeadroom(cmd: CommitCapitalCommand, ref: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const node = ref.coInvestments.find((n) => n.coInvestmentId === cmd.coInvestmentId);
  if (!node) {
    errors.push(err('COINVEST_NOT_FOUND', `Co-investment '${cmd.coInvestmentId}' was not found`, 'coInvestmentId'));
  } else {
    if (node.fundId !== cmd.fundId) errors.push(err('COINVEST_WRONG_FUND', `Co-investment '${cmd.coInvestmentId}' belongs to '${node.fundId}', not '${cmd.fundId}'`, 'coInvestmentId'));
    if (node.status !== 'Active') errors.push(err('COINVEST_NOT_ACTIVE', `Co-investment '${cmd.coInvestmentId}' is ${node.status}, must be Active`, 'coInvestmentId'));
    if (node.headroom < cmd.amount) errors.push(err('COINVEST_NO_HEADROOM', `Co-investment '${cmd.coInvestmentId}' has ${node.headroom.toLocaleString('en-US')} headroom, requested ${cmd.amount.toLocaleString('en-US')}`, 'amount'));
  }
  return { name: 'CoInvestmentMustHaveHeadroom', description: 'Node belongs to the fund, is Active, and has headroom', kind: 'Upstream', elapsedMs: 5.9, errors };
}

function commitmentMustBeWithinAppetite(cmd: CommitCapitalCommand): RuleEval {
  const errors: DomainError[] = [];
  const limits = seedAppetite[cmd.fundId] ?? [];
  const limit = limits.find((l) => l.assetClass === cmd.assetClass && l.region === cmd.region);
  if (!limit) {
    errors.push(err('APPETITE_NONE', `No appetite configured for bucket ${bucketKey(cmd.assetClass, cmd.region)} on '${cmd.fundId}' — denied by default`, 'fundId'));
  } else {
    const committed = seedExposure[cmd.fundId]?.committedByBucket[bucketKey(cmd.assetClass, cmd.region)] ?? 0;
    const projected = committed + cmd.amount;
    if (projected > limit.maxAmount) {
      errors.push(err('APPETITE_BREACH', `Bucket ${bucketKey(cmd.assetClass, cmd.region)}: ${committed.toLocaleString('en-US')} committed + ${cmd.amount.toLocaleString('en-US')} = ${projected.toLocaleString('en-US')} exceeds limit ${limit.maxAmount.toLocaleString('en-US')}`, 'amount'));
    }
  }
  return { name: 'CommitmentMustBeWithinAppetite', description: 'Existing exposure + this commitment stays within appetite', kind: 'Upstream', elapsedMs: 6.0, errors };
}

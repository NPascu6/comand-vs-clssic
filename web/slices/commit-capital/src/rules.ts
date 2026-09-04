import type { CommitCapitalCommand, CommitOutcome, DomainError, ReferenceData, RuleKind, TraceEntry } from '@atlas/contracts';
import { bucketKey, seedAppetite, seedExposure } from '@atlas/contracts';

// Mirrors the backend's six rules so the offline mock yields the same outcome and decision trace as the .NET handler.

const TODAY = '2026-06-13';

interface RuleEval {
  name: string;
  description: string;
  kind: RuleKind;
  elapsedMs: number;
  errors: DomainError[];
}

const domainError = (code: string, message: string, field?: string): DomainError => ({ code, message, field, severity: 'Error' });

export function evaluateCommit(command: CommitCapitalCommand, reference: ReferenceData, correlationId: string): CommitOutcome {
  const evaluations: RuleEval[] = [
    structural(command),
    fundMustBeOpen(command, reference),
    currencyMustBePermitted(command, reference),
    dealMustBeInvestable(command, reference),
    coInvestmentMustHaveHeadroom(command, reference),
    commitmentMustBeWithinAppetite(command),
  ];

  const entries: TraceEntry[] = evaluations.map((evaluation) => ({
    rule: evaluation.name,
    description: evaluation.description,
    kind: evaluation.kind,
    outcome: evaluation.errors.length === 0 ? 'Passed' : 'Failed',
    elapsedMs: evaluation.elapsedMs,
    messages: evaluation.errors.map((error) => `[${error.code}] ${error.field ? error.field + ': ' : ''}${error.message}`),
  }));

  const errors = evaluations.flatMap((evaluation) => evaluation.errors);
  const approved = errors.length === 0;
  const passed = entries.filter((entry) => entry.outcome === 'Passed').length;

  return {
    approved,
    commitmentId: approved ? `CMT-${command.fundId}-${command.dealId}-${command.amount}` : null,
    errors,
    trace: {
      correlationId,
      command: 'CommitCapitalCommand',
      entries,
      approved,
      passed,
      failed: entries.length - passed,
      totalRuleMs: Math.round(entries.reduce((sum, entry) => sum + entry.elapsedMs, 0) * 100) / 100,
    },
  };
}

function structural(command: CommitCapitalCommand): RuleEval {
  const errors: DomainError[] = [];
  if (!command.fundId.trim()) errors.push(domainError('REQUIRED', 'FundId is required', 'fundId'));
  if (!command.coInvestmentId.trim()) errors.push(domainError('REQUIRED', 'CoInvestmentId is required', 'coInvestmentId'));
  if (!command.dealId.trim()) errors.push(domainError('REQUIRED', 'DealId is required', 'dealId'));
  if (!command.requestedBy.trim()) errors.push(domainError('REQUIRED', 'RequestedBy is required', 'requestedBy'));
  if (command.amount <= 0) errors.push(domainError('AMOUNT_NONPOSITIVE', `Amount must be greater than 0 (was ${command.amount.toLocaleString('en-US')})`, 'amount'));
  if (command.currency.length !== 3) errors.push(domainError('CURRENCY_FORMAT', `Currency must be a 3-letter code (was '${command.currency}')`, 'currency'));
  if (command.commitmentDate < TODAY) errors.push(domainError('DATE_IN_PAST', `CommitmentDate ${command.commitmentDate} is before today (${TODAY})`, 'commitmentDate'));
  return { name: 'Structural', description: 'Command is well-formed', kind: 'Structural', elapsedMs: 0.2, errors };
}

function fundMustBeOpen(command: CommitCapitalCommand, reference: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const fund = reference.funds.find((candidate) => candidate.fundId === command.fundId);
  if (!fund) errors.push(domainError('FUND_NOT_FOUND', `Fund '${command.fundId}' was not found`, 'fundId'));
  else if (fund.status !== 'Open') errors.push(domainError('FUND_NOT_OPEN', `Fund '${command.fundId}' is ${fund.status}, must be Open`, 'fundId'));
  return { name: 'FundMustBeOpen', description: 'Fund exists upstream and is Open', kind: 'Upstream', elapsedMs: 5.8, errors };
}

function currencyMustBePermitted(command: CommitCapitalCommand, reference: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const fund = reference.funds.find((candidate) => candidate.fundId === command.fundId);
  if (fund && !fund.permittedCurrencies.includes(command.currency)) {
    errors.push(domainError('CURRENCY_NOT_PERMITTED', `Currency '${command.currency}' is not permitted for '${command.fundId}' (permitted: ${fund.permittedCurrencies.join(', ')})`, 'currency'));
  }
  return { name: 'CurrencyMustBePermitted', description: "Currency is on the fund's permitted list", kind: 'Upstream', elapsedMs: 5.9, errors };
}

function dealMustBeInvestable(command: CommitCapitalCommand, reference: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const deal = reference.deals.find((candidate) => candidate.dealId === command.dealId);
  if (!deal) {
    errors.push(domainError('DEAL_NOT_FOUND', `Deal '${command.dealId}' was not found`, 'dealId'));
  } else {
    if (deal.status !== 'Investable') errors.push(domainError('DEAL_NOT_INVESTABLE', `Deal '${command.dealId}' is ${deal.status}, must be Investable`, 'dealId'));
    if (command.commitmentDate < deal.investableFrom || command.commitmentDate > deal.investableTo)
      errors.push(domainError('DEAL_WINDOW', `CommitmentDate ${command.commitmentDate} is outside the deal window [${deal.investableFrom}..${deal.investableTo}]`, 'commitmentDate'));
    if (command.assetClass !== deal.assetClass) errors.push(domainError('ASSETCLASS_MISMATCH', `Asset class ${command.assetClass} does not match deal ${deal.assetClass}`, 'assetClass'));
    if (command.region !== deal.region) errors.push(domainError('REGION_MISMATCH', `Region ${command.region} does not match deal ${deal.region}`, 'region'));
    if (command.liquidity !== deal.liquidity) errors.push(domainError('LIQUIDITY_MISMATCH', `Liquidity ${command.liquidity} does not match deal ${deal.liquidity}`, 'liquidity'));
  }
  return { name: 'DealMustBeInvestable', description: 'Deal is Investable in-window and matches the commitment', kind: 'Upstream', elapsedMs: 5.7, errors };
}

function coInvestmentMustHaveHeadroom(command: CommitCapitalCommand, reference: ReferenceData): RuleEval {
  const errors: DomainError[] = [];
  const node = reference.coInvestments.find((candidate) => candidate.coInvestmentId === command.coInvestmentId);
  if (!node) {
    errors.push(domainError('COINVEST_NOT_FOUND', `Co-investment '${command.coInvestmentId}' was not found`, 'coInvestmentId'));
  } else {
    if (node.fundId !== command.fundId) errors.push(domainError('COINVEST_WRONG_FUND', `Co-investment '${command.coInvestmentId}' belongs to '${node.fundId}', not '${command.fundId}'`, 'coInvestmentId'));
    if (node.status !== 'Active') errors.push(domainError('COINVEST_NOT_ACTIVE', `Co-investment '${command.coInvestmentId}' is ${node.status}, must be Active`, 'coInvestmentId'));
    if (node.headroom < command.amount) errors.push(domainError('COINVEST_NO_HEADROOM', `Co-investment '${command.coInvestmentId}' has ${node.headroom.toLocaleString('en-US')} headroom, requested ${command.amount.toLocaleString('en-US')}`, 'amount'));
  }
  return { name: 'CoInvestmentMustHaveHeadroom', description: 'Node belongs to the fund, is Active, and has headroom', kind: 'Upstream', elapsedMs: 5.9, errors };
}

function commitmentMustBeWithinAppetite(command: CommitCapitalCommand): RuleEval {
  const errors: DomainError[] = [];
  const limits = seedAppetite[command.fundId] ?? [];
  const limit = limits.find((candidate) => candidate.assetClass === command.assetClass && candidate.region === command.region);
  if (!limit) {
    errors.push(domainError('APPETITE_NONE', `No appetite configured for bucket ${bucketKey(command.assetClass, command.region)} on '${command.fundId}' — denied by default`, 'fundId'));
  } else {
    const committed = seedExposure[command.fundId]?.committedByBucket[bucketKey(command.assetClass, command.region)] ?? 0;
    const projected = committed + command.amount;
    if (projected > limit.maxAmount) {
      errors.push(domainError('APPETITE_BREACH', `Bucket ${bucketKey(command.assetClass, command.region)}: ${committed.toLocaleString('en-US')} committed + ${command.amount.toLocaleString('en-US')} = ${projected.toLocaleString('en-US')} exceeds limit ${limit.maxAmount.toLocaleString('en-US')}`, 'amount'));
    }
  }
  return { name: 'CommitmentMustBeWithinAppetite', description: 'Existing exposure + this commitment stays within appetite', kind: 'Upstream', elapsedMs: 6.0, errors };
}

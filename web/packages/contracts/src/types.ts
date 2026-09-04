// Enums are string-literal unions so they match the JSON the ASP.NET API emits (JsonStringEnumConverter).

export type AssetClass = 'PrivateEquity' | 'PrivateCredit' | 'LiquidEquity' | 'Etf';
export type Region = 'NorthAmerica' | 'Emea' | 'Apac' | 'Latam';
export type Liquidity = 'Illiquid' | 'Liquid';
export type FundStatus = 'Draft' | 'Open' | 'Frozen' | 'Closed';
export type DealStatus = 'Pipeline' | 'Investable' | 'Closed' | 'Withdrawn';
export type CoInvestmentStatus = 'Proposed' | 'Active' | 'Suspended' | 'Closed';

export interface FundSnapshot {
  fundId: string;
  name: string;
  status: FundStatus;
  baseCurrency: string;
  permittedCurrencies: string[];
}

export interface DealSnapshot {
  dealId: string;
  name: string;
  status: DealStatus;
  assetClass: AssetClass;
  region: Region;
  liquidity: Liquidity;
  investableFrom: string; // yyyy-MM-dd
  investableTo: string; // yyyy-MM-dd
  currency: string;
}

export interface CoInvestmentNode {
  coInvestmentId: string;
  fundId: string;
  parentCoInvestmentId: string | null;
  status: CoInvestmentStatus;
  commitmentCap: number;
  alreadyCommitted: number;
  headroom: number;
  currency: string;
}

export interface AppetiteLimit {
  assetClass: AssetClass;
  region: Region;
  maxAmount: number;
  maxConcentrationPct: number;
}

export type BucketKey = `${AssetClass}|${Region}`;

export interface ExposureSnapshot {
  fundId: string;
  totalCommitted: number;
  committedByBucket: Partial<Record<BucketKey, number>>;
}

export interface CommitCapitalCommand {
  fundId: string;
  coInvestmentId: string;
  dealId: string;
  amount: number;
  currency: string;
  assetClass: AssetClass;
  region: Region;
  liquidity: Liquidity;
  commitmentDate: string; // yyyy-MM-dd
  requestedBy: string;
}

export type Severity = 'Error' | 'Warning';

export interface DomainError {
  code: string;
  message: string;
  field?: string | null;
  severity: Severity;
}

export type RuleKind = 'Structural' | 'Upstream';
export type RuleOutcome = 'Passed' | 'Failed';

export interface TraceEntry {
  rule: string;
  description: string;
  kind: RuleKind;
  outcome: RuleOutcome;
  elapsedMs: number;
  messages: string[];
}

export interface DecisionTrace {
  correlationId: string;
  command: string;
  entries: TraceEntry[];
  approved: boolean;
  passed: number;
  failed: number;
  totalRuleMs: number;
}

export interface CommitOutcome {
  approved: boolean;
  commitmentId: string | null;
  errors: DomainError[];
  trace: DecisionTrace;
}

export interface ReferenceData {
  funds: FundSnapshot[];
  deals: DealSnapshot[];
  coInvestments: CoInvestmentNode[];
}

export const bucketKey = (assetClass: AssetClass, region: Region): BucketKey => `${assetClass}|${region}`;

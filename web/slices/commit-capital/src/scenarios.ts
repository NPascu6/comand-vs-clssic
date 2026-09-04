import type { CommitCapitalCommand } from '@atlas/contracts';

export interface Scenario {
  id: string;
  label: string;
  note: string;
  command: CommitCapitalCommand;
}

// The same three scenarios the backend samples run.
export const scenarios: Scenario[] = [
  {
    id: 'A',
    label: 'Valid commitment',
    note: 'passes all six rules',
    command: { fundId: 'PF-APAC-CREDIT', coInvestmentId: 'CI-ROOT', dealId: 'DEAL-PE-NA-02', amount: 10_000_000, currency: 'USD', assetClass: 'PrivateEquity', region: 'NorthAmerica', liquidity: 'Illiquid', commitmentDate: '2026-09-01', requestedBy: 'pm.alice' },
  },
  {
    id: 'B',
    label: 'Two breaches',
    note: 'headroom + appetite, at once',
    command: { fundId: 'PF-APAC-CREDIT', coInvestmentId: 'CI-SLEEVE-PC', dealId: 'DEAL-PC-EMEA-01', amount: 25_000_000, currency: 'EUR', assetClass: 'PrivateCredit', region: 'Emea', liquidity: 'Illiquid', commitmentDate: '2026-07-01', requestedBy: 'pm.bob' },
  },
  {
    id: 'C',
    label: 'Structural + state pileup',
    note: 'many failures at once',
    command: { fundId: 'PF-DRAFT', coInvestmentId: 'CI-MISSING', dealId: 'DEAL-CLOSED-04', amount: -5_000_000, currency: 'US', assetClass: 'PrivateEquity', region: 'Emea', liquidity: 'Illiquid', commitmentDate: '2020-01-01', requestedBy: '' },
  },
];

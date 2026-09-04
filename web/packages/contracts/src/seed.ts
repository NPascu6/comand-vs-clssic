import type {
  AppetiteLimit,
  CoInvestmentNode,
  DealSnapshot,
  ExposureSnapshot,
  FundSnapshot,
  ReferenceData,
} from './types';
import { bucketKey } from './types';

// Mirrors the .NET InMemoryUpstream seed, so the mock data source produces the backend's outcomes offline.

export const seedFunds: FundSnapshot[] = [
  { fundId: 'PF-APAC-CREDIT', name: 'APAC Credit Opportunities', status: 'Open', baseCurrency: 'USD', permittedCurrencies: ['USD', 'EUR', 'GBP', 'SGD'] },
  { fundId: 'PF-DRAFT', name: 'Unfunded Draft Book', status: 'Draft', baseCurrency: 'USD', permittedCurrencies: ['USD'] },
  { fundId: 'PF-EU-PE', name: 'European Buyout Fund IV', status: 'Open', baseCurrency: 'EUR', permittedCurrencies: ['EUR', 'USD', 'GBP'] },
  { fundId: 'PF-GLOBAL-MULTI', name: 'Global Multi-Asset Mandate', status: 'Open', baseCurrency: 'USD', permittedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'SGD'] },
];

export const seedDeals: DealSnapshot[] = [
  { dealId: 'DEAL-PC-EMEA-01', name: 'Nordic Senior Direct Lending', status: 'Investable', assetClass: 'PrivateCredit', region: 'Emea', liquidity: 'Illiquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'EUR' },
  { dealId: 'DEAL-PE-NA-02', name: 'US Mid-Market Buyout III', status: 'Investable', assetClass: 'PrivateEquity', region: 'NorthAmerica', liquidity: 'Illiquid', investableFrom: '2026-01-01', investableTo: '2026-09-30', currency: 'USD' },
  { dealId: 'DEAL-ETF-APAC-03', name: 'APAC Liquid Equity ETF', status: 'Investable', assetClass: 'Etf', region: 'Apac', liquidity: 'Liquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'USD' },
  { dealId: 'DEAL-CLOSED-04', name: 'Closed Vintage Fund', status: 'Closed', assetClass: 'PrivateEquity', region: 'Emea', liquidity: 'Illiquid', investableFrom: '2024-01-01', investableTo: '2024-12-31', currency: 'EUR' },
  { dealId: 'DEAL-PE-EU-05', name: 'DACH Software Buyout', status: 'Investable', assetClass: 'PrivateEquity', region: 'Emea', liquidity: 'Illiquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'EUR' },
  { dealId: 'DEAL-PC-NA-06', name: 'US Asset-Based Lending', status: 'Investable', assetClass: 'PrivateCredit', region: 'NorthAmerica', liquidity: 'Illiquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'USD' },
  { dealId: 'DEAL-ETF-EU-07', name: 'Europe Sustainable Equity ETF', status: 'Investable', assetClass: 'Etf', region: 'Emea', liquidity: 'Liquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'EUR' },
  { dealId: 'DEAL-EQ-APAC-08', name: 'Japan Quality Equity', status: 'Investable', assetClass: 'LiquidEquity', region: 'Apac', liquidity: 'Liquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'JPY' },
  { dealId: 'DEAL-PE-LATAM-09', name: 'Brazil Infrastructure Platform', status: 'Pipeline', assetClass: 'PrivateEquity', region: 'Latam', liquidity: 'Illiquid', investableFrom: '2026-06-01', investableTo: '2027-06-30', currency: 'USD' },
  { dealId: 'DEAL-PC-APAC-10', name: 'APAC Mezzanine Fund II', status: 'Investable', assetClass: 'PrivateCredit', region: 'Apac', liquidity: 'Illiquid', investableFrom: '2026-01-01', investableTo: '2026-12-31', currency: 'SGD' },
];

const node = (
  coInvestmentId: string,
  parentCoInvestmentId: string | null,
  status: CoInvestmentNode['status'],
  commitmentCap: number,
  alreadyCommitted: number,
  fundId = 'PF-APAC-CREDIT',
  currency = 'USD',
): CoInvestmentNode => ({
  coInvestmentId,
  fundId,
  parentCoInvestmentId,
  status,
  commitmentCap,
  alreadyCommitted,
  headroom: commitmentCap - alreadyCommitted,
  currency,
});

export const seedCoInvestments: CoInvestmentNode[] = [
  node('CI-ROOT', null, 'Active', 500_000_000, 100_000_000),
  node('CI-SLEEVE-PC', 'CI-ROOT', 'Active', 200_000_000, 180_000_000),
  node('CI-SUSPENDED', 'CI-ROOT', 'Suspended', 100_000_000, 0),
  node('CI-SLEEVE-EQ', 'CI-ROOT', 'Active', 150_000_000, 40_000_000),
  node('CI-EQ-A', 'CI-SLEEVE-EQ', 'Active', 80_000_000, 30_000_000),
  node('CI-EU-ROOT', null, 'Active', 400_000_000, 250_000_000, 'PF-EU-PE', 'EUR'),
  node('CI-EU-BUYOUT', 'CI-EU-ROOT', 'Active', 250_000_000, 180_000_000, 'PF-EU-PE', 'EUR'),
  node('CI-EU-GROWTH', 'CI-EU-ROOT', 'Active', 150_000_000, 60_000_000, 'PF-EU-PE', 'EUR'),
  node('CI-GLB-ROOT', null, 'Active', 1_000_000_000, 300_000_000, 'PF-GLOBAL-MULTI', 'USD'),
  node('CI-GLB-PE', 'CI-GLB-ROOT', 'Active', 400_000_000, 200_000_000, 'PF-GLOBAL-MULTI', 'USD'),
  node('CI-GLB-CREDIT', 'CI-GLB-ROOT', 'Active', 300_000_000, 150_000_000, 'PF-GLOBAL-MULTI', 'USD'),
  node('CI-GLB-LIQUID', 'CI-GLB-ROOT', 'Active', 300_000_000, 100_000_000, 'PF-GLOBAL-MULTI', 'USD'),
];

export const seedAppetite: Record<string, AppetiteLimit[]> = {
  'PF-APAC-CREDIT': [
    { assetClass: 'PrivateCredit', region: 'Emea', maxAmount: 250_000_000, maxConcentrationPct: 40 },
    { assetClass: 'PrivateEquity', region: 'NorthAmerica', maxAmount: 300_000_000, maxConcentrationPct: 50 },
    { assetClass: 'Etf', region: 'Apac', maxAmount: 100_000_000, maxConcentrationPct: 20 },
  ],
  'PF-EU-PE': [
    { assetClass: 'PrivateEquity', region: 'Emea', maxAmount: 350_000_000, maxConcentrationPct: 60 },
    { assetClass: 'Etf', region: 'Emea', maxAmount: 100_000_000, maxConcentrationPct: 20 },
  ],
  'PF-GLOBAL-MULTI': [
    { assetClass: 'PrivateEquity', region: 'NorthAmerica', maxAmount: 400_000_000, maxConcentrationPct: 40 },
    { assetClass: 'PrivateCredit', region: 'NorthAmerica', maxAmount: 300_000_000, maxConcentrationPct: 30 },
    { assetClass: 'Etf', region: 'Apac', maxAmount: 150_000_000, maxConcentrationPct: 20 },
    { assetClass: 'LiquidEquity', region: 'Apac', maxAmount: 200_000_000, maxConcentrationPct: 25 },
  ],
};

export const seedExposure: Record<string, ExposureSnapshot> = {
  'PF-APAC-CREDIT': {
    fundId: 'PF-APAC-CREDIT',
    totalCommitted: 400_000_000,
    committedByBucket: {
      [bucketKey('PrivateCredit', 'Emea')]: 230_000_000,
      [bucketKey('PrivateEquity', 'NorthAmerica')]: 120_000_000,
      [bucketKey('Etf', 'Apac')]: 50_000_000,
    },
  },
  'PF-EU-PE': {
    fundId: 'PF-EU-PE',
    totalCommitted: 250_000_000,
    committedByBucket: {
      [bucketKey('PrivateEquity', 'Emea')]: 180_000_000,
      [bucketKey('Etf', 'Emea')]: 30_000_000,
    },
  },
  'PF-GLOBAL-MULTI': {
    fundId: 'PF-GLOBAL-MULTI',
    totalCommitted: 450_000_000,
    committedByBucket: {
      [bucketKey('PrivateEquity', 'NorthAmerica')]: 200_000_000,
      [bucketKey('PrivateCredit', 'NorthAmerica')]: 150_000_000,
      [bucketKey('Etf', 'Apac')]: 50_000_000,
      [bucketKey('LiquidEquity', 'Apac')]: 50_000_000,
    },
  },
};

export const referenceData: ReferenceData = {
  funds: seedFunds,
  deals: seedDeals,
  coInvestments: seedCoInvestments,
};

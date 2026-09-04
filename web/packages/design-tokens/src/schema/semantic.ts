import { list } from './kinds.ts';
import type { TokensOf } from './kinds.ts';

export const SERIES_LENGTH = 8;

/**
 * Colours named after what the domain calls them. Per mode, mostly as aliases into the palette,
 * and resolved — a PDF or a C# accessor has no theme to resolve a path against.
 */
export const semantic = {
  status: {
    fund: { draft: 'color', open: 'color', frozen: 'color', closed: 'color' },
    deal: { pipeline: 'color', investable: 'color', closed: 'color', withdrawn: 'color' },
    coInvestment: { proposed: 'color', active: 'color', suspended: 'color', closed: 'color' },
  },
  performance: { positive: 'color', negative: 'color', flat: 'color' },
  exposure: { withinAppetite: 'color', approaching: 'color', breach: 'color' },
  assetClass: { privateEquity: 'color', privateCredit: 'color', liquidEquity: 'color', etf: 'color' },
  region: { northAmerica: 'color', emea: 'color', apac: 'color', latam: 'color' },
  series: list('color', SERIES_LENGTH),
} as const;

export type SemanticInputs = TokensOf<typeof semantic>;

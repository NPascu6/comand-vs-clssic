import { flattenTheme, tokensFor } from './flatten.ts';
import type { ThemeMode } from '../schema/palette.ts';
import type { ThemeInputs } from '../schema/theme.ts';

/** Numbers are px unless the path says ratio, weight or opacity. Matched on the whole final segment. */
const UNITLESS = /(?:^|\.)opacity\.|\.(?:weight|fontWeight|lineHeight|\w*Opacity)$/;

/** `semantic.status.deal.investable` → `--atlas-semantic-status-deal-investable`. */
export const customProperty = (path: string): string =>
  `--atlas-${path.replace(/\./g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;

export const cssValue = (path: string, value: string | number): string =>
  typeof value === 'number' && !UNITLESS.test(path) ? `${value}px` : String(value);

/** Every token one mode resolves to, as custom properties. */
export function cssVariables(inputs: ThemeInputs, mode: ThemeMode): Record<string, string> {
  const flat = tokensFor(flattenTheme(inputs), mode);
  return Object.fromEntries(Object.entries(flat).map(([path, value]) => [customProperty(path), cssValue(path, value)]));
}

/** Only what `inputs` moves away from `base` — what a scope sets on its subtree. */
export function changedCssVariables(base: ThemeInputs, inputs: ThemeInputs, mode: ThemeMode): Record<string, string> {
  const shipped = cssVariables(base, mode);
  return Object.fromEntries(Object.entries(cssVariables(inputs, mode)).filter(([name, value]) => shipped[name] !== value));
}

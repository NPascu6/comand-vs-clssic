import { flattenTheme, tokensFor } from './flatten.ts';
import type { FlatTokens } from './flatten.ts';
import { cssValue, customProperty } from './cssVariables.ts';
import { THEME_MODES } from '../schema/palette.ts';
import type { ThemeInputs } from '../schema/theme.ts';

const HEADER = '/* generated — do not edit. `pnpm --filter @atlas/design-tokens build` rewrites this file from figma/*.tokens.json. */';

/** Custom properties per mode, keyed on the `data-theme` AtlasThemeProvider stamps. Light also answers a bare `:root`. */
export function emitCss(inputs: ThemeInputs): string {
  const flat = flattenTheme(inputs);
  const blocks = THEME_MODES.map((mode) => {
    const selectors = mode === 'light' ? [`[data-theme="${mode}"]`, ':root'] : [`[data-theme="${mode}"]`];
    return `${selectors.join(',\n')} {\n${declarations(tokensFor(flat, mode))}\n}`;
  });
  return `${[HEADER, ...blocks].join('\n\n')}\n`;
}

const declarations = (tokens: FlatTokens): string =>
  Object.entries(tokens).map(([path, value]) => `  ${customProperty(path)}: ${cssValue(path, value)};`).join('\n');

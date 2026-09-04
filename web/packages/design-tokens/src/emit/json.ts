import { flattenTheme, tokensFor } from './flatten.ts';
import type { FlatTokens } from './flatten.ts';
import { THEME_MODES } from '../schema/palette.ts';
import type { ThemeMode } from '../schema/palette.ts';
import type { ThemeInputs } from '../schema/theme.ts';

/** The platform-neutral target the API serves: flat `path → value` per mode, and the export's version. */
export interface TokenBundle {
  version: string;
  modes: ThemeMode[];
  tokens: Record<ThemeMode, FlatTokens>;
}

export function emitJson(inputs: ThemeInputs, version: string): TokenBundle {
  const flat = flattenTheme(inputs);
  return {
    version,
    modes: [...THEME_MODES],
    tokens: Object.fromEntries(THEME_MODES.map((mode) => [mode, tokensFor(flat, mode)])) as Record<ThemeMode, FlatTokens>,
  };
}

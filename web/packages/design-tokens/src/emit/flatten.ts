import { resolvePaletteToken } from '../parse/palettePath.ts';
import type { ColorToken } from '../parse/palettePath.ts';
import type { ThemeInputs } from '../schema/theme.ts';
import type { PaletteInputs, ThemeMode } from '../schema/palette.ts';

export type FlatTokens = Record<string, string | number>;

/** One flattening for CSS, JSON and C#: `shared` is mode-independent, `modes` carry the palette and resolved components. */
export interface FlatTheme {
  shared: FlatTokens;
  modes: Record<ThemeMode, FlatTokens>;
}

export function flattenTheme(inputs: ThemeInputs): FlatTheme {
  const { palettes, components, ...shared } = inputs;
  const forMode = (palette: PaletteInputs): FlatTokens => ({
    ...flatten(palette),
    ...flatten(components, 'component', (value) => (typeof value === 'string' ? resolvePaletteToken(palette, value as ColorToken) : value)),
  });
  return {
    shared: flatten(shared),
    modes: { light: forMode(palettes.light), dark: forMode(palettes.dark), contrast: forMode(palettes.contrast) },
  };
}

export const tokensFor = (theme: FlatTheme, mode: ThemeMode): FlatTokens => ({ ...theme.shared, ...theme.modes[mode] });

type Mapper = (value: string | number) => string | number;

/** Arrays index from 1 — `series.1` is the path the designer sees in Figma. */
function flatten(source: object, prefix = '', map: Mapper = (value) => value): FlatTokens {
  const out: FlatTokens = {};
  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) value.forEach((entry, index) => walk(entry, `${path}.${index + 1}`));
    else if (typeof value === 'object' && value !== null) {
      for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
    } else if (typeof value === 'string' || typeof value === 'number') out[path] = map(value);
  };
  walk(source, prefix);
  return out;
}

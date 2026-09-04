import type { PaletteInputs } from '../schema/palette.ts';

const COLORS = ['primary', 'secondary', 'success', 'warning', 'error', 'info'] as const;
const SHADES = ['main', 'light', 'soft', 'contrastText'] as const;
const STANDALONE = ['text.primary', 'text.secondary', 'divider', 'background.default', 'background.paper'] as const;

/** What a component token may name in the palette. A shade a mode has not set is a TokenError, by design. */
export type PalettePath = `${(typeof COLORS)[number]}.${(typeof SHADES)[number]}` | (typeof STANDALONE)[number];

export type ColorToken = PalettePath | `#${string}` | `rgba(${string})`;

const PALETTE_PATHS: ReadonlySet<string> = new Set<PalettePath>([
  ...COLORS.flatMap((color) => SHADES.map<PalettePath>((shade) => `${color}.${shade}`)),
  ...STANDALONE,
]);

export const isPalettePath = (value: string): value is PalettePath => PALETTE_PATHS.has(value);

export const isColorToken = (value: string): value is ColorToken =>
  isPalettePath(value) || value.startsWith('#') || value.startsWith('rgba(');

export const palettePathSegments = (token: ColorToken): string[] | undefined =>
  isPalettePath(token) ? token.split('.') : undefined;

/** A component colour against one mode's palette — for the targets with no theme to resolve it at render time. */
export function resolvePaletteToken(palette: PaletteInputs, token: ColorToken): string {
  const segments = palettePathSegments(token);
  if (!segments) return token;
  const resolved = segments.reduce<unknown>((value, segment) => (isRecord(value) ? value[segment] : undefined), palette);
  return typeof resolved === 'string' ? resolved : token;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

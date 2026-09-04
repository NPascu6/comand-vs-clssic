import { TokenError } from '../parse/dtcg.ts';
import type { TokenSet } from '../parse/dtcg.ts';
import { BASE, cascade, read } from '../parse/cascade.ts';
import type { Layers } from '../parse/cascade.ts';
import { isColorToken } from '../parse/palettePath.ts';
import { paths } from '../schema/kinds.ts';
import { components } from '../schema/components.ts';
import { buttonContained, palette, THEME_MODES } from '../schema/palette.ts';
import type { PaletteInputs, ThemeMode } from '../schema/palette.ts';
import { semantic } from '../schema/semantic.ts';
import { shared } from '../schema/theme.ts';
import type { ThemeInputs } from '../schema/theme.ts';

/** A token set becomes what the theme reads. Every mode the export carries is checked, read or not. */
export function transform(set: TokenSet): ThemeInputs {
  if (!set[BASE]) throw new TokenError('*.Base.tokens.json: missing (it carries the shape tokens every mode shares)');
  const base = cascade(set, BASE);
  for (const mode of Object.keys(set)) {
    if (mode !== BASE && !THEME_MODES.includes(mode as ThemeMode)) paletteOf(set, mode);
  }
  return {
    ...read(base, shared),
    palettes: { light: paletteOf(set, 'light'), dark: paletteOf(set, 'dark'), contrast: paletteOf(set, 'contrast') },
    components: checkedComponents(read(base, components, 'component')),
  };
}

function paletteOf(set: TokenSet, mode: string): PaletteInputs {
  if (!set[mode]) throw new TokenError(`${mode}: no palette (expected <Collection>.${capitalise(mode)}.tokens.json)`);
  const layers = cascade(set, mode);
  const values = read(layers, palette);
  if (values.mode !== 'light' && values.mode !== 'dark') {
    throw new TokenError(`palette.mode (${layers.files}): expected 'light' or 'dark', got '${values.mode}'`);
  }
  const contained = containedButton(layers);
  return {
    ...values,
    mode: values.mode,
    ...(contained ? { buttonContained: contained } : {}),
    semantic: read(layers, semantic),
  };
}

/** All four or none: half a contained button is a mistake, not a choice. */
function containedButton(layers: Layers): PaletteInputs['buttonContained'] {
  const required = Object.keys(paths(buttonContained));
  const missing = required.filter((path) => !layers.find(path));
  if (missing.length === required.length) return undefined;
  if (missing.length > 0) {
    throw new TokenError(`button.contained (${layers.files}): needs all of ${required.join(', ')} or none; missing ${missing.join(', ')}`);
  }
  return read(layers, buttonContained);
}

function checkedComponents(values: ThemeInputs['components']): ThemeInputs['components'] {
  for (const [path, value] of Object.entries(flat(values, 'component'))) {
    if (typeof value === 'string' && !isColorToken(value)) {
      throw new TokenError(`${path}: '${value}' is neither a palette colour nor a colour value`);
    }
  }
  return values;
}

const flat = (value: unknown, prefix: string): Record<string, unknown> =>
  typeof value === 'object' && value !== null
    ? Object.assign({}, ...Object.entries(value).map(([key, child]) => flat(child, `${prefix}.${key}`)))
    : { [prefix]: value };

const capitalise = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

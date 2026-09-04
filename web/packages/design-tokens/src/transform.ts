import { aliasTarget, isJsonObject, TokenError } from './dtcg.ts';
import type { Token, TokenSet } from './dtcg.ts';
import { BASE_PATHS, BUTTON_CONTAINED_PATHS, MODE_PATHS } from './manifest.ts';
import type { PaletteInputs, ThemeInputs, TokenKind, TokenPaths } from './manifest.ts';

export function transform(set: TokenSet): ThemeInputs {
  const palettes = { light: palette(set, 'light'), dark: palette(set, 'dark'), contrast: palette(set, 'contrast') };
  // Every mode file is held to the contract, even one the theme does not read.
  for (const mode of Object.keys(set)) {
    if (mode !== 'base' && !(mode in palettes)) palette(set, mode);
  }
  const values = readValues(set, 'base', BASE_PATHS);
  return {
    palettes,
    font: { sans: values.string('font.sans'), mono: values.string('font.mono') },
    radius: { control: values.number('radius.control'), surface: values.number('radius.surface') },
    typography: {
      button: { weight: values.number('typography.button.weight') },
      chip: { weight: values.number('typography.chip.weight') },
      overline: {
        size: values.number('typography.overline.size'),
        weight: values.number('typography.overline.weight'),
        letterSpacing: values.string('typography.overline.letterSpacing'),
        lineHeight: values.number('typography.overline.lineHeight'),
      },
      tableHeader: {
        size: values.number('typography.tableHeader.size'),
        weight: values.number('typography.tableHeader.weight'),
        letterSpacing: values.string('typography.tableHeader.letterSpacing'),
      },
    },
  };
}

function palette(set: TokenSet, mode: string): PaletteInputs {
  const values = readValues(set, mode, MODE_PATHS);
  const paletteMode = values.string('palette.mode');
  if (paletteMode !== 'light' && paletteMode !== 'dark') {
    throw new TokenError(`palette.mode (${filesOf(set, mode)}): expected 'light' or 'dark', got '${paletteMode}'`);
  }
  const contained = buttonContained(set, mode);
  return {
    mode: paletteMode,
    primary: {
      main: values.string('color.primary.main'),
      light: values.string('color.primary.light'),
      contrastText: values.string('color.primary.contrastText'),
    },
    secondary: { main: values.string('color.secondary.main') },
    success: { main: values.string('color.success.main') },
    warning: { main: values.string('color.warning.main') },
    error: { main: values.string('color.error.main') },
    info: { main: values.string('color.info.main') },
    text: { primary: values.string('color.text.primary'), secondary: values.string('color.text.secondary') },
    divider: values.string('color.divider'),
    background: { default: values.string('color.background.default'), paper: values.string('color.background.paper') },
    border: { width: values.number('border.width'), color: values.string('border.color') },
    focus: { width: values.number('focus.width'), color: values.string('focus.color') },
    ...(contained ? { buttonContained: contained } : {}),
  };
}

function buttonContained(set: TokenSet, mode: string): PaletteInputs['buttonContained'] {
  const paths = Object.keys(BUTTON_CONTAINED_PATHS);
  const missing = paths.filter((path) => !lookup(set, mode, path));
  if (missing.length === paths.length) return undefined;
  if (missing.length > 0) {
    const rule = `needs all of ${paths.join(', ')} or none`;
    throw new TokenError(`button.contained (${filesOf(set, mode)}): ${rule}; missing ${missing.join(', ')}`);
  }
  const values = readValues(set, mode, BUTTON_CONTAINED_PATHS);
  return {
    background: values.string('button.contained.background'),
    text: values.string('button.contained.text'),
    hoverBackground: values.string('button.contained.hoverBackground'),
    hoverText: values.string('button.contained.hoverText'),
  };
}

interface Values {
  string(path: string): string;
  number(path: string): number;
}

function readValues(set: TokenSet, mode: string, paths: TokenPaths): Values {
  if (!set[mode]) {
    throw new TokenError(`${mode}: no export file (expected <Collection>.${capitalise(mode)}.tokens.json)`);
  }
  const values = new Map<string, string | number>();
  for (const [path, kind] of Object.entries(paths)) values.set(path, readValue(set, mode, path, kind));
  return {
    string: (path) => {
      const value = values.get(path);
      if (typeof value !== 'string') throw new Error(`${path}: not read as a string`);
      return value;
    },
    number: (path) => {
      const value = values.get(path);
      if (typeof value !== 'number') throw new Error(`${path}: not read as a number`);
      return value;
    },
  };
}

function readValue(set: TokenSet, mode: string, path: string, kind: TokenKind): string | number {
  const token = lookup(set, mode, path);
  if (!token) throw new TokenError(`${path}: required token missing from ${filesOf(set, mode)}`);
  const concrete = resolve(set, mode, token);
  checkType(token, kind);
  checkType(concrete, kind);
  return normalise(concrete, kind);
}

function lookup(set: TokenSet, mode: string, path: string): Token | undefined {
  return set[mode]?.tokens[path] ?? set.base?.tokens[path];
}

function resolve(set: TokenSet, mode: string, token: Token, chain: string[] = []): Token {
  const target = aliasTarget(token.value);
  if (target === undefined) return token;
  const visited = [...chain, token.path];
  if (visited.includes(target)) {
    throw new TokenError(`${visited[0]} (${token.file}): alias cycle ${[...visited, target].join(' → ')}`);
  }
  const next = lookup(set, mode, target);
  if (!next) throw new TokenError(`${token.path} (${token.file}): alias {${target}} not found in ${mode} or base`);
  return resolve(set, mode, next, visited);
}

const ACCEPTED_TYPES: Record<TokenKind, string[]> = {
  color: ['color'],
  number: ['number', 'dimension'],
  fontWeight: ['fontWeight', 'number'],
  fontFamily: ['fontFamily', 'string'],
  string: ['string'],
};

function checkType(token: Token, kind: TokenKind): void {
  const accepted = ACCEPTED_TYPES[kind];
  if (token.type !== undefined && !accepted.includes(token.type)) {
    throw new TokenError(`${token.path} (${token.file}): expected $type ${accepted.join(' or ')}, got ${token.type}`);
  }
}

function filesOf(set: TokenSet, mode: string): string {
  return set[mode]?.files.join(', ') ?? mode;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function normalise(token: Token, kind: TokenKind): string | number {
  switch (kind) {
    case 'color':
      return color(token);
    case 'number':
      return pixels(token);
    case 'fontWeight':
      return fontWeight(token);
    case 'fontFamily':
      return fontFamily(token);
    case 'string':
      return text(token);
  }
}

function invalid(token: Token, expected: string): TokenError {
  return new TokenError(`${token.path} (${token.file}): expected ${expected}, got ${JSON.stringify(token.value)}`);
}

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;

function color(token: Token): string {
  const raw = isJsonObject(token.value) ? token.value.hex : token.value;
  const rgba = typeof raw === 'string' ? parseColor(raw.trim()) : undefined;
  if (!rgba) throw invalid(token, 'a colour (#RGB, #RRGGBB, #RRGGBBAA, rgb(), rgba() or { hex })');
  const [red, green, blue, alpha] = rgba;
  if (alpha >= 1) return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
  return `rgba(${red},${green},${blue},${alpha})`;
}

function parseColor(value: string): [number, number, number, number] | undefined {
  const hex = HEX.exec(value)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? [...hex].map((digit) => digit + digit).join('') : hex;
    const [red, green, blue, alpha] = [0, 2, 4, 6].map((offset) => parseInt(digits.slice(offset, offset + 2), 16));
    // Figma stores opacity as a percentage, so two decimals recover it from the byte.
    return [red, green, blue, Number.isNaN(alpha) ? 1 : Math.round((alpha / 255) * 100) / 100];
  }
  const rgb = RGB.exec(value);
  if (!rgb) return undefined;
  const [red, green, blue] = rgb.slice(1, 4).map(Number);
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
  return [red, green, blue].every((channel) => channel <= 255) && alpha <= 1 ? [red, green, blue, alpha] : undefined;
}

const PIXELS = /^(-?\d*\.?\d+)px$/;

function pixels(token: Token): number {
  const value = token.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && PIXELS.test(value)) return Number(PIXELS.exec(value)![1]);
  if (isJsonObject(value) && typeof value.value === 'number' && value.unit === 'px') return value.value;
  throw invalid(token, 'a number or a px dimension');
}

function fontWeight(token: Token): number {
  if (typeof token.value === 'number') return token.value;
  throw invalid(token, 'a numeric font weight');
}

function fontFamily(token: Token): string {
  const value = token.value;
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every((name): name is string => typeof name === 'string')) {
    return value.map((name) => (/\s/.test(name) && !/^["']/.test(name) ? `"${name}"` : name)).join(', ');
  }
  throw invalid(token, 'a font family name or an array of names');
}

function text(token: Token): string {
  if (typeof token.value === 'string') return token.value;
  throw invalid(token, 'a string');
}

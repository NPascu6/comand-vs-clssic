import { isJsonObject, TokenError } from './dtcg.ts';
import type { Token } from './dtcg.ts';
import type { TokenKind } from '../schema/kinds.ts';

const ACCEPTED_TYPES: Record<TokenKind, string[]> = {
  color: ['color'],
  colorToken: ['color'],
  number: ['number', 'dimension'],
  fontWeight: ['fontWeight', 'number'],
  fontFamily: ['fontFamily', 'string'],
  string: ['string'],
};

export function checkType(token: Token, kind: TokenKind): void {
  const accepted = ACCEPTED_TYPES[kind];
  if (token.type !== undefined && !accepted.includes(token.type)) {
    throw new TokenError(`${token.path} (${token.file}): expected $type ${accepted.join(' or ')}, got ${token.type}`);
  }
}

/** A token's value in the one form ThemeInputs carries: `#RRGGBB`, a px number, a font stack. */
export function normalise(token: Token, kind: TokenKind): string | number {
  switch (kind) {
    case 'color':
    case 'colorToken':
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

const invalid = (token: Token, expected: string): TokenError =>
  new TokenError(`${token.path} (${token.file}): expected ${expected}, got ${JSON.stringify(token.value)}`);

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(\d*\.?\d+)\s*)?\)$/i;
const PIXELS = /^(-?\d*\.?\d+)px$/;

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
    // Figma stores opacity as a percentage; two decimals recover it from the byte.
    return [red, green, blue, Number.isNaN(alpha) ? 1 : Math.round((alpha / 255) * 100) / 100];
  }
  const rgb = RGB.exec(value);
  if (!rgb) return undefined;
  const [red, green, blue] = rgb.slice(1, 4).map(Number);
  const alpha = rgb[4] === undefined ? 1 : Number(rgb[4]);
  return [red, green, blue].every((channel) => channel <= 255) && alpha <= 1 ? [red, green, blue, alpha] : undefined;
}

function pixels(token: Token): number {
  const value = token.value;
  if (typeof value === 'number') return value;
  const dimension = typeof value === 'string' ? PIXELS.exec(value) : undefined;
  if (dimension) return Number(dimension[1]);
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

import type { PaletteInputs } from '../schema/palette.ts';

// WCAG 2.1, defined once: the Figma sync refuses a release that fails it, and CI asserts it over
// every palette in the repo.

export const AA_TEXT = 4.5;
export const AA_LARGE = 3;

const HEX = /^#([0-9a-f]{6})$/i;

export type ContrastSeverity = 'error' | 'warning';

export interface ContrastPair {
  id: string;
  minimum: number;
  /** An error blocks the release; a warning is reported for a human to weigh. */
  severity: ContrastSeverity;
  read: (palette: PaletteInputs) => [foreground: string, background: string];
}

/** What the theme promises. Every entry is a gate, so widen it deliberately. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  { id: 'text.primary on background.default', minimum: AA_TEXT, severity: 'error', read: (p) => [p.text.primary, p.background.default] },
  { id: 'text.primary on background.paper', minimum: AA_TEXT, severity: 'error', read: (p) => [p.text.primary, p.background.paper] },
  { id: 'primary.contrastText on primary.main', minimum: AA_LARGE, severity: 'error', read: (p) => [p.primary.contrastText, p.primary.main] },
  { id: 'text.secondary on background.paper', minimum: AA_TEXT, severity: 'warning', read: (p) => [p.text.secondary, p.background.paper] },
  // The soft button and every hover fill; this pair caught the first wiring of it at 1.29:1.
  { id: 'primary.main on primary.soft', minimum: AA_TEXT, severity: 'error', read: (p) => [p.primary.main, p.primary.soft] },
];

export interface ContrastFinding extends ContrastPair {
  ratio: number;
  foreground: string;
  background: string;
}

/** Every pair the palette fails. A translucent colour is skipped: it depends on what is behind it. */
export function checkContrast(palette: PaletteInputs, pairs: readonly ContrastPair[] = CONTRAST_PAIRS): ContrastFinding[] {
  const findings: ContrastFinding[] = [];
  for (const pair of pairs) {
    const [foreground, background] = pair.read(palette);
    const ratio = contrastRatio(foreground, background);
    if (ratio !== undefined && ratio < pair.minimum) findings.push({ ...pair, ratio, foreground, background });
  }
  return findings;
}

/** A translucent colour laid over an opaque one — the only thing a contrast ratio can be measured against. */
export function composite(foreground: string, alpha: number, background: string): string | undefined {
  const front = channels(foreground);
  const back = channels(background);
  if (!front || !back) return undefined;
  const blended = front.map((value, index) => Math.round(value * alpha + back[index] * (1 - alpha)));
  return `#${blended.map((value) => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

export function contrastRatio(foreground: string, background: string): number | undefined {
  const first = luminance(foreground);
  const second = luminance(background);
  if (first === undefined || second === undefined) return undefined;
  const [lighter, darker] = first >= second ? [first, second] : [second, first];
  return Math.round(((lighter + 0.05) / (darker + 0.05)) * 100) / 100;
}

function channels(color: string): number[] | undefined {
  const match = HEX.exec(color.trim());
  return match ? [0, 2, 4].map((start) => parseInt(match[1].slice(start, start + 2), 16)) : undefined;
}

function luminance(color: string): number | undefined {
  const raw = channels(color);
  if (!raw) return undefined;
  const linear = raw.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// Deterministic: keys follow the manifest's order whatever order the input has.

import type { PaletteInputs, ThemeInputs } from './manifest.ts';

const HEADER = `// generated — do not edit. \`pnpm --filter @atlas/design-tokens build\` rewrites this file from figma/*.tokens.json.
import type { ThemeInputs } from '../manifest.ts';

export const themeInputs: ThemeInputs = `;

type EmittedValue = string | number | EmittedObject;
type EmittedObject = { [key: string]: EmittedValue };

export function emit(inputs: ThemeInputs): string {
  return `${HEADER}${literal(canonical(inputs), '')};\n`;
}

function canonical(inputs: ThemeInputs): ThemeInputs & EmittedObject {
  const { palettes, font, radius, typography } = inputs;
  return {
    palettes: { light: palette(palettes.light), dark: palette(palettes.dark), contrast: palette(palettes.contrast) },
    font: { sans: font.sans, mono: font.mono },
    radius: { control: radius.control, surface: radius.surface },
    typography: {
      button: { weight: typography.button.weight },
      chip: { weight: typography.chip.weight },
      overline: {
        size: typography.overline.size,
        weight: typography.overline.weight,
        letterSpacing: typography.overline.letterSpacing,
        lineHeight: typography.overline.lineHeight,
      },
      tableHeader: {
        size: typography.tableHeader.size,
        weight: typography.tableHeader.weight,
        letterSpacing: typography.tableHeader.letterSpacing,
      },
    },
  };
}

function palette(inputs: PaletteInputs): PaletteInputs & EmittedObject {
  const contained = inputs.buttonContained;
  const buttonContained = contained && {
    background: contained.background,
    text: contained.text,
    hoverBackground: contained.hoverBackground,
    hoverText: contained.hoverText,
  };
  return {
    mode: inputs.mode,
    primary: { main: inputs.primary.main, light: inputs.primary.light, contrastText: inputs.primary.contrastText },
    secondary: { main: inputs.secondary.main },
    success: { main: inputs.success.main },
    warning: { main: inputs.warning.main },
    error: { main: inputs.error.main },
    info: { main: inputs.info.main },
    text: { primary: inputs.text.primary, secondary: inputs.text.secondary },
    divider: inputs.divider,
    background: { default: inputs.background.default, paper: inputs.background.paper },
    border: { width: inputs.border.width, color: inputs.border.color },
    focus: { width: inputs.focus.width, color: inputs.focus.color },
    ...(buttonContained ? { buttonContained } : {}),
  };
}

const MAX_LINE = 120;

// Objects of primitives print on one line, like the hand-written theme, unless the line would run long.
function literal(value: EmittedValue, indent: string): string {
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value === 'number') return String(value);
  const entries = Object.entries(value);
  if (entries.every(([, entry]) => typeof entry !== 'object')) {
    const line = `{ ${entries.map(([key, entry]) => `${key}: ${literal(entry, indent)}`).join(', ')} }`;
    if (indent.length + line.length <= MAX_LINE) return line;
  }
  const inner = `${indent}  `;
  return `{\n${entries.map(([key, entry]) => `${inner}${key}: ${literal(entry, inner)},\n`).join('')}${indent}}`;
}

import { isKind, isLeaf } from '../schema/kinds.ts';
import type { Schema } from '../schema/kinds.ts';
import { components } from '../schema/components.ts';
import { buttonContained, palette, THEME_MODES } from '../schema/palette.ts';
import { semantic } from '../schema/semantic.ts';
import { shared } from '../schema/theme.ts';
import type { ThemeInputs } from '../schema/theme.ts';
import { literal } from './literal.ts';
import type { EmittedObject, EmittedValue } from './literal.ts';

const HEADER = `// generated — do not edit. \`pnpm --filter @atlas/design-tokens build\` rewrites this file from figma/*.tokens.json.
import type { ThemeInputs } from '../schema/theme.ts';

export const themeInputs: ThemeInputs = `;

/** The TypeScript target. Keys follow the schema, whatever order the input came in, so the file is diffable. */
export function emit(inputs: ThemeInputs): string {
  const palettes = Object.fromEntries(
    THEME_MODES.map((mode) => {
      const source = inputs.palettes[mode];
      return [mode, {
        ...pick(palette, source),
        ...(source.buttonContained ? { buttonContained: pick(buttonContained, source.buttonContained) } : {}),
        semantic: pick(semantic, source.semantic),
      }];
    }),
  );
  const canonical: EmittedObject = { palettes, ...pick(shared, inputs), components: pick(components, inputs.components) };
  return `${HEADER}${literal(canonical, '')};\n`;
}

/** The values of `source` in the schema's shape and order. */
function pick(schema: Schema, source: unknown): EmittedObject {
  const record = source as Record<string, unknown>;
  const out: EmittedObject = {};
  for (const [key, node] of Object.entries(schema)) {
    const value = record[key];
    out[key] = isKind(node) || isLeaf(node) ? (Array.isArray(value) ? [...value] : value) as EmittedValue : pick(node, value);
  }
  return out;
}

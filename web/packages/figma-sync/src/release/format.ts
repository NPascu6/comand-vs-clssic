// The one formatter for `figma/*.tokens.json`. The files are machine-owned, so their
// text is a function of their values: a Figma edit shows up as the lines that changed
// and nothing else.

import type { JsonValue } from '@atlas/design-tokens/toolkit';

/** A token (any object with `$value`) prints on one line; a group nests, two spaces per level. */
export function formatDtcg(json: JsonValue): string {
  return `${write(json, '')}\n`;
}

function write(node: JsonValue, indent: string): string {
  if (!isObject(node)) return scalar(node);
  if ('$value' in node) return `{ ${pairs(node).join(', ')} }`;
  const inner = `${indent}  `;
  const lines = Object.entries(node).map(([key, child]) => `${inner}${JSON.stringify(key)}: ${write(child, inner)}`);
  return lines.length === 0 ? '{}' : `{\n${lines.join(',\n')}\n${indent}}`;
}

const pairs = (node: Record<string, JsonValue>): string[] =>
  Object.entries(node).map(([key, value]) => `${JSON.stringify(key)}: ${scalar(value)}`);

/** `JSON.stringify` packs arrays and objects tight; the export spaces them like the rest of the file. */
function scalar(value: JsonValue): string {
  if (Array.isArray(value)) return `[${value.map(scalar).join(', ')}]`;
  if (isObject(value)) return `{ ${pairs(value).join(', ')} }`;
  return JSON.stringify(value);
}

const isObject = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

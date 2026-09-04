import { parseDtcgFiles } from '@atlas/design-tokens';
import type { DtcgFile, JsonValue } from '@atlas/design-tokens';

/** One editable token: where it lives, what it is, and its raw value — an alias stays an alias. */
export interface EditableToken {
  file: string;
  path: string;
  type: string;
  value: JsonValue;
}

export function listTokens(files: DtcgFile[]): EditableToken[] {
  const set = parseDtcgFiles(files);
  return Object.values(set)
    .flatMap((mode) => Object.values(mode.tokens))
    .map((token) => ({ file: token.file, path: token.path, type: token.type ?? 'string', value: token.value }));
}

/** The files with one token's `$value` replaced — a new tree, the old one untouched. */
export function withValue(files: DtcgFile[], file: string, path: string, value: JsonValue): DtcgFile[] {
  return files.map((entry) => (entry.name === file ? { ...entry, json: setAt(entry.json, path.split('.'), value) } : entry));
}

function setAt(node: JsonValue, segments: string[], value: JsonValue): JsonValue {
  if (typeof node !== 'object' || node === null || Array.isArray(node)) return node;
  if (segments.length === 0) return { ...node, $value: value };
  const [head, ...rest] = segments;
  return { ...node, [head]: setAt(node[head] ?? {}, rest, value) };
}

export const isAlias = (value: JsonValue): boolean => typeof value === 'string' && /^\{[^{}]+\}$/.test(value);

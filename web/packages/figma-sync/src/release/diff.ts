// What changed between two exports, per mode and token path. Pure: the caller supplies
// both sides, so the same comparison runs in the sync CLI and in the tests.

import { parseDtcgFiles } from '@atlas/design-tokens/toolkit';
import type { DtcgFile, JsonValue, TokenSet } from '@atlas/design-tokens/toolkit';

export type ChangeKind = 'added' | 'changed' | 'removed';

/** A semver bump, ordered by severity. */
export type Bump = 'major' | 'minor' | 'patch';

export interface TokenChange {
  /** The file name's second segment, lower-cased: `light`, `dark`, `contrast`, `base`. */
  mode: string;
  path: string;
  kind: ChangeKind;
  /** The DTCG `$type` after the change, or before it when the token was removed. */
  type?: string;
  /** Set when the change also moved the token's `$type`, which the theme may not survive. */
  retypedFrom?: string;
  before?: string;
  after?: string;
}

export function diffTokens(before: readonly DtcgFile[], after: readonly DtcgFile[]): TokenChange[] {
  const source = parseDtcgFiles([...before]);
  const target = parseDtcgFiles([...after]);
  const changes: TokenChange[] = [];

  for (const mode of modes(source, target)) {
    const was = source[mode]?.tokens ?? {};
    const now = target[mode]?.tokens ?? {};
    for (const path of paths(was, now)) {
      const change = compare(mode, path, was[path], now[path]);
      if (change) changes.push(change);
    }
  }
  return changes;
}

/** Base first — every mode reads it — then the modes in the order the export lists them. */
function modes(source: TokenSet, target: TokenSet): string[] {
  const all = [...new Set([...Object.keys(target), ...Object.keys(source)])];
  return all.sort((first, second) => rank(first) - rank(second) || first.localeCompare(second));
}

const rank = (mode: string): number => (mode === 'base' ? 0 : 1);

const paths = (was: Record<string, unknown>, now: Record<string, unknown>): string[] =>
  [...new Set([...Object.keys(now), ...Object.keys(was)])].sort();

/** A removed token, or one whose `$type` moved, can break the theme; a new one cannot. */
export function bumpFor(changes: TokenChange[]): Bump | undefined {
  if (changes.length === 0) return undefined;
  if (changes.some((change) => change.kind === 'removed' || change.retypedFrom !== undefined)) return 'major';
  if (changes.some((change) => change.kind === 'added')) return 'minor';
  return 'patch';
}

/** Why the bump is what it is, in the words a reviewer needs — kept beside the rule that decides it. */
export function bumpReason(changes: TokenChange[]): string {
  const count = (kind: ChangeKind) => changes.filter((change) => change.kind === kind).length;
  const retyped = changes.filter((change) => change.retypedFrom !== undefined).length;
  if (count('removed') > 0 || retyped > 0) {
    return `${count('removed')} token(s) removed and ${retyped} retyped; anything reading them can break`;
  }
  if (count('added') > 0) return `${count('added')} token(s) added, none removed or retyped`;
  return `${changes.length} value(s) changed; the set of tokens and their types is unchanged`;
}

/** The value as it reads in a diff: an alias stays `{path}`, a font stack joins. */
export function display(value: JsonValue): string {
  if (Array.isArray(value)) return value.map(display).join(', ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value);
  return String(value);
}

function compare(
  mode: string,
  path: string,
  was: { type?: string; value: JsonValue } | undefined,
  now: { type?: string; value: JsonValue } | undefined,
): TokenChange | undefined {
  if (!was) return { mode, path, kind: 'added', type: now!.type, after: display(now!.value) };
  if (!now) return { mode, path, kind: 'removed', type: was.type, before: display(was.value) };
  const before = display(was.value);
  const after = display(now.value);
  if (before === after && was.type === now.type) return undefined;
  const retyped = was.type === now.type ? {} : { retypedFrom: was.type };
  return { mode, path, kind: 'changed', type: now.type, before, after, ...retyped };
}


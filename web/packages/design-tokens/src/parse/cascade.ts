import { aliasTarget, TokenError } from './dtcg.ts';
import type { ModeTokens, Token, TokenSet } from './dtcg.ts';
import { checkType, normalise } from './normalise.ts';
import { isKind, isLeaf } from '../schema/kinds.ts';
import type { Leaf, Schema, TokenKind, TokensOf } from '../schema/kinds.ts';

export const BASE = 'base';

export interface Layers {
  files: string;
  find(path: string): Token | undefined;
}

/** The mode's own tokens first, then the ones every mode shares. */
export function cascade(set: TokenSet, mode: string): Layers {
  const levels = [set[mode], set[BASE]]
    .filter((level): level is ModeTokens => level !== undefined)
    .filter((level, index, all) => all.indexOf(level) === index);
  return {
    files: levels.flatMap((level) => level.files).join(', ') || mode,
    find: (path) => levels.map((level) => level.tokens[path]).find((token) => token !== undefined),
  };
}

/** A schema read through the cascade into the object it describes, in schema order. */
export function read<S extends Schema>(layers: Layers, schema: S, prefix = ''): TokensOf<S> {
  const out: Record<string, unknown> = {};
  for (const [key, node] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isKind(node)) out[key] = valueAt(layers, path, node);
    else if (isLeaf(node)) out[key] = leafAt(layers, path, node);
    else out[key] = read(layers, node, path);
  }
  return out as TokensOf<S>;
}

function leafAt(layers: Layers, path: string, leaf: Leaf): unknown {
  if ('length' in leaf) return Array.from({ length: leaf.length }, (_, index) => valueAt(layers, `${path}.${index + 1}`, leaf.kind));
  return valueAt(layers, leaf.path, leaf.kind);
}

export function valueAt(layers: Layers, path: string, kind: TokenKind): string | number {
  const token = layers.find(path);
  if (!token) throw new TokenError(`${path}: required token missing from ${layers.files}`);
  return kind === 'colorToken' ? paletteReference(layers, token) : resolved(layers, token, kind);
}

function resolved(layers: Layers, token: Token, kind: TokenKind): string | number {
  const concrete = followAliases(layers, token);
  checkType(token, kind);
  checkType(concrete, kind);
  return normalise(concrete, kind);
}

/** A component colour aliasing the palette keeps the path: it means the intended colour in every mode. */
function paletteReference(layers: Layers, token: Token): string {
  const target = aliasTarget(token.value);
  if (target === undefined || !target.startsWith('color.')) return String(resolved(layers, token, 'colorToken'));
  checkType(token, 'colorToken');
  return target.slice('color.'.length);
}

function followAliases(layers: Layers, token: Token, chain: string[] = []): Token {
  const target = aliasTarget(token.value);
  if (target === undefined) return token;
  const visited = [...chain, token.path];
  if (visited.includes(target)) {
    throw new TokenError(`${visited[0]} (${token.file}): alias cycle ${[...visited, target].join(' → ')}`);
  }
  const next = layers.find(target);
  if (!next) throw new TokenError(`${token.path} (${token.file}): alias {${target}} not found in ${layers.files}`);
  return followAliases(layers, next, visited);
}

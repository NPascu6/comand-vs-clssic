import type { ColorToken } from '../parse/palettePath.ts';

/** How a token's value is read and normalised. `colorToken` keeps a palette alias unresolved. */
export type TokenKind = 'color' | 'colorToken' | 'number' | 'fontWeight' | 'fontFamily' | 'string';

/** A leaf that lives at a path other than its key. */
export interface At<K extends TokenKind = TokenKind> {
  readonly kind: K;
  readonly path: string;
}

/** A list of `length` tokens of one kind, at `<key>.1` … `<key>.<length>`. */
export interface List<K extends TokenKind = TokenKind> {
  readonly kind: K;
  readonly length: number;
}

export type Leaf = At | List;

export type Schema = { readonly [key: string]: TokenKind | Leaf | Schema };

type ValueOf<K extends TokenKind> = K extends 'colorToken' ? ColorToken : K extends 'number' | 'fontWeight' ? number : string;

/** The object a schema reads into — derived, never written by hand. */
export type TokensOf<S extends Schema> = {
  -readonly [K in keyof S]: S[K] extends TokenKind ? ValueOf<S[K]>
    : S[K] extends List<infer Kind> ? ValueOf<Kind>[]
    : S[K] extends At<infer Kind> ? ValueOf<Kind>
    : S[K] extends Schema ? TokensOf<S[K]>
    : never;
};

export const at = <K extends TokenKind>(path: string, kind: K): At<K> => ({ kind, path });
export const list = <K extends TokenKind>(kind: K, length: number): List<K> => ({ kind, length });

export const isLeaf = (node: TokenKind | Leaf | Schema): node is Leaf => typeof node === 'object' && 'kind' in node;

export const isKind = (node: TokenKind | Leaf | Schema): node is TokenKind => typeof node === 'string';

/** Every `path → kind` a schema requires, in schema order. */
export function paths(schema: Schema, prefix = ''): Record<string, TokenKind> {
  const out: Record<string, TokenKind> = {};
  for (const [key, node] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (isKind(node)) out[path] = node;
    else if (isLeaf(node)) {
      if ('length' in node) for (let index = 1; index <= node.length; index += 1) out[`${path}.${index}`] = node.kind;
      else out[node.path] = node.kind;
    } else Object.assign(out, paths(node, path));
  }
  return out;
}

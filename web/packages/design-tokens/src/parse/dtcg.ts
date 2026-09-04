// No I/O: the caller reads the files, so this runs under Node, Deno and in a test alike.

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface DtcgFile {
  name: string;
  json: JsonValue;
}

export interface Token {
  path: string;
  type?: string;
  value: JsonValue;
  file: string;
}

export interface ModeTokens {
  files: string[];
  tokens: Record<string, Token>;
}

/** mode → its tokens, keyed by the file name's second segment; `base` is what every mode shares. */
export type TokenSet = Record<string, ModeTokens>;

export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

const FILE_NAME = /^([^.]+)\.([^.]+)\.tokens\.json$/;
const ALIAS = /^\{([^{}]+)\}$/;

export function parseDtcgFiles(files: DtcgFile[]): TokenSet {
  const set: TokenSet = {};
  for (const file of files) {
    const mode = (set[modeOf(file.name)] ??= { files: [], tokens: {} });
    mode.files.push(file.name);
    for (const token of tokensIn(file.json, [], undefined, file.name)) {
      const existing = mode.tokens[token.path];
      if (existing) throw new TokenError(`${token.path} (${file.name}): already defined in ${existing.file}`);
      mode.tokens[token.path] = token;
    }
  }
  return set;
}

export const aliasTarget = (value: JsonValue): string | undefined =>
  typeof value === 'string' ? ALIAS.exec(value)?.[1] : undefined;

export const isJsonObject = (value: JsonValue): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function modeOf(name: string): string {
  const match = FILE_NAME.exec(name);
  if (!match) throw new TokenError(`${name}: expected a file named <Collection>.<Mode>.tokens.json`);
  return match[2].toLowerCase();
}

function tokensIn(node: JsonValue, path: string[], inheritedType: string | undefined, file: string): Token[] {
  if (!isJsonObject(node)) {
    throw new TokenError(`${path.join('.') || '(root)'} (${file}): expected a token or a group, got ${JSON.stringify(node)}`);
  }
  const type = typeof node.$type === 'string' ? node.$type : inheritedType;
  if ('$value' in node) return [{ path: path.join('.'), type, value: node.$value, file }];
  return Object.entries(node)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => tokensIn(child, [...path, key], type, file));
}

// No I/O here: the caller reads the files, so the same code runs under Node and Deno.

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonObject = { [key: string]: JsonValue };

export interface DtcgFile {
  /** `<Collection>.<Mode>.tokens.json` */
  name: string;
  json: JsonValue;
}

export interface Token {
  /** Dotted path within the file, e.g. `color.primary.main`. */
  path: string;
  /** DTCG `$type`, the token's own or inherited from an enclosing group. */
  type?: string;
  /** Raw `$value`; an alias is the string `{path.to.token}`. */
  value: JsonValue;
  file: string;
}

export interface ModeTokens {
  files: string[];
  tokens: Record<string, Token>;
}

/** mode (the file name's second segment, lower-cased) → tokens; `base` is shared by every mode. */
export type TokenSet = Record<string, ModeTokens>;

/** The message names the offending token path and file. */
export class TokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenError';
  }
}

const FILE_NAME = /^[^.]+\.([^.]+)\.tokens\.json$/;
const ALIAS = /^\{([^{}]+)\}$/;

export function parseDtcgFiles(files: DtcgFile[]): TokenSet {
  const set: TokenSet = {};
  for (const file of files) {
    const mode = (set[modeOf(file.name)] ??= { files: [], tokens: {} });
    mode.files.push(file.name);
    for (const token of collect(file.json, [], undefined, file.name)) {
      const existing = mode.tokens[token.path];
      if (existing) throw new TokenError(`${token.path} (${file.name}): already defined in ${existing.file}`);
      mode.tokens[token.path] = token;
    }
  }
  return set;
}

export function aliasTarget(value: JsonValue): string | undefined {
  return typeof value === 'string' ? ALIAS.exec(value)?.[1] : undefined;
}

export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function modeOf(name: string): string {
  const match = FILE_NAME.exec(name);
  if (!match) throw new TokenError(`${name}: expected a file named <Collection>.<Mode>.tokens.json`);
  return match[1].toLowerCase();
}

// A token is any object with `$value`; any other object is a group whose `$type` applies below it; other `$` keys are skipped.
function collect(node: JsonValue, path: string[], inherited: string | undefined, file: string, out: Token[] = []): Token[] {
  if (!isJsonObject(node)) {
    const location = path.join('.') || '(root)';
    throw new TokenError(`${location} (${file}): expected a token or a group, got ${JSON.stringify(node)}`);
  }
  const type = typeof node.$type === 'string' ? node.$type : inherited;
  if ('$value' in node) {
    out.push({ path: path.join('.'), type, value: node.$value, file });
    return out;
  }
  for (const [key, child] of Object.entries(node)) {
    if (!key.startsWith('$')) collect(child, [...path, key], type, file, out);
  }
  return out;
}

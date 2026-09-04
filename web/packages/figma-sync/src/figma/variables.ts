// Figma's local-variables payload → the DTCG files `@atlas/design-tokens` reads.
// No I/O here: the caller fetches (or reads a fixture), so the same code runs
// under Node (the CLI) and Deno (CI).

import type { DtcgFile, JsonValue } from '@atlas/design-tokens/toolkit';

/** The payload names the offending collection, variable or mode. */
export class FigmaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FigmaError';
  }
}

export interface FigmaMode {
  modeId: string;
  name: string;
}

export interface FigmaCollection {
  id: string;
  name: string;
  modes: FigmaMode[];
}

/** `r`, `g`, `b` and `a` are 0..1. */
export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface FigmaAlias {
  type: 'VARIABLE_ALIAS';
  id: string;
}

export type FigmaValue = FigmaColor | FigmaAlias | string | number | boolean;

export type FigmaResolvedType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export interface FigmaVariable {
  id: string;
  /** Slash-separated, e.g. `color/primary/main`. */
  name: string;
  variableCollectionId: string;
  resolvedType: FigmaResolvedType;
  description?: string;
  /** Where the variable is allowed to be used; this is what fixes the DTCG `$type`. */
  scopes?: string[];
  /** Keyed by `modeId`; a mode without an entry does not carry the variable. */
  valuesByMode: Record<string, FigmaValue>;
}

/** `GET /v1/files/{fileKey}/variables/local`. */
export interface FigmaVariablesResponse {
  meta: {
    variableCollections: Record<string, FigmaCollection>;
    variables: Record<string, FigmaVariable>;
  };
}

/**
 * Figma types a variable as COLOR/FLOAT/STRING/BOOLEAN and separately records where it
 * may be used. The scope is what tells a corner radius (a dimension) from a stroke width
 * (a plain number), and a font family from any other string.
 */
const SCOPE_TYPES: Readonly<Record<string, string>> = {
  CORNER_RADIUS: 'dimension',
  FONT_SIZE: 'dimension',
  WIDTH_HEIGHT: 'dimension',
  GAP: 'dimension',
  FONT_WEIGHT: 'fontWeight',
  FONT_FAMILY: 'fontFamily',
};

const RESOLVED_TYPES: Readonly<Record<FigmaResolvedType, string>> = {
  COLOR: 'color',
  FLOAT: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
};

export function dtcgType(variable: FigmaVariable): string {
  for (const scope of variable.scopes ?? []) {
    const type = SCOPE_TYPES[scope];
    if (type) return type;
  }
  return RESOLVED_TYPES[variable.resolvedType];
}

/**
 * One file per collection and mode, named `<Collection>.<Mode>.tokens.json`, in the order
 * Figma lists the variables — the files read the way the designer organised the panel.
 */
export function toDtcgFiles(response: FigmaVariablesResponse): DtcgFile[] {
  const { variableCollections, variables } = response.meta;
  const files = new Map<string, Group>();
  const nameOf = (id: string): string => {
    const variable = variables[id];
    if (!variable) throw new FigmaError(`alias to ${id}: no such variable in the payload`);
    return variable.name.split('/').join('.');
  };

  for (const variable of Object.values(variables)) {
    const collection = variableCollections[variable.variableCollectionId];
    if (!collection) throw new FigmaError(`${variable.name}: unknown collection ${variable.variableCollectionId}`);
    const type = dtcgType(variable);
    for (const mode of collection.modes) {
      const raw = variable.valuesByMode[mode.modeId];
      if (raw === undefined) continue;
      const name = `${collection.name}.${mode.name}.tokens.json`;
      const root = files.get(name) ?? files.set(name, {}).get(name)!;
      place(root, variable.name.split('/'), token(variable, type, raw, nameOf));
    }
  }

  if (files.size === 0) throw new FigmaError('the payload holds no variables');
  return [...files]
    .map(([name, json]) => ({ name, json: hoistTypes(json) }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

function token(
  variable: FigmaVariable,
  type: string,
  raw: FigmaValue,
  nameOf: (id: string) => string,
): Group {
  const node: Group = { $type: type, $value: value(variable, type, raw, nameOf) };
  if (variable.description) node.$description = variable.description;
  return node;
}

function value(variable: FigmaVariable, type: string, raw: FigmaValue, nameOf: (id: string) => string): JsonValue {
  if (isAlias(raw)) return `{${nameOf(raw.id)}}`;
  if (type === 'color') {
    if (!isColor(raw)) throw new FigmaError(`${variable.name}: expected a colour, got ${JSON.stringify(raw)}`);
    return hex(raw);
  }
  if (typeof raw === 'object') throw new FigmaError(`${variable.name}: expected a ${type}, got ${JSON.stringify(raw)}`);
  if (type === 'dimension') return `${raw}px`;
  // Figma has no list variable: a font stack is a comma-separated string.
  if (type === 'fontFamily') return String(raw).split(',').map((family) => family.trim());
  return raw;
}

const isAlias = (raw: FigmaValue): raw is FigmaAlias =>
  typeof raw === 'object' && raw !== null && (raw as FigmaAlias).type === 'VARIABLE_ALIAS';

const isColor = (raw: FigmaValue): raw is FigmaColor =>
  typeof raw === 'object' && raw !== null && typeof (raw as FigmaColor).r === 'number';

/** Upper-case `#RRGGBB`, or `rgba()` when the variable is translucent — what the transform normalises to. */
function hex({ r, g, b, a = 1 }: FigmaColor): string {
  const channel = (value: number) => Math.round(value * 255);
  if (a < 1) return `rgba(${channel(r)},${channel(g)},${channel(b)},${Number(a.toFixed(4))})`;
  return `#${[r, g, b].map((value) => channel(value).toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

type Group = Record<string, JsonValue>;

function place(root: Group, path: string[], node: Group): void {
  let group = root;
  for (const key of path.slice(0, -1)) {
    const child = (group[key] ??= {});
    if (!isGroup(child) || isToken(child)) throw new FigmaError(`${path.join('/')}: ${key} is both a variable and a group`);
    group = child;
  }
  const leaf = path[path.length - 1];
  if (leaf in group) throw new FigmaError(`${path.join('/')}: defined twice in the same mode`);
  group[leaf] = node;
}

/**
 * A `$type` shared by every token below a group moves up onto that group — the shape a
 * hand-written DTCG file has — and then down again through single-group chains, so
 * `button.contained` carries it rather than `button`.
 */
function hoistTypes(node: Group): Group {
  const types = new Set(tokensOf(node).map((token) => String(token.$type)));
  if (types.size === 1 && tokensOf(node).length > 1) return hoist(node, [...types][0]);
  return mapGroups(node, hoistTypes);
}

function hoist(node: Group, type: string): Group {
  const children = groups(node);
  if (children.length === 1 && !isToken(children[0][1])) {
    const [key, child] = children[0];
    return { ...node, [key]: hoist(child, type) };
  }
  return { $type: type, ...stripTypes(node) };
}

function stripTypes(node: Group): Group {
  if (!isToken(node)) return mapGroups(node, stripTypes);
  const { $type: _dropped, ...rest } = node;
  return rest;
}

function tokensOf(node: Group, out: Group[] = []): Group[] {
  if (isToken(node)) out.push(node);
  else for (const [, child] of groups(node)) tokensOf(child, out);
  return out;
}

function mapGroups(node: Group, map: (child: Group) => Group): Group {
  return Object.fromEntries(
    Object.entries(node).map(([key, child]) => [key, isGroup(child) && !key.startsWith('$') ? map(child) : child]),
  );
}

/** The group's children, skipping the `$`-prefixed DTCG keys. */
const groups = (node: Group): [string, Group][] =>
  Object.entries(node).filter((entry): entry is [string, Group] => !entry[0].startsWith('$') && isGroup(entry[1]));

const isToken = (node: Group): boolean => '$value' in node;

const isGroup = (value: JsonValue): value is Group =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

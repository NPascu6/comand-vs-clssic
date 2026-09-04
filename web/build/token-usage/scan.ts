import { TOKEN_PATHS } from './tokenPaths.ts';

export interface SourceFile {
  readonly path: string;
  readonly source: string;
}

export type TokenUsage = Readonly<Record<string, readonly string[]>>;

interface GroupAlias {
  /** The identifier the source reads through. */
  readonly alias: string;
  /** The token path that identifier stands for, '' for the whole export. */
  readonly prefix: string;
}

const IDENTIFIER = '[A-Za-z_$][\\w$]*';

const TYPED_GROUP = new RegExp(`(${IDENTIFIER})\\s*:\\s*(?:(${IDENTIFIER})Tokens\\b|ComponentTokens\\['(${IDENTIFIER})'\\])`, 'g');

// A component reads tokens one of three ways, and all have to be credited: the shipped export
// directly, the resolved ones through the hook or the theme, or a group handed to it as an
// argument — `(button: ButtonTokens)` — which is how a helper reads tokens it was given.
const ROOTS: readonly GroupAlias[] = [
  { alias: 'themeInputs', prefix: '' },
  { alias: 'useAtlasTokens()', prefix: '' },
  { alias: 'atlas.tokens', prefix: '' },
];

export function isScannedSource(path: string): boolean {
  if (!path.endsWith('.ts') && !path.endsWith('.tsx')) return false;
  const excluded = path.includes('.stories.') || path.includes('.test.') || path.startsWith('generated/') || path.startsWith('docs/') || path.startsWith('test/') || path.startsWith('a11y/');
  return !excluded;
}

export function componentNameOf(path: string): string {
  const file = path.split('/').at(-1) ?? path;
  return file.replace(/\.tsx?$/, '');
}

const escaped = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const joined = (prefix: string, path: string): string => (prefix ? `${prefix}.${path}` : path);

/** `ThemeInputs` is the whole export; `ButtonTokens` and `ComponentTokens['button']` are one group. */
function typedAliasesOf(source: string): readonly GroupAlias[] {
  const typed = [...source.matchAll(TYPED_GROUP)].map((match) => {
    const group = match[3] ?? (match[2] === 'Theme' ? '' : `components.${lowerFirst(match[2] ?? '')}`);
    return { alias: match[1], prefix: match[3] ? `components.${match[3]}` : group };
  });
  const whole = [...source.matchAll(new RegExp(`(${IDENTIFIER})\\s*:\\s*ThemeInputs\\b`, 'g'))];
  return [...typed, ...whole.map((match) => ({ alias: match[1], prefix: '' }))];
}

const lowerFirst = (value: string): string => value.charAt(0).toLowerCase() + value.slice(1);

/** `const { gap, height } = theme.atlas.tokens.components.header;` — the group can be at any depth. */
function boundAliasesOf(source: string, root: GroupAlias): readonly GroupAlias[] {
  // `theme.atlas.tokens` and a bare `atlas.tokens` are the same root, hence the optional owner.
  const pattern = new RegExp(
    `const\\s*\\{([^}]*)\\}\\s*=\\s*(?:${IDENTIFIER}\\.)?${escaped(root.alias)}((?:\\.${IDENTIFIER})*)\\s*;`,
    'g',
  );
  return [...source.matchAll(pattern)].flatMap((match) =>
    match[1]
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => {
        const [group, renamed] = part.split(':').map((piece) => piece.trim());
        return { alias: renamed ?? group, prefix: joined(joined(root.prefix, match[2].slice(1)), group) };
      }),
  );
}

function aliasesIn(source: string): readonly GroupAlias[] {
  const found = [...ROOTS, ...typedAliasesOf(source)];
  // Two rounds: a binding can be made from a binding, but not indefinitely in practice.
  for (let round = 0; round < 2; round += 1) {
    found.push(...found.flatMap((root) => boundAliasesOf(source, root)));
  }
  return found;
}

function referencesOf(source: string, { alias, prefix }: GroupAlias): readonly string[] {
  const pattern = new RegExp(`\\b${escaped(alias)}\\.(${IDENTIFIER}(?:\\.${IDENTIFIER})*)`, 'g');
  const read = [...source.matchAll(pattern)].map((match) => joined(prefix, match[1]));
  // A binding may already be a leaf — `const { contentGap } = ….layout` reads it with no dot after.
  return TOKEN_PATHS.has(prefix) ? [prefix, ...read] : read;
}

function knownPathsOf(reference: string): readonly string[] {
  const segments = reference.split('.');
  return segments
    .map((_, index) => segments.slice(0, index + 1).join('.'))
    .filter((path) => TOKEN_PATHS.has(path));
}

export function tokenPathsIn(source: string): readonly string[] {
  const referenced = aliasesIn(source).flatMap((group) => referencesOf(source, group)).flatMap(knownPathsOf);
  return [...new Set(referenced)].sort();
}

export type Attribution = (module: string) => readonly string[];

const ownModule: Attribution = (module) => [module];

export function buildTokenUsage(files: readonly SourceFile[], attribute: Attribution = ownModule): TokenUsage {
  const uses = files.flatMap((file) =>
    tokenPathsIn(file.source).flatMap((path) =>
      attribute(file.path.replace(/\.tsx?$/, '')).map((module) => ({ path, component: componentNameOf(module) })),
    ),
  );
  const paths = [...new Set(uses.map((use) => use.path))].sort();
  return Object.fromEntries(
    paths.map((path) => [
      path,
      [...new Set(uses.filter((use) => use.path === path).map((use) => use.component))].sort(),
    ]),
  );
}

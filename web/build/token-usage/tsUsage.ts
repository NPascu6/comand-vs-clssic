import { TOKEN_PATHS } from './tokenPaths.ts';
import { customProperty } from '../../packages/design-tokens/src/emit/cssVariables.ts';
import type { SourceFile, TokenUsage } from './scan.ts';

// The components are MUI's, styled from the theme, so most of what a component spends is a
// `token('…')` in the theme's overrides or a `var(--atlas-…)` in an `sx`. Both are read here.

/** `--atlas-component-button-gap` → `components.button.gap`, built forwards so it cannot guess wrong. */
const PATH_OF_PROPERTY: ReadonlyMap<string, string> = new Map(
  [...TOKEN_PATHS].flatMap((path) => {
    const emitted = path.replace(/^components\./, 'component.');
    return [[customProperty(path), path] as const, [customProperty(emitted), path] as const];
  }),
);

/** A path as it is spelt in a `token('…')` call, in either of its two forms. */
const KNOWN_PATHS: ReadonlyMap<string, string> = new Map(
  [...TOKEN_PATHS].flatMap((path) => [[path, path] as const, [path.replace(/^components\./, 'component.'), path] as const]),
);

/** The component a MUI override block styles. */
const COMPONENT_OF_MUI: Readonly<Record<string, string>> = {
  MuiButton: 'Button',
  MuiIconButton: 'IconButton',
  MuiSvgIcon: 'Icon',
  MuiAppBar: 'AppHeader',
  MuiToolbar: 'AppHeader',
  MuiTypography: 'Text',
};

const TOKEN_CALL = /token\('([\w.]+)'\)/g;
const VARIABLE = /var\((--atlas-[\w-]+)\)/g;
/** `var(--atlas-space-${gap})`: every token under that prefix is reachable from the call site. */
const VARIABLE_PREFIX = /var\((--atlas-[\w-]+)-\$\{/g;
const MUI_BLOCK = /^\s*(Mui\w+):\s*\{/;

function componentOf(path: string): string {
  return (path.split('/').at(-1) ?? path).replace(/\.tsx?$/, '');
}

export function tsTokenUsage(files: readonly SourceFile[]): TokenUsage {
  const found = new Map<string, Set<string>>();
  const credit = (path: string, component: string) => found.set(path, (found.get(path) ?? new Set()).add(component));

  for (const file of files) {
    let block: string | undefined;
    for (const line of file.source.split('\n')) {
      const opened = MUI_BLOCK.exec(line);
      if (opened) block = COMPONENT_OF_MUI[opened[1]];
      const component = block ?? componentOf(file.path);

      for (const [, spelt] of line.matchAll(TOKEN_CALL)) {
        const path = KNOWN_PATHS.get(spelt);
        if (path) credit(path, component);
      }
      for (const [, property] of line.matchAll(VARIABLE)) {
        const path = PATH_OF_PROPERTY.get(property);
        if (path) credit(path, component);
      }
      for (const [, prefix] of line.matchAll(VARIABLE_PREFIX)) {
        for (const [property, path] of PATH_OF_PROPERTY) {
          if (property.startsWith(`${prefix}-`)) credit(path, component);
        }
      }
    }
  }
  return Object.fromEntries([...found].sort().map(([path, names]) => [path, [...names].sort()]));
}

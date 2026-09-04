import { TOKEN_PATHS } from './tokenPaths.ts';
import { customProperty } from '../../packages/design-tokens/src/emit/cssVariables.ts';
import type { SourceFile, TokenUsage } from './scan.ts';

// A component spends most of its tokens in the stylesheet now, so the usage map has to read CSS
// as well as TypeScript — otherwise the governance gate would call a token unread the moment its
// component stopped naming it in a `sx`.

/**
 * `--atlas-component-header-height` → `components.header.height`, built forwards so it cannot
 * guess wrong. The flattener prefixes a component path with the singular `component`, while the
 * path table names the group as it appears on ThemeInputs, so both spellings map to the path.
 */
const PATH_OF_PROPERTY: ReadonlyMap<string, string> = new Map(
  [...TOKEN_PATHS].flatMap((path) => {
    const emitted = path.replace(/^components\./, 'component.');
    return emitted === path
      ? [[customProperty(path), path] as const]
      : [[customProperty(path), path] as const, [customProperty(emitted), path] as const];
  }),
);

const RULE = /([^{}]+)\{([^}]*)\}/g;
const VARIABLE = /var\((--[\w-]+)/g;

/**
 * The component a selector belongs to: `.atlas-app-header__bar` and `.atlas-app-header--sticky`
 * are both AppHeader. A selector naming no component — `:root`, a token block — credits nothing.
 */
export function componentOfSelector(selector: string): string | undefined {
  const match = /\.atlas-([a-z][\w-]*)/.exec(selector);
  if (!match) return undefined;
  const block = match[1].split('__')[0].split('--')[0];
  return block.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

export function cssTokenUsage(files: readonly SourceFile[]): TokenUsage {
  const found = new Map<string, Set<string>>();
  for (const file of files) {
    for (const [, selector, body] of file.source.matchAll(RULE)) {
      const component = componentOfSelector(selector);
      if (component === undefined) continue;
      for (const [, property] of body.matchAll(VARIABLE)) {
        const path = PATH_OF_PROPERTY.get(property);
        if (path === undefined) continue;
        found.set(path, (found.get(path) ?? new Set()).add(component));
      }
    }
  }
  return Object.fromEntries([...found].map(([path, names]) => [path, [...names].sort()]));
}

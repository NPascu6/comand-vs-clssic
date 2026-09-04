import assert from 'node:assert/strict';
import { themeInputs } from '@atlas/design-tokens';
import { buildTokenUsage, isScannedSource, tokenPathsIn } from '../../web/build/token-usage/scan.ts';
import type { SourceFile, TokenUsage } from '../../web/build/token-usage/scan.ts';
import { emitTokenUsage } from '../../web/build/token-usage/emit.ts';
import { cssTokenUsage } from '../../web/build/token-usage/cssUsage.ts';
import { tsTokenUsage } from '../../web/build/token-usage/tsUsage.ts';
import { attributionOf, importGraphOf } from '../../web/build/token-usage/importGraph.ts';
import { publicModulesOf, terminalModulesOf } from '../../web/build/token-usage/publicModules.ts';
import { TOKEN_PATHS } from '../../web/build/token-usage/tokenPaths.ts';
import { tokenUsage } from '../../web/packages/core/src/generated/token-usage.ts';

const SOURCE_DIR = new URL('../../web/packages/core/src/', import.meta.url);

async function sourcesIn(directory: URL, prefix: string): Promise<readonly SourceFile[]> {
  const entries = await Array.fromAsync(Deno.readDir(directory));
  const found = await Promise.all(
    entries.map(async (entry): Promise<readonly SourceFile[]> => {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory) return await sourcesIn(new URL(`${entry.name}/`, directory), `${path}/`);
      if (!isScannedSource(path)) return [];
      return [{ path, source: await Deno.readTextFile(new URL(entry.name, directory)) }];
    }),
  );
  return found.flat();
}

/** A token read in TypeScript and in CSS is read by both, so the two maps union. */
function mergeUsage(...maps: readonly TokenUsage[]): TokenUsage {
  const merged = new Map<string, Set<string>>();
  for (const map of maps) {
    for (const [path, components] of Object.entries(map)) {
      const named = merged.get(path) ?? new Set<string>();
      for (const component of components) named.add(component);
      merged.set(path, named);
    }
  }
  return Object.fromEntries([...merged].sort().map(([path, named]) => [path, [...named].sort()]));
}

async function scanUsage(): Promise<string> {
  const files = await sourcesIn(SOURCE_DIR, '');
  const publicModules = publicModulesOf(await Deno.readTextFile(new URL('index.ts', SOURCE_DIR)));
  const attribute = attributionOf(importGraphOf(files), terminalModulesOf(publicModules));
  const styles = [{ path: 'styles.css', source: await Deno.readTextFile(new URL('styles.css', SOURCE_DIR)) }];
  return emitTokenUsage(mergeUsage(buildTokenUsage(files, attribute), cssTokenUsage(styles), tsTokenUsage(files)));
}

Deno.test('The committed usage map is exactly what a scan of the design system produces', async () => {
  const committed = await Deno.readTextFile(new URL('generated/token-usage.ts', SOURCE_DIR));

  assert.equal(await scanUsage(), committed, 'run `pnpm tokens:usage` in web/packages/core');
});

Deno.test('A token spent in the stylesheet is credited to the block that spends it', () => {
  // IconButton renders Button's own classes on purpose — one button surface, two shapes — so the
  // stylesheet credits the block, which is where a designer would go to change it.
  assert.deepEqual(tokenUsage['components.button.heightMd'], ['Button', 'IconButton']);
  assert.deepEqual(tokenUsage['components.button.solidBackground'], ['Button']);
  assert.deepEqual(tokenUsage['components.header.adornmentSize'], ['AppHeader']);
});

Deno.test('Every token path in the map is a real token in themeInputs', () => {
  const unknown = Object.keys(tokenUsage).filter((path) => !TOKEN_PATHS.has(path));

  assert.deepEqual(unknown, [], `usage map names tokens that do not exist: ${unknown.join(', ')}`);
});

Deno.test('Every component token group has at least one consumer', () => {
  const consuming = new Set(
    Object.keys(tokenUsage)
      .filter((path) => path.startsWith('components.'))
      .map((path) => path.split('.')[1]),
  );
  const orphans = Object.keys(themeInputs.components).filter((group) => !consuming.has(group));

  assert.deepEqual(orphans, [], `component tokens nobody reads, so nobody can see them change: ${orphans.join(', ')}`);
});

Deno.test('Every component the map names still reads a token', () => {
  const named = new Set(Object.values(tokenUsage).flat());

  assert.equal(named.size > 0, true);
  assert.equal([...named].every((component) => component.length > 0), true);
});

Deno.test('A reference counts whether it is destructured or written out in full', () => {
  const destructured = 'const { header } = themeInputs.components;\nconst { space } = themeInputs;\nheader.height + space.md';

  assert.deepEqual(tokenPathsIn(destructured), ['components.header.height', 'space.md']);
  assert.deepEqual(tokenPathsIn('themeInputs.components.button.heightMd'), ['components.button.heightMd']);
  assert.deepEqual(tokenPathsIn('themeInputs.typography.overline.size'), ['typography.overline.size']);
  assert.deepEqual(tokenPathsIn('const { header: bar } = themeInputs.components;\nbar.gap'), [
    'components.header.gap',
  ]);
  // A group reached through the theme, bound at its own depth, and read with no dot after it.
  assert.deepEqual(tokenPathsIn('const { gap } = theme.atlas.tokens.components.header;\ngap'), [
    'components.header.gap',
  ]);
  // A helper that is handed a group reads it, even though it never names the export.
  assert.deepEqual(tokenPathsIn('function sizeOf(button: ButtonTokens) { return button.heightLg; }'), [
    'components.button.heightLg',
  ]);
  assert.deepEqual(tokenPathsIn('themeInputs.schemes.atlas.label'), []);
});

Deno.test('Stories and the docs pages are documentation, not consumers', () => {
  assert.equal(isScannedSource('layout/AppHeader.tsx'), true);
  assert.equal(isScannedSource('controls/buttonSurface.ts'), true);
  assert.equal(isScannedSource('layout/AppHeader.stories.tsx'), false);
  assert.equal(isScannedSource('theme/Tokens.stories.tsx'), false);
  assert.equal(isScannedSource('generated/token-usage.ts'), false);
  assert.equal(isScannedSource('README.md'), false);
});

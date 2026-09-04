import assert from 'node:assert/strict';
import { themeInputs } from '@atlas/design-tokens';

// A story showing a value the export does not carry is a story that lies about the design system.
// These keep Storybook and the Figma export in step without anyone remembering to check.

const STORIES_DIR = new URL('../../web/packages/core/src/', import.meta.url);
const HEX = /#[0-9A-Fa-f]{6}\b/g;

/** A hex a story may hold: one the token export itself carries, or one it declares as an override. */
const EXPORTED_COLOURS: ReadonlySet<string> = new Set(
  Object.values(themeInputs.palettes)
    .flatMap((palette) => JSON.stringify(palette).match(HEX) ?? [])
    .map((value) => value.toUpperCase()),
);

async function storiesIn(directory: URL, prefix = ''): Promise<ReadonlyArray<{ path: string; source: string }>> {
  const entries = await Array.fromAsync(Deno.readDir(directory));
  const found = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory) return await storiesIn(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`);
      if (!entry.name.endsWith('.stories.tsx')) return [];
      return [{ path: `${prefix}${entry.name}`, source: await Deno.readTextFile(new URL(entry.name, directory)) }];
    }),
  );
  return found.flat();
}

Deno.test('A story shows the shipped palette, or a colour it declares as a token override', async () => {
  const offenders: string[] = [];
  for (const story of await storiesIn(STORIES_DIR)) {
    // A story that builds a ThemeOverrides is demonstrating a re-skin; its colours are the point.
    if (story.source.includes('ThemeOverrides')) continue;
    for (const hex of story.source.match(HEX) ?? []) {
      if (!EXPORTED_COLOURS.has(hex.toUpperCase())) offenders.push(`${story.path}: ${hex}`);
    }
  }

  assert.deepEqual(offenders, [], `stories holding colours the export does not carry: ${offenders.join(', ')}`);
});

Deno.test('The token playground offers a control for tokens that exist', async () => {
  const source = await Deno.readTextFile(new URL('theme/TokenPlayground.stories.tsx', STORIES_DIR));
  const paths = [...source.matchAll(/'((?:component|typography|layout)\.[\w.]+)'/g)].map((match) => match[1]);
  const flat = JSON.stringify(themeInputs);
  const unknown = paths.filter((path) => !flat.includes(`"${path.split('.').at(-1)}"`));

  assert.equal(paths.length > 0, true, 'the playground names the token paths it changes');
  assert.deepEqual(unknown, [], `playground names tokens that do not exist: ${unknown.join(', ')}`);
});

import assert from 'node:assert/strict';

// Storybook is where a designer sees what they can configure, so a component missing from it is a
// component they cannot see. This is the gate: every component the library exports has a story.

const SOURCE_DIR = new URL('../../web/packages/core/src/', import.meta.url);
const COMPONENT_DIRS = ['primitives', 'controls', 'layout', 'theme'] as const;

/** The provider every story is already rendered inside; a story of it would show nothing. */
const NO_STORY_NEEDED = new Set(['AtlasThemeProvider']);

async function componentsIn(folder: string): Promise<readonly string[]> {
  const entries = await Array.fromAsync(Deno.readDir(new URL(`${folder}/`, SOURCE_DIR)));
  return entries
    .filter((entry) => entry.isFile && entry.name.endsWith('.tsx'))
    .map((entry) => entry.name.replace(/\.tsx$/, ''))
    .filter((name) => !name.includes('.stories') && !name.includes('.test'))
    // A component is what a consumer renders: a file whose name is capitalised.
    .filter((name) => /^[A-Z]/.test(name));
}

async function hasStory(folder: string, name: string): Promise<boolean> {
  try {
    await Deno.stat(new URL(`${folder}/${name}.stories.tsx`, SOURCE_DIR));
    return true;
  } catch {
    return false;
  }
}

Deno.test('Every component the design system ships has a story', async () => {
  const missing: string[] = [];
  for (const folder of COMPONENT_DIRS) {
    for (const name of await componentsIn(folder)) {
      if (NO_STORY_NEEDED.has(name)) continue;
      if (!(await hasStory(folder, name))) missing.push(`${folder}/${name}`);
    }
  }

  assert.deepEqual(missing, [], `components a designer cannot see in Storybook: ${missing.join(', ')}`);
});

Deno.test('Every story a component has renders it under a title in its own group', async () => {
  const wrong: string[] = [];
  for (const folder of COMPONENT_DIRS) {
    for (const name of await componentsIn(folder)) {
      if (!(await hasStory(folder, name))) continue;
      const source = await Deno.readTextFile(new URL(`${folder}/${name}.stories.tsx`, SOURCE_DIR));
      if (!source.includes(`/${name}'`)) wrong.push(`${folder}/${name}`);
    }
  }

  assert.deepEqual(wrong, [], `stories whose title does not name their component: ${wrong.join(', ')}`);
});

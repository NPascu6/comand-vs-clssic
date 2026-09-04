import assert from 'node:assert/strict';
import { emit, parseDtcgFiles, themeInputs, TokenError, transform } from '@atlas/design-tokens';
import type { DtcgFile, JsonValue, ThemeInputs } from '@atlas/design-tokens';

const PACKAGE = new URL('../../web/packages/design-tokens/', import.meta.url);
const FIGMA_DIR = new URL('figma/', PACKAGE);
const GENERATED = new URL('src/generated/theme-inputs.ts', PACKAGE);

async function readExport(): Promise<DtcgFile[]> {
  const files: DtcgFile[] = [];
  for await (const entry of Deno.readDir(FIGMA_DIR)) {
    if (entry.isFile && entry.name.endsWith('.tokens.json')) {
      files.push({ name: entry.name, json: JSON.parse(await Deno.readTextFile(new URL(entry.name, FIGMA_DIR))) });
    }
  }
  return files.sort((first, second) => first.name.localeCompare(second.name));
}

Deno.test('The committed theme inputs are exactly what the Figma export produces', async () => {
  const inputs = transform(parseDtcgFiles(await readExport()));

  assert.deepEqual(inputs, themeInputs);
  assert.equal(emit(inputs), await Deno.readTextFile(GENERATED));
});

interface JsonObject {
  [key: string]: JsonValue;
}
type Patch = Record<string, JsonObject | undefined>;

const token = (type: string, value: JsonValue): JsonObject => ({ $type: type, $value: value });
const color = (value: JsonValue) => token('color', value);

const COLOR_PATHS = [
  'primary.main', 'primary.light', 'primary.contrastText', 'secondary.main', 'success.main', 'warning.main',
  'error.main', 'info.main', 'text.primary', 'text.secondary', 'divider', 'background.default', 'background.paper',
];

/** Dotted paths → nested DTCG groups; an undefined token removes the path. */
function nest(tokens: Patch): JsonObject {
  const root: JsonObject = {};
  for (const [path, value] of Object.entries(tokens)) {
    if (!value) continue;
    const keys = path.split('.');
    let node = root;
    for (const key of keys.slice(0, -1)) node = (node[key] ??= {}) as JsonObject;
    node[keys[keys.length - 1]] = value;
  }
  return root;
}

function modeFile(mode: string, patch: Patch = {}): DtcgFile {
  const tokens: Patch = {
    'palette.mode': token('string', mode === 'Dark' ? 'dark' : 'light'),
    'border.width': token('number', 1),
    'border.color': color('{color.divider}'),
    'focus.width': token('number', 0),
    'focus.color': color('{color.primary.main}'),
  };
  for (const path of COLOR_PATHS) tokens[`color.${path}`] = color('#123456');
  return { name: `Atlas.${mode}.tokens.json`, json: nest({ ...tokens, ...patch }) };
}

function baseFile(patch: Patch = {}): DtcgFile {
  const tokens: Patch = {
    'font.sans': token('fontFamily', ['ui-sans-serif', 'sans-serif']),
    'font.mono': token('fontFamily', 'ui-monospace, monospace'),
    'radius.control': token('dimension', '8px'),
    'radius.surface': token('dimension', { value: 12, unit: 'px' }),
    'typography.button.weight': token('fontWeight', 600),
    'typography.chip.weight': token('fontWeight', 600),
    'typography.overline.size': token('dimension', 11),
    'typography.overline.weight': token('fontWeight', 600),
    'typography.overline.letterSpacing': token('string', '0.08em'),
    'typography.overline.lineHeight': token('number', 1.6),
    'typography.tableHeader.size': token('dimension', '11px'),
    'typography.tableHeader.weight': token('fontWeight', 700),
    'typography.tableHeader.letterSpacing': token('string', '0.06em'),
  };
  return { name: 'Atlas.Base.tokens.json', json: nest({ ...tokens, ...patch }) };
}

interface Patches {
  light?: Patch;
  dark?: Patch;
  contrast?: Patch;
  base?: Patch;
}

const build = ({ light, dark, contrast, base }: Patches = {}): ThemeInputs =>
  transform(parseDtcgFiles([
    modeFile('Light', light), modeFile('Dark', dark), modeFile('Contrast', contrast), baseFile(base),
  ]));

const throwsTokenError = (block: () => void, ...fragments: string[]) =>
  assert.throws(block, (error) => {
    assert.ok(error instanceof TokenError, `expected a TokenError, got ${String(error)}`);
    for (const fragment of fragments) {
      assert.ok(error.message.includes(fragment), `"${error.message}" should mention ${fragment}`);
    }
    return true;
  });

Deno.test('A group-level $type applies to every token below it unless the token sets its own', () => {
  const set = parseDtcgFiles([{
    name: 'Atlas.Light.tokens.json',
    json: { color: { $type: 'color', $description: 'ignored', primary: { main: { $value: '#abc' }, label: { $type: 'string', $value: 'Navy' } } } },
  }]);

  assert.deepEqual(Object.keys(set), ['light']);
  assert.equal(set.light.tokens['color.primary.main'].type, 'color');
  assert.equal(set.light.tokens['color.primary.label'].type, 'string');
  assert.equal(set.light.tokens['color.primary.main'].file, 'Atlas.Light.tokens.json');
});

Deno.test('Aliases chain, resolving in the mode file before Base', () => {
  const inputs = build({
    light: { 'color.info.main': color('{color.secondary.main}'), 'color.secondary.main': color('{brand.navy}') },
    base: { 'brand.navy': color('#0f2143'), 'color.divider': color('#ffffff') },
  });

  assert.equal(inputs.palettes.light.info.main, '#0F2143');
  assert.equal(inputs.palettes.light.secondary.main, '#0F2143');
  // The mode's own divider wins over Base's.
  assert.equal(inputs.palettes.light.border.color, '#123456');
});

Deno.test('An alias cycle is a TokenError naming the chain', () => {
  throwsTokenError(
    () => build({ light: { 'color.info.main': color('{color.secondary.main}'), 'color.secondary.main': color('{color.info.main}') } }),
    'cycle', 'color.secondary.main', 'color.info.main', 'Atlas.Light.tokens.json',
  );
});

Deno.test('An alias to a token that does not exist is a TokenError', () => {
  throwsTokenError(() => build({ light: { 'color.info.main': color('{color.nope}') } }), 'color.info.main', '{color.nope}');
});

Deno.test('A missing required path is a TokenError naming the path and the file', () => {
  throwsTokenError(() => build({ dark: { 'color.divider': undefined } }), 'color.divider', 'Atlas.Dark.tokens.json');
  throwsTokenError(() => build({ base: { 'radius.surface': undefined } }), 'radius.surface', 'Atlas.Base.tokens.json');
  throwsTokenError(() => transform(parseDtcgFiles([modeFile('Light'), modeFile('Dark'), modeFile('Contrast')])), 'Base.tokens.json');
});

Deno.test('Every exported mode is held to the contract, even one the theme does not read', () => {
  const sepia = modeFile('Sepia', { 'focus.color': undefined });
  const files = [modeFile('Light'), modeFile('Dark'), modeFile('Contrast'), baseFile(), sepia];

  throwsTokenError(() => transform(parseDtcgFiles(files)), 'focus.color', 'Atlas.Sepia.tokens.json');
});

Deno.test('palette.mode must be light or dark', () => {
  throwsTokenError(() => build({ contrast: { 'palette.mode': token('string', 'sepia') } }), 'palette.mode', 'sepia');
});

Deno.test('A value of the wrong type is a TokenError naming the path', () => {
  throwsTokenError(() => build({ light: { 'color.divider': token('number', 1) } }), 'color.divider', 'number');
  throwsTokenError(() => build({ light: { 'color.divider': color('blue') } }), 'color.divider', 'blue');
  throwsTokenError(() => build({ base: { 'typography.button.weight': token('fontWeight', 'bold') } }), 'typography.button.weight');
});

Deno.test('Colours normalise to upper-case #RRGGBB, keeping translucency as rgba()', () => {
  const cases: [JsonValue, string][] = [
    ['#abc', '#AABBCC'],
    ['#aabbccff', '#AABBCC'],
    ['#ffffff80', 'rgba(255,255,255,0.5)'],
    ['rgb(15, 33, 67)', '#0F2143'],
    ['rgba(255, 255, 255, 0.12)', 'rgba(255,255,255,0.12)'],
    [{ hex: '#0f2143' }, '#0F2143'],
  ];
  for (const [raw, expected] of cases) {
    assert.equal(build({ light: { 'color.divider': color(raw) } }).palettes.light.divider, expected, JSON.stringify(raw));
  }
});

Deno.test('Dimensions become px numbers in every DTCG form', () => {
  for (const raw of [8, '8px', { value: 8, unit: 'px' }]) {
    assert.equal(build({ base: { 'radius.control': token('dimension', raw) } }).radius.control, 8, JSON.stringify(raw));
  }
  throwsTokenError(() => build({ base: { 'radius.control': token('dimension', '0.5rem') } }), 'radius.control', 'px');
});

Deno.test('A fontFamily array joins into a CSS stack, quoting names with spaces', () => {
  const inputs = build({ base: { 'font.sans': token('fontFamily', ['Segoe UI', 'Roboto', 'sans-serif']) } });

  assert.equal(inputs.font.sans, '"Segoe UI", Roboto, sans-serif');
  assert.equal(inputs.font.mono, 'ui-monospace, monospace');
});

Deno.test('buttonContained is all four tokens or none', () => {
  const contained = {
    'button.contained.background': color('#fff'),
    'button.contained.text': color('#000'),
    'button.contained.hoverBackground': color('#000'),
    'button.contained.hoverText': color('#fff'),
  };

  assert.equal('buttonContained' in build().palettes.contrast, false);
  assert.deepEqual(build({ contrast: contained }).palettes.contrast.buttonContained, {
    background: '#FFFFFF', text: '#000000', hoverBackground: '#000000', hoverText: '#FFFFFF',
  });
  throwsTokenError(
    () => build({ contrast: { ...contained, 'button.contained.hoverText': undefined } }),
    'button.contained', 'hoverText', 'Atlas.Contrast.tokens.json',
  );
});

function evaluate(source: string): ThemeInputs {
  const literal = source.slice(source.indexOf('= {') + 2, source.lastIndexOf(';'));
  return new Function(`return ${literal}`)() as ThemeInputs;
}

Deno.test('emit is deterministic, orders keys as the manifest does, and round-trips', () => {
  const source = emit(themeInputs);
  const { typography, radius, font, palettes } = themeInputs;
  const scrambled: ThemeInputs = {
    typography, radius, font, palettes: { contrast: palettes.contrast, dark: palettes.dark, light: palettes.light },
  };

  assert.ok(source.startsWith('// generated — do not edit'));
  assert.equal(emit(themeInputs), source);
  assert.equal(emit(scrambled), source);
  assert.deepEqual(evaluate(source), themeInputs);
  assert.deepEqual(evaluate(emit(build())), build());
});

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

Deno.test('The export carries exactly the three modes the theme reads', () => {
  assert.deepEqual(Object.keys(themeInputs.palettes), ['light', 'dark', 'contrast']);
  assert.equal(themeInputs.palettes.light.primary.main, '#0F2143');
  assert.equal(themeInputs.palettes.light.mode, 'light');
  assert.equal(themeInputs.palettes.contrast.mode, 'light');
});

interface JsonObject {
  [key: string]: JsonValue;
}
type Patch = Record<string, JsonObject | undefined>;

const token = (type: string, value: JsonValue): JsonObject => ({ $type: type, $value: value });
const color = (value: JsonValue) => token('color', value);
const px = (value: number) => token('dimension', `${value}px`);
const weight = (value: number) => token('fontWeight', value);
const ratio = (value: number) => token('number', value);

const COLOR_PATHS = [
  'primary.main', 'primary.light', 'primary.soft', 'primary.contrastText', 'secondary.main', 'success.main', 'warning.main',
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

const file = (name: string, tokens: Patch): DtcgFile => ({ name: `${name}.tokens.json`, json: nest(tokens) });

function paletteFile(collection: string, mode: string, patch: Patch = {}): DtcgFile {
  const tokens: Patch = {
    'palette.mode': token('string', mode === 'Dark' ? 'dark' : 'light'),
    'border.width': token('number', 1),
    'border.color': color('{color.divider}'),
    'focus.width': token('number', 0),
    'focus.color': color('{color.primary.main}'),
  };
  for (const path of COLOR_PATHS) tokens[`color.${path}`] = color('#123456');
  // The eight categorical colours are per mode; the vocabulary that points at them is in Base.
  for (let index = 1; index <= 8; index += 1) tokens[`series.${index}`] = color(`#65432${index}`);
  return file(`${collection}.${mode}`, { ...tokens, ...patch });
}

/** The domain vocabulary, as Figma writes it: aliases into the palette, so each scheme resolves its own. */
const SEMANTIC_ALIASES: Patch = {
  'status.fund.draft': color('{series.8}'),
  'status.fund.open': color('{color.success.main}'),
  'status.fund.frozen': color('{color.warning.main}'),
  'status.fund.closed': color('{color.text.secondary}'),
  'status.deal.pipeline': color('{series.8}'),
  'status.deal.investable': color('{color.success.main}'),
  'status.deal.closed': color('{color.text.secondary}'),
  'status.deal.withdrawn': color('{color.error.main}'),
  'status.coInvestment.proposed': color('{series.8}'),
  'status.coInvestment.active': color('{color.success.main}'),
  'status.coInvestment.suspended': color('{color.warning.main}'),
  'status.coInvestment.closed': color('{color.text.secondary}'),
  'performance.positive': color('{color.success.main}'),
  'performance.negative': color('{color.error.main}'),
  'performance.flat': color('{color.text.secondary}'),
  'exposure.withinAppetite': color('{color.success.main}'),
  'exposure.approaching': color('{color.warning.main}'),
  'exposure.breach': color('{color.error.main}'),
  'assetClass.privateEquity': color('{series.1}'),
  'assetClass.privateCredit': color('{series.5}'),
  'assetClass.liquidEquity': color('{series.2}'),
  'assetClass.etf': color('{series.8}'),
  'region.northAmerica': color('{series.3}'),
  'region.emea': color('{series.4}'),
  'region.apac': color('{series.6}'),
  'region.latam': color('{series.7}'),
};

/** The component-token class, as Figma writes it: dimensions and weights literal, colours aliased into `color.*`. */
const COMPONENT_TOKENS: Patch = {
  'component.button.heightSm': px(32),
  'component.button.heightMd': px(40),
  'component.button.heightLg': px(48),
  'component.button.paddingInlineSm': px(12),
  'component.button.paddingInlineMd': px(16),
  'component.button.paddingInlineLg': px(24),
  'component.button.gap': px(8),
  'component.button.radius': token('dimension', '{radius.control}'),
  'component.button.fontWeight': weight(600),
  'component.button.solidBackground': color('{color.primary.main}'),
  'component.button.solidText': color('{color.primary.contrastText}'),
  'component.button.solidHoverBackground': color('{color.primary.light}'),
  'component.button.softBackground': color('{color.primary.light}'),
  'component.button.softText': color('{color.primary.main}'),
  'component.button.outlineBorder': color('{color.divider}'),
  'component.button.outlineText': color('{color.primary.main}'),
  'component.button.ghostText': color('{color.primary.main}'),
  'component.button.hoverSurface': color('{color.primary.light}'),

  'component.icon.sizeSm': px(16),
  'component.icon.sizeMd': px(20),
  'component.icon.sizeLg': px(24),
  'component.header.height': px(64),
  'component.header.heightCompact': px(48),
  'component.header.paddingInline': px(16),
  'component.header.gap': px(16),
  'component.header.borderColor': color('{color.divider}'),
  'component.header.adornmentGap': px(8),
  'component.header.adornmentSize': px(32),
};

function baseFile(patch: Patch = {}): DtcgFile {
  const tokens: Patch = {
    'font.sans': token('fontFamily', ['ui-sans-serif', 'sans-serif']),
    'font.mono': token('fontFamily', 'ui-monospace, monospace'),
    'radius.control': token('dimension', '8px'),
    'radius.surface': token('dimension', { value: 12, unit: 'px' }),
    'opacity.soft': ratio(0.12),
    'opacity.disabled': ratio(0.5),
    'typography.title.size': token('dimension', '24px'),
    'typography.title.weight': token('fontWeight', 700),
    'typography.title.lineHeight': token('number', 1.34),
    'typography.heading.size': token('dimension', '20px'),
    'typography.heading.weight': token('fontWeight', 600),
    'typography.heading.lineHeight': token('number', 1.6),
    'typography.subheading.size': token('dimension', '14px'),
    'typography.subheading.weight': token('fontWeight', 600),
    'typography.subheading.lineHeight': token('number', 1.57),
    'typography.body.size': token('dimension', '16px'),
    'typography.body.weight': token('fontWeight', 400),
    'typography.body.lineHeight': token('number', 1.5),
    'typography.bodySmall.size': token('dimension', '14px'),
    'typography.bodySmall.weight': token('fontWeight', 400),
    'typography.bodySmall.lineHeight': token('number', 1.43),
    'typography.caption.size': token('dimension', '12px'),
    'typography.caption.weight': token('fontWeight', 400),
    'typography.caption.lineHeight': token('number', 1.66),
    'typography.button.weight': token('fontWeight', 600),
    'typography.overline.size': token('dimension', 11),
    'typography.overline.weight': token('fontWeight', 600),
    'typography.overline.letterSpacing': token('string', '0.08em'),
    'typography.overline.lineHeight': token('number', 1.6),
    'space.xs': token('dimension', '4px'),
    'space.sm': token('dimension', '8px'),
    'space.md': token('dimension', '16px'),
    'space.lg': token('dimension', '24px'),
    'space.xl': token('dimension', '32px'),
    'layout.contentPadding': token('dimension', '24px'),
    'layout.contentGap': token('dimension', '24px'),
    ...COMPONENT_TOKENS,
    ...SEMANTIC_ALIASES,
  };
  return file('Atlas.Base', { ...tokens, ...patch });
}

interface Patches {
  light?: Patch;
  dark?: Patch;
  contrast?: Patch;
  /** The shape file every mode shares (Atlas.Base). */
  base?: Patch;
}

const build = ({ light, dark, contrast, base }: Patches = {}): ThemeInputs =>
  transform(parseDtcgFiles([
    paletteFile('Atlas', 'Light', light),
    paletteFile('Atlas', 'Dark', dark),
    paletteFile('Atlas', 'Contrast', contrast),
    baseFile(base),
  ]));

const atlas = (patches: Patches = {}) => build(patches).palettes;

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

/** The two cascade levels, most specific first, each holding a divider colour only it can supply. */
const LEVELS = ['Atlas.Light', 'Atlas.Base'];
const LEVEL_COLORS = ['#111111', '#222222'];

/** The light divider the theme resolves to once the `dropped` most specific levels stop defining it. */
function dividerAfterDropping(dropped: number): string {
  const divider = (level: string): Patch => {
    const depth = LEVELS.indexOf(level);
    return { 'color.divider': depth < dropped ? undefined : color(LEVEL_COLORS[depth]) };
  };
  return build({ light: divider('Atlas.Light'), base: divider('Atlas.Base') }).palettes.light.divider;
}

Deno.test('A token cascades mode → base', () => {
  assert.deepEqual([0, 1].map(dividerAfterDropping), LEVEL_COLORS);
});

Deno.test('Aliases chain, resolving in the mode file before Base', () => {
  const palettes = atlas({
    light: { 'color.info.main': color('{color.secondary.main}'), 'color.secondary.main': color('{brand.navy}') },
    base: { 'brand.navy': color('#0f2143'), 'color.divider': color('#ffffff') },
  });

  assert.equal(palettes.light.info.main, '#0F2143');
  assert.equal(palettes.light.secondary.main, '#0F2143');
  // The mode's own divider wins over the shared base's.
  assert.equal(palettes.light.border.color, '#123456');
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

Deno.test('A component colour token emits the palette path it aliases, not a colour', () => {
  const { components } = build();

  assert.equal(components.header.borderColor, 'divider');
});

Deno.test('A literal colour component token emits the colour', () => {
  const inputs = build({ base: { 'component.header.borderColor': color('#0f2143') } });

  assert.equal(inputs.components.header.borderColor, '#0F2143');
  throwsTokenError(
    () => build({ base: { 'component.header.borderColor': color('teal') } }),
    'component.header.borderColor',
    'teal',
  );
});

Deno.test('A component colour token aliasing a path the palette does not have is a TokenError', () => {
  throwsTokenError(
    () => build({ base: { 'component.header.borderColor': color('{color.primary.dark}') } }),
    'component.header.borderColor',
    'primary.dark',
  );
});

Deno.test('An alias out of a non-colour group still resolves to its value', () => {
  assert.equal(build().components.button.radius, 8);
  assert.equal(build({ base: { 'radius.control': px(10) } }).components.button.radius, 10);
});

Deno.test('A missing component path is a TokenError naming the path and the file', () => {

});

Deno.test('Component tokens come from Base and retune through the palette', () => {
  const inputs = build({
    base: { 'color.divider': color('#333333'), 'component.header.height': px(80) },
    light: { 'color.divider': undefined },
  });

  // Base is where component dimensions live, so Base is what retunes them.
  assert.equal(inputs.components.header.height, 80);
  // A colour token is a path, so the mode's own divider is what the header's rule renders as.
  assert.equal(inputs.components.header.borderColor, 'divider');
  assert.equal(inputs.palettes.light.divider, '#333333');
});

Deno.test('A missing required path is a TokenError naming the path and the file', () => {
  throwsTokenError(() => build({ dark: { 'color.divider': undefined } }), 'color.divider', 'Atlas.Dark.tokens.json');
  throwsTokenError(() => build({ base: { 'radius.surface': undefined } }), 'radius.surface', 'Atlas.Base.tokens.json');
  throwsTokenError(() => build({ base: { 'layout.contentGap': undefined } }), 'layout.contentGap', 'Atlas.Base.tokens.json');
  // With no Base file at all there is no collection prefix to name, so the message says the shape.
  throwsTokenError(
    () => transform(parseDtcgFiles([paletteFile('Atlas', 'Light'), paletteFile('Atlas', 'Dark'), paletteFile('Atlas', 'Contrast')])),
    'Base.tokens.json',
  );
});

Deno.test('A mode missing a palette colour is a TokenError naming the file', () => {
  throwsTokenError(() => build({ light: { 'color.primary.main': undefined } }), 'color.primary.main', 'Atlas.Light.tokens.json');
});

Deno.test('Every mode the theme reads must have a palette file', () => {
  const files = [paletteFile('Atlas', 'Light'), paletteFile('Atlas', 'Contrast'), baseFile()];

  throwsTokenError(() => transform(parseDtcgFiles(files)), 'dark');
});

Deno.test('A missing Base file is a TokenError, since it carries what every mode shares', () => {
  const modes = [paletteFile('Atlas', 'Light'), paletteFile('Atlas', 'Dark'), paletteFile('Atlas', 'Contrast')];

  throwsTokenError(() => transform(parseDtcgFiles(modes)), 'Base.tokens.json');
});

Deno.test('Base carries the shape tokens, and they are read once for the whole theme', () => {
  const inputs = build();

  assert.deepEqual(inputs.space, { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 });
  assert.deepEqual(inputs.layout, { contentPadding: 24, contentGap: 24 });
  assert.equal(inputs.components.header.height, 64);
});

Deno.test('Every exported mode is held to the contract, even one the theme does not read', () => {
  const sepia = paletteFile('Atlas', 'Sepia', { 'focus.color': undefined });
  const files = [paletteFile('Atlas', 'Light'), paletteFile('Atlas', 'Dark'), paletteFile('Atlas', 'Contrast'), baseFile()];

  throwsTokenError(() => transform(parseDtcgFiles([...files, sepia])), 'focus.color', 'Atlas.Sepia.tokens.json');
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
    assert.equal(atlas({ light: { 'color.divider': color(raw) } }).light.divider, expected, JSON.stringify(raw));
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

  assert.equal('buttonContained' in atlas().contrast, false);
  assert.deepEqual(atlas({ contrast: contained }).contrast.buttonContained, {
    background: '#FFFFFF', text: '#000000', hoverBackground: '#000000', hoverText: '#FFFFFF',
  });
  throwsTokenError(
    () => build({ contrast: { ...contained, 'button.contained.hoverText': undefined } }),
    'button.contained', 'hoverText', 'Atlas.Contrast.tokens.json',
  );
});

function evaluate(source: string): ThemeInputs {
  const literal = source.slice(source.indexOf('= {') + 2, source.indexOf('\n};') + 2);
  return new Function(`return ${literal}`)() as ThemeInputs;
}

Deno.test('emit is deterministic, orders keys as the manifest does, and round-trips', () => {
  const source = emit(themeInputs);
  const { palettes, typography, radius, opacity, font, space, layout, components } = themeInputs;
  const scrambled: ThemeInputs = {
    components,
    layout,
    space,
    typography,
    opacity,
    radius,
    font,
    palettes: { contrast: palettes.contrast, dark: palettes.dark, light: palettes.light },
  };

  assert.ok(source.startsWith('// generated — do not edit'));
  assert.equal(emit(themeInputs), source);
  assert.equal(emit(scrambled), source);
  assert.deepEqual(evaluate(source), themeInputs);
  assert.deepEqual(evaluate(emit(build())), build());
});


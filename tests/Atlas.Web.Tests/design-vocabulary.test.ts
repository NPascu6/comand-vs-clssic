import assert from 'node:assert/strict';
import {
  AA_TEXT,
  applyOverrides,
  checkContrast,
  composite,
  contrastRatio,
  emitCSharp,
  emitCss,
  emitJson,
  SERIES_LENGTH,
  themeInputs,
} from '@atlas/design-tokens';
import type { ThemeMode } from '@atlas/design-tokens';
import type { AssetClass, CoInvestmentStatus, DealStatus, FundStatus, Region } from '@atlas/contracts';

// The domain vocabulary: colours named after what the domain calls them. One state is one colour
// in the app, in an export and in a server-rendered document — so what is worth testing is that
// every state has one in every mode, and that it tracks the palette it aliases.

const MODES: readonly ThemeMode[] = ['light', 'dark', 'contrast'];

const COLOUR = /^(#[0-9A-F]{6}|rgba\(.+\))$/;

/**
 * Compile-time, and the reason the layer earns its keep: these stop compiling the moment
 * `@atlas/contracts` gains a status, an asset class or a region nobody has given a colour.
 */
const light = themeInputs.palettes.light.semantic;
const _fundStatusesHaveColours: Record<Uncapitalize<FundStatus>, string> = light.status.fund;
const _dealStatusesHaveColours: Record<Uncapitalize<DealStatus>, string> = light.status.deal;
const _nodeStatusesHaveColours: Record<Uncapitalize<CoInvestmentStatus>, string> = light.status.coInvestment;
const _assetClassesHaveColours: Record<Uncapitalize<AssetClass>, string> = light.assetClass;
const _regionsHaveColours: Record<Uncapitalize<Region>, string> = light.region;

Deno.test('Every domain state has a colour, in every mode', () => {
  for (const mode of MODES) {
    const { status, performance, exposure, assetClass, region, series } = themeInputs.palettes[mode].semantic;
    const every = [
      ...Object.values(status.fund), ...Object.values(status.deal), ...Object.values(status.coInvestment),
      ...Object.values(performance), ...Object.values(exposure),
      ...Object.values(assetClass), ...Object.values(region), ...series,
    ];

    assert.equal(series.length, SERIES_LENGTH, mode);
    assert.equal(every.length, 34, mode);
    for (const value of every) assert.match(value, COLOUR, mode);
  }
  void [_fundStatusesHaveColours, _dealStatusesHaveColours, _nodeStatusesHaveColours, _assetClassesHaveColours, _regionsHaveColours];
});

Deno.test('The vocabulary is the palette it aliases, resolved per mode', () => {
  for (const mode of MODES) {
    const palette = themeInputs.palettes[mode];

    assert.equal(palette.semantic.status.deal.investable, palette.success.main, `${mode} investable`);
    assert.equal(palette.semantic.status.deal.withdrawn, palette.error.main, `${mode} withdrawn`);
    assert.equal(palette.semantic.performance.positive, palette.success.main, `${mode} positive`);
    assert.equal(palette.semantic.performance.flat, palette.text.secondary, `${mode} flat`);
    assert.equal(palette.semantic.exposure.breach, palette.error.main, `${mode} breach`);
    assert.equal(palette.semantic.assetClass.privateEquity, palette.semantic.series[0], `${mode} PE`);
  }

  // Each mode carries its own, so the vocabulary is not one set of colours reused across modes.
  const { light: lightMode, dark } = themeInputs.palettes;
  assert.notEqual(lightMode.semantic.status.deal.investable, dark.semantic.status.deal.investable);
  assert.notDeepEqual(lightMode.semantic.series, dark.semantic.series);
  assert.equal(new Set(lightMode.semantic.series).size, SERIES_LENGTH, 'the eight series colours are distinct');
});

// ── Overrides: what a client application re-skins with, instead of CSS ───────────────────

Deno.test('An override reaches the palette, the vocabulary that aliases it, and the component tokens', () => {
  const skinned = applyOverrides(themeInputs, {
    palettes: { light: { primary: { main: '#7A4E24' } } },
    components: { button: { radius: 4 } },
  });

  assert.equal(skinned.palettes.light.primary.main, '#7A4E24');
  assert.equal(skinned.components.button.radius, 4);
  // Untouched values are the shipped ones, and the shipped tokens are not mutated.
  assert.equal(skinned.palettes.light.success.main, themeInputs.palettes.light.success.main);
  assert.equal(skinned.palettes.dark.primary.main, themeInputs.palettes.dark.primary.main);
  assert.notEqual(themeInputs.palettes.light.primary.main, '#7A4E24');
});

Deno.test('An override replaces an ordered list whole rather than merging it by index', () => {
  const series = ['#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888'];
  const skinned = applyOverrides(themeInputs, { palettes: { light: { semantic: { series } } } });

  assert.deepEqual(skinned.palettes.light.semantic.series, series);
  assert.equal(applyOverrides(themeInputs, undefined), themeInputs);
});

// ── One export, three targets beside the theme inputs ───────────────────────────────────

const PACKAGE = new URL('../../web/packages/design-tokens/', import.meta.url);
const REPO = new URL('../../', import.meta.url);

Deno.test('The CSS, JSON and .NET targets carry the same values as the theme inputs', async () => {
  const committed = JSON.parse(await Deno.readTextFile(new URL('generated/tokens.json', PACKAGE)));
  const css = emitCss(themeInputs);
  const csharp = emitCSharp(themeInputs, committed.version);
  const investable = themeInputs.palettes.dark.semantic.status.deal.investable;

  assert.deepEqual(emitJson(themeInputs, committed.version), committed);
  assert.equal(committed.tokens.dark['semantic.status.deal.investable'], investable);
  assert.ok(css.includes('[data-theme="dark"] {'));
  assert.ok(css.includes(`--atlas-semantic-status-deal-investable: ${investable};`));
  assert.ok(csharp.includes('["dark"] = new Dictionary<string, string>'));
  assert.ok(csharp.includes(`["semantic.status.deal.investable"] = "${investable}"`));
  // Light also answers a bare :root, so a page that sets nothing still paints.
  assert.ok(css.includes('[data-theme="light"],\n:root {'));
});

Deno.test('A component token reaches the other targets resolved, since they have no theme at render time', () => {
  const bundle = emitJson(themeInputs, '0.0.0');

  for (const mode of MODES) {
    assert.equal(bundle.tokens[mode]['component.header.borderColor'], themeInputs.palettes[mode].divider, mode);
  }
  assert.notEqual(bundle.tokens.light['component.header.borderColor'], bundle.tokens.dark['component.header.borderColor']);
});

Deno.test('Every generated target matches the committed one', async () => {
  const committed = JSON.parse(await Deno.readTextFile(new URL('generated/tokens.json', PACKAGE)));

  assert.equal(emitCss(themeInputs), await Deno.readTextFile(new URL('generated/tokens.css', PACKAGE)));
  assert.equal(
    emitCSharp(themeInputs, committed.version),
    await Deno.readTextFile(new URL('src/Atlas.DesignTokens/Tokens.g.cs', REPO)),
  );
});

// ── Contrast, defined once and read by both gates ───────────────────────────────────────

Deno.test('checkContrast measures the pairs the theme promises and grades them', () => {
  const readable = themeInputs.palettes.light;
  const unreadable = { ...readable, text: { ...readable.text, primary: '#9AA3AF' } };

  const findings = checkContrast(unreadable);
  assert.deepEqual(findings.filter((finding) => finding.severity === 'error').map((finding) => finding.id), [
    'text.primary on background.default',
    'text.primary on background.paper',
  ]);
  for (const finding of findings) assert.ok(finding.ratio < finding.minimum, finding.id);
});

Deno.test('Contrast is the WCAG ratio, and translucency is left to a human', () => {
  assert.equal(contrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(contrastRatio('#FFFFFF', '#FFFFFF'), 1);
  assert.equal(contrastRatio('rgba(255,255,255,0.12)', '#FFFFFF'), undefined);
  assert.equal(AA_TEXT, 4.5);
});

Deno.test('composite gives the effective background of a translucent surface', () => {
  assert.equal(composite('#000000', 0.5, '#FFFFFF'), '#808080');
  assert.equal(composite('#1FA97A', 0.12, '#FFFFFF'), '#E4F5EF');
  assert.equal(composite('#FFFFFF', 0, '#123456'), '#123456');
  assert.equal(composite('rgba(0,0,0,0.5)', 0.5, '#FFFFFF'), undefined);
});

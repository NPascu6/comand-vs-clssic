// What a reviewer reads: the pull request body, and a standalone page that shows every scheme
// before and after. Both are pure functions of a release — the CLI writes them out, the
// pipelines attach them.

import { THEME_MODES } from '@atlas/design-tokens/toolkit';
import type { PaletteInputs, ThemeInputs, ThemeMode } from '@atlas/design-tokens/toolkit';
import { bumpReason } from './diff.ts';
import type { TokenChange } from './diff.ts';
import type { Release } from './ledger.ts';

/** What a token paints, so a reviewer knows where to look without reading the theme. */
const IMPACT: readonly (readonly [string, string])[] = [
  ['color.primary', 'buttons, links, the app bar and every selected state'],
  ['color.secondary', 'secondary buttons and the info palette'],
  ['color.success', 'positive status chips, alerts and KPI deltas'],
  ['color.warning', 'warning chips and alerts'],
  ['color.error', 'error chips, alerts and field validation'],
  ['color.info', 'informational chips and alerts'],
  ['color.text', 'body and secondary copy everywhere'],
  ['color.divider', 'card, grid and input outlines'],
  ['color.background', 'the page and card surfaces'],
  ['border', 'the outline of cards, grids, inputs and chips'],
  ['focus', 'the keyboard focus ring'],
  ['button.contained', 'contained buttons in contrast mode'],
  ['radius', 'corner rounding of buttons, inputs, cards and the data grid'],
  ['font', 'every typeface in the app'],
  ['typography', 'button, chip, overline and table-header type'],
  ['palette.mode', 'whether MUI treats the mode as light or dark'],
  ['space', 'the spacing scale every layout is built from'],
  ['layout', 'page padding and the gap between sections'],
  ['component', 'that component, in every scheme — it is a component token, so nothing else moves'],
  ['status.fund', 'the fund status chip — in the app, in an export and in a server-rendered factsheet'],
  ['status.deal', 'the deal status chip, everywhere a deal is listed'],
  ['status.coInvestment', 'the co-investment status chip and the node tree'],
  ['performance', 'every number that moves: KPI deltas, return columns, sparklines'],
  ['exposure', 'appetite headroom — the bar, the warning band and the breach state'],
  ['assetClass', 'that bucket in every chart, legend and export, on the server as well as the client'],
  ['region', 'that region in every chart, legend and export'],
  ['series', 'categorical chart colours, taken in order where no domain colour applies'],
];

export const impactOf = (path: string): string =>
  IMPACT.find(([prefix]) => path === prefix || path.startsWith(`${prefix}.`))?.[1] ?? 'the theme';

export interface PullRequest {
  title: string;
  body: string;
  /** `figma/tokens-1.1.0`; the branch the sync pushes. */
  branch: string;
}

export function pullRequest(release: Release, fileUrl: string): PullRequest {
  return {
    title: `design tokens ${release.version} — ${summary(release.changes)}`,
    branch: `figma/tokens-${release.version}`,
    body: body(release, fileUrl),
  };
}

function summary(changes: TokenChange[]): string {
  const modes = [...new Set(changes.map((change) => change.mode))];
  const count = `${changes.length} token${changes.length === 1 ? '' : 's'}`;
  return `${count} in ${modes.join(', ')}`;
}

function body(release: Release, fileUrl: string): string {
  const { author, figma, changes } = release;
  const who = author.figmaHandle ? `**${author.name}** (@${author.figmaHandle})` : `**${author.name}**`;
  const paths = [...new Set(changes.map((change) => change.path))];

  return [
    `${who} changed ${summary(changes)} in Figma. \`@atlas/design-tokens\` goes to ` +
      `**${release.version}** (${release.bump}: ${bumpReason(changes)}).`,
    '',
    '| | |',
    '| --- | --- |',
    `| Figma file | [${figma.fileName ?? figma.fileKey}](${fileUrl}) |`,
    `| Figma version | ${figma.versionId ? `\`${figma.versionId}\`` : '—'}${figma.label ? ` — ${figma.label}` : ''} |`,
    `| Exported | ${release.releasedAt} |`,
    `| Export digest | \`${release.digest}\` |`,
    '',
    '## What changed',
    ...changeSections(changes),
    '## Where it shows up',
    '',
    ...paths.map((path) => `- \`${path}\` — ${impactOf(path)}`),
    '',
    '## What this pull request touches',
    '',
    '- `web/packages/design-tokens/figma/*.tokens.json` — the export, written by the sync',
    `- \`web/packages/design-tokens/figma/tokens.lock.json\` — release ${release.version}, its digest and its author`,
    '- `web/packages/design-tokens/src/generated/theme-inputs.ts` — what `createAtlasTheme` reads',
    '- `web/packages/design-tokens/generated/tokens.css` — the custom properties any non-React consumer reads',
    '- `web/packages/design-tokens/generated/tokens.json` — the platform-neutral bundle the API serves',
    '- `src/Atlas.DesignTokens/DesignTokens.g.cs` — what the API paints exports and factsheets with',
    '',
    'Nothing else changes: every component, story, slice, export and server-rendered artefact',
    'restyles from these four outputs of the same export.',
    '',
    '## How this got here',
    '',
    `Every rule below had to approve before the branch existed (\`${release.trace.correlationId}\`, ` +
      `${release.trace.passed}/${release.trace.entries.length} passed).`,
    '',
    '| Rule | Checks | Outcome |',
    '| --- | --- | --- |',
    ...release.trace.entries.map((entry) => `| \`${entry.rule}\` | ${entry.description} | ${entry.outcome} |`),
    '',
    'The same trace is kept in `tokens.lock.json` beside the release, so the record survives the pull request.',
    '',
    ...advisories(release),
    '## Review',
    '',
    '- [ ] the swatches in the `token-preview` artefact are what the design intended',
    '- [ ] contrast mode still meets WCAG AA',
    '- [ ] the Storybook *Theme / Tokens* story looks right',
    '',
  ].join('\n');
}

/** A rule can flag without blocking; the reviewer, not the pipeline, decides what to do about it. */
function advisories(release: Release): string[] {
  const flagged = release.trace.entries.flatMap((entry) =>
    entry.messages.filter((message) => message.includes('(warning)')).map((message) => `- ${entry.rule}: ${message}`)
  );
  return flagged.length === 0 ? [] : ['### Flagged, not blocked', '', ...flagged, ''];
}

function changeSections(changes: TokenChange[]): string[] {
  const lines: string[] = [];
  for (const mode of new Set(changes.map((change) => change.mode))) {
    lines.push('', `### ${mode}`, '', '| Token | Before | After | |', '| --- | --- | --- | --- |');
    for (const change of changes.filter((change) => change.mode === mode)) {
      lines.push(`| \`${change.path}\` | ${cell(change.before)} | ${cell(change.after)} | ${label(change)} |`);
    }
  }
  lines.push('');
  return lines;
}

/** GitHub and Azure DevOps both render a colour chip beside a hex in backticks. */
const cell = (value: string | undefined): string => (value === undefined ? '—' : `\`${value}\``);

const label = (change: TokenChange): string =>
  change.retypedFrom ? `retyped from ${change.retypedFrom}` : change.kind;

const SWATCHES: readonly (readonly [string, (palette: PaletteInputs) => string])[] = [
  ['primary.main', (palette) => palette.primary.main],
  ['primary.light', (palette) => palette.primary.light],
  ['secondary.main', (palette) => palette.secondary.main],
  ['success.main', (palette) => palette.success.main],
  ['warning.main', (palette) => palette.warning.main],
  ['error.main', (palette) => palette.error.main],
  ['text.primary', (palette) => palette.text.primary],
  ['text.secondary', (palette) => palette.text.secondary],
  ['divider', (palette) => palette.divider],
  ['background.default', (palette) => palette.background.default],
  ['background.paper', (palette) => palette.background.paper],
];

/** A standalone page — no assets, no script — that the pipelines publish next to the pull request. */
export function previewHtml(before: ThemeInputs, after: ThemeInputs, release: Release): string {
  return [
    '<!doctype html>',
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>Atlas design tokens ${release.version}</title>`,
    `<style>${STYLE}</style>`,
    '</head><body>',
    `<h1>Atlas design tokens <code>${release.version}</code></h1>`,
    `<p class="by">${escape(release.author.name)}` +
      `${release.author.figmaHandle ? ` (@${escape(release.author.figmaHandle)})` : ''}` +
      ` · ${escape(release.releasedAt)} · ${release.changes.length} token(s) changed</p>`,
    ...THEME_MODES.map((mode) => modeCard(mode, before.palettes[mode], after.palettes[mode], after)),
    '</body></html>',
  ].join('\n');
}

function modeCard(mode: ThemeMode, before: PaletteInputs, after: PaletteInputs, inputs: ThemeInputs): string {
  const rows = SWATCHES.map(([path, read]) => {
    const was = read(before);
    const now = read(after);
    return `<tr class="${was === now ? '' : 'diff'}"><th>${path}</th>${chip(was)}${chip(now)}</tr>`;
  }).join('');

  return `<section><h2>${mode}</h2><div class="split">` +
    `<table><thead><tr><th></th><th>before</th><th>after</th></tr></thead><tbody>${rows}</tbody></table>` +
    mockup(after, inputs) +
    semanticStrip(after) +
    '</div></section>';
}

const chip = (value: string): string =>
  `<td><span class="sw" style="background:${escape(value)}"></span><code>${escape(value)}</code></td>`;

/** The domain vocabulary, which is what a chart, an export and a factsheet actually read. */
function semanticStrip(palette: PaletteInputs): string {
  const { status, performance, exposure, assetClass, region, series } = palette.semantic;
  const group = (title: string, entries: [string, string][]) =>
    `<div class="group"><p class="label">${title}</p>${entries.map(([name, value]) =>
      `<span class="tag"><span class="sw" style="background:${escape(value)}"></span>${escape(name)}</span>`
    ).join('')}</div>`;

  return '<div class="semantic">' +
    group('deal status', Object.entries(status.deal)) +
    group('fund status', Object.entries(status.fund)) +
    group('performance', Object.entries(performance)) +
    group('exposure', Object.entries(exposure)) +
    group('asset class', Object.entries(assetClass)) +
    group('region', Object.entries(region)) +
    group('series', series.map((value, index) => [String(index + 1), value] as [string, string])) +
    '</div>';
}

/** The same surfaces the theme paints — a card, a button, a chip — so the change is visible, not just listed. */
function mockup(palette: PaletteInputs, inputs: ThemeInputs): string {
  const surface = `background:${palette.background.default};color:${palette.text.primary};` +
    `font-family:${escape(inputs.font.sans)}`;
  const card = `background:${palette.background.paper};border:${palette.border.width}px solid ${palette.border.color};` +
    `border-radius:${inputs.radius.surface}px`;
  const button = `background:${palette.primary.main};color:${palette.primary.contrastText};` +
    `border-radius:${inputs.radius.control}px;font-weight:${inputs.typography.button.weight}`;
  const chipStyle = `background:${palette.semantic.performance.positive};color:${palette.background.paper};` +
    `border-radius:${inputs.radius.control}px;font-weight:${inputs.typography.button.weight}`;
  const investable = `background:${palette.semantic.status.deal.investable};color:${palette.background.paper};` +
    `border-radius:${inputs.radius.control}px;font-weight:${inputs.typography.button.weight}`;
  return `<div class="mockup" style="${surface}"><div class="card" style="${card}">` +
    `<p class="overline" style="color:${palette.text.secondary}">Fund exposure</p>` +
    '<p class="figure">EUR 412.8m</p>' +
    `<span class="chip" style="${chipStyle}">+2.4%</span>` +
    `<span class="chip" style="${investable}">Investable</span>` +
    `<button style="${button}">Commit capital</button>` +
    `<hr style="border:0;border-top:${palette.border.width}px solid ${palette.divider}">` +
    `<p class="muted" style="color:${palette.text.secondary}">Last valuation 31 Aug</p>` +
    '</div></div>';
}

const STYLE = [
  'body{font:14px/1.5 ui-sans-serif,system-ui,sans-serif;margin:2rem;color:#16223A;background:#F6F8FB}',
  'h1{font-size:1.3rem;margin:0 0 .25rem}',
  'h2{font-size:1.05rem;margin:2rem 0 .5rem;border-bottom:1px solid #E3E9F2;padding-bottom:.35rem}',
  'h3{font-size:.8rem;text-transform:uppercase;letter-spacing:.08em;color:#6B7A95;margin:1.25rem 0 .5rem}',
  '.by,.quiet{color:#6B7A95}.by{margin:0 0 2rem}.quiet{font-weight:400;font-size:.85rem}',
  '.split{display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap}',
  'table{border-collapse:collapse;font-size:12px;background:#fff;border:1px solid #E3E9F2;border-radius:8px}',
  'th,td{text-align:left;padding:.3rem .6rem;border-bottom:1px solid #E3E9F2;white-space:nowrap}',
  'tbody th{font-weight:500;color:#6B7A95}',
  'tr.diff td:last-child code{font-weight:700}tr.diff{background:#FFF8E6}tr.flagged th::after{content:" ●";color:#E0A33B}',
  '.sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid rgba(0,0,0,.2);',
  'margin-right:.4rem;vertical-align:-2px}',
  '.mockup{padding:1.25rem;border-radius:10px;min-width:260px}',
  '.card{padding:1rem}.overline{font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin:0}',
  '.figure{font-size:1.6rem;margin:.15rem 0 .6rem}',
  '.chip{display:inline-block;padding:.15rem .5rem;font-size:11px;margin-right:.5rem}',
  'button{border:0;padding:.45rem .9rem;font-size:13px;cursor:pointer;margin-top:.5rem}',
  '.muted{font-size:12px;margin:.6rem 0 0}',
  '.semantic{font-size:11px;max-width:280px}.group{margin-bottom:.5rem}',
  '.label{margin:0 0 .15rem;color:#6B7A95;text-transform:uppercase;letter-spacing:.06em;font-size:10px}',
  '.tag{display:inline-block;margin:0 .5rem .15rem 0;white-space:nowrap}',
].join('');

const escape = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

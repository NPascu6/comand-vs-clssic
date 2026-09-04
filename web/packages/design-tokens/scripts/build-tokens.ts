// One transform, four targets: the MUI theme inputs, the CSS custom properties, the
// platform-neutral JSON bundle, and the .NET package the API paints with. Every consumer gets
// the same values from the same export, so none of them can drift.
//
// Paths are resolved from this script, so it runs from any directory.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { parseDtcgFiles, TokenError } from '../src/parse/dtcg.ts';
import type { DtcgFile } from '../src/parse/dtcg.ts';
import { transform } from '../src/build/theme.ts';
import { emit } from '../src/emit/typescript.ts';
import { emitCss } from '../src/emit/css.ts';
import { emitJson } from '../src/emit/json.ts';
import { emitCSharp } from '../src/emit/csharp.ts';

const PACKAGE = new URL('../', import.meta.url);
const REPO = new URL('../../../', PACKAGE);
const FIGMA_DIR = new URL('figma/', PACKAGE);
const GENERATED = new URL('generated/', PACKAGE);

interface Target {
  name: string;
  url: URL;
  text: string;
}

function readJson(name: string, url: URL): unknown {
  try {
    return JSON.parse(readFileSync(url, 'utf8'));
  } catch (error) {
    throw new TokenError(`${name}: not valid JSON (${error instanceof Error ? error.message : String(error)})`);
  }
}

function readExport(): DtcgFile[] {
  const names = readdirSync(FIGMA_DIR).filter((name) => name.endsWith('.tokens.json')).sort();
  if (names.length === 0) throw new TokenError('figma/: no *.tokens.json files');
  return names.map((name) => ({ name, json: readJson(name, new URL(name, FIGMA_DIR)) as DtcgFile['json'] }));
}

/** The version the ledger records, so every target is stamped with the release it came from. */
function version(): string {
  const lock = new URL('tokens.lock.json', FIGMA_DIR);
  return existsSync(lock) ? (readJson('tokens.lock.json', lock) as { version?: string }).version ?? '0.0.0' : '0.0.0';
}

function targets(): Target[] {
  const inputs = transform(parseDtcgFiles(readExport()));
  const released = version();
  return [
    { name: 'src/generated/theme-inputs.ts', url: new URL('src/generated/theme-inputs.ts', PACKAGE), text: emit(inputs) },
    { name: 'generated/tokens.css', url: new URL('tokens.css', GENERATED), text: emitCss(inputs) },
    {
      name: 'generated/tokens.json',
      url: new URL('tokens.json', GENERATED),
      text: `${JSON.stringify(emitJson(inputs, released), null, 2)}\n`,
    },
    {
      name: 'src/Atlas.DesignTokens/Tokens.g.cs',
      url: new URL('src/Atlas.DesignTokens/Tokens.g.cs', REPO),
      text: emitCSharp(inputs, released),
    },
  ];
}

function main(): number {
  const check = process.argv.includes('--check');
  const built = targets();

  if (!check) {
    mkdirSync(GENERATED, { recursive: true });
    for (const target of built) {
      writeFileSync(target.url, target.text);
      console.log(`wrote ${target.name}`);
    }
    return 0;
  }

  const stale = built.filter((target) => (existsSync(target.url) ? readFileSync(target.url, 'utf8') : '') !== target.text);
  if (stale.length > 0) {
    const names = stale.map((target) => target.name).join(', ');
    console.error(`stale: ${names} — run \`pnpm --filter @atlas/design-tokens build\` and commit the result`);
    return 1;
  }
  console.log(`${built.length} generated files are up to date`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof TokenError)) throw error;
  console.error(`design tokens: ${error.message}`);
  process.exitCode = 1;
}

// Paths are resolved from this script, so it runs from any directory.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { parseDtcgFiles, TokenError } from '../src/dtcg.ts';
import type { DtcgFile } from '../src/dtcg.ts';
import { transform } from '../src/transform.ts';
import { emit } from '../src/emit.ts';

const FIGMA_DIR = new URL('../figma/', import.meta.url);
const OUTPUT = new URL('../src/generated/theme-inputs.ts', import.meta.url);
const OUTPUT_NAME = 'src/generated/theme-inputs.ts';

function readExport(): DtcgFile[] {
  const names = readdirSync(FIGMA_DIR).filter((name) => name.endsWith('.tokens.json')).sort();
  if (names.length === 0) throw new TokenError('figma/: no *.tokens.json files');
  return names.map((name) => {
    try {
      return { name, json: JSON.parse(readFileSync(new URL(name, FIGMA_DIR), 'utf8')) };
    } catch (error) {
      throw new TokenError(`${name}: not valid JSON (${error instanceof Error ? error.message : String(error)})`);
    }
  });
}

function main(): number {
  const check = process.argv.includes('--check');
  const source = emit(transform(parseDtcgFiles(readExport())));
  if (!check) {
    writeFileSync(OUTPUT, source);
    console.log(`wrote ${OUTPUT_NAME}`);
    return 0;
  }
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
  if (current !== source) {
    console.error(`${OUTPUT_NAME} is stale: run \`pnpm --filter @atlas/design-tokens build\` and commit the result`);
    return 1;
  }
  console.log(`${OUTPUT_NAME} is up to date`);
  return 0;
}

try {
  process.exitCode = main();
} catch (error) {
  if (!(error instanceof TokenError)) throw error;
  console.error(`design tokens: ${error.message}`);
  process.exitCode = 1;
}

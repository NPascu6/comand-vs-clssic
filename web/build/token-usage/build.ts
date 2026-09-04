// Which tokens a package's components read, generated from its own sources.
//
//   node ../../build/token-usage/build.ts            # rewrite src/generated/token-usage.ts
//   node ../../build/token-usage/build.ts --check    # exit 1 if it is stale
//
// The package to scan is the working directory, so each one that draws with tokens runs it.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import { buildTokenUsage, isScannedSource } from './scan.ts';
import { attributionOf, importGraphOf } from './importGraph.ts';
import { publicModulesOf, terminalModulesOf } from './publicModules.ts';
import type { SourceFile, TokenUsage } from './scan.ts';
import { emitTokenUsage } from './emit.ts';
import { cssTokenUsage } from './cssUsage.ts';
import { tsTokenUsage } from './tsUsage.ts';

const PACKAGE_DIR = new URL(`file://${process.cwd()}/`);
const SOURCE_DIR = new URL('src/', PACKAGE_DIR);
const OUTPUT_DIR = new URL('src/generated/', PACKAGE_DIR);
const OUTPUT = new URL('token-usage.ts', OUTPUT_DIR);
const OUTPUT_NAME = 'src/generated/token-usage.ts';

/** The stylesheet is scanned too: most of what a component spends is a `var()` in it now. */
function readStyles(): SourceFile[] {
  return readdirSync(SOURCE_DIR, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter((path) => path.endsWith('.css'))
    .sort()
    .map((path) => ({ path, source: readFileSync(new URL(path, SOURCE_DIR), 'utf8') }));
}

function readSources(): SourceFile[] {
  return readdirSync(SOURCE_DIR, { recursive: true, encoding: 'utf8' })
    .map((entry) => entry.replaceAll('\\', '/'))
    .filter(isScannedSource)
    .sort()
    .map((path) => ({ path, source: readFileSync(new URL(path, SOURCE_DIR), 'utf8') }));
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

function main(): number {
  const check = process.argv.includes('--check');
  const files = readSources();
  const terminals = terminalModulesOf(publicModulesOf(readFileSync(new URL('index.ts', SOURCE_DIR), 'utf8')));
  const attribute = attributionOf(importGraphOf(files), terminals);
  const source = emitTokenUsage(mergeUsage(buildTokenUsage(files, attribute), cssTokenUsage(readStyles()), tsTokenUsage(files)));
  if (!check) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
    writeFileSync(OUTPUT, source);
    console.log(`wrote ${OUTPUT_NAME}`);
    return 0;
  }
  const current = existsSync(OUTPUT) ? readFileSync(OUTPUT, 'utf8') : '';
  if (current !== source) {
    console.error(`${OUTPUT_NAME} is stale: run \`pnpm tokens:usage\` in this package and commit the result`);
    return 1;
  }
  console.log(`${OUTPUT_NAME} is up to date`);
  return 0;
}

process.exitCode = main();

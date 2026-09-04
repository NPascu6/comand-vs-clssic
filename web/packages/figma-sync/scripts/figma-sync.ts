// The imperative shell. It reads (Figma or a recorded payload, the committed export, the
// ledger), hands one command to the handler, and writes what comes back. Every decision —
// whether the change may ship, what version it gets, what the reviewer reads — is a pure
// function in ../src.
//
//   node scripts/figma-sync.ts --fixture brand-refresh --author-handle mara.ilic
//   node scripts/figma-sync.ts --export exports/studio --author-handle mara.ilic   # DTCG files from a plugin or the token studio
//   node scripts/figma-sync.ts --check          # the committed export still matches its ledger entry
//
// Paths are resolved from this script, so it runs from any directory.

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import process from 'node:process';
import type { DtcgFile } from '@atlas/design-tokens/toolkit';
import { syncTokensCommand } from '../src/command/command.ts';
import type { SyncSource } from '../src/command/command.ts';
import { diffTokens } from '../src/release/diff.ts';
import { formatDtcg } from '../src/release/format.ts';
import { syncDesignTokens } from '../src/command/handler.ts';
import { parseLedger, tokenDigest, verify } from '../src/release/ledger.ts';
import type { FigmaOrigin, TokenAuthor, TokenLedger } from '../src/release/ledger.ts';
import type { FigmaVariablesResponse } from '../src/figma/variables.ts';

const FIGMA_DIR = new URL('../../design-tokens/figma/', import.meta.url);
const LEDGER = new URL('tokens.lock.json', FIGMA_DIR);
const AUTHORS = new URL('authors.json', FIGMA_DIR);
const FIXTURES = new URL('../fixtures/', import.meta.url);

const argv = process.argv.slice(2);
const flag = (name: string): boolean => argv.includes(`--${name}`);
const option = (name: string): string | undefined => {
  const index = argv.indexOf(`--${name}`);
  return index === -1 ? undefined : argv[index + 1];
};

const readJson = (path: URL): unknown => JSON.parse(readFileSync(path, 'utf8'));

function readExport(): DtcgFile[] {
  return readdirSync(FIGMA_DIR)
    .filter((name) => name.endsWith('.tokens.json'))
    .sort()
    .map((name) => ({ name, json: readJson(new URL(name, FIGMA_DIR)) as DtcgFile['json'] }));
}

const readLedger = (): TokenLedger =>
  existsSync(LEDGER) ? parseLedger(readJson(LEDGER)) : { version: '0.0.0', digest: '', updatedAt: '', releases: [] };

interface FigmaVersion {
  id: string;
  label?: string;
  user?: { handle?: string };
}

async function figmaGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`https://api.figma.com${path}`, { headers: { 'X-Figma-Token': token } });
  if (!response.ok) throw new Error(`figma ${path}: ${response.status} ${response.statusText}`);
  return await response.json() as T;
}

interface Source {
  source: SyncSource;
  figma: FigmaOrigin;
  author: TokenAuthor;
}

/** A directory of `<Collection>.<Mode>.tokens.json` — what a Figma plugin exports on a plan without the REST API. */
function readDtcgDir(dir: URL): DtcgFile[] {
  if (!existsSync(dir)) throw new Error(`no export at ${dir.pathname}`);
  const files = readdirSync(dir).filter((name) => name.endsWith('.tokens.json')).sort();
  if (files.length === 0) throw new Error(`${dir.pathname}: no *.tokens.json files`);
  return files.map((name) => ({ name, json: readJson(new URL(name, dir)) as DtcgFile['json'] }));
}

/**
 * Who published the change: the caller's flags win (a webhook knows its `triggered_by`),
 * then the newest entry in Figma's version history. `figma/authors.json` turns the handle
 * into the name and address the commit is made under.
 */
function attribute(handle: string | undefined, name: string | undefined): TokenAuthor {
  const authors = existsSync(AUTHORS) ? readJson(AUTHORS) as Record<string, TokenAuthor> : {};
  const mapped = handle ? authors[handle] : undefined;
  return {
    name: name ?? mapped?.name ?? '',
    ...handle ? { figmaHandle: handle } : {},
    ...mapped?.email ? { email: mapped.email } : {},
  };
}

async function readSource(fileKey: string): Promise<Source> {
  const exportDir = option('export');
  if (exportDir) {
    const dir = new URL(`${exportDir.replace(/\/?$/, '/')}`, new URL('../', import.meta.url));
    return {
      source: { files: readDtcgDir(dir) },
      figma: { fileKey, fileName: option('file-name') ?? exportDir, versionId: option('version'), label: option('label') },
      author: attribute(option('author-handle'), option('author')),
    };
  }

  const fixture = option('fixture');
  if (fixture) {
    const path = new URL(`variables.${fixture}.json`, FIXTURES);
    if (!existsSync(path)) throw new Error(`no fixture 'variables.${fixture}.json' in web/packages/figma-sync/fixtures/`);
    return {
      source: { payload: readJson(path) as FigmaVariablesResponse },
      figma: { fileKey, fileName: option('file-name') ?? 'Atlas Design System', versionId: option('version'), label: option('label') },
      author: attribute(option('author-handle'), option('author')),
    };
  }

  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('set FIGMA_TOKEN, or pass --fixture <name> to run against a recorded payload');
  const [payload, history] = await Promise.all([
    figmaGet<FigmaVariablesResponse>(`/v1/files/${fileKey}/variables/local`, token),
    figmaGet<{ versions: FigmaVersion[] }>(`/v1/files/${fileKey}/versions?page_size=1`, token),
  ]);
  const version = history.versions[0];
  return {
    source: { payload },
    figma: {
      fileKey,
      fileName: option('file-name'),
      versionId: option('version') ?? version?.id,
      label: option('label') ?? version?.label,
    },
    author: attribute(option('author-handle') ?? version?.user?.handle, option('author')),
  };
}

/**
 * Only the files whose tokens actually moved. The export is machine-owned from the first write,
 * but a file nobody changed keeps whatever formatting it already had — so a colour change is a
 * one-line diff rather than a rewrite of every token file in the repo.
 */
function writeExport(files: DtcgFile[], committed: DtcgFile[], removed: string[]): number {
  for (const name of removed) rmSync(new URL(name, FIGMA_DIR));
  const before = new Map(committed.map((file) => [file.name, file]));
  let written = 0;
  for (const file of files) {
    // Compared by tokens, not by text: reordering a group is not a change, and rewriting a file
    // that did not move would put formatting churn in front of a reviewer looking for a colour.
    const previous = before.get(file.name);
    if (previous && diffTokens([previous], [file]).length === 0) continue;
    writeFileSync(new URL(file.name, FIGMA_DIR), formatDtcg(file.json));
    written += 1;
  }
  return written;
}

/** Both pipelines read `sync.json`; the rest is convenience for the CI they run on. */
function publish(out: URL, outputs: Record<string, string>): void {
  writeFileSync(new URL('sync.json', out), `${JSON.stringify(outputs, null, 2)}\n`);
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    const lines = Object.entries(outputs).map(([key, value]) => `${key}<<__EOF__\n${value}\n__EOF__`);
    writeFileSync(githubOutput, `${lines.join('\n')}\n`, { flag: 'a' });
  }
  if (process.env.TF_BUILD) {
    // Azure DevOps variables are single-line; the body is read from the artefact instead.
    for (const key of ['changed', 'version', 'bump', 'branch', 'author', 'authorEmail']) {
      if (outputs[key] !== undefined) console.log(`##vso[task.setvariable variable=${key};isOutput=true]${outputs[key]}`);
    }
  }
}

async function main(): Promise<number> {
  const committed = readExport();
  const ledger = readLedger();

  if (flag('check')) {
    const problem = verify(ledger, tokenDigest(committed));
    if (problem) {
      console.error(problem);
      return 1;
    }
    console.log(`figma/: ${committed.length} files, design tokens ${ledger.version} — the ledger matches the export`);
    return 0;
  }

  const fileKey = option('file-key') ?? process.env.FIGMA_FILE_KEY ?? 'atlas-design-system';
  const { source, figma, author } = await readSource(fileKey);
  const command = syncTokensCommand({
    source,
    committed,
    ledger,
    author,
    figma,
    at: option('at') ?? new Date().toISOString(),
  });
  const correlationId = option('correlation-id') ?? `SYNC-${Date.now().toString(36).toUpperCase()}`;
  const outcome = syncDesignTokens(command, correlationId, `https://www.figma.com/file/${fileKey}`);

  const out = new URL(`${option('out') ?? '.sync'}/`, new URL('../', import.meta.url));
  mkdirSync(out, { recursive: true });
  writeFileSync(new URL('decision-trace.json', out), `${JSON.stringify(outcome.trace, null, 2)}\n`);

  for (const entry of outcome.trace.entries) {
    console.log(`  ${entry.outcome === 'Passed' ? '✓' : '✗'} ${entry.rule.padEnd(30)} ${entry.description}`);
  }
  for (const warning of outcome.errors.filter((error) => error.severity !== 'Error')) {
    console.log(`  ! ${warning.code} ${warning.field ? `${warning.field}: ` : ''}${warning.message}`);
  }
  const blocking = outcome.errors.filter((error) => error.severity === 'Error');
  if (!outcome.approved) {
    for (const error of blocking) console.error(`  [${error.code}] ${error.field ? `${error.field}: ` : ''}${error.message}`);
    console.error(`figma sync: ${blocking.length} rule failure(s) — nothing was written`);
    return 1;
  }
  if (!outcome.plan) {
    publish(out, { changed: 'false', version: ledger.version });
    console.log(`figma/: no change — design tokens stay at ${ledger.version}`);
    return 0;
  }

  const { release, pullRequest: request } = outcome.plan;
  const written = writeExport(outcome.plan.files, committed, outcome.plan.removed);
  writeFileSync(LEDGER, `${JSON.stringify(outcome.plan.ledger, null, 2)}\n`);
  writeFileSync(new URL('pull-request.md', out), request.body);
  writeFileSync(new URL('token-preview.html', out), outcome.plan.preview);
  publish(out, {
    changed: 'true',
    version: release.version,
    bump: release.bump,
    branch: request.branch,
    title: request.title,
    author: release.author.name,
    authorEmail: release.author.email ?? '',
    body: request.body,
  });

  console.log(`design tokens ${ledger.version} → ${release.version} (${release.bump}) by ${release.author.name} — ${written} file(s) rewritten`);
  for (const change of release.changes) {
    console.log(`  ${change.mode.padEnd(9)} ${change.path.padEnd(32)} ${change.before ?? '—'} → ${change.after ?? '—'}`);
  }
  return 0;
}

try {
  process.exitCode = await main();
} catch (error) {
  console.error(`figma sync: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}

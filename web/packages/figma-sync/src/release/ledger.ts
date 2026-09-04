// `figma/tokens.lock.json`: the version the committed export carries, a digest that ties
// the version to the exact bytes, and one entry per release saying who changed what.
// Pure data in, pure data out — the CLI reads and writes the file.

import type { DecisionTrace } from '@atlas/contracts';
import { parseDtcgFiles } from '@atlas/design-tokens/toolkit';
import type { DtcgFile } from '@atlas/design-tokens/toolkit';
import { bumpFor } from './diff.ts';
import type { Bump, TokenChange } from './diff.ts';

import { sha256Hex } from '../figma/sha256.ts';

export class LedgerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LedgerError';
  }
}

/** The designer, as Figma knows them; `email` comes from `figma/authors.json` when it maps the handle. */
export interface TokenAuthor {
  name: string;
  figmaHandle?: string;
  email?: string;
}

export interface FigmaOrigin {
  fileKey: string;
  fileName?: string;
  /** The entry in Figma's version history the export was taken from. */
  versionId?: string;
  label?: string;
}

export interface Release extends DraftRelease {
  /** Every rule that approved the release, and what each took — the audit trail, kept with the change. */
  trace: DecisionTrace;
}

export interface DraftRelease {
  version: string;
  releasedAt: string;
  bump: Bump;
  /** The export's digest as of this release. */
  digest: string;
  author: TokenAuthor;
  figma: FigmaOrigin;
  changes: TokenChange[];
}

export interface TokenLedger {
  /** The version the committed export carries — the head of `releases`. */
  version: string;
  /** `sha256:…` over the committed export; CI recomputes it, so a hand edit cannot pass unrecorded. */
  digest: string;
  updatedAt: string;
  /** Newest first. */
  releases: Release[];
}

const VERSION = /^(\d+)\.(\d+)\.(\d+)$/;

export function nextVersion(version: string, bump: Bump): string {
  const match = VERSION.exec(version);
  if (!match) throw new LedgerError(`version '${version}': expected major.minor.patch`);
  const [major, minor, patch] = match.slice(1).map(Number);
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

export interface ReleaseInput {
  ledger: TokenLedger;
  changes: TokenChange[];
  digest: string;
  author: TokenAuthor;
  figma: FigmaOrigin;
  at: string;
}

/** `undefined` when the export is unchanged — the sync then has no pull request to open. */
export function draftRelease({ ledger, changes, digest, author, figma, at }: ReleaseInput): DraftRelease | undefined {
  const bump = bumpFor(changes);
  if (!bump) return undefined;
  return { version: nextVersion(ledger.version, bump), releasedAt: at, bump, digest, author, figma, changes };
}

export function record(ledger: TokenLedger, entry: Release): TokenLedger {
  return {
    version: entry.version,
    digest: entry.digest,
    updatedAt: entry.releasedAt,
    releases: [entry, ...ledger.releases],
  };
}

/** The message names what drifted; `undefined` when the ledger describes the export it sits next to. */
export function verify(ledger: TokenLedger, digest: string): string | undefined {
  const head = ledger.releases[0];
  if (head && head.version !== ledger.version) {
    return `tokens.lock.json: version ${ledger.version} but the newest release is ${head.version}`;
  }
  if (ledger.digest === digest) return undefined;
  return `tokens.lock.json: digest ${ledger.digest} does not match the export (${digest}) — ` +
    'the token files were edited without a release; run the Figma sync instead of editing them by hand';
}

/**
 * sha256 over the export's tokens, sorted: mode, path, type, value. Not over the
 * file text — a digest that moved when a key was reordered or a file reformatted would fire on
 * changes that are not changes, and the point of it is to catch an edit that never went through
 * the sync.
 */
export function tokenDigest(files: readonly DtcgFile[]): string {
  const set = parseDtcgFiles([...files]);
  const lines: string[] = [];
  for (const mode of Object.keys(set).sort()) {
    const tokens = set[mode].tokens;
    for (const path of Object.keys(tokens).sort()) {
      lines.push(`${mode}.${path}\t${tokens[path].type ?? ''}\t${JSON.stringify(tokens[path].value)}`);
    }
  }
  return `sha256:${sha256Hex(lines.join('\n'))}`;
}

export function parseLedger(json: unknown): TokenLedger {
  const ledger = json as Partial<TokenLedger>;
  if (typeof ledger?.version !== 'string' || !VERSION.test(ledger.version)) {
    throw new LedgerError('tokens.lock.json: version must be major.minor.patch');
  }
  if (typeof ledger.digest !== 'string' || !Array.isArray(ledger.releases)) {
    throw new LedgerError('tokens.lock.json: expected { version, digest, updatedAt, releases }');
  }
  return { version: ledger.version, digest: ledger.digest, updatedAt: String(ledger.updatedAt ?? ''), releases: ledger.releases };
}

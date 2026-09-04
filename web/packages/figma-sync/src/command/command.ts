// The command: everything the rules and the handler need, and nothing they have to fetch.
// Converting the payload and transforming it into a theme are each done once and shared — the
// same trick MemoizedUpstream plays for the .NET rules that read the same fund twice.

import { parseDtcgFiles, transform } from '@atlas/design-tokens/toolkit';
import type { DtcgFile, ThemeInputs } from '@atlas/design-tokens/toolkit';
import { toDtcgFiles } from '../figma/variables.ts';
import type { FigmaVariablesResponse } from '../figma/variables.ts';
import type { FigmaOrigin, TokenAuthor, TokenLedger } from '../release/ledger.ts';

/** The value, or the reason it could not be produced — one rule reports it, the others stay quiet. */
export type Attempt<T> = { ok: true; value: T } | { ok: false; reason: string };

/** Where the incoming export comes from: Figma's REST payload, or DTCG files already on disk — a plugin export, the token studio. */
export type SyncSource = { payload: FigmaVariablesResponse } | { files: DtcgFile[] };

export interface SyncTokensInput {
  source: SyncSource;
  /** The export as committed. */
  committed: DtcgFile[];
  ledger: TokenLedger;
  author: TokenAuthor;
  figma: FigmaOrigin;
  /** ISO timestamp the release is dated with; passed in so a run is reproducible. */
  at: string;
}

export interface SyncTokensCommand extends SyncTokensInput {
  /** The export the payload describes. */
  incoming: () => Attempt<DtcgFile[]>;
  /** Every scheme the export produces — what the contract rule checks and the preview draws. */
  theme: () => Attempt<ThemeInputs>;
  /** The theme on main, for the before/after preview. */
  committedTheme: () => Attempt<ThemeInputs>;
}

export function syncTokensCommand(input: SyncTokensInput): SyncTokensCommand {
  const incoming = once(() => attempt(() => ('files' in input.source ? input.source.files : toDtcgFiles(input.source.payload))));
  return {
    ...input,
    incoming,
    theme: once(() => map(incoming(), (files) => transform(parseDtcgFiles(files)))),
    committedTheme: once(() => attempt(() => transform(parseDtcgFiles(input.committed)))),
  };
}

function attempt<T>(produce: () => T): Attempt<T> {
  try {
    return { ok: true, value: produce() };
  } catch (thrown) {
    return { ok: false, reason: thrown instanceof Error ? thrown.message : String(thrown) };
  }
}

const map = <T, U>(source: Attempt<T>, next: (value: T) => U): Attempt<U> =>
  source.ok ? attempt(() => next(source.value)) : source;

function once<T>(produce: () => T): () => T {
  let cached: { value: T } | undefined;
  return () => (cached ??= { value: produce() }).value;
}

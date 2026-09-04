// A Figma change becomes a reviewed, versioned, attributed token release. The package is written
// as one command, and the folders are its stages:
//
//   figma/    the boundary with Figma — their REST payload converted to DTCG files, and hashed
//   release/  what a release is — the diff, the semver bump it implies, the ledger, the report
//   command/  the command itself — its input, the rules that gate it, the handler that runs it
//
// Nothing here writes to disk: the caller reads and writes files, so the same code runs anywhere.

// figma/ — their payload, converted and hashed
export { dtcgType, FigmaError, toDtcgFiles } from './figma/variables.ts';
export type {
  FigmaAlias,
  FigmaCollection,
  FigmaColor,
  FigmaMode,
  FigmaResolvedType,
  FigmaValue,
  FigmaVariable,
  FigmaVariablesResponse,
} from './figma/variables.ts';
export { sha256Hex } from './figma/sha256.ts';

// release/ — the diff, the version it implies, the ledger and the report
export { formatDtcg } from './release/format.ts';
export { bumpFor, bumpReason, diffTokens, display } from './release/diff.ts';
export type { Bump, ChangeKind, TokenChange } from './release/diff.ts';
export { draftRelease, LedgerError, nextVersion, parseLedger, record, tokenDigest, verify } from './release/ledger.ts';
export type { DraftRelease, FigmaOrigin, Release, ReleaseInput, TokenAuthor, TokenLedger } from './release/ledger.ts';
export { impactOf, previewHtml, pullRequest } from './release/report.ts';
export type { PullRequest } from './release/report.ts';

// command/ — the command, its rules, its handler
export { syncTokensCommand } from './command/command.ts';
export type { Attempt, SyncTokensCommand, SyncTokensInput } from './command/command.ts';
export { SYNC_TOKENS_RULES } from './command/rules.ts';
export { syncDesignTokens } from './command/handler.ts';
export type { SyncOutcome, SyncPlan } from './command/handler.ts';

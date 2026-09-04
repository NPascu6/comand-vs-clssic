// The pipeline for a Figma change: the rules decide whether it may become a pull request,
// and only then is the release cut. Nothing here touches the file system — the CLI writes
// what this returns.

import type { DomainError, DecisionTrace } from '@atlas/contracts';
import { handle } from '@atlas/commands';
import type { CommandDefinition } from '@atlas/commands';
import type { DtcgFile } from '@atlas/design-tokens/toolkit';
import type { SyncTokensCommand } from './command.ts';
import { SYNC_TOKENS_RULES } from './rules.ts';
import { diffTokens } from '../release/diff.ts';
import { draftRelease, record, tokenDigest } from '../release/ledger.ts';
import type { DraftRelease, Release, TokenLedger } from '../release/ledger.ts';
import { previewHtml, pullRequest } from '../release/report.ts';
import type { PullRequest } from '../release/report.ts';

/** What the release is; the trace that approved it is attached by `syncDesignTokens`. */
interface Draft {
  release: DraftRelease;
  files: DtcgFile[];
  removed: string[];
}

export interface SyncPlan {
  release: Release;
  ledger: TokenLedger;
  /** The export to write to `figma/`. */
  files: DtcgFile[];
  /** Files the export no longer has — a mode Figma dropped. */
  removed: string[];
  pullRequest: PullRequest;
  /** A standalone before/after page for the reviewer. */
  preview: string;
}

export interface SyncOutcome {
  approved: boolean;
  errors: DomainError[];
  trace: DecisionTrace;
  /** `null` when a rule rejected the change, and when the export is unchanged. */
  plan: SyncPlan | null;
}

const SYNC_TOKENS: CommandDefinition<SyncTokensCommand, Draft | null> = {
  name: 'SyncDesignTokensCommand',
  rules: SYNC_TOKENS_RULES,
  execute: (command) => {
    // Approved, so the export converted: the rules would have rejected it otherwise.
    const files = (command.incoming() as { ok: true; value: DtcgFile[] }).value;
    const changes = diffTokens(command.committed, files);
    const release = draftRelease({
      ledger: command.ledger,
      changes,
      digest: tokenDigest(files),
      author: command.author,
      figma: command.figma,
      at: command.at,
    });
    if (!release) return null;

    const kept = new Set(files.map((file) => file.name));
    return { release, files, removed: command.committed.filter((file) => !kept.has(file.name)).map((file) => file.name) };
  },
};

export function syncDesignTokens(command: SyncTokensCommand, correlationId: string, fileUrl: string): SyncOutcome {
  const { approved, value, errors, trace } = handle(SYNC_TOKENS, command, correlationId);
  if (!approved || !value) return { approved, errors, trace, plan: null };

  // The trace is what let the release through, so it is part of the release.
  const release: Release = { ...value.release, trace };
  const before = command.committedTheme();
  const after = command.theme();
  return {
    approved,
    errors,
    trace,
    plan: {
      release,
      ledger: record(command.ledger, release),
      files: value.files,
      removed: value.removed,
      pullRequest: pullRequest(release, fileUrl),
      preview: before.ok && after.ok ? previewHtml(before.value, after.value, release) : '',
    },
  };
}

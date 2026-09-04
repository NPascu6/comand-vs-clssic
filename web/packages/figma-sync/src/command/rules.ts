// The gates a Figma change passes before it may become a pull request. Each one is a value:
// testable with a hand-built command, named in the decision trace, and never short-circuited —
// a broken export reports its contract failure *and* its contrast failure in one pass.

import type { DomainError } from '@atlas/contracts';
import { structural, violation } from '@atlas/commands';
import type { Rule } from '@atlas/commands';
import { checkContrast, THEME_MODES } from '@atlas/design-tokens/toolkit';
import type { SyncTokensCommand } from './command.ts';
import { tokenDigest, verify } from '../release/ledger.ts';

export const SYNC_TOKENS_RULES: readonly Rule<SyncTokensCommand>[] = [
  exportIsWellFormed(),
  exportSatisfiesThemeContract(),
  committedExportMatchesLedger(),
  changeIsAttributable(),
  textRemainsReadable(),
];

/** Figma's payload has to describe a set of DTCG files before anything else can look at it. */
function exportIsWellFormed(): Rule<SyncTokensCommand> {
  return structural('ExportIsWellFormed', 'The Figma payload converts to DTCG token files', (command) => {
    const incoming = command.incoming();
    if (!incoming.ok) return [violation('FIGMA_PAYLOAD', incoming.reason)];
    return incoming.value.length === 0 ? [violation('FIGMA_PAYLOAD', 'the payload produced no token files')] : [];
  });
}

/** Every path the theme requires, in every mode, with the type it requires — a Figma slip fails here, not in the browser. */
function exportSatisfiesThemeContract(): Rule<SyncTokensCommand> {
  return structural('ExportSatisfiesThemeContract', 'Every mode carries every token createAtlasTheme needs, well-typed', (command) => {
    const theme = command.theme();
    return theme.ok || !command.incoming().ok ? [] : [violation('TOKEN_CONTRACT', theme.reason)];
  });
}

/** The export on main must be the one the ledger describes, or its history is already a fiction. */
function committedExportMatchesLedger(): Rule<SyncTokensCommand> {
  return structural('CommittedExportMatchesLedger', 'The committed export is the one tokens.lock.json records', (command) => {
    const problem = verify(command.ledger, tokenDigest(command.committed));
    return problem ? [violation('LEDGER_DRIFT', problem)] : [];
  });
}

/** A token change reaches production; it does not get to be anonymous. */
function changeIsAttributable(): Rule<SyncTokensCommand> {
  return structural('ChangeIsAttributable', 'The release names the designer who published it', (command) => {
    const { name, figmaHandle } = command.author;
    if (!figmaHandle) return [violation('AUTHOR_UNKNOWN', 'no Figma handle: pass --author-handle, or let the sync read the file version history', 'author')];
    if (!name.trim()) return [violation('AUTHOR_UNKNOWN', `no name for @${figmaHandle}: add the handle to figma/authors.json`, 'author')];
    return [];
  });
}

/**
 * The pairs and thresholds come from `@atlas/design-tokens`, which CI also asserts over the
 * palettes already in the repo. This is the same rule at the earlier moment: it stops a colour
 * a designer just published, before it reaches a branch.
 */
function textRemainsReadable(): Rule<SyncTokensCommand> {
  return structural('TextRemainsReadable', 'Every mode still clears the WCAG AA contrast the theme promises', (command) => {
    const theme = command.theme();
    if (!theme.ok) return [];
    const errors: DomainError[] = [];
    for (const mode of THEME_MODES) {
      for (const finding of checkContrast(theme.value.palettes[mode])) {
        const detail = `${finding.id} is ${finding.ratio}:1, below ${finding.minimum}:1 (${finding.foreground} on ${finding.background})`;
        errors.push(violation('CONTRAST_AA', detail, mode, finding.severity === 'error' ? 'Error' : 'Warning'));
      }
    }
    return errors;
  });
}

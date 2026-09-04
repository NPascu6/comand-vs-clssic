import { useState } from 'react';
import type { CommitCapitalCommand } from '@atlas/contracts';
import { Button, Card, StatusPill } from '@atlas/core';
import { useCommitCapital } from '../useCommitCapital';
import { scenarios } from '../scenarios';
import { CommitCapitalForm } from './CommitCapitalForm';
import { OutcomePanel } from './OutcomePanel';
import { DecisionTraceView } from './DecisionTraceView';
import { useT } from '@atlas/i18n';

export function CommitCapitalSlice() {
  const t = useT();
  const { mode, reference, refError, outcome, busy, submitError, submit } = useCommitCapital();
  const [cmd, setCmd] = useState<CommitCapitalCommand>(scenarios[0].command);

  const patch = (p: Partial<CommitCapitalCommand>) => setCmd((c) => ({ ...c, ...p }));

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-xl font-bold text-ink">{t('commit.title')}</h2>
        <p className="text-sm text-mute">{t('commit.tagline')}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">{t('commit.scenario')}:</span>
          {scenarios.map((s) => (
            <Button
              key={s.id}
              size="sm"
              variant="ghost"
              onClick={() => {
                setCmd(s.command);
                submit(s.command);
              }}
            >
              {s.id} · {s.label}
            </Button>
          ))}
        </div>
      </header>

      {refError ? (
        <Card edge="red" className="p-5">
          <StatusPill tone="danger">Reference data unavailable</StatusPill>
          <p className="mt-2 text-sm text-ink">
            Could not load reference data in <b>{mode}</b> mode: <span className="font-mono text-xs">{refError}</span>
          </p>
          <p className="mt-1 text-sm text-mute">Switch to <b>Mock</b> in the header, or start the API: <span className="font-mono text-xs">dotnet run --project src/Atlas.Api</span></p>
        </Card>
      ) : !reference ? (
        <div className="text-sm text-mute">Loading reference data…</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="p-5">
            <CommitCapitalForm value={cmd} reference={reference} onChange={patch} onSubmit={() => submit(cmd)} busy={busy} />
          </Card>
          <div className="space-y-5">
            {submitError && (
              <Card edge="red" className="p-5">
                <StatusPill tone="danger">Request failed</StatusPill>
                <p className="mt-2 font-mono text-xs text-ink">{submitError}</p>
              </Card>
            )}
            {outcome ? (
              <>
                <OutcomePanel outcome={outcome} />
                <DecisionTraceView trace={outcome.trace} />
              </>
            ) : (
              <Card className="p-5 text-sm text-mute">Submit a commitment to see the outcome and its decision trace.</Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

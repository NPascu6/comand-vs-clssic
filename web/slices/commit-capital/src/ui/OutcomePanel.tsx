import type { CommitOutcome } from '@atlas/contracts';
import { Card, StatusPill } from '@atlas/core';
import { useT } from '@atlas/i18n';

export function OutcomePanel({ outcome }: { outcome: CommitOutcome }) {
  const t = useT();
  if (outcome.approved) {
    return (
      <Card edge="green" className="p-5">
        <div className="flex items-center gap-3">
          <StatusPill tone="success">{t('commit.approved')}</StatusPill>
          <span className="text-sm text-mute">commitment recorded</span>
        </div>
        <div className="mt-2 font-mono text-sm text-ink">{outcome.commitmentId}</div>
      </Card>
    );
  }
  return (
    <Card edge="red" className="p-5">
      <div className="flex items-center gap-3">
        <StatusPill tone="danger">{t('commit.rejected')}</StatusPill>
        <span className="text-sm text-mute">{outcome.errors.length} error(s) — all reported in one pass</span>
      </div>
      <ul className="mt-3 space-y-2">
        {outcome.errors.map((e, i) => (
          <li key={i} className="text-sm">
            <span className="mr-2 rounded bg-[#FBE3E2] px-1.5 py-0.5 font-mono text-xs font-semibold text-red">{e.code}</span>
            <span className="text-ink">{e.message}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

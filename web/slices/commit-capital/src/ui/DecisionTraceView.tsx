import type { DecisionTrace } from '@atlas/contracts';
import { Card, StatusPill } from '@atlas/core';

// Renders the trading-grade audit record. Identical UI whether the trace came
// from the in-browser mock or the live API — the shape is the contract.
export function DecisionTraceView({ trace }: { trace: DecisionTrace }) {
  return (
    <Card edge="navy" className="p-5">
      <div className="flex items-center justify-between">
        <div className="font-semibold text-ink">Decision trace</div>
        <span className="font-mono text-xs text-mute">{trace.correlationId}</span>
      </div>
      <div className="mt-1 text-xs text-mute">
        {trace.passed} passed · {trace.failed} failed · sum-of-rules {trace.totalRuleMs.toFixed(1)}ms (run concurrently)
      </div>
      <ul className="mt-3 space-y-2">
        {trace.entries.map((e) => (
          <li key={e.rule} className="rounded-[8px] border border-line p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-ink">{e.rule}</span>
              <span className="flex items-center gap-2">
                <StatusPill tone={e.kind === 'Upstream' ? 'info' : 'neutral'}>{e.kind}</StatusPill>
                <StatusPill tone={e.outcome === 'Passed' ? 'success' : 'danger'}>{e.outcome}</StatusPill>
                <span className="text-xs tabular-nums text-mute">{e.elapsedMs.toFixed(1)}ms</span>
              </span>
            </div>
            <div className="mt-0.5 text-xs text-mute">{e.description}</div>
            {e.messages.map((m, i) => (
              <div key={i} className="mt-1 font-mono text-xs text-red">{m}</div>
            ))}
          </li>
        ))}
      </ul>
    </Card>
  );
}

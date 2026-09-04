import LinearProgress from '@mui/material/LinearProgress';
import type { MeterProps } from '../components/Meter';

// LEGACY: MUI LinearProgress behind the owned Meter API. Note the inline styles
// and sx overrides — "a lot of custom styling" layered on MUI is precisely the
// coupling the Tailwind version removes.
export function Meter({ value, max, label, format }: MeterProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 100 ? 'error' : pct >= 80 ? 'warning' : 'success';
  const fmt = format ?? ((n: number) => n.toLocaleString('en-US'));
  return (
    <div>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <span style={{ color: '#6B7A95' }}>
            {fmt(value)} / {fmt(max)} · {pct}%
          </span>
        </div>
      )}
      <LinearProgress variant="determinate" value={pct} color={color} sx={{ height: 10, borderRadius: 999 }} />
    </div>
  );
}

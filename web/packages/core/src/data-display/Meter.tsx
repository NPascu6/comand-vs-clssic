import { Box, LinearProgress, Stack, Typography } from '@mui/material';

export type MeterTone = 'green' | 'amber' | 'red' | 'auto';

export interface MeterProps {
  value: number;
  max: number;
  label?: string;
  /** 'auto': <80% success, <100% warning, >=100% error. Default 'auto'. */
  tone?: MeterTone;
  /** Default toLocaleString('en-US'). */
  format?: (value: number) => string;
}

const TONE_COLOR = { green: 'success', amber: 'warning', red: 'error' } as const;

function resolveTone(tone: MeterTone, ratio: number): keyof typeof TONE_COLOR {
  if (tone !== 'auto') return tone;
  return ratio >= 100 ? 'red' : ratio >= 80 ? 'amber' : 'green';
}

/** Caption row (label left, "value / max · pct%" right) over a pill-shaped determinate bar. */
export function Meter({ value, max, label, tone = 'auto', format }: MeterProps) {
  const ratio = max <= 0 ? 0 : (value / max) * 100;
  const percent = Math.min(100, Math.round(ratio));
  const formatValue = format ?? ((amount: number) => amount.toLocaleString('en-US'));

  return (
    <Box sx={{ minWidth: 0 }}>
      {label ? (
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
            {formatValue(value)} / {formatValue(max)} · {percent}%
          </Typography>
        </Stack>
      ) : null}
      <LinearProgress
        variant="determinate"
        value={percent}
        color={TONE_COLOR[resolveTone(tone, ratio)]}
        aria-label={label}
        sx={{ height: 8, borderRadius: 999, '& .MuiLinearProgress-bar': { borderRadius: 999 } }}
      />
    </Box>
  );
}

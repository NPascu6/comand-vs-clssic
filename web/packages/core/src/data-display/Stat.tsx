import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export type StatTone = 'navy' | 'green' | 'amber' | 'red';

export interface StatProps {
  value: ReactNode;
  label: string;
  tone?: StatTone;
}

const TONE_COLOR: Record<StatTone, string> = {
  navy: 'primary.main',
  green: 'success.main',
  amber: 'warning.main',
  red: 'error.main',
};

/** Overline label over a bold, tabular value. Untoned values use text.primary. */
export function Stat({ value, label, tone }: StatProps) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="overline" color="text.secondary" noWrap sx={{ display: 'block' }}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: tone ? TONE_COLOR[tone] : 'text.primary' }}
      >
        {value}
      </Typography>
    </Box>
  );
}

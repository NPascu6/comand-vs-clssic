import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';
import type { PillTone } from '../components/StatusPill';

// LEGACY: MUI Chip behind the owned StatusPill API.
const colorFor: Record<PillTone, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  neutral: 'default',
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
};

export function StatusPill({ tone = 'neutral', children }: { tone?: PillTone; children: ReactNode }) {
  return (
    <Chip
      label={children}
      size="small"
      color={colorFor[tone]}
      variant={tone === 'neutral' ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
}

import type { ReactNode } from 'react';
import { Chip } from '@mui/material';

export type PillTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface StatusPillProps {
  tone?: PillTone;
  children: ReactNode;
  size?: 'small' | 'medium';
}

const TONE = {
  neutral: { variant: 'filled', color: 'default' },
  success: { variant: 'outlined', color: 'success' },
  warning: { variant: 'outlined', color: 'warning' },
  danger: { variant: 'outlined', color: 'error' },
  info: { variant: 'outlined', color: 'info' },
} as const;

/** MUI Chip: neutral is filled default, every other tone is coloured outlined. */
export function StatusPill({ tone = 'neutral', children, size = 'small' }: StatusPillProps) {
  return <Chip label={children} size={size} {...TONE[tone]} />;
}

import type { ReactNode } from 'react';
import { Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface MonoProps {
  children: ReactNode;
  color?: 'inherit' | 'secondary' | 'error';
  sx?: SxProps<Theme>;
}

const COLOR = { inherit: 'inherit', secondary: 'text.secondary', error: 'error.main' } as const;

/** Inline text in the theme's mono stack at 0.85em — ids, codes, keys. */
export function Mono({ children, color = 'inherit', sx }: MonoProps) {
  return (
    <Typography
      component="span"
      color={COLOR[color]}
      sx={[
        { fontFamily: (theme) => theme.typography.fontFamilyMono, fontSize: '0.85em' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}

import type { KeyboardEvent, ReactNode } from 'react';
import { Box, Card as MuiCard } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export type EdgeTone = 'navy' | 'green' | 'amber' | 'red';

export interface CardProps {
  children: ReactNode;
  /** 4px left accent edge — the Atlas motif. navy→primary, green→success, amber→warning, red→error. */
  edge?: EdgeTone;
  /** Apply padding 2.5 to the content. Default true. */
  padded?: boolean;
  /** Makes the whole card a button (hover elevation, cursor pointer, role=button, keyboard). */
  onClick?: () => void;
  sx?: SxProps<Theme>;
}

const EDGE_COLOR: Record<EdgeTone, string> = {
  navy: 'primary.main',
  green: 'success.main',
  amber: 'warning.main',
  red: 'error.main',
};

/** MUI Card, variant outlined. The edge is a pseudo-element so the radius stays clean. */
export function Card({ children, edge, padded = true, onClick, sx }: CardProps) {
  const interactive = Boolean(onClick);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <MuiCard
      variant="outlined"
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? onKeyDown : undefined}
      sx={[
        { position: 'relative', minWidth: 0, overflow: 'hidden' },
        edge
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: EDGE_COLOR[edge],
              },
            }
          : {},
        interactive
          ? {
              cursor: 'pointer',
              transition: 'box-shadow 120ms, border-color 120ms',
              '&:hover': { boxShadow: 2, borderColor: 'primary.main' },
            }
          : {},
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {padded ? <Box sx={{ p: 2.5 }}>{children}</Box> : children}
    </MuiCard>
  );
}

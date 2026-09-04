import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  /** Default 160. */
  minHeight?: number | string;
}

/** Centred title / description / action inside a dashed divider border. */
export function EmptyState({ title, description, icon, action, minHeight = 160 }: EmptyStateProps) {
  return (
    <Box
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        p: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 3,
      }}
    >
      {icon ? <Box sx={{ display: 'flex', color: 'text.secondary' }}>{icon}</Box> : null}
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}

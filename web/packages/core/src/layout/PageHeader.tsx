import type { ReactNode } from 'react';
import { Box, Stack, Typography } from '@mui/material';

export interface PageHeaderProps {
  /** Rendered as an h1 in the h5 typography variant. */
  title: ReactNode;
  tagline?: ReactNode;
  /** Right side; wraps on narrow screens. */
  actions?: ReactNode;
  /** A row under the title (filters, steppers, scenario buttons). */
  children?: ReactNode;
}

export function PageHeader({ title, tagline, actions, children }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          {tagline ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {tagline}
            </Typography>
          ) : null}
        </Box>
        {actions ? (
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            {actions}
          </Stack>
        ) : null}
      </Stack>
      {children ? <Box sx={{ mt: 2 }}>{children}</Box> : null}
    </Box>
  );
}

import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export interface SectionProps {
  title?: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** An overline title (the theme's overline variant, text.secondary) over its content. */
export function Section({ title, children, sx }: SectionProps) {
  return (
    <Box component="section" sx={sx}>
      {title ? (
        <Typography component="h2" variant="overline" color="text.secondary" sx={{ display: 'block' }}>
          {title}
        </Typography>
      ) : null}
      <Box sx={{ mt: title ? 1 : 0 }}>{children}</Box>
    </Box>
  );
}

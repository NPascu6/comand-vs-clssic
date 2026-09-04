import { Fragment } from 'react';
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

export interface KeyValueListProps {
  items: Array<{ label: ReactNode; value: ReactNode }>;
  dense?: boolean;
}

/** A two-column <dl>: labels in text.secondary, values bold. */
export function KeyValueList({ items, dense = false }: KeyValueListProps) {
  return (
    <Box
      component="dl"
      sx={{ m: 0, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 3, rowGap: dense ? 0.5 : 1.25 }}
    >
      {items.map((item, index) => (
        <Fragment key={index}>
          <Typography component="dt" variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography component="dd" variant="body2" sx={{ m: 0, minWidth: 0, fontWeight: 600, overflowWrap: 'anywhere' }}>
            {item.value}
          </Typography>
        </Fragment>
      ))}
    </Box>
  );
}

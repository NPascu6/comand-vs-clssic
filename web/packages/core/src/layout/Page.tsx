import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import type { BoxProps } from '@mui/material';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';

export interface PageProps extends Omit<BoxProps, 'title'> {
  children: ReactNode;
  /** With a title the page grows a header row; without one it is only its body. */
  title?: ReactNode;
  description?: ReactNode;
  /** Before the title — a back arrow, an icon. */
  start?: ReactNode;
  /** After it, held to the far edge — the page's actions. */
  actions?: ReactNode;
  /** How the body flows. */
  direction?: 'column' | 'row';
}

/** A page body on the layout tokens' inset and rhythm, and an optional header row. A Box underneath. */
export function Page({ children, title, description, start, actions, direction = 'column', sx, ...rest }: PageProps) {
  return (
    <Box
      sx={[
        { display: 'flex', flexDirection: 'column', gap: 'var(--atlas-layout-content-gap)', padding: 'var(--atlas-layout-content-padding)' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {title === undefined ? null : (
        <Stack direction="row" gap="md" align="end" justify="between" wrap>
          <Stack direction="row" gap="sm" align="center" grow>
            {start}
            <Stack gap="none">
              <Text variant="title">{title}</Text>
              {description === undefined ? null : (
                <Text variant="bodySmall" tone="muted">
                  {description}
                </Text>
              )}
            </Stack>
          </Stack>
          {actions === undefined ? null : (
            <Stack direction="row" gap="sm" align="center" justify="end" wrap grow>
              {actions}
            </Stack>
          )}
        </Stack>
      )}
      <Stack direction={direction} gap="lg" grow>
        {children}
      </Stack>
    </Box>
  );
}

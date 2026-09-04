import type { ReactNode } from 'react';
import { Stack } from '../primitives/Stack';
import type { StackProps } from '../primitives/Stack';
import { Text } from '../primitives/Text';

export interface BrandProps extends Omit<StackProps, 'children'> {
  /** The product's name, at `typography.heading` in the primary tone. */
  name: ReactNode;
  /** A line under it, at `typography.caption` in the muted tone. */
  subtitle?: ReactNode;
  /** The app icon before the name — an `<img>`, an SVG inside `Icon`, anything. */
  logo?: ReactNode;
}

/** The app mark and name: a Stack, so everything a Stack takes it takes. */
export function Brand({ name, subtitle, logo, direction = 'row', gap = 'sm', align = 'center', ...rest }: BrandProps) {
  return (
    <Stack direction={direction} gap={gap} align={align} {...rest}>
      {logo}
      <Stack gap="none">
        <Text variant="heading" tone="primary" component="span">
          {name}
        </Text>
        {subtitle === undefined ? null : (
          <Text variant="caption" tone="muted">
            {subtitle}
          </Text>
        )}
      </Stack>
    </Stack>
  );
}

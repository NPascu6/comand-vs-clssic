import type { Meta, StoryObj } from '@storybook/react';
import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import { themeInputs } from '@atlas/design-tokens';
import { Text } from './Text';
import { SPACES } from './space';
import type { StackAlign } from './Stack';
import { Stack } from './Stack';

const { radius, space } = themeInputs;

const ALIGNMENTS: readonly StackAlign[] = ['start', 'center', 'end', 'baseline', 'stretch'];

function Tile({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        paddingX: `${space.md}px`,
        paddingY: `${space.sm}px`,
        borderRadius: `${radius.control}px`,
        bgcolor: 'action.hover',
      }}
    >
      <Text variant="bodySmall">{children}</Text>
    </Box>
  );
}

function Sample({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="xs">
      <Text variant="overline" tone="muted">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

const meta = {
  title: 'Primitives/Stack',
  component: Stack,
  args: {
    direction: 'column',
    gap: 'md',
    children: (
      <>
        <Tile>First</Tile>
        <Tile>Second</Tile>
        <Tile>Third</Tile>
      </>
    ),
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['column', 'row'] },
    gap: { control: 'select', options: SPACES },
    align: { control: 'select', options: ALIGNMENTS },
  },
} satisfies Meta<typeof Stack>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Stack gap="lg">
      {SPACES.map((gap) => (
        <Sample key={gap} label={gap}>
          <Stack direction="row" gap={gap}>
            <Tile>One</Tile>
            <Tile>Two</Tile>
            <Tile>Three</Tile>
          </Stack>
        </Sample>
      ))}
    </Stack>
  ),
};

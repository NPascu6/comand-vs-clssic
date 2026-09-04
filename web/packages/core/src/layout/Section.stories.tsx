import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Stat } from '../data-display/Stat';
import { Section } from './Section';

const meta = {
  title: 'Layout/Section',
  component: Section,
  args: {
    title: 'Capacity',
    children: (
      <Stack direction="row" sx={{ gap: 4 }}>
        <Stat label="Committed" value="EUR 25M" tone="navy" />
        <Stat label="Available" value="EUR 8M" tone="green" />
      </Stack>
    ),
  },
} satisfies Meta<typeof Section>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Untitled: Story = {
  args: { title: undefined },
};

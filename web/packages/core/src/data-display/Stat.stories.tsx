import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Stat } from './Stat';

const meta = {
  title: 'Data display/Stat',
  component: Stat,
  args: { label: 'Committed', value: 'EUR 25M' },
  argTypes: { tone: { control: 'inline-radio', options: [undefined, 'navy', 'green', 'amber', 'red'] } },
} satisfies Meta<typeof Stat>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <Stack direction="row" sx={{ gap: 4, flexWrap: 'wrap' }}>
      <Stat label="Committed" value="EUR 25M" tone="navy" />
      <Stat label="Available" value="EUR 8M" tone="green" />
      <Stat label="Pending" value="EUR 3M" tone="amber" />
      <Stat label="Over limit" value="EUR 1.2M" tone="red" />
    </Stack>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { compactMoney } from '../util/format';
import { Meter } from './Meter';

const meta = {
  title: 'Data display/Meter',
  component: Meter,
  args: { label: 'Buyout appetite', value: 62_000_000, max: 100_000_000 },
  argTypes: { tone: { control: 'inline-radio', options: ['auto', 'green', 'amber', 'red'] } },
  decorators: [
    (Story) => (
      <Stack sx={{ maxWidth: 420 }}>
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof Meter>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AutoTones: Story = {
  render: () => (
    <Stack sx={{ gap: 3 }}>
      <Meter label="Under 80%" value={55} max={100} />
      <Meter label="Under 100%" value={91} max={100} />
      <Meter label="At limit" value={100} max={100} />
      <Meter label="Over limit (clamped)" value={130} max={100} />
    </Stack>
  ),
};

export const CompactFormat: Story = {
  args: { format: compactMoney },
};

export const NoLabel: Story = {
  args: { label: undefined, value: 40, max: 100, tone: 'green' },
};

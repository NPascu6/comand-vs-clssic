import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from '@mui/material';
import { Mono } from './Mono';

const meta = {
  title: 'Data display/Mono',
  component: Mono,
  args: { children: 'COM-2026-000417' },
  argTypes: { color: { control: 'inline-radio', options: ['inherit', 'secondary', 'error'] } },
} satisfies Meta<typeof Mono>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inline: Story = {
  render: () => (
    <Typography variant="body1">
      Commitment <Mono>COM-2026-000417</Mono> was booked against <Mono color="secondary">fund.iv.buyout</Mono>;
      the previous attempt failed with <Mono color="error">E_APPETITE_EXCEEDED</Mono>.
    </Typography>
  ),
};

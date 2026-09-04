import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { StatusPill } from './StatusPill';

const meta = {
  title: 'Data display/StatusPill',
  component: StatusPill,
  args: { children: 'Approved', tone: 'success', size: 'small' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'success', 'warning', 'danger', 'info'] },
    size: { control: 'inline-radio', options: ['small', 'medium'] },
  },
} satisfies Meta<typeof StatusPill>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllTones: Story = {
  render: () => (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <StatusPill tone="neutral">Draft</StatusPill>
      <StatusPill tone="success">Approved</StatusPill>
      <StatusPill tone="warning">Pending</StatusPill>
      <StatusPill tone="danger">Rejected</StatusPill>
      <StatusPill tone="info">In review</StatusPill>
    </Stack>
  ),
};

export const Medium: Story = { args: { size: 'medium' } };

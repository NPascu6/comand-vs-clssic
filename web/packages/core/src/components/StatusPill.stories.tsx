import type { Meta, StoryObj } from '@storybook/react';
import { StatusPill } from './StatusPill';

const meta: Meta<typeof StatusPill> = {
  title: 'Components/StatusPill',
  component: StatusPill,
  args: {
    tone: 'success',
    children: 'Approved',
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'success', 'warning', 'danger', 'info'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof StatusPill>;

export const Success: Story = {
  args: { tone: 'success', children: 'Approved' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill tone="neutral">Draft</StatusPill>
      <StatusPill tone="success">Approved</StatusPill>
      <StatusPill tone="warning">Pending review</StatusPill>
      <StatusPill tone="danger">Breached</StatusPill>
      <StatusPill tone="info">In committee</StatusPill>
    </div>
  ),
};

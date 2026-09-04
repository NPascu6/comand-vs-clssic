import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../controls/Button';
import { ConfirmDialog } from './ConfirmDialog';

const meta = {
  title: 'Overlay/ConfirmDialog',
  component: ConfirmDialog,
  args: {
    open: true,
    title: 'Withdraw commitment?',
    description: 'The EUR 25,000,000 commitment to Fund IV will be released back to the buyout appetite.',
    onConfirm: () => undefined,
    onCancel: () => undefined,
  },
} satisfies Meta<typeof ConfirmDialog>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = { args: { danger: true, confirmLabel: 'Withdraw' } };

export const Busy: Story = { args: { busy: true, confirmLabel: 'Withdrawing' } };

export const Interactive: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>
          Withdraw commitment
        </Button>
        <ConfirmDialog {...args} open={open} danger onConfirm={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </>
    );
  },
};

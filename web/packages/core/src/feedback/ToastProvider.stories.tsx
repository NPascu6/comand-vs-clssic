import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Button } from '../controls/Button';
import { ToastProvider, useToast } from './ToastProvider';

function Triggers() {
  const { show } = useToast();
  return (
    <Stack direction="row" sx={{ gap: 1, flexWrap: 'wrap' }}>
      <Button onClick={() => show('Commitment booked.', 'success')}>Success</Button>
      <Button variant="ghost" onClick={() => show('Appetite recalculated.')}>
        Info
      </Button>
      <Button variant="ghost" onClick={() => show('Close to the strategy limit.', 'warning')}>
        Warning
      </Button>
      <Button variant="danger" onClick={() => show('The backend rejected the change.', 'error')}>
        Error
      </Button>
    </Stack>
  );
}

const meta = {
  title: 'Feedback/ToastProvider',
  component: ToastProvider,
  args: { children: <Triggers /> },
} satisfies Meta<typeof ToastProvider>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

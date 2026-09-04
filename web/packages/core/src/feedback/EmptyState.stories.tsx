import type { Meta, StoryObj } from '@storybook/react';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { Button } from '../controls/Button';
import { EmptyState } from './EmptyState';

const meta = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  args: { title: 'No deals yet', description: 'Deals appear here once they pass the first screen.' },
} satisfies Meta<typeof EmptyState>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIconAndAction: Story = {
  args: {
    icon: <InboxOutlinedIcon fontSize="large" />,
    action: <Button size="sm">New deal</Button>,
  },
};

export const Compact: Story = {
  args: { description: undefined, minHeight: 80 },
};

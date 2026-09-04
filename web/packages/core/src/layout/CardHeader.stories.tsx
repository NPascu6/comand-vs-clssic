import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../controls/Button';
import { StatusPill } from '../data-display/StatusPill';
import { Card } from './Card';
import { CardHeader } from './CardHeader';

const meta = {
  title: 'Layout/CardHeader',
  component: CardHeader,
  args: { title: 'Co-investment terms', subtitle: 'Last updated 2 days ago' },
  decorators: [
    (Story) => (
      <Card padded={false}>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof CardHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: { action: <Button variant="ghost" size="sm">Edit</Button> },
};

export const WithPill: Story = {
  args: { subtitle: undefined, action: <StatusPill tone="success">Approved</StatusPill> },
};

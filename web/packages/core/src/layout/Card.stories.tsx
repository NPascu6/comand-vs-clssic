import type { Meta, StoryObj } from '@storybook/react';
import { Stack, Typography } from '@mui/material';
import { CardHeader } from './CardHeader';
import { Card } from './Card';

const meta = {
  title: 'Layout/Card',
  component: Card,
  args: {
    children: <Typography variant="body2">Fund IV · vintage 2024 · EUR 250M target</Typography>,
  },
  argTypes: {
    edge: { control: 'inline-radio', options: [undefined, 'navy', 'green', 'amber', 'red'] },
    padded: { control: 'boolean' },
  },
} satisfies Meta<typeof Card>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Edges: Story = {
  render: (args) => (
    <Stack sx={{ gap: 2 }}>
      <Card {...args} edge="navy" />
      <Card {...args} edge="green" />
      <Card {...args} edge="amber" />
      <Card {...args} edge="red" />
    </Stack>
  ),
};

export const Clickable: Story = {
  args: { edge: 'navy', onClick: () => undefined },
};

export const WithHeader: Story = {
  args: {
    padded: false,
    children: (
      <>
        <CardHeader title="Allocation" subtitle="Q3 2026" />
        <Typography variant="body2" sx={{ p: 2.5 }}>
          Unpadded card with a header and its own content spacing.
        </Typography>
      </>
    ),
  },
};

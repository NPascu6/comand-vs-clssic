import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from '@mui/material';
import { Loading } from './Loading';

const meta = {
  title: 'Feedback/Loading',
  component: Loading,
  args: { label: 'Loading appetite' },
} satisfies Meta<typeof Loading>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Block: Story = {};

export const NoLabel: Story = { args: { label: undefined } };

export const Inline: Story = {
  args: { inline: true, label: 'Recalculating' },
  render: (args) => (
    <Typography variant="body1">
      Appetite: <Loading {...args} />
    </Typography>
  ),
};

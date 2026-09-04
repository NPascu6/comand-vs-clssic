import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Button } from './Button';

const meta = {
  title: 'Controls/Button',
  component: Button,
  args: { children: 'Commit capital', variant: 'primary', size: 'md' },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['md', 'sm'] },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Ghost: Story = { args: { variant: 'ghost', children: 'Cancel' } };

export const Danger: Story = { args: { variant: 'danger', children: 'Withdraw commitment' } };

export const Small: Story = { args: { size: 'sm', children: 'Add allocation' } };

export const Loading: Story = { args: { loading: true, children: 'Saving' } };

export const AllVariants: Story = {
  render: () => (
    <Stack sx={{ gap: 2 }}>
      {(['md', 'sm'] as const).map((size) => (
        <Stack key={size} direction="row" sx={{ gap: 1.5 }}>
          <Button size={size}>Primary</Button>
          <Button size={size} variant="ghost">
            Ghost
          </Button>
          <Button size={size} variant="danger">
            Danger
          </Button>
          <Button size={size} disabled>
            Disabled
          </Button>
          <Button size={size} loading>
            Loading
          </Button>
        </Stack>
      ))}
    </Stack>
  ),
};

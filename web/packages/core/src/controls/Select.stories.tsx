import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Select } from './Select';

const OPTIONS = [
  { value: 'buyout', label: 'Buyout' },
  { value: 'growth', label: 'Growth' },
  { value: 'venture', label: 'Venture', disabled: true },
  { value: 'credit', label: 'Private credit' },
];

const meta = {
  title: 'Controls/Select',
  component: Select,
  args: { label: 'Strategy', value: 'buyout', options: OPTIONS, onChange: () => undefined },
  decorators: [
    (Story) => (
      <Stack sx={{ maxWidth: 360 }}>
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof Select>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Select {...args} value={value} onChange={setValue} />;
  },
};

export const ValueNotInOptions: Story = {
  args: { value: 'infra', helperText: 'The saved strategy is no longer offered.' },
};

export const Error: Story = {
  args: { error: true, helperText: 'Pick a strategy.' },
};

export const Unlabelled: Story = {
  args: { label: undefined, 'aria-label': 'Strategy', size: 'medium' },
};

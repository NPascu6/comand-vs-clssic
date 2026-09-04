import type { Meta, StoryObj } from '@storybook/react';
import { InputAdornment, Stack } from '@mui/material';
import { TextField } from './TextField';

const meta = {
  title: 'Controls/TextField',
  component: TextField,
  args: { label: 'Commitment amount', placeholder: '25,000,000' },
  decorators: [
    (Story) => (
      <Stack sx={{ maxWidth: 360 }}>
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof TextField>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAdornment: Story = {
  args: {
    slotProps: { input: { startAdornment: <InputAdornment position="start">EUR</InputAdornment> } },
  },
};

export const Error: Story = {
  args: { error: true, helperText: 'Exceeds the remaining appetite.', defaultValue: '40,000,000' },
};

export const Multiline: Story = {
  args: { label: 'Reason', multiline: true, minRows: 3, placeholder: 'Why this change is needed' },
};

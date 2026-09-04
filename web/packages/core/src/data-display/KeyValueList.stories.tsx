import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '@mui/material';
import { Mono } from './Mono';
import { StatusPill } from './StatusPill';
import { KeyValueList } from './KeyValueList';

const meta = {
  title: 'Data display/KeyValueList',
  component: KeyValueList,
  args: {
    items: [
      { label: 'Fund', value: 'Atlas Fund IV' },
      { label: 'Vintage', value: '2024' },
      { label: 'Commitment', value: 'EUR 25,000,000' },
      { label: 'Status', value: <StatusPill tone="success">Approved</StatusPill> },
      { label: 'Reference', value: <Mono>COM-2026-000417</Mono> },
    ],
  },
  decorators: [
    (Story) => (
      <Stack sx={{ maxWidth: 480 }}>
        <Story />
      </Stack>
    ),
  ],
} satisfies Meta<typeof KeyValueList>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Dense: Story = { args: { dense: true } };

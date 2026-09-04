import type { Meta, StoryObj } from '@storybook/react';
import { Meter } from './Meter';
import { compactMoney } from '../util/format';

const meta: Meta<typeof Meter> = {
  title: 'Components/Meter',
  component: Meter,
  args: {
    label: 'PrivateCredit | Emea',
    value: 230_000_000,
    max: 250_000_000,
    tone: 'auto',
    format: compactMoney,
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['auto', 'green', 'amber', 'red'] },
    value: { control: 'number' },
    max: { control: 'number' },
  },
};
export default meta;

type Story = StoryObj<typeof Meter>;

// ~92% -> auto resolves to amber.
export const NearLimit: Story = {
  args: { value: 230_000_000, max: 250_000_000 },
};

// Comfortably within limit -> green.
export const Healthy: Story = {
  args: { label: 'PrivateCredit | Emea', value: 120_000_000, max: 250_000_000 },
};

// At/over the limit -> red.
export const Breached: Story = {
  args: { label: 'PrivateCredit | Emea', value: 265_000_000, max: 250_000_000 },
};

export const Fills: Story = {
  render: () => (
    <div className="flex w-[420px] flex-col gap-5">
      <Meter label="PrivateCredit | Emea" value={120_000_000} max={250_000_000} format={compactMoney} />
      <Meter label="PrivateCredit | Emea" value={230_000_000} max={250_000_000} format={compactMoney} />
      <Meter label="PrivateCredit | Emea" value={265_000_000} max={250_000_000} format={compactMoney} />
    </div>
  ),
};

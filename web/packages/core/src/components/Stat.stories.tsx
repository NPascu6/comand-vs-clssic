import type { Meta, StoryObj } from '@storybook/react';
import { Stat } from './Stat';
import { compactMoney } from '../util/format';

const meta: Meta<typeof Stat> = {
  title: 'Components/Stat',
  component: Stat,
  args: {
    value: compactMoney(230_000_000),
    label: 'Committed capital',
    tone: 'navy',
  },
  argTypes: {
    tone: { control: 'inline-radio', options: ['navy', 'green', 'amber', 'red'] },
  },
};
export default meta;

type Story = StoryObj<typeof Stat>;

export const Navy: Story = {
  args: { value: compactMoney(230_000_000), label: 'Committed capital', tone: 'navy' },
};

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-10">
      <Stat value={compactMoney(230_000_000)} label="Committed capital" tone="navy" />
      <Stat value={compactMoney(120_000_000)} label="Available headroom" tone="green" />
      <Stat value="92%" label="Limit utilisation" tone="amber" />
      <Stat value={3} label="Breached limits" tone="red" />
    </div>
  ),
};

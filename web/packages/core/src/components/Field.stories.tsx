import type { Meta, StoryObj } from '@storybook/react';
import { Field, TextInput } from './Field';

const meta: Meta<typeof Field> = {
  title: 'Components/Field',
  component: Field,
};
export default meta;

type Story = StoryObj<typeof Field>;

export const Normal: Story = {
  render: () => (
    <div className="w-[320px]">
      <Field label="Commitment amount" htmlFor="amount">
        <TextInput id="amount" defaultValue="230,000,000" />
      </Field>
    </div>
  ),
};

export const WithHint: Story = {
  render: () => (
    <div className="w-[320px]">
      <Field label="Commitment amount" htmlFor="amount-hint" hint="Enter the total in the fund's base currency.">
        <TextInput id="amount-hint" placeholder="0" />
      </Field>
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className="w-[320px]">
      <Field label="Commitment amount" htmlFor="amount-err" error="Exceeds the EMEA private-credit limit.">
        <TextInput id="amount-err" defaultValue="265,000,000" invalid />
      </Field>
    </div>
  ),
};

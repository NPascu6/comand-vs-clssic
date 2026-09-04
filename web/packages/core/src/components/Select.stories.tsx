import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';
import { Field } from './Field';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  argTypes: {
    invalid: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  render: (args) => (
    <div className="w-[320px]">
      <Select {...args} defaultValue="emea">
        <option value="emea">PrivateCredit | Emea</option>
        <option value="apac">PrivateCredit | Apac</option>
        <option value="amer">PrivateCredit | Amer</option>
      </Select>
    </div>
  ),
};

export const InField: Story = {
  render: () => (
    <div className="w-[320px]">
      <Field label="Strategy / region" htmlFor="strategy">
        <Select id="strategy" defaultValue="emea">
          <option value="emea">PrivateCredit | Emea</option>
          <option value="apac">PrivateCredit | Apac</option>
          <option value="amer">PrivateCredit | Amer</option>
        </Select>
      </Field>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="w-[320px]">
      <Field label="Strategy / region" htmlFor="strategy-err" error="Select a strategy.">
        <Select id="strategy-err" invalid defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          <option value="emea">PrivateCredit | Emea</option>
        </Select>
      </Field>
    </div>
  ),
};

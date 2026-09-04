import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from './Stepper';

const meta = {
  title: 'Navigation/Stepper',
  component: Stepper,
  args: { steps: ['Screen', 'Diligence', 'IC approval', 'Signed'], activeIndex: 1 },
  argTypes: { activeIndex: { control: { type: 'number', min: 0, max: 4 } } },
} satisfies Meta<typeof Stepper>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const First: Story = { args: { activeIndex: 0 } };

export const Complete: Story = { args: { activeIndex: 4 } };

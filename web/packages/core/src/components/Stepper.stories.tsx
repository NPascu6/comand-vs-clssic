import type { Meta, StoryObj } from '@storybook/react';
import { Stepper } from './Stepper';

const meta: Meta<typeof Stepper> = {
  title: 'Components/Stepper',
  component: Stepper,
  args: {
    steps: ['Pipeline', 'Investable', 'Closed'],
    activeIndex: 1,
  },
  argTypes: {
    activeIndex: { control: { type: 'number', min: 0, max: 2 } },
  },
  decorators: [
    (Story) => (
      <div className="w-[420px]">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof Stepper>;

// Active step in the middle: one done, one current, one upcoming.
export const Midway: Story = {
  args: { steps: ['Pipeline', 'Investable', 'Closed'], activeIndex: 1 },
};

// Just started: first step current, the rest upcoming.
export const Start: Story = {
  args: { steps: ['Pipeline', 'Investable', 'Closed'], activeIndex: 0 },
};

// Reached the end: every prior step done, last step current.
export const Done: Story = {
  args: { steps: ['Pipeline', 'Investable', 'Closed'], activeIndex: 2 },
};

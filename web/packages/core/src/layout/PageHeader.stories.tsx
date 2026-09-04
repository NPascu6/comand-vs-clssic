import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../controls/Button';
import { Stepper } from '../navigation/Stepper';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Layout/PageHeader',
  component: PageHeader,
  args: {
    title: 'Deal pipeline',
    tagline: 'Every live opportunity from first screen to signed commitment.',
  },
} satisfies Meta<typeof PageHeader>;
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    actions: (
      <>
        <Button variant="ghost">Export</Button>
        <Button>New deal</Button>
      </>
    ),
  },
};

export const WithChildren: Story = {
  args: {
    title: 'Commit capital',
    tagline: 'Three steps from request to booked commitment.',
    children: <Stepper steps={['Request', 'Review', 'Book']} activeIndex={1} />,
  },
};

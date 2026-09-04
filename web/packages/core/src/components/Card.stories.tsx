import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader } from './Card';
import { Stat } from './Stat';
import { StatusPill } from './StatusPill';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  argTypes: {
    edge: { control: 'inline-radio', options: [undefined, 'navy', 'green', 'amber', 'red'] },
  },
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Plain: Story = {
  render: () => (
    <Card className="w-[360px]">
      <div className="p-5">
        <div className="text-sm text-mute">A plain card — no accent edge.</div>
        <div className="mt-2 text-ink">Commit Capital · Q2 review</div>
      </div>
    </Card>
  ),
};

export const WithEdge: Story = {
  render: () => (
    <Card edge="green" className="w-[360px]">
      <CardHeader
        title="PrivateCredit | Emea"
        subtitle="Capital commitment"
        right={<StatusPill tone="success">Approved</StatusPill>}
      />
      <div className="p-5">
        <Stat value="230M" label="Committed capital" tone="navy" />
      </div>
    </Card>
  ),
};

export const Edges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {(['navy', 'green', 'amber', 'red'] as const).map((edge) => (
        <Card key={edge} edge={edge} className="w-[220px]">
          <div className="p-4">
            <div className="font-semibold capitalize text-ink">{edge} edge</div>
            <div className="mt-1 text-xs text-mute">The design-system accent motif.</div>
          </div>
        </Card>
      ))}
    </div>
  ),
};

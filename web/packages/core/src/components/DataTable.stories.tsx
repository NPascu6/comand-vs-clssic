import type { Meta, StoryObj } from '@storybook/react';
import type { Column } from './DataTable';
import { DataTable } from './DataTable';
import { StatusPill } from './StatusPill';
import { compactMoney } from '../util/format';

interface Commitment {
  id: string;
  strategy: string;
  region: string;
  committed: number;
  status: 'Approved' | 'Pending review' | 'Breached';
}

const rows: Commitment[] = [
  { id: 'c-1', strategy: 'PrivateCredit', region: 'Emea', committed: 230_000_000, status: 'Approved' },
  { id: 'c-2', strategy: 'PrivateCredit', region: 'Apac', committed: 145_000_000, status: 'Pending review' },
  { id: 'c-3', strategy: 'PrivateCredit', region: 'Amer', committed: 265_000_000, status: 'Breached' },
  { id: 'c-4', strategy: 'RealEstate', region: 'Emea', committed: 88_000_000, status: 'Approved' },
];

const toneFor: Record<Commitment['status'], 'success' | 'warning' | 'danger'> = {
  Approved: 'success',
  'Pending review': 'warning',
  Breached: 'danger',
};

const columns: Column<Commitment>[] = [
  { key: 'strategy', header: 'Strategy', render: (r) => r.strategy },
  { key: 'region', header: 'Region', render: (r) => r.region },
  { key: 'committed', header: 'Committed', align: 'right', render: (r) => compactMoney(r.committed) },
  {
    key: 'status',
    header: 'Status',
    align: 'center',
    render: (r) => <StatusPill tone={toneFor[r.status]}>{r.status}</StatusPill>,
  },
];

const meta: Meta<typeof DataTable<Commitment>> = {
  title: 'Components/DataTable',
  component: DataTable,
};
export default meta;

type Story = StoryObj<typeof DataTable<Commitment>>;

export const Commitments: Story = {
  render: () => (
    <div className="w-[560px]">
      <DataTable columns={columns} rows={rows} getKey={(r) => r.id} />
    </div>
  ),
};

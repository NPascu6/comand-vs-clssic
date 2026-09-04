import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import type { GridColDef } from '@mui/x-data-grid';
import { StatusPill } from './StatusPill';
import { DataGrid } from './DataGrid';

interface Deal {
  dealId: string;
  name: string;
  strategy: string;
  stage: 'Screen' | 'Diligence' | 'IC' | 'Signed';
  commitment: number;
  owner: string;
}

const STAGE_TONE = { Screen: 'neutral', Diligence: 'info', IC: 'warning', Signed: 'success' } as const;

const ROWS: Deal[] = [
  { dealId: 'D-1001', name: 'Project Aurora', strategy: 'Buyout', stage: 'Diligence', commitment: 25_000_000, owner: 'A. Keller' },
  { dealId: 'D-1002', name: 'Project Basalt', strategy: 'Growth', stage: 'Screen', commitment: 8_000_000, owner: 'M. Ortiz' },
  { dealId: 'D-1003', name: 'Project Cobalt', strategy: 'Private credit', stage: 'IC', commitment: 40_000_000, owner: 'A. Keller' },
  { dealId: 'D-1004', name: 'Project Delta', strategy: 'Buyout', stage: 'Signed', commitment: 60_000_000, owner: 'S. Nakamura' },
  { dealId: 'D-1005', name: 'Project Ember', strategy: 'Venture', stage: 'Screen', commitment: 3_500_000, owner: 'M. Ortiz' },
  { dealId: 'D-1006', name: 'Project Fjord', strategy: 'Infrastructure', stage: 'Diligence', commitment: 120_000_000, owner: 'L. Brandt' },
  { dealId: 'D-1007', name: 'Project Granite', strategy: 'Buyout', stage: 'IC', commitment: 45_000_000, owner: 'S. Nakamura' },
  { dealId: 'D-1008', name: 'Project Harbor', strategy: 'Real assets', stage: 'Signed', commitment: 75_000_000, owner: 'L. Brandt' },
  { dealId: 'D-1009', name: 'Project Iris', strategy: 'Growth', stage: 'Screen', commitment: 12_000_000, owner: 'A. Keller' },
  { dealId: 'D-1010', name: 'Project Juniper', strategy: 'Private credit', stage: 'Diligence', commitment: 30_000_000, owner: 'M. Ortiz' },
  { dealId: 'D-1011', name: 'Project Kestrel', strategy: 'Venture', stage: 'IC', commitment: 5_000_000, owner: 'S. Nakamura' },
  { dealId: 'D-1012', name: 'Project Lumen', strategy: 'Buyout', stage: 'Screen', commitment: 18_000_000, owner: 'L. Brandt' },
];

const COLUMNS: GridColDef<Deal>[] = [
  { field: 'dealId', headerName: 'Deal', width: 100 },
  { field: 'name', headerName: 'Name', flex: 1, minWidth: 160, editable: true },
  { field: 'strategy', headerName: 'Strategy', width: 140, editable: true },
  {
    field: 'stage',
    headerName: 'Stage',
    width: 130,
    renderCell: (params) => <StatusPill tone={STAGE_TONE[params.row.stage]}>{params.row.stage}</StatusPill>,
  },
  {
    field: 'commitment',
    headerName: 'Commitment',
    type: 'number',
    width: 150,
    editable: true,
    valueFormatter: (value: number) => `EUR ${value.toLocaleString('en-US')}`,
  },
  { field: 'owner', headerName: 'Owner', width: 140 },
];

const meta = {
  title: 'Data display/DataGrid',
  component: DataGrid,
  args: { rows: ROWS, columns: COLUMNS, idField: 'dealId' },
} satisfies Meta<typeof DataGrid<Deal>>;
export default meta;

type Story = StoryObj<typeof meta>;

export const AutoHeight: Story = {};

export const FixedHeight: Story = { args: { height: 360 } };

export const NoToolbar: Story = { args: { toolbar: false } };

export const Empty: Story = { args: { rows: [], emptyMessage: 'No deals in this stage yet.' } };

export const LoadingSkeleton: Story = { args: { rows: [], loading: true, height: 360 } };

/** Double-click a Name, Strategy or Commitment cell; the edit is kept in local state. */
export const Editable: Story = {
  render: () => {
    const [rows, setRows] = useState(ROWS);
    return (
      <DataGrid<Deal>
        columns={COLUMNS}
        idField="dealId"
        rows={rows}
        processRowUpdate={(next) => {
          setRows((current) => current.map((row) => (row.dealId === next.dealId ? next : row)));
          return next;
        }}
      />
    );
  },
};

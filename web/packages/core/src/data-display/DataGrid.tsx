import { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGrid as MuiDataGrid, GridOverlay } from '@mui/x-data-grid';
import type { DataGridProps as MuiDataGridProps, GridColDef, GridRowId, GridValidRowModel } from '@mui/x-data-grid';
import { EmptyState } from '../feedback/EmptyState';

// Lets the wrapper hand `emptyMessage` to its no-rows slot through slotProps.
declare module '@mui/x-data-grid' {
  interface NoRowsOverlayPropsOverrides {
    message?: string;
  }
}

export interface DataGridProps<R extends GridValidRowModel = GridValidRowModel>
  extends Omit<MuiDataGridProps<R>, 'rows' | 'columns' | 'slots' | 'slotProps'> {
  rows: R[];
  columns: GridColDef<R>[];
  /** Fixed height (px or CSS). When omitted the grid uses autoHeight. */
  height?: number | string;
  /** Show the toolbar (quick filter, columns, density, export). Default true. */
  toolbar?: boolean;
  /** Text for the no-rows overlay. Default "No rows". */
  emptyMessage?: string;
  /** Column field to use as the row id when the row has no `id`. */
  idField?: keyof R & string;
}

function NoRowsOverlay({ message }: { message?: string }) {
  return (
    <GridOverlay sx={{ p: 2 }}>
      <EmptyState title={message ?? 'No rows'} minHeight={0} />
    </GridOverlay>
  );
}

const SLOTS = { noRowsOverlay: NoRowsOverlay };
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// MUI X 9 lays cells out as text; custom content only sits vertically centred in a flex cell.
function withFlexRenderCells<R extends GridValidRowModel>(columns: GridColDef<R>[]): GridColDef<R>[] {
  return columns.map((column) => (column.renderCell && !column.display ? { ...column, display: 'flex' } : column));
}

/** MUI X DataGrid behind Atlas defaults: compact, paginated, quick filter, skeleton loading; editing works as in MUI X. */
export function DataGrid<R extends GridValidRowModel = GridValidRowModel>({
  rows,
  columns,
  height,
  toolbar = true,
  emptyMessage = 'No rows',
  idField,
  initialState,
  ...rest
}: DataGridProps<R>) {
  // The field's value is trusted to be a string | number, as GridRowId requires.
  const getRowId = idField ? (row: R) => row[idField] as GridRowId : undefined;
  const flexColumns = useMemo(() => withFlexRenderCells(columns), [columns]);

  const grid = (
    <MuiDataGrid<R>
      rows={rows}
      columns={flexColumns}
      density="compact"
      disableRowSelectionOnClick
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      showToolbar={toolbar}
      autoHeight={height === undefined}
      getRowId={getRowId}
      initialState={{
        ...initialState,
        pagination: { paginationModel: { pageSize: 10 }, ...initialState?.pagination },
      }}
      slots={SLOTS}
      slotProps={{
        toolbar: { showQuickFilter: true },
        noRowsOverlay: { message: emptyMessage },
        loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' },
      }}
      {...rest}
    />
  );

  return height === undefined ? grid : <Box sx={{ height, width: '100%' }}>{grid}</Box>;
}

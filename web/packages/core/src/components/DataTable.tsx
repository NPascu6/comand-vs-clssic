import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, getKey }: DataTableProps<T>) {
  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-mute">
          {columns.map((c) => (
            <th key={c.key} className={`px-3 py-2 font-semibold ${c.align === 'right' ? 'text-right' : c.align === 'center' ? 'text-center' : ''}`}>
              {c.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={getKey(r)} className="border-b border-line/60 last:border-0">
            {columns.map((c) => (
              <td key={c.key} className={`px-3 py-2 text-ink ${c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : ''}`}>
                {c.render(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

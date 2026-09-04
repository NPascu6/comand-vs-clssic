import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// One switch, app-wide: do slices read from the deterministic in-browser mock,
// or from the live ASP.NET CommitCapital API? Each slice reads this to choose
// its client, so the data source is configurable without touching slice code.
// ---------------------------------------------------------------------------

export type DataSourceMode = 'mock' | 'api';

export interface DataSource {
  mode: DataSourceMode;
  apiBaseUrl: string;
}

export const DEFAULT_API_BASE = 'http://localhost:5179/api';

const Ctx = createContext<DataSource>({ mode: 'mock', apiBaseUrl: DEFAULT_API_BASE });

export function DataSourceProvider({ value, children }: { value: DataSource; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDataSource(): DataSource {
  return useContext(Ctx);
}

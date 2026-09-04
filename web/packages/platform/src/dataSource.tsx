import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { defaultRuntimeConfig } from './runtimeConfig';

// One app-wide switch between the in-browser mock and the live API; each slice reads it to pick its client.

export type DataSourceMode = 'mock' | 'api';

export interface DataSource {
  mode: DataSourceMode;
  apiBaseUrl: string;
}

const DataSourceContext = createContext<DataSource>({ mode: 'mock', apiBaseUrl: defaultRuntimeConfig.apiBaseUrl });

export function DataSourceProvider({ value, children }: { value: DataSource; children: ReactNode }) {
  return <DataSourceContext.Provider value={value}>{children}</DataSourceContext.Provider>;
}

export function useDataSource(): DataSource {
  return useContext(DataSourceContext);
}

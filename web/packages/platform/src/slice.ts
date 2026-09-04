import type { ComponentType } from 'react';

// The shell discovers slices only through this manifest; adding a domain is a package plus a registration.

export interface SliceManifest {
  /** Stable id used for routing/registry. */
  id: string;
  /** Human title shown in the navigation. */
  title: string;
  /** One-line description of the use case. */
  tagline: string;
  /** Domain grouping label, e.g. "Commitments", "Appetite". */
  domain: string;
  /** The slice's root component. It reads its own data via useDataSource(). */
  Component: ComponentType;
}

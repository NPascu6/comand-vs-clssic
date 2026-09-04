import type { ComponentType } from 'react';

// ---------------------------------------------------------------------------
// The contract every vertical slice fulfils. A slice is a self-contained
// business domain: it owns its UI, its data client, and its manifest. The shell
// app discovers slices purely through this manifest — it knows nothing about
// what is inside them. Adding a domain = adding a package + registering it.
// ---------------------------------------------------------------------------

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

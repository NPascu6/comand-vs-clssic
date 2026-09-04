// Shared Atlas domain vocabulary (enums, snapshots, client ports, upstream bundle)
// lives in the contracts assembly. Importing it globally keeps every layer file
// focused on its own job, not on plumbing.
global using Atlas.Upstream.Contracts;

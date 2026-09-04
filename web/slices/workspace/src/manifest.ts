import type { SliceManifest } from '@atlas/platform';
import { WorkspaceSlice } from './ui/WorkspaceSlice';

export const manifest: SliceManifest = {
  id: 'workspace',
  title: 'Workspace',
  tagline: 'Custom views from pluggable, resizable panels',
  domain: 'Fund Management',
  Component: WorkspaceSlice,
};

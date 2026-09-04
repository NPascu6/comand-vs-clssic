import type { SliceManifest } from '@atlas/platform';
import { DealPipelineSlice } from './ui/DealPipelineSlice';

export const manifest: SliceManifest = {
  id: 'deal-pipeline',
  title: 'Deal Pipeline',
  tagline: 'Move deals through their lifecycle',
  domain: 'Fund Construction',
  Component: DealPipelineSlice,
};

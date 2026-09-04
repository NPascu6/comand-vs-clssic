import type { SliceManifest } from '@atlas/platform';
import { CommitCapitalSlice } from './ui/CommitCapitalSlice';

export const manifest: SliceManifest = {
  id: 'commit-capital',
  title: 'Commit Capital',
  tagline: 'Commit capital to a co-investment, validated against upstream',
  domain: 'Fund Construction',
  Component: CommitCapitalSlice,
};

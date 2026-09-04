import type { SliceManifest } from '@atlas/platform';
import { AppetiteSlice } from './ui/AppetiteSlice';

export const manifest: SliceManifest = {
  id: 'appetite',
  title: 'Appetite Restrictions',
  tagline: 'Exposure vs. ceilings per asset-class / region bucket',
  domain: 'Fund Construction',
  Component: AppetiteSlice,
};

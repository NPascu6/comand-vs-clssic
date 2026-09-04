import type { SliceManifest } from '@atlas/platform';
import { TranslationsSlice } from './ui/TranslationsSlice';

export const manifest: SliceManifest = {
  id: 'translations',
  title: 'Translations',
  tagline: 'Edit, version, roll back and audit the backend-served catalogs',
  domain: 'Platform',
  Component: TranslationsSlice,
};

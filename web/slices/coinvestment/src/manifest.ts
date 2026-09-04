import type { SliceManifest } from '@atlas/platform';
import { CoInvestmentSlice } from './ui/CoInvestmentSlice';

export const manifest: SliceManifest = {
  id: 'coinvestment',
  title: 'Fund & Hierarchy',
  tagline: 'Navigate vehicles, sleeves & holdings',
  domain: 'Fund Management',
  Component: CoInvestmentSlice,
};

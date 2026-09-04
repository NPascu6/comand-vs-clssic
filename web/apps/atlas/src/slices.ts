import type { SliceManifest } from '@atlas/platform';
import { manifest as commitCapital } from '@atlas/slice-commit-capital';
import { manifest as appetite } from '@atlas/slice-appetite';
import { manifest as coinvestment } from '@atlas/slice-coinvestment';
import { manifest as dealPipeline } from '@atlas/slice-deal-pipeline';
import { manifest as workspace } from '@atlas/slice-workspace';
import { manifest as translations } from '@atlas/slice-translations';

// Order drives the nav grouping by `domain`.
export const slices: SliceManifest[] = [commitCapital, appetite, dealPipeline, coinvestment, workspace, translations];

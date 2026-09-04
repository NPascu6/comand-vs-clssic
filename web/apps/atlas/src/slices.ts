import type { SliceManifest } from '@atlas/platform';
import { manifest as commitCapital } from '@atlas/slice-commit-capital';
import { manifest as appetite } from '@atlas/slice-appetite';
import { manifest as coinvestment } from '@atlas/slice-coinvestment';
import { manifest as dealPipeline } from '@atlas/slice-deal-pipeline';
import { manifest as workspace } from '@atlas/slice-workspace';

// The slice registry. The shell knows nothing about what is inside a slice —
// it only consumes the manifest. Adding a business domain is: build the package,
// add one line here. (Order also drives nav grouping by `domain`.)
export const slices: SliceManifest[] = [commitCapital, appetite, dealPipeline, coinvestment, workspace];

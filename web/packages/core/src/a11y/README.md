# a11y

## Purpose

The accessibility gates, run as tests. `componentSamples.tsx` renders every component in the
library once; `componentA11y.test.tsx` puts each through axe in light, dark and high contrast;
the contrast tests measure the palette pairs the theme promises.

One sample list, so a component added to the library cannot skip the gate.

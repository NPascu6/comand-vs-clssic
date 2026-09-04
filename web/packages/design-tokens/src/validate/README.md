# validate

## Purpose

The gate a release has to clear. `contrast.ts` measures the WCAG 2.1 ratio for every pair the
theme promises — text on its surface, a control on its background — in every mode, and grades it
against AA. A translucent surface is composited over what sits behind it first, because the
ratio a reader experiences is the one that counts.

Measured, not assumed: pairs are only added here when a real component renders them.

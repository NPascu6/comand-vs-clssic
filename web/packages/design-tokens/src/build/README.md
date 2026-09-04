# build

## Purpose

A token set becomes `ThemeInputs`. `theme.ts` reads each schema through the cascade — the shared
groups from Base, a palette per mode, the component tokens — and holds the two rules a schema
cannot express: a contained button is all four tokens or none, and every mode the export carries
is checked whether the theme reads it or not. `overrides.ts` deep-merges an application's values
onto the result without mutating it.

# figma

## Purpose

The boundary with Figma. `variables.ts` converts their `/v1/files/:key/variables/local` payload
into DTCG files — resolving `VARIABLE_ALIAS` references, and reading `scopes` to decide whether a
number is a corner radius, a font size or a stroke. `sha256.ts` is a dependency-free digest, used
to fingerprint the token *values* so reformatting or reordering the export never looks like a change.

# schema

## Purpose

Every token the theme requires, stated once. Each group is a declarative object — `'number'`,
`'color'`, `'colorToken'`, or `at(path, kind)` when the key and the path differ, `list(kind, n)`
for a series. From that one statement the rest is derived: the TypeScript type (`TokensOf`), the
path table a release is checked against (`paths`), the reader, and the key order of every emitted
target. Adding a token is one line here and nothing anywhere else.

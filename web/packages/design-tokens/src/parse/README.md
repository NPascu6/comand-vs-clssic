# parse

## Purpose

DTCG files in, resolved values out. `dtcg.ts` reads the W3C format into `path → token` per mode;
`cascade.ts` looks a path up in the mode then in Base, follows alias chains and refuses cycles, and
reads a schema into the object it describes; `normalise.ts` turns each kind into the one form the
theme carries — `#RRGGBB`, a px number, a font stack; `palettePath.ts` is the grammar of what a
component colour may name in the palette.

No I/O: the caller reads the files, so this runs under Node, Deno and in a test alike.

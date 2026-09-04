# primitives

## Purpose

MUI's `Stack` and `Typography`, forwarded with a small vocabulary. `Stack` takes its gap from the
space scale and nothing else — `direction`, `align`, `justify`, `wrap`, `grow` is the whole of it.
`Text` is the type ramp, one variant per entry the designer owns, and a tone from the palette.
`Icon` is the seam for a product's own artwork: whatever it wraps is sized from
`component.icon.*` and inherits the surrounding colour; spread `svgDefaults` on a custom `<svg>`.

Nothing here has a stylesheet. The theme styles MUI from the tokens; these only choose props.

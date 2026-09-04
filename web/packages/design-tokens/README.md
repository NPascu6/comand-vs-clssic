# `@atlas/design-tokens` — Figma variables → theme inputs

The design system's colours, fonts, radii and type scale are **owned in Figma**.
This package turns the Figma Variables export (W3C Design Tokens JSON) into the
typed inputs `createAtlasTheme` reads, so every core component — and therefore
every Storybook story and every slice — restyles from Figma without a code change.

```
figma/*.tokens.json  ──►  pnpm --filter @atlas/design-tokens build  ──►  src/generated/theme-inputs.ts  ──►  @atlas/core createAtlasTheme
      (design)                      (transform, no deps)                      (committed, typed)                  (MUI theme, 3 modes)
```

No runtime dependency: the transform is pure TypeScript, the CLI runs on Node
(≥ 23.6, which executes `.ts` directly), and CI checks the committed output
against the export with `deno test`.

## Layout

```
figma/                        the export, one file per Figma collection + mode
  Atlas.Light.tokens.json       mode-specific tokens (colour, border, focus)
  Atlas.Dark.tokens.json
  Atlas.Contrast.tokens.json
  Atlas.Base.tokens.json        mode-independent tokens (font, radius, typography)
src/
  dtcg.ts                     parse DTCG files → flat tokens (groups, $type inheritance, aliases); TokenError
  manifest.ts                 the ThemeInputs types + the token paths the theme requires
  transform.ts                tokens → ThemeInputs (alias resolution, validation, normalisation)
  emit.ts                     ThemeInputs → TypeScript source text (deterministic)
  generated/theme-inputs.ts   the committed output — never edited by hand
  index.ts                    public API
scripts/build-tokens.ts           the CLI: `build` (write, then compile the package) and `check` (fail if the output would change)
scripts/node.d.ts                 the few node:fs / node:process signatures the CLI uses (no @types/node)
```

## Export format (what `figma/` holds)

Figma's **Variables Import/Export** writes one file per collection and mode,
named `<Collection>.<Mode>.tokens.json`, in the W3C Design Tokens (DTCG) shape:

```json
{
  "color": {
    "$type": "color",
    "primary": {
      "main": { "$value": "#0F2143" },
      "light": { "$value": "#1B3460" },
      "contrastText": { "$value": "#FFFFFF" }
    },
    "info": { "main": { "$value": "{color.secondary.main}" } }
  },
  "border": { "width": { "$type": "number", "$value": 1 }, "color": { "$type": "color", "$value": "{color.divider}" } }
}
```

Supported, per the DTCG spec and what Figma actually emits:

- Groups nest; `$type` on a group applies to every token below it; a token is any
  object with `$value`. `$description` and `$extensions` are ignored.
- **Aliases**: `"$value": "{path.to.token}"` — resolved within the same mode file
  first, then in `Base`; chains are followed; a cycle or an unknown target is an error.
- **Types**: `color` (`#RGB`, `#RRGGBB`, `#RRGGBBAA`, `rgb()/rgba()`, or the DTCG
  colour object `{ "hex": "#…" }`), `number`, `dimension` (`8`, `"8px"`, or
  `{ "value": 8, "unit": "px" }` → number of px), `fontFamily` (string or array →
  comma-joined stack, names with spaces double-quoted), `fontWeight` (number), `string`. Colours are normalised to
  upper-case `#RRGGBB` (alpha kept as `rgba(r,g,b,a)`).
- The mode is the file name's second segment, lower-cased; `Base` is shared.

## The contract: what the theme needs (`src/manifest.ts`)

```ts
export type ThemeMode = 'light' | 'dark' | 'contrast';

export interface PaletteInputs {
  /** MUI palette mode; contrast is a light palette pushed to black/white. */
  mode: 'light' | 'dark';
  primary: { main: string; light: string; contrastText: string };
  secondary: { main: string };
  success: { main: string };
  warning: { main: string };
  error: { main: string };
  info: { main: string };
  text: { primary: string; secondary: string };
  divider: string;
  background: { default: string; paper: string };
  /** Outline of cards, grids, inputs, chips. 1px divider normally; 2px black in contrast. */
  border: { width: number; color: string };
  /** Focus ring. width 0 = MUI's default ring; contrast uses 3px black. */
  focus: { width: number; color: string };
  /** Contained buttons in contrast mode: black text on white with a border, inverting on hover; absent otherwise. */
  buttonContained?: { background: string; text: string; hoverBackground: string; hoverText: string };
}

export interface ThemeInputs {
  palettes: Record<ThemeMode, PaletteInputs>;
  font: { sans: string; mono: string };
  /** control = buttons, inputs, MUI shape.borderRadius; surface = cards, papers, the data grid. */
  radius: { control: number; surface: number };
  typography: {
    button: { weight: number };
    chip: { weight: number };
    overline: { size: number; weight: number; letterSpacing: string; lineHeight: number };
    tableHeader: { size: number; weight: number; letterSpacing: string };
  };
}
```

Required token paths, per mode file: `palette.mode`, `color.primary.main|light|contrastText`,
`color.secondary.main`, `color.success.main`, `color.warning.main`, `color.error.main`,
`color.info.main`, `color.text.primary|secondary`, `color.divider`,
`color.background.default|paper`, `border.width|color`, `focus.width|color`; optional:
`button.contained.background|text|hoverBackground|hoverText` (all four or none).
In `Base`: `font.sans|mono`, `radius.control|surface`, `typography.button.weight`,
`typography.chip.weight`, `typography.overline.size|weight|letterSpacing|lineHeight`,
`typography.tableHeader.size|weight|letterSpacing`.

A missing required path, an extra mode without the required set, or a value of the
wrong type fails the build with the path in the message — Figma mistakes surface at
build time, never in the browser.

## Commands

```bash
pnpm --filter @atlas/design-tokens build          # figma/*.tokens.json → src/generated/theme-inputs.ts, then tsc → dist/
pnpm --filter @atlas/design-tokens check          # exit 1 if the committed output is stale (what CI asserts)
deno test -A                                      # from the repo root: the export ⇔ generated check + unit tests
```

## Public API (`src/index.ts`)

```ts
export type { ThemeMode, PaletteInputs, ThemeInputs } from './manifest';
export { themeInputs } from './generated/theme-inputs';     // what core consumes
export { parseDtcgFiles } from './dtcg';                     // (files: {name, json}[]) → TokenSet
export { transform } from './transform';                     // (TokenSet) → ThemeInputs   (throws TokenError)
export { emit } from './emit';                               // (ThemeInputs) → string
export { TokenError } from './dtcg';
```

`parseDtcgFiles`, `transform` and `emit` take and return plain data — no file system,
no Node APIs — so the same functions run under Node (the CLI) and Deno (CI).

## Updating the design

1. In Figma, edit the variables and export the collection (all modes).
2. Replace the files in `figma/`.
3. `pnpm --filter @atlas/design-tokens build`, then open Storybook — the *Theme / Tokens*
   story shows every swatch per mode and the components restyled.
4. Commit the export **and** the generated file together; CI refuses a mismatch.

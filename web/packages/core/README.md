# `@atlas/core` — the Atlas design system

An **owned, stable API over MUI**: the theme, its tokens, and the basic controls
that read them. An application imports from `@atlas/core` only — never from
`@mui/*` — so the implementation can change underneath it and the application
code never learns which library is drawing the pixels.

The bar, and the reason this package exists:

> **Application code contains behaviour and business logic only.**
> No `sx`, no `style`, no CSS, no colour, no `px`, no hand-rolled layout.
> Every visual decision arrives as a prop on a core component, or as a token.

---

## The two-way contract

| owner | owns | changes it by |
|---|---|---|
| **Designers** | every configurable visual value: the palettes, the type ramp, the spacing scale, the radii — and each component's own dimensions and colours | editing Figma variables and re-exporting |
| **Developers** | behaviour, composition, accessibility, and *which* tokens a component reads; the variants, tones and sizes it supports | editing this package |
| **Applications** | which tokens they lay over the shipped ones | `tokens` on the provider, or `AtlasTokenScope` |

Two consequences the package is built to hold:

- **A designer may retune a value, not invent behaviour.** A token nobody
  consumes does nothing: it builds, it ships, it changes no pixel. The usage map
  (`src/generated/token-usage.ts`) is generated from a scan of the source, and CI
  fails when a component token has no reader.
- **A developer may not invent a value.** No colour, radius, spacing or
  dimension literal lives in `src/**` — everything comes from the theme's own
  tokens (`theme.atlas.tokens`, `useAtlasTokens()`) or, in the theme builder
  itself, from `themeInputs`.

## The layers

```
Figma Variables            @atlas/design-tokens        @atlas/core                the application
───────────────            ────────────────────        ───────────                ───────────────
Atlas.Base (global +       parse → cascade → validate  createAtlasTheme(mode)     <AtlasThemeProvider>
  component tokens)  ────► src/generated/        ────► theme + controls     ────► behaviour only
Atlas.Light/Dark/Contrast    theme-inputs.ts            no `sx` on any prop        no styling at all
```

Each arrow is one-way. A designer changing a hex or a padding in Figma
re-exports, the build regenerates `theme-inputs.ts`, and every component
restyles — no component edit, no application edit.

## Ground rules

- **Runtime**: React 18, TypeScript strict, `verbatimModuleSyntax` (use
  `import type`), extensionless relative imports.
- **Dependencies**: `@mui/material@9`, `@mui/icons-material@9`, emotion. MUI is
  an implementation detail: it never appears in a public prop type.
- **No `sx` in a public API.** A component's props are its contract; `sx` would
  leak the library underneath and let a call site invent a visual decision.
- **Everything sizes itself from a token**, read through the theme so an
  override reaches it.

## Folder structure

```
src/
  theme/        createAtlasTheme, the provider, token scopes, the mode switcher, Swatch
  primitives/   Stack, Split, Columns, Text — and the spacing scale
  layout/       AppHeader, Brand, Page — the frame a page sits in
  controls/     Button, IconButton, ButtonGroup, TextField, Select, SearchField,
                Field, Checkbox, RadioGroup, Toggle, ToggleGroup
  system/       the slot contract
  a11y/         contrast tests over the palettes
  generated/    token-usage.ts (do not edit)
```

## Tokens: two classes, one export

`@atlas/design-tokens` emits one typed object, `themeInputs`:

- **Global tokens** — `palettes`, `font`, `radius`, `opacity`, `typography`,
  `space`, `layout`. What a whole theme is made of.
- **Component tokens** — `components.button`, `.input`, `.field`, `.header`.
  One component's own dimensions and colours, so a designer can retune a control
  without touching React.

A component token that is a colour holds a **palette path** (`'divider'`,
`'primary.main'`), not a hex, so it means the same thing in every mode. Resolve
it with `resolveColorToken(theme, token)`.

## Theme: three modes

`light`, `dark`, `contrast` — one token export read three ways.

```tsx
import { AtlasThemeProvider } from '@atlas/core';

<AtlasThemeProvider>
  <App />
</AtlasThemeProvider>
```

The provider persists the mode, stamps `data-theme` on `<html>` (which
`generated/tokens.css` keys on), and exposes `useAtlasTheme()` for the current
mode. `atlasTheme` is the whole design system as one ready-made object for a host
that wants the defaults and nothing to configure.

## Overrides: how an application re-skins

An application changes how the design system looks by **passing token values**,
never by writing CSS. Every token is reachable, and the three ways compose.

```tsx
// The whole application.
<AtlasThemeProvider tokens={{ components: { button: { radius: 4 } } }}>

// One subtree — where a consumer would otherwise have reached for a stylesheet.
<AtlasTokenScope tokens={{ palettes: { light: { primary: { main: '#7A4E24' } } } }}>
  <Button>Commit capital</Button>
</AtlasTokenScope>

// Any component can read what the theme resolved.
const tokens = useAtlasTokens();
```

`AtlasTokenScope` starts from the tokens its parent resolved, not from the
shipped defaults, so scopes nest. `theme/tokenOverrides.test.tsx` proves an
override reaches the **emitted CSS rules**, not merely the theme object.

## The tone vocabulary

`primary · secondary · success · warning · danger · info · neutral`.

A call site names the *intent*; the theme decides the colour. `danger` maps onto
MUI's `error` palette — the vocabulary is the design system's, not the library's.

## The inventory

**Theme (6)** — `AtlasThemeProvider`, `AtlasTokenScope`, `ThemeSwitcher`,
`Swatch`, `useAtlasTheme`, `useAtlasTokens` (plus `createAtlasTheme`,
`getAtlasTheme`, `atlasTheme`).

**Primitives (4)** — `Stack`, `Split`, `Columns`/`Column`, `Text`.

**Layout (3)** — `AppHeader`, `Brand`, `Page`.

**Controls (11)** — `Button`, `IconButton`, `ButtonGroup`, `TextField`,
`Select`, `SearchField`, `Field`, `Checkbox`, `RadioGroup`, `Toggle`,
`ToggleGroup`.

The layout pieces are deliberately granular: `AppHeader` is a surface and
arranges nothing, so `Split`, `Brand` and whatever the application puts in the
bar stay separately usable.

## Customization, in order of preference

1. **Props** — variant, tone, size, state. What the design system supports outright.
2. **Tokens** — the provider or a scope, when the value itself should change.
3. **Slots** — replace a documented part (`slots`, `slotProps`) where a component
   offers them.
4. **`className`** — deliberately exceptional, and deliberately a class rather
   than a style object, so a reviewer sees the exception in the diff.

## Storybook

`pnpm --filter @atlas/core storybook` — one canonical story per component, plus
the token and palette pages. It is the shopfront, not a variant catalogue: the
argument controls cover the rest of the surface.

## Adding a component token

1. Add the variable in Figma under `component/<name>/<property>` and re-export.
2. Add it to `componentTokens.ts` (type), `componentPaths.ts` (path and kind) and
   `componentValues.ts` (read) in `@atlas/design-tokens`, then run its build.
3. Read it in the component through the theme — `theme.atlas.tokens.components…`
   or `useAtlasTokens()` — so an override reaches it.
4. `pnpm --filter @atlas/core tokens:usage` to regenerate the usage map.

A token with no reader fails CI, on purpose.

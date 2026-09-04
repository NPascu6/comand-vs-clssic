# theme

## Purpose

Binding the token export to MUI, and to a running application. `build/createAtlasTheme` maps the
tokens onto MUI's palette and typography and styles its components from `var(--atlas-…)` custom
properties. `AtlasThemeProvider` writes those properties for the mode onto `<html>` — so an
application configures nothing but this provider — and `AtlasTokenScope` rewrites them for one
subtree, which is how a host reskins a component without CSS. `useAtlasTokens` reads the resolved
values.

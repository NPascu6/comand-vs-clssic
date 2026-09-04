// The design system: the tokens a designer owns bound to MUI, and MUI's components forwarded with
// a small vocabulary of props. '@atlas/core/mui' and '@atlas/core/mui-icons' carry the rest.

export { AtlasThemeProvider, useAtlasTheme } from './theme/AtlasThemeProvider';
export type { AtlasThemeContextValue, AtlasThemeProviderProps } from './theme/AtlasThemeProvider';
export { AtlasTokenScope } from './theme/AtlasTokenScope';
export { atlasTheme, createAtlasTheme, DEFAULT_MODE, getAtlasTheme, THEME_MODES } from './theme/build/createAtlasTheme';
export type { AtlasTheme, CreateAtlasThemeOptions, ThemeMode, ThemeOverrides } from './theme/build/createAtlasTheme';
export { useAtlasTokens } from './theme/useAtlasTokens';
export { ThemeSwitcher } from './theme/ThemeSwitcher';
export { TONES } from './system/tones';
export type { Tone } from './system/tones';
export { themeInputs } from '@atlas/design-tokens';
export type { ComponentTokens, PaletteInputs, ThemeInputs, TypeRamp, TypeStyle } from '@atlas/design-tokens';
export { tokenUsage } from './generated/token-usage';

export { Text, TEXT_VARIANTS } from './primitives/Text';
export type { TextProps, TextTone, TextVariant } from './primitives/Text';
export { Stack, STACK_ALIGNMENTS, STACK_JUSTIFICATIONS } from './primitives/Stack';
export type { StackAlign, StackJustify, StackProps } from './primitives/Stack';
export { Icon, ICON_SIZES, svgDefaults } from './primitives/Icon';
export type { IconProps, IconSize } from './primitives/Icon';
export { SPACES, spacingIn, useSpacing } from './primitives/space';
export type { Space } from './primitives/space';

export { Button, BUTTON_SIZES, BUTTON_VARIANTS } from './controls/Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './controls/Button';
export { IconButton } from './controls/IconButton';
export type { IconButtonProps } from './controls/IconButton';

export { AppHeader, MenuButton } from './layout/AppHeader';
export type { AppHeaderProps, HeaderSize, HeaderSurface, MenuButtonProps } from './layout/AppHeader';
export { Brand } from './layout/Brand';
export type { BrandProps } from './layout/Brand';
export { Page } from './layout/Page';
export type { PageProps } from './layout/Page';

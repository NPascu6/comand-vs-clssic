import type { TokensOf } from './kinds.ts';

/** Component tokens live in Base. A colour stays a palette path, so one value means the intended colour in every mode. */
export const components = {
  button: {
    heightSm: 'number', heightMd: 'number', heightLg: 'number',
    paddingInlineSm: 'number', paddingInlineMd: 'number', paddingInlineLg: 'number',
    gap: 'number', radius: 'number', fontWeight: 'fontWeight',
    solidBackground: 'colorToken', solidText: 'colorToken', solidHoverBackground: 'colorToken',
    softBackground: 'colorToken', softText: 'colorToken',
    outlineBorder: 'colorToken', outlineText: 'colorToken',
    ghostText: 'colorToken', hoverSurface: 'colorToken',
  },
  icon: { sizeSm: 'number', sizeMd: 'number', sizeLg: 'number' },
  header: {
    height: 'number', heightCompact: 'number', paddingInline: 'number', gap: 'number', borderColor: 'colorToken',
    adornmentGap: 'number', adornmentSize: 'number',
  },
} as const;

export type ComponentTokens = TokensOf<typeof components>;
export type ButtonTokens = ComponentTokens['button'];
export type IconTokens = ComponentTokens['icon'];
export type HeaderTokens = ComponentTokens['header'];

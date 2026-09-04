import type { ThemeInputs } from '@atlas/design-tokens';
import { useAtlasTokens } from '../theme/useAtlasTokens';

export type Space = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export const SPACES: readonly Space[] = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];

/** The scale is a token, so an override moves every gap in the system at once. */
export const spacingIn = (tokens: ThemeInputs, space: Space): number =>
  space === 'none' ? 0 : tokens.space[space];

/** `const spacing = useSpacing()` then `spacing('md')`, for a component reading the live scale. */
export function useSpacing(): (space: Space) => number {
  const tokens = useAtlasTokens();
  return (space) => spacingIn(tokens, space);
}

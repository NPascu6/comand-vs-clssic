// By path, not by name: this folder is build tooling and has no node_modules of its own.
import { themeInputs } from '../../packages/design-tokens/src/generated/theme-inputs.ts';

type TokenGroup = Readonly<Record<string, unknown>>;

const GLOBAL_GROUPS: Readonly<Record<string, TokenGroup>> = {
  font: themeInputs.font,
  radius: themeInputs.radius,
  opacity: themeInputs.opacity,
  typography: themeInputs.typography,
  space: themeInputs.space,
  layout: themeInputs.layout,
};

function isTokenGroup(value: unknown): value is TokenGroup {
  return typeof value === 'object' && value !== null;
}

function leafPathsOf(group: TokenGroup, prefix: string): readonly string[] {
  return Object.entries(group).flatMap(([key, value]) =>
    isTokenGroup(value) ? leafPathsOf(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

const globalPaths = Object.entries(GLOBAL_GROUPS).flatMap(([group, tokens]) => leafPathsOf(tokens, `${group}.`));

const componentPaths = Object.entries(themeInputs.components).flatMap(([group, tokens]) =>
  Object.keys(tokens).map((property) => `components.${group}.${property}`),
);

export const TOKEN_PATHS: ReadonlySet<string> = new Set([...globalPaths, ...componentPaths].sort());

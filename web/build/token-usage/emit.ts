import type { TokenUsage } from './scan.ts';

const HEADER = [
  '// generated — do not edit. `pnpm tokens:usage` rewrites this file from src/**.',
  '// Token path → the components that read it: the blast radius of changing that token in Figma.',
].join('\n');

const DECLARATION = 'export const tokenUsage: Readonly<Record<string, readonly string[]>> = {';

function entryOf(path: string, components: readonly string[]): string {
  return `  '${path}': [${components.map((component) => `'${component}'`).join(', ')}],`;
}

export function emitTokenUsage(usage: TokenUsage): string {
  const entries = Object.entries(usage).map(([path, components]) => entryOf(path, components));
  return [HEADER, '', DECLARATION, ...entries, '};', ''].join('\n');
}

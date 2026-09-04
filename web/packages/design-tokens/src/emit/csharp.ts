import { flattenTheme, tokensFor } from './flatten.ts';
import { THEME_MODES } from '../schema/palette.ts';
import type { ThemeInputs } from '../schema/theme.ts';

const HEADER = `// generated — do not edit. \`pnpm --filter @atlas/design-tokens build\` rewrites this file from figma/*.tokens.json.
using System.Collections.Frozen;

namespace Atlas.DesignTokens;

public static partial class Tokens
{`;

/** The .NET target: the same values the browser uses, so a server-rendered document never drifts. */
export function emitCSharp(inputs: ThemeInputs, version: string): string {
  const flat = flattenTheme(inputs);
  const sets = THEME_MODES.flatMap((mode) => [
    `        [${quote(mode)}] = new Dictionary<string, string>`,
    '        {',
    ...Object.entries(tokensFor(flat, mode)).map(([path, value]) => `            [${quote(path)}] = ${quote(String(value))},`),
    '        }.ToFrozenDictionary(),',
  ]);
  return [
    HEADER,
    '    /// <summary>The design-tokens version this file was generated from.</summary>',
    `    public const string Version = ${quote(version)};`,
    '',
    '    /// <summary>mode → every token of that mode, the mode-independent ones included.</summary>',
    '    internal static readonly FrozenDictionary<string, FrozenDictionary<string, string>> Sets =',
    '        new Dictionary<string, FrozenDictionary<string, string>>',
    '        {',
    ...sets,
    '        }.ToFrozenDictionary();',
    '}',
    '',
  ].join('\n');
}

const quote = (value: string): string => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

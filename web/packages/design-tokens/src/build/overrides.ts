import type { ThemeInputs } from '../schema/theme.ts';

/** An array is replaced whole: `series` is an ordered set, not a bag of indices. */
export type DeepPartial<T> = T extends readonly (infer Item)[] ? readonly Item[]
  : T extends object ? { [Key in keyof T]?: DeepPartial<T[Key]> }
  : T;

export type ThemeOverrides = DeepPartial<ThemeInputs>;

/** The overrides laid over the export — non-mutating, so a host can hold several skins at once. */
export function applyOverrides(inputs: ThemeInputs, overrides?: ThemeOverrides): ThemeInputs {
  return overrides ? (merge(inputs, overrides) as ThemeInputs) : inputs;
}

function merge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (Array.isArray(over) || !isRecord(over) || !isRecord(base)) return over;
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(over)) merged[key] = merge(base[key], value);
  return merged;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

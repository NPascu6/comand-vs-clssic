/** Constrain n to the inclusive [min, max] range. */
export const clamp = (n: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, n));

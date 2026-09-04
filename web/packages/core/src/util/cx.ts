/** Tiny class-name joiner — no `clsx` dependency (the team avoids library coupling). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

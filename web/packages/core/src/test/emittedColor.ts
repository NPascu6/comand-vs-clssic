import { themeInputs } from '@atlas/design-tokens';
import { DEFAULT_MODE } from '../theme/build/createAtlasTheme';

export const RENDERED_PALETTE = themeInputs.palettes[DEFAULT_MODE];

const VARIABLE = /^var\((--[\w-]+)(?:,\s*(.+))?\)$/;

const rules = (): readonly CSSStyleRule[] =>
  [...document.styleSheets]
    .flatMap((sheet) => [...sheet.cssRules])
    .flatMap((rule) => (rule instanceof CSSMediaRule ? [...rule.cssRules] : [rule]))
    .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule);

const CLASS_IN_SELECTOR = /\.([\w-]+)/g;

// Whole class names, not substrings: `.atlas-text` must not match `.atlas-text--tone-primary`.
const matching = (element: Element): readonly CSSStyleRule[] => {
  const own = new Set(element.classList);
  return rules().filter((rule) =>
    [...rule.selectorText.matchAll(CLASS_IN_SELECTOR)].some(([, name]) => own.has(name)),
  );
};

/**
 * What a custom property resolves to here: the nearest ancestor that sets it inline — which is
 * how a token override reaches a subtree — falling back to the mode's block in the stylesheet.
 */
function resolveVariable(element: Element, name: string): string | undefined {
  for (let node: Element | null = element; node !== null; node = node.parentElement) {
    const inline = node instanceof HTMLElement ? node.style.getPropertyValue(name) : '';
    if (inline !== '') return inline.trim();
  }
  const mode = document.documentElement.dataset.theme ?? DEFAULT_MODE;
  const block = rules().find((rule) => rule.selectorText.includes(`[data-theme="${mode}"]`) || rule.selectorText.includes(':root'));
  const declared = block?.style.getPropertyValue(name) ?? '';
  return declared === '' ? undefined : declared.trim();
}

/** A declared value with any `var()` resolved, so a test asserts what the reader would see. */
function resolved(element: Element, declared: string): string {
  const reference = VARIABLE.exec(declared.trim());
  if (reference === null) return declared;
  return resolveVariable(element, reference[1]) ?? reference[2] ?? declared;
}

// jsdom resolves none of emotion's media-query-wrapped rules through getComputedStyle, and it
// substitutes no custom properties at all, so read the rules and resolve them here.
export function emittedColorsOf(element: Element): readonly string[] {
  return matching(element)
    .map((rule) => rule.style.getPropertyValue('color'))
    .filter((value) => value !== '')
    .map((value) => resolved(element, value));
}

/** The same reading, for any declaration — what a token override has to move to be real. */
export function emittedValuesOf(element: Element, property: string): readonly string[] {
  return matching(element)
    .map((rule) => rule.style.getPropertyValue(property))
    .filter((value) => value !== '')
    .map((value) => resolved(element, value));
}

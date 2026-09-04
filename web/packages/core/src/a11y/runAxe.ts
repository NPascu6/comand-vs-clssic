import axe from 'axe-core';
import type { ElementContext, Result, RunOptions } from 'axe-core';

// `color-contrast` needs a real layout engine to resolve computed colours, which jsdom has not —
// paletteContrast.test.tsx gates contrast against the tokens instead. `region` and `page-has-heading-one`
// judge a whole document, and a sample is one component.
const OPTIONS: RunOptions = {
  runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
    'page-has-heading-one': { enabled: false },
  },
};

export async function violationsOf(context: ElementContext): Promise<readonly Result[]> {
  const { violations } = await axe.run(context, OPTIONS);
  return violations;
}

export function describeViolations(violations: readonly Result[]): readonly string[] {
  return violations.flatMap((violation) =>
    violation.nodes.map((node) => `${violation.id} [${violation.impact}] ${node.target.join(' ')} — ${violation.help}`),
  );
}

import type { ThemeOverrides } from '@atlas/design-tokens';

/**
 * The values in `figma-sync/fixtures/variables.type-refresh.json`, as a token override — so the
 * page can preview the designer's edit before the sync turns it into a pull request. The two must
 * agree: this is what the reviewer sees, and the fixture is what CI commits.
 */
export const PROPOSAL: ThemeOverrides = {
  typography: {
    title: { size: 28, lineHeight: 1.25 },
    heading: { size: 22, weight: 700 },
    subheading: { size: 15 },
    body: { size: 15 },
    bodySmall: { size: 13 },
    caption: { size: 11 },
  },
  components: {
    button: { heightMd: 44, paddingInlineMd: 20, fontWeight: 700 },
    header: { height: 72, adornmentSize: 40, adornmentGap: 12 },
  },
};

/** Path → before/after, in the order the sync reports them. */
export const PROPOSED_CHANGES: ReadonlyArray<readonly [path: string, before: string, after: string]> = [
  ['component.button.fontWeight', '600', '700'],
  ['component.button.heightMd', '40px', '44px'],
  ['component.button.paddingInlineMd', '16px', '20px'],
  ['component.header.adornmentGap', '8px', '12px'],
  ['component.header.adornmentSize', '32px', '40px'],
  ['component.header.height', '64px', '72px'],
  ['typography.body.size', '16px', '15px'],
  ['typography.bodySmall.size', '14px', '13px'],
  ['typography.caption.size', '12px', '11px'],
  ['typography.heading.size', '20px', '22px'],
  ['typography.heading.weight', '600', '700'],
  ['typography.subheading.size', '14px', '15px'],
  ['typography.title.lineHeight', '1.34', '1.25'],
  ['typography.title.size', '24px', '28px'],
];

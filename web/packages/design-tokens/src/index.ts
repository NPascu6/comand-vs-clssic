// The design tokens a designer owns in Figma, and what turns them into each platform's theme.
//
//   schema/    what exists — every token stated once; types, paths, readers and emit order derive from it
//   parse/     DTCG files in, resolved values out
//   build/     a token set becomes ThemeInputs; overrides deep-merge onto it
//   emit/      ThemeInputs becomes TypeScript, CSS, JSON and C#
//   validate/  the WCAG gate a release has to clear

export * from './toolkit.ts';
export { themeInputs } from './generated/theme-inputs.ts';

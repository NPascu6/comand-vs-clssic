const EXPORT_SOURCE = /from '\.\/([^']+)'/g;
const THEME_ENTRY = 'theme/createAtlasTheme';

export function publicModulesOf(indexSource: string): ReadonlySet<string> {
  return new Set([...indexSource.matchAll(EXPORT_SOURCE)].map((match) => match[1]));
}

export function terminalModulesOf(publicModules: ReadonlySet<string>): ReadonlySet<string> {
  const components = [...publicModules].filter((module) => /^[A-Z]/.test(module.split('/').at(-1) ?? ''));
  return new Set([...components, THEME_ENTRY]);
}

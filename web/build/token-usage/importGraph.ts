import type { SourceFile } from './scan.ts';

export type ImportGraph = ReadonlyMap<string, readonly string[]>;

const RELATIVE_IMPORT = /from '(\.[^']*)'/g;

export function moduleIdOf(path: string): string {
  return path.replace(/\.tsx?$/, '');
}

function resolve(fromModule: string, specifier: string): string {
  const base = fromModule.split('/').slice(0, -1);
  const steps = specifier.split('/');
  const resolved = steps.reduce<string[]>((segments, step) => {
    if (step === '.') return segments;
    if (step === '..') return segments.slice(0, -1);
    return [...segments, step];
  }, base);
  return resolved.join('/');
}

export function importGraphOf(files: readonly SourceFile[]): ImportGraph {
  return new Map(
    files.map((file) => {
      const module = moduleIdOf(file.path);
      const targets = [...file.source.matchAll(RELATIVE_IMPORT)].map((match) => resolve(module, match[1]));
      return [module, [...new Set(targets)]];
    }),
  );
}

function importersOf(graph: ImportGraph): ReadonlyMap<string, readonly string[]> {
  const edges = [...graph].flatMap(([importer, targets]) => targets.map((target) => ({ importer, target })));
  const targets = [...new Set(edges.map((edge) => edge.target))];
  return new Map(
    targets.map((target) => [
      target,
      [...new Set(edges.filter((edge) => edge.target === target).map((edge) => edge.importer))],
    ]),
  );
}

export function attributionOf(
  graph: ImportGraph,
  terminals: ReadonlySet<string>,
): (module: string) => readonly string[] {
  const importers = importersOf(graph);
  return (module) => {
    const seen = new Set<string>();
    const reached = new Set<string>();
    const queue = [module];
    while (queue.length > 0) {
      const [current, ...rest] = queue;
      queue.length = 0;
      queue.push(...rest);
      if (seen.has(current)) continue;
      seen.add(current);
      if (terminals.has(current)) reached.add(current);
      else queue.push(...(importers.get(current) ?? []));
    }
    return reached.size > 0 ? [...reached] : [module];
  };
}

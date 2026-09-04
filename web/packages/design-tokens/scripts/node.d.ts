// @types/node is not a dependency of this package, so the few Node APIs the CLI uses are declared here.
declare module 'node:fs' {
  export function readdirSync(path: URL): string[];
  export function readFileSync(path: URL, encoding: 'utf8'): string;
  export function writeFileSync(path: URL, data: string): void;
  export function existsSync(path: URL): boolean;
}

declare module 'node:process' {
  const process: { argv: string[]; exitCode?: number };
  export default process;
}

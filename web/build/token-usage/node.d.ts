// @types/node is not a dependency of this package, so the few Node APIs the CLI uses are declared here.
declare module 'node:fs' {
  export function readdirSync(path: URL, options: { recursive: true; encoding: 'utf8' }): string[];
  export function readFileSync(path: URL, encoding: 'utf8'): string;
  export function writeFileSync(path: URL, data: string): void;
  export function existsSync(path: URL): boolean;
  export function mkdirSync(path: URL, options: { recursive: true }): string | undefined;
}

declare module 'node:process' {
  const process: { argv: string[]; exitCode?: number };
  export default process;
}

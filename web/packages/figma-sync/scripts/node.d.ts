// @types/node is not a dependency of this package, so the few Node APIs the CLI uses are declared here.
declare module 'node:fs' {
  export function readdirSync(path: URL): string[];
  export function readFileSync(path: URL, encoding: 'utf8'): string;
  export function writeFileSync(path: URL | string, data: string, options?: { flag: 'a' }): void;
  export function existsSync(path: URL): boolean;
  export function mkdirSync(path: URL, options: { recursive: true }): void;
  export function rmSync(path: URL): void;
}

declare module 'node:process' {
  const process: { argv: string[]; env: Record<string, string | undefined>; exitCode?: number };
  export default process;
}

// @types/node is not a dependency of the workspace, so the few Node APIs the composition server uses are declared here.
declare module 'node:http' {
  export interface IncomingMessage {
    url?: string;
  }
  export interface ServerResponse {
    writeHead(statusCode: number, headers: Record<string, string>): ServerResponse;
    end(body: string | Uint8Array): void;
  }
  export interface Server {
    listen(port: number, host: string, onListening: () => void): Server;
    close(): void;
  }
  export function createServer(handler: (request: IncomingMessage, response: ServerResponse) => void): Server;
}

declare module 'node:fs' {
  export function readFileSync(path: string): Uint8Array;
  export function writeFileSync(path: string, data: string): void;
  export function statSync(path: string, options: { throwIfNoEntry: false }): { isFile(): boolean } | undefined;
}

declare module 'node:path' {
  export const sep: string;
  export function extname(path: string): string;
  export function join(...segments: string[]): string;
  export function normalize(path: string): string;
  export function resolve(...segments: string[]): string;
}

declare module 'node:process' {
  const process: {
    exitCode?: number;
    exit(code: number): never;
    on(event: 'SIGINT', listener: () => void): void;
  };
  export default process;
}

interface ImportMeta {
  dirname: string;
}

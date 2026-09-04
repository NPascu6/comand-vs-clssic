import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { formatDtcg } from '../../packages/figma-sync/src/release/format.ts';

const EXPORT_DIR = new URL('../../packages/figma-sync/exports/studio/', import.meta.url);

/**
 * Dev only. The token studio saves here, as a DTCG export — never into `figma/`, which only the
 * sync may write, so a hand edit cannot bypass the ledger and the contrast gate.
 */
function tokenStudioSave(): Plugin {
  return {
    name: 'token-studio-save',
    configureServer(server) {
      server.middlewares.use('/__tokens', (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405;
          return response.end();
        }
        let body = '';
        request.on('data', (chunk: Buffer) => (body += chunk));
        request.on('end', () => {
          const files = JSON.parse(body) as ReadonlyArray<{ name: string; json: unknown }>;
          mkdirSync(EXPORT_DIR, { recursive: true });
          for (const file of files) writeFileSync(new URL(file.name, EXPORT_DIR), formatDtcg(file.json as never));
          response.setHeader('content-type', 'text/plain');
          response.end(
            `Saved ${files.length} files to ${fileURLToPath(EXPORT_DIR)}. Release it with:\n` +
              'node web/packages/figma-sync/scripts/figma-sync.ts --export exports/studio --author-handle <you>',
          );
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tokenStudioSave()],
  server: { port: 5175, strictPort: true },
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Connect, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import { searchTryCompanies } from './server/trySearch.ts';

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

function trySearchApi(): Plugin {
  return {
    name: 'try-search-api',
    configureServer(server) {
      server.middlewares.use('/api/try/search', (request, response, next) => {
        if (request.method !== 'POST') {
          next();
          return;
        }

        void readJsonBody(request)
          .then(searchTryCompanies)
          .then((result) => {
            response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify(result));
          })
          .catch((error: unknown) => {
            response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
            response.end(
              JSON.stringify({
                error: error instanceof Error ? error.message : '검색에 실패했습니다.',
              }),
            );
          });
      });
    },
  };
}

function readJsonBody(request: Connect.IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 65_536) reject(new Error('검색 요청이 너무 큽니다.'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body) as unknown);
      } catch {
        reject(new Error('검색 요청 형식이 올바르지 않습니다.'));
      }
    });
    request.on('error', reject);
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDirectory, '');
  if (!process.env.ALIO_API_KEY && env.ALIO_API_KEY) process.env.ALIO_API_KEY = env.ALIO_API_KEY;
  if (!process.env.JOOBLE_API_KEY && env.JOOBLE_API_KEY) {
    process.env.JOOBLE_API_KEY = env.JOOBLE_API_KEY;
  }

  return {
    plugins: [react(), tailwindcss(), trySearchApi()],
    resolve: {
      alias: {
        '@': path.resolve(rootDirectory, 'src'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        exclude: ['src/main.tsx', 'src/test/**'],
      },
    },
  };
});

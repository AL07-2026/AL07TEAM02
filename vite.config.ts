import path from 'node:path';
import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { loadEnv, type Connect, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

import {
  createColdEmailRequest,
  listColdEmailRequests,
  parseColdEmailRequestDraft,
} from './server/coldEmailRequests.ts';
import {
  createHomepageFeedback,
  listHomepageFeedback,
  parseHomepageFeedbackDraft,
} from './server/homepageFeedback.ts';
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

function coldEmailRequestsApi(): Plugin {
  return {
    name: 'cold-email-requests-api',
    configureServer(server) {
      server.middlewares.use('/api/cold-email-requests', (request, response, next) => {
        if (request.method === 'POST') {
          void readJsonBody(request)
            .then(parseColdEmailRequestDraft)
            .then(createColdEmailRequest)
            .then((result) => {
              response.writeHead(201, { 'content-type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify(result));
            })
            .catch((error: unknown) => {
              response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
              response.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : '신청 처리에 실패했습니다.',
                }),
              );
            });
          return;
        }

        if (request.method === 'GET') {
          const adminToken = process.env.ADMIN_ACCESS_TOKEN;
          if (!adminToken || request.headers.authorization !== `Bearer ${adminToken}`) {
            response.writeHead(401, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: '관리자 토큰이 올바르지 않습니다.' }));
            return;
          }

          void listColdEmailRequests()
            .then((requests) => {
              response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify({ requests }));
            })
            .catch((error: unknown) => {
              response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
              response.end(
                JSON.stringify({
                  error:
                    error instanceof Error ? error.message : '신청 목록을 불러오지 못했습니다.',
                }),
              );
            });
          return;
        }

        next();
      });
    },
  };
}

function homepageFeedbackApi(): Plugin {
  return {
    name: 'homepage-feedback-api',
    configureServer(server) {
      server.middlewares.use('/api/homepage-feedback', (request, response, next) => {
        if (request.method === 'POST') {
          void readJsonBody(request)
            .then(parseHomepageFeedbackDraft)
            .then(createHomepageFeedback)
            .then((result) => {
              response.writeHead(201, { 'content-type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify(result));
            })
            .catch((error: unknown) => {
              response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
              response.end(
                JSON.stringify({
                  error: error instanceof Error ? error.message : '피드백 제출에 실패했습니다.',
                }),
              );
            });
          return;
        }

        if (request.method === 'GET') {
          const adminToken = process.env.ADMIN_ACCESS_TOKEN;
          if (!adminToken || request.headers.authorization !== `Bearer ${adminToken}`) {
            response.writeHead(401, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: '관리자 토큰이 올바르지 않습니다.' }));
            return;
          }

          void listHomepageFeedback()
            .then((feedback) => {
              response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
              response.end(JSON.stringify({ feedback }));
            })
            .catch((error: unknown) => {
              response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
              response.end(
                JSON.stringify({
                  error:
                    error instanceof Error ? error.message : '피드백 목록을 불러오지 못했습니다.',
                }),
              );
            });
          return;
        }

        next();
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
  if (!process.env.WORK24_RECRUIT_API_KEY && env.WORK24_RECRUIT_API_KEY) {
    process.env.WORK24_RECRUIT_API_KEY = env.WORK24_RECRUIT_API_KEY;
  }
  if (!process.env.SUPABASE_URL && env.SUPABASE_URL) process.env.SUPABASE_URL = env.SUPABASE_URL;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY && env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  }
  if (!process.env.SUPABASE_SECRET_KEY && env.SUPABASE_SECRET_KEY) {
    process.env.SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY;
  }
  if (!process.env.ADMIN_ACCESS_TOKEN && env.ADMIN_ACCESS_TOKEN) {
    process.env.ADMIN_ACCESS_TOKEN = env.ADMIN_ACCESS_TOKEN;
  }

  return {
    plugins: [react(), tailwindcss(), trySearchApi(), coldEmailRequestsApi(), homepageFeedbackApi()],
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

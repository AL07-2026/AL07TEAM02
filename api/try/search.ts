import type { IncomingMessage, ServerResponse } from 'node:http';

import { searchTryCompanies } from '../../server/trySearch.js';

function readJsonBody(request: IncomingMessage) {
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

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    sendJson(response, 405, { error: 'POST 요청만 지원합니다.' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    sendJson(response, 200, await searchTryCompanies(body));
  } catch (error) {
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : '검색에 실패했습니다.',
    });
  }
}

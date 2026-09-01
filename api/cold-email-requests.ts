import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  createColdEmailRequest,
  listColdEmailRequests,
  parseColdEmailRequestDraft,
} from '../server/coldEmailRequests.js';

function readJsonBody(request: IncomingMessage) {
  return new Promise<unknown>((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      body += chunk;
      if (body.length > 65_536) reject(new Error('신청 요청이 너무 큽니다.'));
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body) as unknown);
      } catch {
        reject(new Error('신청 요청 형식이 올바르지 않습니다.'));
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function hasAdminAccess(request: IncomingMessage) {
  const adminToken = process.env.ADMIN_ACCESS_TOKEN;
  if (!adminToken) return false;

  const authorization = request.headers.authorization;
  return authorization === `Bearer ${adminToken}`;
}

export default async function handler(request: IncomingMessage, response: ServerResponse) {
  try {
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      sendJson(response, 201, await createColdEmailRequest(parseColdEmailRequestDraft(body)));
      return;
    }

    if (request.method === 'GET') {
      if (!hasAdminAccess(request)) {
        sendJson(response, 401, { error: '관리자 토큰이 올바르지 않습니다.' });
        return;
      }

      sendJson(response, 200, { requests: await listColdEmailRequests() });
      return;
    }

    response.setHeader('allow', 'GET, POST');
    sendJson(response, 405, { error: 'GET 또는 POST 요청만 지원합니다.' });
  } catch (error) {
    sendJson(response, 400, {
      error: error instanceof Error ? error.message : '신청 처리에 실패했습니다.',
    });
  }
}

import { XMLParser } from 'fast-xml-parser';

type Work24Search = {
  page?: number;
  display?: number;
};

const endpoint =
  'https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L21.do';

function normalizeApiKey(value: string) {
  return value
    .trim()
    .replace(/^WORK24_RECRUIT_API_KEY\s*=\s*/i, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function scalarString(value: unknown) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function findApiError(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) return null;
  const record = payload as Record<string, unknown>;
  for (const value of Object.values(record)) {
    if (typeof value !== 'object' || value === null) continue;
    const child = value as Record<string, unknown>;
    const code = scalarString(child.errorCd ?? child.errorCode ?? child.resultCode);
    const message = scalarString(
      child.error ?? child.errorMsg ?? child.errorMessage ?? child.resultMsg,
    );
    if (!code && message) return message;
    if (code && code !== '00' && code !== '0') {
      return message || code;
    }
  }
  return null;
}

export async function fetchWork24Jobs(apiKey: string, search: Work24Search) {
  const url = new URL(endpoint);
  url.search = new URLSearchParams({
    authKey: normalizeApiKey(apiKey),
    callTp: 'L',
    returnType: 'XML',
    startPage: String(search.page ?? 1),
    display: String(Math.min(Math.max(search.display ?? 100, 1), 100)),
    sortField: 'regDt',
    sortOrderBy: 'desc',
  }).toString();

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: 'application/xml, text/xml' },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error('고용24 API 연결에 실패했습니다.');
  }

  if (!response.ok) throw new Error(`고용24 API HTTP 오류: ${response.status}`);

  const xml = await response.text();
  let payload: unknown;
  try {
    payload = new XMLParser({ ignoreAttributes: false, parseTagValue: false }).parse(xml) as unknown;
  } catch {
    throw new Error('고용24 API 응답을 읽지 못했습니다.');
  }

  const apiError = findApiError(payload);
  if (apiError) throw new Error(`고용24 API 오류: ${apiError}`);
  if (
    typeof payload !== 'object' ||
    payload === null ||
    typeof (payload as Record<string, unknown>).dhsOpenEmpInfoList !== 'object'
  ) {
    throw new Error('고용24 공채속보 응답 형식이 올바르지 않습니다.');
  }
  return payload;
}

type JoobleSearch = {
  keywords: string;
  location?: string;
  page?: number;
};

function normalizeApiKey(value: string) {
  return value
    .trim()
    .replace(/^JOOBLE_API_KEY\s*=\s*/i, '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

export async function fetchJoobleJobs(apiKey: string, search: JoobleSearch) {
  const normalizedApiKey = normalizeApiKey(apiKey);
  let response: Response;
  try {
    response = await fetch(`https://kr.jooble.org/api/${encodeURIComponent(normalizedApiKey)}`, {
      method: 'POST',
      headers: { accept: 'application/json', 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        keywords: search.keywords,
        location: search.location ?? '',
        page: search.page ?? 1,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('Jooble API 연결에 실패했습니다.');
  }

  if (response.status === 403) {
    throw new Error(
      'Jooble API 키가 유효하지 않거나 권한이 없습니다. Vercel 환경변수 JOOBLE_API_KEY의 Value에 순수 API 키만 입력한 뒤 다시 배포해주세요.',
    );
  }

  if (!response.ok) throw new Error(`Jooble API HTTP 오류: ${response.status}`);
  return (await response.json()) as unknown;
}

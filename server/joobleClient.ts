type JoobleSearch = {
  keywords: string;
  location?: string;
  page?: number;
};

export async function fetchJoobleJobs(apiKey: string, search: JoobleSearch) {
  let response: Response;
  try {
    response = await fetch(`https://kr.jooble.org/api/${encodeURIComponent(apiKey)}`, {
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

  if (!response.ok) throw new Error(`Jooble API HTTP 오류: ${response.status}`);
  return (await response.json()) as unknown;
}

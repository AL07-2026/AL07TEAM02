// @vitest-environment node

import { fetchJoobleJobs } from './joobleClient.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchJoobleJobs', () => {
  it('검색어와 지역을 JSON으로 전송한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ totalCount: 0, jobs: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await fetchJoobleJobs('test-key', { keywords: '백엔드 개발자', location: '서울' });

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://kr.jooble.org/api/test-key');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(typeof request.body).toBe('string');
    expect(JSON.parse(request.body as string)).toEqual({
      keywords: '백엔드 개발자',
      location: '서울',
      page: 1,
    });
  });
});

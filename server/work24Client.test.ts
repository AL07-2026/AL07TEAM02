// @vitest-environment node

import { fetchWork24Jobs } from './work24Client.ts';

describe('fetchWork24Jobs', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('고용24 공채속보 목록 API를 호출하고 XML을 파싱한다', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(`<?xml version="1.0" encoding="UTF-8"?>
        <dhsOpenEmpInfoList>
          <total>1</total>
          <dhsOpenEmpInfo>
            <empSeqno>171853</empSeqno>
            <empBusiNm>테스트 주식회사</empBusiNm>
            <empWantedTitle>백엔드 개발자 모집</empWantedTitle>
          </dhsOpenEmpInfo>
        </dhsOpenEmpInfoList>`),
    );

    const payload = await fetchWork24Jobs('test-key', { display: 200 });

    const requestedUrl = fetchMock.mock.calls[0]?.[0];
    expect(requestedUrl).toBeInstanceOf(URL);
    if (!(requestedUrl instanceof URL)) throw new Error('고용24 요청 URL이 생성되지 않았습니다.');
    expect(requestedUrl.searchParams.get('authKey')).toBe('test-key');
    expect(requestedUrl.searchParams.get('display')).toBe('100');
    expect(requestedUrl.pathname).toContain('callOpenApiSvcInfo210L21.do');
    expect(payload).toMatchObject({
      dhsOpenEmpInfoList: {
        total: '1',
        dhsOpenEmpInfo: { empSeqno: '171853' },
      },
    });
  });

  it('고용24 오류 응답을 사용자에게 이해할 수 있는 오류로 바꾼다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<GO24><error>개인회원은 사용할 수 없는 OPEN-API입니다.</error></GO24>'),
    );

    await expect(fetchWork24Jobs('invalid-key', {})).rejects.toThrow(
      '고용24 API 오류: 개인회원은 사용할 수 없는 OPEN-API입니다.',
    );
  });
});

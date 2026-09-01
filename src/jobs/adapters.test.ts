import {
  adaptAlioResponse,
  adaptJoobleResponse,
  adaptSaraminResponse,
  adaptWork24Response,
} from './adapters.ts';

describe('adaptJoobleResponse', () => {
  it('Jooble 검색 응답을 공통 채용공고 형식으로 변환한다', () => {
    const [posting] = adaptJoobleResponse(
      {
        totalCount: 1,
        jobs: [
          {
            id: 6853340702360284000,
            title: 'Backend Developer',
            company: '테스트랩',
            location: '서울',
            snippet: '<b>TypeScript</b>와 AWS 기반 서버 개발',
            type: '정규직',
            link: 'https://kr.jooble.org/desc/6853340702360284249',
            updated: '2026-08-12T23:27:48+09:00',
          },
        ],
      },
      '2026-08-13T00:00:00+09:00',
    );

    expect(posting).toMatchObject({
      source: 'jooble',
      externalId: '6853340702360284249',
      companyName: '테스트랩',
      jobFamily: 'engineering',
      description: 'TypeScript와 AWS 기반 서버 개발',
      location: '서울',
      active: true,
    });
    expect(posting?.skills).toEqual(expect.arrayContaining(['TypeScript', 'AWS']));
  });
});

describe('adaptSaraminResponse', () => {
  it('사람인 검색 응답을 공통 채용공고 형식으로 변환한다', () => {
    const [posting] = adaptSaraminResponse(
      {
        jobs: {
          job: [
            {
              id: '123',
              url: 'https://www.saramin.co.kr/job/123',
              active: 1,
              'posting-timestamp': 1785510000,
              'modification-timestamp': 1785510000,
              'expiration-timestamp': 1788188400,
              company: { detail: { name: '(주)테스트' } },
              position: {
                title: 'B2B 영업 담당자',
                industry: { name: '솔루션·SI' },
                location: { name: '서울' },
                'job-type': { name: '정규직' },
              },
              keyword: 'B2B영업,Salesforce,CRM',
            },
          ],
        },
      },
      '2026-08-12T00:00:00.000Z',
    );

    expect(posting).toMatchObject({
      source: 'saramin',
      externalId: '123',
      companyName: '(주)테스트',
      jobFamily: 'sales',
      active: true,
    });
    expect(posting?.skills).toContain('Salesforce');
  });
});

describe('adaptWork24Response', () => {
  it('고용24 공채속보 응답을 공통 채용공고 형식으로 변환한다', () => {
    const [posting] = adaptWork24Response(
      {
        dhsOpenEmpInfoList: {
          total: '1',
          dhsOpenEmpInfo: {
            empSeqno: '171853',
            empWantedTitle: '백엔드 개발자 모집',
            empBusiNm: '테스트 주식회사',
            coClcdNm: '중견기업',
            empWantedStdt: '20260831',
            empWantedEndt: '20260930',
            empWantedTypeNm: '정규직',
            empWantedHomepgDetail: 'https://www.work24.go.kr/job/test',
          },
        },
      },
      '2026-09-01T00:00:00+09:00',
    );

    expect(posting).toMatchObject({
      source: 'work24',
      externalId: '171853',
      companyName: '테스트 주식회사',
      title: '백엔드 개발자 모집',
      industry: '중견기업',
      location: '',
      employmentType: '정규직',
      publishedAt: '2026-08-30T15:00:00.000Z',
      expiresAt: '2026-09-29T15:00:00.000Z',
      active: true,
    });
    expect(posting?.jobFamily).toBe('engineering');
  });
});

describe('adaptAlioResponse', () => {
  it('ALIO 채용공시 응답을 공통 채용공고 형식으로 변환한다', () => {
    const [posting] = adaptAlioResponse(
      {
        resultCode: 200,
        resultMsg: '성공했습니다.',
        totalCount: 1,
        result: [
          {
            recrutPblntSn: 303696,
            instNm: '(재)우체국물류지원단',
            recrutPbancTtl: '기간제 채용 공고',
            ncsCdNmLst: '운전.운송',
            recrutNope: 30,
            workRgnNmLst: '서울',
            pbancBgngYmd: '20260810',
            pbancEndYmd: '20260812',
            ongoingYn: 'Y',
            srcUrl: 'https://example.com/recruit/303696',
            hireTypeNmLst: '비정규직',
            recrutSeNm: '신입+경력',
            aplyQlfcCn: '즉시 근무 가능한 자',
          },
        ],
      },
      '2026-08-12T00:00:00+09:00',
    );

    expect(posting).toMatchObject({
      source: 'alio',
      externalId: '303696',
      companyName: '(재)우체국물류지원단',
      headcount: 30,
      location: '서울',
      active: true,
      publishedAt: '2026-08-09T15:00:00.000Z',
    });
  });
});

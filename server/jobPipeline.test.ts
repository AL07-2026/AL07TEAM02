// @vitest-environment node

import { runJobPipeline } from './jobPipeline.ts';

describe('runJobPipeline', () => {
  it('API 응답을 변환해 저장하고 같은 실행에서 역할별 분석 결과를 만든다', () => {
    const result = runJobPipeline({
      source: 'saramin',
      databasePath: ':memory:',
      collectedAt: '2026-08-12T00:00:00+09:00',
      request: { role: 'sales', query: 'ATS 채용관리' },
      payload: {
        jobs: {
          job: [
            {
              id: '123',
              url: 'https://www.saramin.co.kr/job/123',
              active: 1,
              'posting-date': '2026-08-01',
              company: { detail: { name: '(주)테스트' } },
              position: {
                title: '채용 운영 담당자',
                industry: { name: 'IT·SaaS' },
                location: { name: '서울' },
                'job-type': { name: '정규직' },
              },
              keyword: 'ATS,채용관리,인사',
            },
          ],
        },
      },
    });

    expect(result.importSummary).toMatchObject({ received: 1, inserted: 1 });
    expect(result.storedPostingCount).toBe(1);
    expect(result.analysis[0]).toMatchObject({ companyName: '(주)테스트', role: 'sales' });
    expect(result.analysis[0]?.evidenceUrls).toEqual(['https://www.saramin.co.kr/job/123']);
  });
});

// @vitest-environment node

import { normalizeJobPosting } from '../src/jobs/normalize.ts';
import { JobStore } from './jobStore.ts';

describe('JobStore', () => {
  it('같은 날 동일한 공고를 다시 넣어도 공고와 스냅샷이 중복되지 않는다', () => {
    const store = new JobStore(':memory:');
    const posting = normalizeJobPosting({
      source: 'normalized',
      externalId: 'job-1',
      sourceUrl: 'https://jobs.example.com/job-1',
      companyName: '테스트기업',
      title: 'B2B 영업',
      description: '엔터프라이즈 영업 담당',
      industry: 'IT',
      keywords: ['영업'],
      location: '서울',
      employmentType: '정규직',
      headcount: 1,
      publishedAt: '2026-08-01T00:00:00+09:00',
      updatedAt: null,
      expiresAt: null,
      active: true,
      collectedAt: '2026-08-12T00:00:00+09:00',
    });

    try {
      expect(store.import([posting])).toMatchObject({ inserted: 1, snapshotsAdded: 1 });
      expect(store.import([posting])).toMatchObject({ unchanged: 1, snapshotsAdded: 0 });
      expect(store.readPostings()).toHaveLength(1);
    } finally {
      store.close();
    }
  });
});

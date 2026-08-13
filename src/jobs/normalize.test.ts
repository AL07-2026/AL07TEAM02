import { normalizeCompanyName, normalizeJobPosting } from './normalize.ts';

describe('normalizeJobPosting', () => {
  it('기업명, 직무, 직급, 기술을 공통 형식으로 정리한다', () => {
    const posting = normalizeJobPosting({
      source: 'normalized',
      externalId: 'job-1',
      sourceUrl: 'https://jobs.example.com/job-1',
      companyName: '(주)플로우데스크',
      title: '백엔드 개발 리드',
      description: 'Java, AWS 환경에서 개발팀을 이끕니다.',
      industry: 'IT',
      keywords: ['Java', 'AWS'],
      location: '서울',
      employmentType: '정규직',
      headcount: 1,
      publishedAt: '2026-08-01T00:00:00+09:00',
      updatedAt: null,
      expiresAt: null,
      active: true,
      collectedAt: '2026-08-12T00:00:00+09:00',
    });

    expect(normalizeCompanyName('(주)플로우데스크')).toBe(normalizeCompanyName('플로우데스크'));
    expect(posting.jobFamily).toBe('engineering');
    expect(posting.seniority).toBe('lead');
    expect(posting.skills).toEqual(expect.arrayContaining(['Java', 'AWS']));
    expect(posting.qualityScore).toBe(100);
  });

  it('필수 데이터가 비어 있으면 저장 전에 거부한다', () => {
    expect(() =>
      normalizeJobPosting({
        source: 'normalized',
        externalId: '',
        sourceUrl: '',
        companyName: '',
        title: '',
        description: '',
        industry: '',
        keywords: [],
        location: '',
        employmentType: '',
        headcount: null,
        publishedAt: '',
        updatedAt: null,
        expiresAt: null,
        active: true,
        collectedAt: '2026-08-12T00:00:00+09:00',
      }),
    ).toThrow('제목');
  });
});

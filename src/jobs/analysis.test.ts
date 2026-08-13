import { analyzeCompanies, buildCompanySignals } from './analysis.ts';
import { normalizeJobPosting } from './normalize.ts';
import type { NormalizedJobInput } from './types.ts';

function posting(overrides: Partial<NormalizedJobInput> = {}) {
  return normalizeJobPosting({
    source: 'normalized',
    externalId: 'default-job',
    sourceUrl: 'https://jobs.example.com/default-job',
    companyName: '플로우데스크',
    title: '채용 담당자',
    description: 'ATS 채용관리 프로세스를 운영합니다.',
    industry: 'IT·SaaS',
    keywords: ['ATS', '채용관리'],
    location: '서울',
    employmentType: '정규직',
    headcount: 1,
    publishedAt: '2026-08-01T00:00:00+09:00',
    updatedAt: null,
    expiresAt: null,
    active: true,
    collectedAt: '2026-08-12T00:00:00+09:00',
    ...overrides,
  });
}

describe('job analysis', () => {
  const postings = [
    posting(),
    posting({
      externalId: 'lead-job',
      sourceUrl: 'https://jobs.example.com/lead-job',
      title: 'HR 운영 리드',
      publishedAt: '2026-07-25T00:00:00+09:00',
    }),
    posting({
      externalId: 'previous-job',
      sourceUrl: 'https://jobs.example.com/previous-job',
      title: '백엔드 개발자',
      description: 'Java 서비스 개발',
      keywords: ['Java'],
      publishedAt: '2026-06-25T00:00:00+09:00',
      active: false,
    }),
  ];

  it('최근 30일과 이전 30일을 분리해 기업 채용 신호를 만든다', () => {
    const [signal] = buildCompanySignals(postings, new Date('2026-08-12T00:00:00+09:00'));

    expect(signal?.recentPostingCount).toBe(2);
    expect(signal?.previousPostingCount).toBe(1);
    expect(signal?.leadershipHireCount).toBe(1);
    expect(signal?.newJobFamilies).toContain('recruiting');
  });

  it('같은 공고 데이터로 역할별 분석 결과를 생성한다', () => {
    const sales = analyzeCompanies(
      postings,
      { role: 'sales', query: 'ATS 채용관리', secondaryQuery: '인사 채용' },
      new Date('2026-08-12T00:00:00+09:00'),
    )[0];
    const recruiter = analyzeCompanies(
      postings,
      { role: 'recruiter', query: '채용 담당자', secondaryQuery: '리드' },
      new Date('2026-08-12T00:00:00+09:00'),
    )[0];
    const investor = analyzeCompanies(
      postings,
      { role: 'investor', query: 'B2B SaaS', secondaryQuery: '조직 확장' },
      new Date('2026-08-12T00:00:00+09:00'),
    )[0];

    expect(sales?.breakdown).toHaveLength(4);
    expect(recruiter?.breakdown).toHaveLength(5);
    expect(investor?.interpretation).toContain('투자 추천은 아닙니다');
  });

  it('제품과 직접 연결된 공고가 없으면 B2B 영업 점수를 신뢰도 이상으로 올리지 않는다', () => {
    const [result] = analyzeCompanies(
      postings,
      { role: 'sales', query: '인사 채용', secondaryQuery: '운영 관리' },
      new Date('2026-08-12T00:00:00+09:00'),
    );

    expect(result?.totalScore).toBeLessThanOrEqual(10);
    expect(result?.interpretation).toContain('직접 연결되는 공고 근거가 부족');
  });

  it('직무 상세가 있으면 인원·업무·채용 배경을 결과에 사용한다', () => {
    const [result] = analyzeCompanies(
      [
        posting({
          title: '간호사 채용',
          description: '약제부 간호사 채용',
          keywords: ['간호사'],
          roleDetails: [
            {
              name: '간호사',
              headcount: 1,
              department: '약제부',
              duties: ['항암조제 업무 보조'],
              qualification: '(필수) 간호사 면허 소지자',
              contractEvidence: '정규인력 충원 시 계약 종료될 수 있음',
              hiringReason: '정규인력 충원 전 업무 공백을 보완하는 한시 채용입니다.',
            },
          ],
        }),
      ],
      { role: 'recruiter', query: '간호사' },
      new Date('2026-08-12T00:00:00+09:00'),
    );

    expect(result?.hiringSituation).toContain('간호사 1명');
    expect(result?.hiringSituation).toContain('항암조제 업무 보조');
    expect(result?.recommendationReasons.join(' ')).toContain('정규인력 충원 전');
    expect(result?.hiringSituation).not.toContain('원문 확인');
  });
});

import { afterEach, expect, it, vi } from 'vitest';

import { enrichJobPostingContact } from './jobContactEnrichment';
import { normalizeJobPosting } from '../src/jobs/normalize';

function posting(sourceUrl = 'https://company.example/careers/backend') {
  return normalizeJobPosting({
    source: 'normalized',
    externalId: sourceUrl,
    sourceUrl,
    companyName: '테스트 기업',
    title: '백엔드 개발자',
    description: '개발자를 채용합니다.',
    industry: 'SaaS',
    keywords: ['개발자'],
    location: '서울',
    employmentType: '정규직',
    headcount: 1,
    publishedAt: '2026-09-01T00:00:00+09:00',
    updatedAt: null,
    expiresAt: null,
    active: true,
    collectedAt: '2026-09-03T00:00:00+09:00',
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

it('공고 원문 HTML에서 이메일, 전화번호, 채용 문의 링크를 추출한다', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(
      `
      <a href="mailto:Recruit@Test.Example">email</a>
      <a href="tel:02-1234-5678">phone</a>
      <a href="/contact/recruit">채용 문의</a>
      `,
      { status: 200, headers: { 'content-type': 'text/html' } },
    ),
  );

  await expect(enrichJobPostingContact(posting())).resolves.toMatchObject({
    contactInfo: {
      email: 'recruit@test.example',
      phone: '02-1234-5678',
      contactPageUrl: 'https://company.example/contact/recruit',
      source: 'posting_html',
      verificationStatus: 'confirmed',
    },
  });
});

it('확정 연락처가 없으면 회사 도메인 기반 이메일 후보를 검증 필요로 제공한다', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response('<html><body>채용 중입니다.</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  );

  await expect(enrichJobPostingContact(posting())).resolves.toMatchObject({
    contactInfo: {
      estimatedEmails: [
        'recruit@company.example',
        'hr@company.example',
        'jobs@company.example',
      ],
      source: 'estimated',
      verificationStatus: 'needs_verification',
    },
  });
});

it('채용 플랫폼 도메인에서도 회사명 기반 채용 문의 검색 링크를 제공한다', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response('<html><body>연락처 없음</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  );

  await expect(
    enrichJobPostingContact(posting('https://kr.jooble.org/desc/123')),
  ).resolves.toMatchObject({
    contactInfo: {
      department: '채용팀 또는 인사팀',
      contactPageUrl:
        'https://www.google.com/search?q=%ED%85%8C%EC%8A%A4%ED%8A%B8%20%EA%B8%B0%EC%97%85%20%EC%B1%84%EC%9A%A9%20%EB%AC%B8%EC%9D%98',
      verificationStatus: 'needs_verification',
    },
  });
});

it('알려진 기업이면 채용 플랫폼 공고에서도 채용 페이지 힌트를 제공한다', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response('<html><body>연락처 없음</body></html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    }),
  );

  const tossPosting = {
    ...posting('https://kr.jooble.org/desc/456'),
    companyName: 'Toss',
  };

  await expect(enrichJobPostingContact(tossPosting)).resolves.toMatchObject({
    contactInfo: {
      department: '토스채용팀',
      contactPageUrl: 'https://toss.im/career/jobs',
      estimatedEmails: ['recruit@toss.im', 'hr@toss.im', 'jobs@toss.im'],
      verificationStatus: 'needs_verification',
    },
  });
});

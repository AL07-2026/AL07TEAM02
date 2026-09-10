import { expect, it } from 'vitest';

import { getCompanyContactFallback } from './contactHints';

it('알려진 기업은 공식 채용 페이지와 이메일 후보를 제공한다', () => {
  expect(getCompanyContactFallback('Toss')).toMatchObject({
    department: '토스채용팀',
    contactPageUrl: 'https://toss.im/career/jobs',
    estimatedEmails: ['recruit@toss.im', 'hr@toss.im', 'jobs@toss.im'],
    verificationStatus: 'needs_verification',
  });
});

it('알려지지 않은 기업도 채용 문의 검색 링크를 제공한다', () => {
  expect(getCompanyContactFallback('테스트 기업')).toMatchObject({
    department: '채용팀 또는 인사팀',
    contactPageUrl:
      'https://www.google.com/search?q=%ED%85%8C%EC%8A%A4%ED%8A%B8%20%EA%B8%B0%EC%97%85%20%EC%B1%84%EC%9A%A9%20%EB%AC%B8%EC%9D%98',
    verificationStatus: 'needs_verification',
  });
});

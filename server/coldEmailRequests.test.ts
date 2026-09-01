import { expect, it } from 'vitest';

import { parseColdEmailRequestDraft } from './coldEmailRequests';

const validPayload = {
  applicantRole: 'recruiter',
  applicantEmail: 'sales@example.com',
  applicantCompany: 'ABC Labs',
  productName: 'AI 세일즈 코파일럿',
  productDescription: 'B2B 영업팀이 기업 조사와 맞춤 메시지 작성 시간을 줄이도록 돕는 서비스입니다.',
  targetCompany: { name: '테스트 기업', industry: 'SaaS' },
  privacyAgreed: true,
};

it('콜드메일 신청 payload를 저장 가능한 draft로 정리한다', () => {
  expect(
    parseColdEmailRequestDraft({
      ...validPayload,
      applicantEmail: ' sales@example.com ',
      additionalRequest: ' 짧게 작성해주세요. ',
    }),
  ).toEqual({
    ...validPayload,
    additionalRequest: '짧게 작성해주세요.',
  });
});

it('동의하지 않은 신청 payload는 거부한다', () => {
  expect(() =>
    parseColdEmailRequestDraft({
      ...validPayload,
      privacyAgreed: false,
    }),
  ).toThrow('정보 처리에 동의해주세요.');
});

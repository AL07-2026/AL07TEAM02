import { afterEach, expect, it, vi } from 'vitest';

import {
  buildColdEmailResultText,
  sendColdEmailResult,
} from './coldEmailDelivery';
import type { ColdEmailRequestDraft } from '../src/features/apply/types';

const request: ColdEmailRequestDraft = {
  applicantRole: 'recruiter',
  applicantEmail: 'user@example.com',
  applicantCompany: 'ABC Labs',
  productName: '시니어 백엔드 개발자',
  productDescription: 'B2B SaaS 경험과 대규모 트래픽 처리 역량을 갖춘 후보자를 제안합니다.',
  targetCompany: {
    name: '테스트 기업',
    hiringChange: '백엔드 개발자 채용을 진행 중입니다.',
    recommendationReason: '현재 진행 중인 공고가 있어 후보자를 제안할 실제 수요가 있습니다.',
    contacts: [
      {
        sourceTitle: '백엔드 개발자 모집',
        sourceUrl: 'https://example.com/jobs/backend',
        department: '인사팀',
        name: '김채용',
        email: 'recruit@test.example',
        contactPageUrl: 'https://example.com/contact/recruit',
        estimatedEmails: ['hr@test.example'],
      },
    ],
  },
  privacyAgreed: true,
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it('콜드메일 결과 본문에 공개 연락처와 초안을 포함한다', () => {
  const text = buildColdEmailResultText(request);

  expect(text).toContain('recruit@test.example');
  expect(text).toContain('채용 문의 페이지: https://example.com/contact/recruit');
  expect(text).toContain('추정 이메일(검증 필요): hr@test.example');
  expect(text).toContain('백엔드 개발자 모집');
  expect(text).toContain('안녕하세요, 테스트 기업 담당자님.');
  expect(text).toContain('ABC Labs 드림');
});

it('Resend 설정이 없으면 발송을 건너뛴 상태를 반환한다', async () => {
  vi.stubEnv('RESEND_API_KEY', '');
  vi.stubEnv('COLD_EMAIL_FROM', '');

  await expect(sendColdEmailResult(request)).resolves.toMatchObject({
    status: 'skipped',
  });
});

it('Resend API로 신청자에게 콜드메일 초안을 보낸다', async () => {
  vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
  vi.stubEnv('COLD_EMAIL_FROM', 'Sales Signal <sender@example.com>');
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ id: 'email-1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
  );

  await expect(sendColdEmailResult(request)).resolves.toMatchObject({
    status: 'sent',
    provider: 'resend',
  });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('https://api.resend.com/emails');
  expect(init.method).toBe('POST');
  expect(init.headers).toMatchObject({ authorization: 'Bearer test-resend-key' });
  expect(init.body).toEqual(expect.stringContaining('"to":["user@example.com"]'));
});

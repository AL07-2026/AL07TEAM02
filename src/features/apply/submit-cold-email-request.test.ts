import { beforeEach, expect, it, vi } from 'vitest';

import { submitColdEmailRequest } from '@/features/apply/submit-cold-email-request';
import type { ColdEmailRequestDraft } from '@/features/apply/types';

const request: ColdEmailRequestDraft = {
  applicantRole: 'sales',
  applicantEmail: 'sales@example.com',
  applicantCompany: 'ABC Labs',
  productName: 'AI 세일즈 코파일럿',
  productDescription: 'B2B 영업팀이 기업 조사와 맞춤 메시지 작성 시간을 줄이도록 돕는 서비스입니다.',
  targetCompany: {
    name: '테스트 기업',
  },
  privacyAgreed: true,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

it('콜드메일 신청 API에 요청을 보내고 접수 결과를 반환한다', async () => {
  const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        ...request,
        id: 'request-1',
        submittedAt: '2026-08-21T00:00:00.000Z',
      }),
      { status: 201, headers: { 'content-type': 'application/json' } },
    ),
  );

  const submittedRequest = await submitColdEmailRequest(request);

  expect(submittedRequest).toMatchObject(request);
  expect(submittedRequest.id).toBe('request-1');
  expect(fetchMock).toHaveBeenCalledWith('/api/cold-email-requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });
});

it('신청 API가 실패하면 서버 오류 메시지를 전달한다', async () => {
  vi.spyOn(window, 'fetch').mockResolvedValueOnce(
    new Response(JSON.stringify({ error: '저장 실패' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    }),
  );

  await expect(submitColdEmailRequest(request)).rejects.toThrow('저장 실패');
});

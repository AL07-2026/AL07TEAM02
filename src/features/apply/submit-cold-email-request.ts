import type { ColdEmailRequest, ColdEmailRequestDraft } from '@/features/apply/types';

export async function submitColdEmailRequest(
  request: ColdEmailRequestDraft,
): Promise<ColdEmailRequest> {
  if (!import.meta.env.DEV) {
    throw new Error('Backend endpoint 연결이 필요합니다.');
  }

  // 개발용 mock에는 서버가 없으므로 접수 시각을 클라이언트에서 생성한다.
  return Promise.resolve({
    ...request,
    submittedAt: new Date().toISOString(),
  });
}

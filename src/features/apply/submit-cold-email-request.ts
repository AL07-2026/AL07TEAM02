import type { ColdEmailRequest, ColdEmailRequestDraft } from '@/features/apply/types';

export async function submitColdEmailRequest(
  request: ColdEmailRequestDraft,
): Promise<ColdEmailRequest> {
  const response = await fetch('/api/cold-email-requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    let message = '신청 처리에 실패했습니다.';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the generic error when the server does not return JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as ColdEmailRequest;
}

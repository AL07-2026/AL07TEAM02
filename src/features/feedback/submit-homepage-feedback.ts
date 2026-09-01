import type { HomepageFeedback, HomepageFeedbackDraft } from '@/features/feedback/types';

export async function submitHomepageFeedback(
  feedback: HomepageFeedbackDraft,
): Promise<HomepageFeedback> {
  const response = await fetch('/api/homepage-feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    let message = '피드백 제출에 실패했습니다.';
    try {
      const payload = (await response.json()) as { error?: string };
      if (payload.error) message = payload.error;
    } catch {
      // Keep the generic error when the server does not return JSON.
    }

    throw new Error(message);
  }

  return (await response.json()) as HomepageFeedback;
}

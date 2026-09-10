import type {
  TopicInterestDraft,
  TopicInterestSelection,
} from '@/features/topic-interest/types';

export async function submitTopicInterest(
  selection: TopicInterestDraft,
): Promise<TopicInterestSelection> {
  const response = await fetch('/api/topic-interests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(selection),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '관심 주제를 저장하지 못했습니다.');
  }

  return (await response.json()) as TopicInterestSelection;
}

import {
  createHomepageFeedback,
  listHomepageFeedback,
} from './homepageFeedback.js';
import { isTopicInterestId } from '../src/features/topic-interest/topics.js';
import type {
  TopicInterestDraft,
  TopicInterestSelection,
} from '../src/features/topic-interest/types.js';

const messagePrefix = 'topic-interest:';
const visitorIdPattern = /^[a-zA-Z0-9-]{8,80}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function parseTopicInterestDraft(payload: unknown): TopicInterestDraft {
  if (!isRecord(payload)) throw new Error('관심 주제 요청 형식이 올바르지 않습니다.');

  const topicId = readString(payload.topicId);
  const visitorId = readString(payload.visitorId);
  const pagePath = readString(payload.pagePath) || '/';

  if (!isTopicInterestId(topicId)) throw new Error('선택한 관심 주제를 확인해주세요.');
  if (!visitorIdPattern.test(visitorId)) throw new Error('방문자 식별값이 올바르지 않습니다.');
  if (pagePath.length > 200) throw new Error('페이지 경로가 너무 깁니다.');

  return { topicId, visitorId, pagePath };
}

export async function createTopicInterest(
  draft: TopicInterestDraft,
): Promise<TopicInterestSelection> {
  const feedback = await createHomepageFeedback({
    rating: 5,
    message: `${messagePrefix}${draft.topicId}:${draft.visitorId}`,
    pagePath: draft.pagePath,
  });

  return {
    ...draft,
    id: feedback.id,
    submittedAt: feedback.submittedAt,
  };
}

function parseStoredSelection(
  message: string,
  pagePath: string,
  submittedAt: string,
  id?: string,
): TopicInterestSelection | null {
  if (!message.startsWith(messagePrefix)) return null;

  const [topicId, visitorId] = message.slice(messagePrefix.length).split(':');
  if (!topicId || !visitorId || !isTopicInterestId(topicId)) return null;
  if (!visitorIdPattern.test(visitorId)) return null;

  return { topicId, visitorId, pagePath, submittedAt, ...(id ? { id } : {}) };
}

export async function listTopicInterests(): Promise<TopicInterestSelection[]> {
  const feedback = await listHomepageFeedback();
  const selections = feedback
    .map((item) =>
      parseStoredSelection(item.message, item.pagePath, item.submittedAt, item.id),
    )
    .filter((item): item is TopicInterestSelection => item !== null);

  const uniqueSelections = new Map<string, TopicInterestSelection>();
  for (const selection of selections) {
    const key = `${selection.visitorId}:${selection.topicId}`;
    if (!uniqueSelections.has(key)) uniqueSelections.set(key, selection);
  }

  return [...uniqueSelections.values()].sort((left, right) =>
    right.submittedAt.localeCompare(left.submittedAt),
  );
}

import type { TopicInterestId } from '@/features/topic-interest/topics';

export type TopicInterestDraft = {
  topicId: TopicInterestId;
  visitorId: string;
  pagePath: string;
};

export type TopicInterestSelection = TopicInterestDraft & {
  id?: string;
  submittedAt: string;
};

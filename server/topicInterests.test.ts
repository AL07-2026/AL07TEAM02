import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createTopicInterest,
  listTopicInterests,
  parseTopicInterestDraft,
} from './topicInterests';
import { createHomepageFeedback, listHomepageFeedback } from './homepageFeedback';

vi.mock('./homepageFeedback', () => ({
  createHomepageFeedback: vi.fn(),
  listHomepageFeedback: vi.fn(),
}));

const createFeedbackMock = vi.mocked(createHomepageFeedback);
const listFeedbackMock = vi.mocked(listHomepageFeedback);

describe('topic interests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('허용된 주제 선택을 검증한다', () => {
    expect(
      parseTopicInterestDraft({
        topicId: 'funding-hiring',
        visitorId: 'visitor-12345678',
        pagePath: '/',
      }),
    ).toEqual({
      topicId: 'funding-hiring',
      visitorId: 'visitor-12345678',
      pagePath: '/',
    });
  });

  it('알 수 없는 주제는 거부한다', () => {
    expect(() =>
      parseTopicInterestDraft({
        topicId: 'unknown',
        visitorId: 'visitor-12345678',
        pagePath: '/',
      }),
    ).toThrow('선택한 관심 주제를 확인해주세요.');
  });

  it('관심 주제를 임시 피드백 저장소에 기록한다', async () => {
    createFeedbackMock.mockResolvedValue({
      id: 'feedback-1',
      rating: 5,
      message: 'topic-interest:funding-hiring:visitor-12345678',
      pagePath: '/',
      submittedAt: '2026-09-08T00:00:00.000Z',
    });

    await expect(
      createTopicInterest({
        topicId: 'funding-hiring',
        visitorId: 'visitor-12345678',
        pagePath: '/',
      }),
    ).resolves.toMatchObject({
      topicId: 'funding-hiring',
      visitorId: 'visitor-12345678',
    });

    expect(createFeedbackMock).toHaveBeenCalledWith({
      rating: 5,
      message: 'topic-interest:funding-hiring:visitor-12345678',
      pagePath: '/',
    });
  });

  it('같은 방문자의 같은 주제 선택은 한 번만 집계한다', async () => {
    listFeedbackMock.mockResolvedValue([
      {
        id: 'feedback-1',
        rating: 5,
        message: 'topic-interest:hiring-surge:visitor-12345678',
        pagePath: '/',
        submittedAt: '2026-09-08T01:00:00.000Z',
      },
      {
        id: 'feedback-2',
        rating: 5,
        message: 'topic-interest:hiring-surge:visitor-12345678',
        pagePath: '/',
        submittedAt: '2026-09-08T00:00:00.000Z',
      },
      {
        id: 'feedback-3',
        rating: 4,
        message: '일반 홈페이지 피드백',
        pagePath: '/feedback',
        submittedAt: '2026-09-08T02:00:00.000Z',
      },
    ]);

    const selections = await listTopicInterests();
    expect(selections).toHaveLength(1);
    expect(selections[0]?.submittedAt).toBe('2026-09-08T01:00:00.000Z');
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';

import { TopicInterestSection } from '@/features/topic-interest/TopicInterestSection';
import { submitTopicInterest } from '@/features/topic-interest/submit-topic-interest';

vi.mock('@/features/topic-interest/topic-interest.css', () => ({}));

vi.mock('@/features/topic-interest/submit-topic-interest', () => ({
  submitTopicInterest: vi.fn(),
}));

const submitTopicInterestMock = vi.mocked(submitTopicInterest);

beforeEach(() => {
  window.localStorage.clear();
  submitTopicInterestMock.mockReset();
  submitTopicInterestMock.mockResolvedValue({
    id: 'selection-1',
    topicId: 'funding-hiring',
    visitorId: 'visitor-12345678',
    pagePath: '/',
    submittedAt: '2026-09-08T00:00:00.000Z',
  });
});

it('10개 관심 주제를 표시한다', () => {
  render(<TopicInterestSection />);

  expect(screen.getAllByRole('button', { name: '이 리스트가 궁금해요' })).toHaveLength(10);
  expect(screen.getByText('투자 유치 후 채용 확대가 예상되는 기업')).toBeInTheDocument();
});

it('선택한 주제를 저장하고 다시 선택하지 못하게 한다', async () => {
  render(<TopicInterestSection />);

  fireEvent.click(screen.getAllByRole('button', { name: '이 리스트가 궁금해요' })[0]!);

  await waitFor(() => expect(submitTopicInterestMock).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole('button', { name: '선택했습니다' })).toBeDisabled();
  expect(screen.getByText('선택이 저장되었습니다. 다른 항목도 함께 고를 수 있어요.')).toBeInTheDocument();
});

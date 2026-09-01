import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { ColdEmailRequestsAdminPage } from '@/features/apply/ColdEmailRequestsAdminPage';

vi.mock('@/features/apply/admin-page.css', () => ({}));

const recruiterRequest = {
  id: 'request-1',
  applicantRole: 'recruiter' as const,
  applicantEmail: 'recruiter@example.com',
  applicantCompany: 'ABC Search',
  productName: '시니어 백엔드 개발자',
  productDescription:
    'B2B SaaS 경험과 대규모 트래픽 처리 역량을 갖춘 7년 차 백엔드 개발자입니다.',
  additionalRequest: '후보자의 현재 회사명은 밝히지 말아주세요.',
  targetCompany: { name: '테스트 기업' },
  privacyAgreed: true as const,
  submittedAt: '2026-08-21T01:00:00.000Z',
};

describe('ColdEmailRequestsAdminPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('헤드헌터 신청에 필요한 신청 정보를 상세 화면에 표시한다', async () => {
    const fetchMock = vi.spyOn(window, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ requests: [recruiterRequest] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    render(<ColdEmailRequestsAdminPage />);

    fireEvent.change(screen.getByLabelText('관리자 토큰'), {
      target: { value: 'test-admin-token' },
    });
    fireEvent.click(screen.getByRole('button', { name: '신청 정보 열기' }));

    expect((await screen.findAllByText('ABC Search')).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('결과를 받을 이메일')).toBeInTheDocument();
    expect(screen.getByText('제안하려는 직무 또는 인재 분야')).toBeInTheDocument();
    expect(screen.getByText('제안할 인재와 강점')).toBeInTheDocument();
    expect(screen.getByText('추가 요청사항')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith('/api/cold-email-requests', {
      headers: { authorization: 'Bearer test-admin-token' },
    });
  });
});

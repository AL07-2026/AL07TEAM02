import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, vi } from 'vitest';

import { ColdEmailRequestPage } from '@/features/apply/ColdEmailRequestPage';
import { mockTargetCompany } from '@/features/apply/mock-target-company';
import { submitColdEmailRequest } from '@/features/apply/submit-cold-email-request';

vi.mock('@/features/apply/apply-page.css', () => ({}));

vi.mock('@/features/apply/submit-cold-email-request', () => ({
  submitColdEmailRequest: vi.fn(),
}));

const mockedSubmit = vi.mocked(submitColdEmailRequest);

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/결과를 받을 이메일/), {
    target: { value: 'sales@example.com' },
  });
  fireEvent.change(screen.getByLabelText(/회사명/), {
    target: { value: 'ABC Labs' },
  });
  fireEvent.change(screen.getByLabelText(/판매하려는 제품 또는 서비스/), {
    target: { value: 'AI 세일즈 코파일럿' },
  });
  fireEvent.change(screen.getByLabelText(/제품을 간단히 설명해주세요/), {
    target: {
      value: 'B2B 영업팀이 기업 조사와 맞춤 메시지 작성 시간을 줄이도록 돕는 서비스입니다.',
    },
  });
  fireEvent.click(screen.getByLabelText(/입력한 정보를 처리하는 것에 동의합니다/));
}

describe('ColdEmailRequestPage', () => {
  beforeEach(() => {
    mockedSubmit.mockImplementation((request) =>
      Promise.resolve({ ...request, submittedAt: '2026-08-13T00:00:00.000Z' }),
    );
  });

  it('헤더에서 관리자 페이지로 이동할 수 있다', () => {
    render(<ColdEmailRequestPage targetCompany={{ name: '테스트 기업' }} />);

    expect(screen.getByRole('link', { name: '관리자 페이지' })).toHaveAttribute(
      'href',
      '/admin/cold-email-requests',
    );
  });

  it('기업 정보가 없으면 안내하고 신청을 비활성화한다', () => {
    render(<ColdEmailRequestPage />);

    expect(screen.getByText('선택된 기업 정보가 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '맞춤 콜드메일 제작 신청하기' })).toBeDisabled();
  });

  it('필수 입력값을 한국어로 검증한다', () => {
    render(<ColdEmailRequestPage targetCompany={{ name: '테스트 기업' }} />);

    fireEvent.click(screen.getByRole('button', { name: '맞춤 콜드메일 제작 신청하기' }));

    expect(screen.getByText('이메일을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('회사명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('제품 또는 서비스명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('제품 설명을 입력해주세요.')).toBeInTheDocument();
    expect(screen.getByText('정보 처리에 동의해주세요.')).toBeInTheDocument();
  });

  it('헤드헌터에게 인재 제안에 맞는 문구를 보여준다', () => {
    render(
      <ColdEmailRequestPage applicantRole="recruiter" targetCompany={{ name: '테스트 기업' }} />,
    );

    expect(screen.getByLabelText(/제안하려는 직무 또는 인재 분야/)).toBeInTheDocument();
    expect(screen.getByLabelText(/제안할 인재와 강점을 설명해주세요/)).toBeInTheDocument();
    expect(screen.getByText('입력한 직무 / 인재 정보')).toBeInTheDocument();
    expect(screen.queryByText('제품을 간단히 설명해주세요')).not.toBeInTheDocument();
  });

  it('투자심사역에게 투자 검토에 맞는 문구를 보여준다', () => {
    render(
      <ColdEmailRequestPage applicantRole="investor" targetCompany={{ name: '테스트 기업' }} />,
    );

    expect(screen.getByLabelText(/관심 있는 산업 또는 투자 테마/)).toBeInTheDocument();
    expect(screen.getByLabelText(/투자 관점과 관심 조건을 설명해주세요/)).toBeInTheDocument();
    expect(screen.getByText('입력한 투자 테마 / 검토 관점')).toBeInTheDocument();
    expect(screen.queryByText('제품을 간단히 설명해주세요')).not.toBeInTheDocument();
  });

  it('유효한 신청을 submit 함수에 전달하고 성공 상태를 표시한다', async () => {
    render(<ColdEmailRequestPage targetCompany={mockTargetCompany} />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: '맞춤 콜드메일 제작 신청하기' }));

    await waitFor(() => expect(screen.getByText('신청이 완료되었습니다')).toBeInTheDocument());
    expect(mockedSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        applicantEmail: 'sales@example.com',
        targetCompany: mockTargetCompany,
        privacyAgreed: true,
      }),
    );
    expect(screen.getByText(/sales@example.com/)).toBeInTheDocument();
  });

  it('submit 실패 시 입력값을 유지하고 오류를 표시한다', async () => {
    mockedSubmit.mockRejectedValueOnce(new Error('저장 실패'));
    render(<ColdEmailRequestPage targetCompany={mockTargetCompany} />);
    fillValidForm();

    fireEvent.click(screen.getByRole('button', { name: '맞춤 콜드메일 제작 신청하기' }));

    await waitFor(() =>
      expect(
        screen.getByText('신청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'),
      ).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/결과를 받을 이메일/)).toHaveValue('sales@example.com');
  });
});

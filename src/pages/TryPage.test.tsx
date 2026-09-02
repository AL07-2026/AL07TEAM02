import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { TryPage } from '@/pages/TryPage';

const match = {
  companyName: '국립중앙의료원',
  role: 'sales' as const,
  totalScore: 69,
  breakdown: [
    { label: '제품 수요 적합도', score: 24, maximum: 40 },
    { label: '구매 타이밍', score: 25, maximum: 30 },
  ],
  hiringSituation:
    '국립중앙의료원은 최근 30일 채용공고 2건을 게시했고 간호사 관련 공고 1건이 확인됐습니다.',
  recommendationReasons: [
    '간호사 관련 공고가 현재 진행 중이라 후보자를 제안할 실제 채용 수요가 있습니다.',
  ],
  observedFacts: ['최근 30일 고유 공고 2건, 이전 30일 0건', '현재 진행 공고 2건'],
  interpretation: 'ATS와 연결되는 채용 변화가 확인됐습니다.',
  confidenceScore: 10,
  riskFlags: [],
  evidenceUrls: ['https://example.com/job/1'],
  evidence: [
    {
      source: 'work24' as const,
      title: '간호사 채용 공고',
      url: 'https://example.com/job/1',
      publishedAt: '2026-08-10T00:00:00.000Z',
      location: '서울',
      headcount: 3,
    },
  ],
  roleFindings: [],
};

function renderPage() {
  return render(
    <MemoryRouter>
      <TryPage />
    </MemoryRouter>,
  );
}

function mockSearchResponse(matches = [match]) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        collectedAt: '2026-08-12T00:00:00.000Z',
        matches,
        postingCount: 10,
        sourceCounts: { jooble: 6, work24: 4 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TryPage', () => {
  it('필수 조건이 없으면 입력 안내를 표시한다', () => {
    renderPage();

    expect(screen.queryByRole('radio', { name: /B2B 영업/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /투자심사역/ })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /헤드헌터/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '기업 찾기' }));

    expect(screen.getByText('나의 역할을 하나 선택해주세요.')).toBeInTheDocument();
  });

  it('서버가 분석한 실제 추천 결과를 표시한다', async () => {
    mockSearchResponse();
    renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /헤드헌터/ }));
    fireEvent.change(screen.getByLabelText(/어떤 직무의 인재를 제안하나요/), {
      target: { value: '간호사' },
    });
    fireEvent.click(screen.getByRole('button', { name: '기업 찾기' }));

    expect(
      await screen.findByRole('heading', { name: '지금 확인할 기업 1곳' }),
    ).toBeInTheDocument();
    expect(screen.getByText('추천 1순위')).toBeInTheDocument();
    expect(screen.getByText('고용24 4건')).toBeInTheDocument();
    expect(screen.getByText('Jooble 6건')).toBeInTheDocument();
    expect(screen.getByText('간호사 채용 공고')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '국립중앙의료원 상세 분석 보기' })).toHaveAttribute(
      'href',
      '/result/%EA%B5%AD%EB%A6%BD%EC%A4%91%EC%95%99%EC%9D%98%EB%A3%8C%EC%9B%90',
    );
  });

  it('역할·검색어·지역을 검색 API에 전달한다', async () => {
    const fetchMock = mockSearchResponse([]);
    renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /헤드헌터/ }));
    fireEvent.change(screen.getByLabelText(/어떤 직무의 인재를 제안하나요/), {
      target: { value: '간호사' },
    });
    fireEvent.change(screen.getByLabelText('관심 지역'), { target: { value: 'seoul' } });
    fireEvent.click(screen.getByRole('button', { name: '기업 찾기' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(typeof request.body).toBe('string');
    expect(JSON.parse(request.body as string)).toEqual({
      role: 'recruiter',
      query: '간호사',
      region: 'seoul',
    });
  });

  it('검색 서버 오류를 사용자에게 안내한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: '수집된 채용공고가 없습니다.' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /헤드헌터/ }));
    fireEvent.change(screen.getByLabelText(/어떤 직무의 인재를 제안하나요/), {
      target: { value: '간호사' },
    });
    fireEvent.click(screen.getByRole('button', { name: '기업 찾기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('수집된 채용공고가 없습니다.');
  });

  it('검색 서버가 빈 응답을 반환하면 이해 가능한 오류를 표시한다', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    renderPage();

    fireEvent.click(screen.getByRole('radio', { name: /헤드헌터/ }));
    fireEvent.change(screen.getByLabelText(/어떤 직무의 인재를 제안하나요/), {
      target: { value: '백엔드 개발자' },
    });
    fireEvent.click(screen.getByRole('button', { name: '기업 찾기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      '검색 서버에서 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.',
    );
  });
});

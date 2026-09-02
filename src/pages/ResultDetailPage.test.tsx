import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import { storeCompanyAnalysis } from '@/jobs/analysisSession';
import type { CompanyRoleAnalysis } from '@/jobs/types';
import { ResultDetailPage } from '@/pages/ResultDetailPage';

const analysis: CompanyRoleAnalysis = {
  companyName: '테스트랩',
  role: 'recruiter',
  totalScore: 73,
  breakdown: [{ label: '직무 적합도', score: 23, maximum: 35 }],
  hiringSituation: '테스트랩은 디자이너 채용을 진행 중입니다.',
  recommendationReasons: ['디자이너 공고가 현재 진행 중입니다.'],
  observedFacts: ['최근 30일 고유 공고 2건, 이전 30일 0건'],
  interpretation: '디자인 조직을 확장하는 흐름으로 분석됩니다.',
  confidenceScore: 8,
  riskFlags: ['공개 공고 기반 분석입니다.'],
  evidenceUrls: ['https://example.com/jobs/designer'],
  evidence: [
    {
      source: 'work24',
      title: '프로덕트 디자이너',
      url: 'https://example.com/jobs/designer',
      publishedAt: '2026-09-01T00:00:00.000Z',
      location: '서울',
      headcount: 2,
    },
  ],
  roleFindings: [
    {
      name: '프로덕트 디자이너',
      headcount: 2,
      department: '디자인팀',
      duties: ['서비스 화면 설계'],
      qualification: 'Figma 사용 경험',
      contractEvidence: '정규직',
      hiringReason: '디자인 조직 확대',
    },
  ],
};

function renderDetail(state?: { analysis: CompanyRoleAnalysis }) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/result/테스트랩', state }]}>
      <Routes>
        <Route path="/result/:companyId" element={<ResultDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  window.sessionStorage.clear();
});

describe('ResultDetailPage', () => {
  it('선택한 기업의 실제 분석 데이터를 상세 화면에 표시한다', () => {
    renderDetail({ analysis });

    expect(screen.getByRole('heading', { name: '테스트랩 상세 분석' })).toBeInTheDocument();
    expect(screen.getByText('73점')).toBeInTheDocument();
    expect(screen.getByText('디자인 조직을 확장하는 흐름으로 분석됩니다.')).toBeInTheDocument();
    expect(screen.getByText('디자이너 공고가 현재 진행 중입니다.')).toBeInTheDocument();
    expect(screen.getAllByText('고용24')).toHaveLength(2);
    expect(screen.queryByText('14명')).not.toBeInTheDocument();
    expect(screen.queryByText('RevOps')).not.toBeInTheDocument();
  });

  it('새로고침 상황에서는 세션에 저장한 기업 분석을 복원한다', () => {
    storeCompanyAnalysis(analysis);
    renderDetail();

    expect(screen.getByRole('heading', { name: '테스트랩 상세 분석' })).toBeInTheDocument();
    expect(screen.getAllByText('프로덕트 디자이너', { selector: 'strong' })).toHaveLength(2);
  });
});

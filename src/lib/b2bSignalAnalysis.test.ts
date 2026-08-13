import { trialCompanies } from '@/data/trialCompanies';
import { analyzeB2BSignal } from '@/lib/b2bSignalAnalysis';

function getCompany(id: string) {
  const company = trialCompanies.find((item) => item.id === id);

  if (!company) throw new Error(`${id} 테스트 기업을 찾을 수 없습니다.`);
  return company;
}

describe('analyzeB2BSignal', () => {
  it('채용 확장, 제품 적합도, 근거 신뢰도를 100점 안에서 계산한다', () => {
    const analysis = analyzeB2BSignal(getCompany('flowdesk'), 'ATS 채용관리 솔루션');

    expect(analysis.expansionScore).toBeLessThanOrEqual(50);
    expect(analysis.fitScore).toBeLessThanOrEqual(40);
    expect(analysis.confidenceScore).toBeLessThanOrEqual(10);
    expect(analysis.totalScore).toBe(
      analysis.expansionScore + analysis.fitScore + analysis.confidenceScore,
    );
  });

  it('제품 핵심어가 맞는 기업에 더 높은 B2B 점수를 준다', () => {
    const matchingCompany = analyzeB2BSignal(getCompany('flowdesk'), 'ATS 채용관리 솔루션');
    const unrelatedCompany = analyzeB2BSignal(getCompany('loop-commerce'), 'ATS 채용관리 솔루션');

    expect(matchingCompany.totalScore).toBeGreaterThan(unrelatedCompany.totalScore);
    expect(matchingCompany.matchedKeywords).toEqual(expect.arrayContaining(['ats', '채용관리']));
  });
});

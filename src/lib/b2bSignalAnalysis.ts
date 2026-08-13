import type { CompanySignal } from '@/data/trialCompanies';

export type B2BSignalAnalysis = {
  totalScore: number;
  expansionScore: number;
  fitScore: number;
  confidenceScore: number;
  matchedKeywords: string[];
  reasons: string[];
};

const commercialTerms = [
  '영업',
  '세일즈',
  '고객성공',
  '사업개발',
  '파트너십',
  '마케팅',
  '브랜드',
  '구매',
];
const leadershipTerms = ['리드', '책임자', '헤드', '매니저'];

function clampScore(score: number, maximum: number) {
  return Math.min(maximum, Math.max(0, Math.round(score)));
}

function normalizeText(value: string) {
  return value
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]+/g, ' ')
    .trim();
}

function getIntentTokens(intent: string) {
  return [
    ...new Set(
      normalizeText(intent)
        .split(/\s+/)
        .filter((token) => token.length >= 2),
    ),
  ];
}

export function analyzeB2BSignal(company: CompanySignal, intent: string): B2BSignalAnalysis {
  const searchableFields = [
    ...company.keywords,
    company.signal,
    ...company.jobs,
    ...company.evidence,
  ].map(normalizeText);
  const matchedKeywords = getIntentTokens(intent).filter((token) =>
    searchableFields.some((field) => field.includes(token)),
  );
  const companyText = searchableFields.join(' ');
  const hasCommercialRole = commercialTerms.some((term) => companyText.includes(term));
  const hasLeadershipHire = leadershipTerms.some((term) => companyText.includes(term));

  const volumeScore = clampScore((company.recentPostingCount / 15) * 20, 20);
  const growthRate =
    company.previousPostingCount === 0
      ? company.recentPostingCount > 0
        ? 1
        : 0
      : (company.recentPostingCount - company.previousPostingCount) / company.previousPostingCount;
  const growthScore = clampScore(growthRate * 20, 20);
  const expansionScore = volumeScore + growthScore + (hasLeadershipHire ? 10 : 0);
  const fitScore = clampScore(matchedKeywords.length * 12, 30) + (hasCommercialRole ? 10 : 0);
  const confidenceScore = company.evidence.length >= 2 && company.jobs.length >= 2 ? 10 : 5;
  const reasons = [
    `최근 30일 공고가 ${company.previousPostingCount}건에서 ${company.recentPostingCount}건으로 변했습니다.`,
  ];

  if (matchedKeywords.length) {
    reasons.push(
      `입력한 ‘${matchedKeywords.slice(0, 2).join(' · ')}’와 연결되는 채용 내용이 확인됐습니다.`,
    );
  }
  if (hasCommercialRole) {
    reasons.push('영업 활동과 가까운 직무를 채용하고 있습니다.');
  }
  if (hasLeadershipHire) {
    reasons.push('리드·책임자급 채용으로 조직 구축 가능성이 보입니다.');
  }

  return {
    totalScore: expansionScore + fitScore + confidenceScore,
    expansionScore,
    fitScore,
    confidenceScore,
    matchedKeywords,
    reasons,
  };
}

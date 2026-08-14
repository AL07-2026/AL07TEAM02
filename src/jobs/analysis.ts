import { normalizeText } from './normalize.ts';
import type {
  CompanyHiringSignal,
  CompanyRoleAnalysis,
  JobRoleDetail,
  NormalizedJobPosting,
  RoleAnalysisRequest,
} from './types.ts';

const dayInMilliseconds = 24 * 60 * 60 * 1000;
const ignoredQueryTerms = new Set([
  '공고',
  '관리',
  '기업',
  '담당',
  '서비스',
  '업무',
  '운영',
  '인사',
  '채용',
]);

function clamp(score: number, maximum: number) {
  return Math.min(maximum, Math.max(0, Math.round(score)));
}

function uniquePostings(postings: NormalizedJobPosting[]) {
  const byFingerprint = new Map<string, NormalizedJobPosting>();

  for (const posting of postings) {
    const existing = byFingerprint.get(posting.fingerprint);
    if (
      !existing ||
      new Date(posting.updatedAt ?? posting.publishedAt) >
        new Date(existing.updatedAt ?? existing.publishedAt)
    ) {
      byFingerprint.set(posting.fingerprint, posting);
    }
  }

  return [...byFingerprint.values()];
}

function isBetween(value: string, start: Date, end: Date) {
  const time = new Date(value).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function groupByCompany(postings: NormalizedJobPosting[]) {
  const companies = new Map<string, NormalizedJobPosting[]>();
  for (const posting of postings) {
    const companyPostings = companies.get(posting.normalizedCompanyName) ?? [];
    companyPostings.push(posting);
    companies.set(posting.normalizedCompanyName, companyPostings);
  }
  return companies;
}

export function buildCompanySignals(
  postings: NormalizedJobPosting[],
  asOf = new Date(),
): CompanyHiringSignal[] {
  const recentStart = new Date(asOf.getTime() - 30 * dayInMilliseconds);
  const previousStart = new Date(asOf.getTime() - 60 * dayInMilliseconds);

  return [...groupByCompany(postings).values()].map((companyPostings) => {
    const unique = uniquePostings(companyPostings);
    const recent = unique.filter((posting) => isBetween(posting.publishedAt, recentStart, asOf));
    const previous = unique.filter((posting) =>
      isBetween(posting.publishedAt, previousStart, recentStart),
    );
    const recentFamilies = new Set(recent.map((posting) => posting.jobFamily));
    const previousFamilies = new Set(previous.map((posting) => posting.jobFamily));
    const fingerprintCounts = new Map<string, number>();
    for (const posting of companyPostings) {
      fingerprintCounts.set(
        posting.fingerprint,
        (fingerprintCounts.get(posting.fingerprint) ?? 0) + 1,
      );
    }
    const averageQuality =
      unique.reduce((total, posting) => total + posting.qualityScore, 0) /
      Math.max(unique.length, 1);
    const evidence = [
      ...recent,
      ...unique.filter((posting) => posting.active && !recent.includes(posting)),
    ]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 10);

    return {
      companyName: unique[0]?.companyName ?? '',
      recentPostingCount: recent.length,
      previousPostingCount: previous.length,
      activePostingCount: unique.filter((posting) => posting.active).length,
      recentHeadcount: recent.reduce((total, posting) => total + (posting.headcount ?? 1), 0),
      newJobFamilies: [...recentFamilies].filter((family) => !previousFamilies.has(family)),
      jobFamilies: [...new Set(unique.map((posting) => posting.jobFamily))],
      leadershipHireCount: recent.filter((posting) =>
        ['lead', 'executive'].includes(posting.seniority),
      ).length,
      repostCount: [...fingerprintCounts.values()].filter((count) => count > 1).length,
      sourceCount: new Set(unique.map((posting) => posting.source)).size,
      confidenceScore: clamp(averageQuality / 10, 10),
      evidence,
    };
  });
}

function queryTokens(value: string) {
  return [
    ...new Set(
      normalizeText(value)
        .split(/\s+/)
        .filter((token) => token.length >= 2 && !ignoredQueryTerms.has(token)),
    ),
  ];
}

function searchableText(posting: NormalizedJobPosting) {
  return normalizeText(
    [
      posting.title,
      posting.description,
      posting.industry,
      posting.jobFamily,
      ...posting.skills,
      ...posting.keywords,
    ].join(' '),
  );
}

function getRelevantPostings(signal: CompanyHiringSignal, query: string) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  return signal.evidence.filter((posting) =>
    tokens.some((token) => searchableText(posting).includes(token)),
  );
}

function getRoleFindings(postings: NormalizedJobPosting[], query: string) {
  const tokens = queryTokens(query);
  const findings = postings.flatMap((posting) => posting.roleDetails ?? []);
  const matched = findings.filter((detail) =>
    tokens.some((token) => normalizeText(detail.name).includes(token)),
  );
  return matched.length ? matched : findings;
}

function growthScore(signal: CompanyHiringSignal, maximum: number) {
  const difference = signal.recentPostingCount - signal.previousPostingCount;
  if (signal.recentPostingCount < 2 || difference <= 0) return 0;
  const ratio = difference / Math.max(signal.previousPostingCount, 2);
  return clamp(ratio * maximum, maximum);
}

function commonFacts(signal: CompanyHiringSignal) {
  return [
    `최근 30일 고유 공고 ${signal.recentPostingCount}건, 이전 30일 ${signal.previousPostingCount}건`,
    `현재 진행 공고 ${signal.activePostingCount}건`,
    signal.newJobFamilies.length
      ? `새 직무군: ${signal.newJobFamilies.join(', ')}`
      : '새롭게 등장한 직무군 없음',
  ];
}

function situationInterpretation(
  signal: CompanyHiringSignal,
  relevant: NormalizedJobPosting[],
  query: string,
  roleFindings: JobRoleDetail[],
) {
  if (!relevant.length) {
    return `‘${query}’와 직접 연결되는 공고 근거가 부족해 현재 상황을 단정하기 어렵습니다.`;
  }

  const activeCount = relevant.filter((posting) => posting.active).length;
  const titleSummary = [...new Set(relevant.map((posting) => posting.title))].slice(0, 3).join(', ');
  const departmentSummary = [...new Set(roleFindings.map((finding) => finding.department).filter(Boolean))]
    .slice(0, 2)
    .join(', ');
  const trend =
    signal.recentPostingCount > signal.previousPostingCount
      ? '최근 채용 활동이 확대되는 흐름'
      : signal.recentPostingCount < signal.previousPostingCount
        ? '최근 채용 활동이 둔화된 흐름'
        : '최근 채용 활동이 유지되는 흐름';
  const detail = departmentSummary ? ` 확인된 부서는 ${departmentSummary}입니다.` : '';
  return `${signal.companyName}은 ${trend}이며, ‘${query}’ 관련 공고 ${relevant.length}건 중 ${activeCount}건이 현재 진행 중입니다. 주요 공고는 ${titleSummary}입니다.${detail} 이를 종합하면 해당 직무를 즉시 충원하거나 조직 운영 공백을 메우려는 상황으로 보이며, 관련 조직의 확장 가능성이 있습니다.`;
}

function hiringSituation(
  signal: CompanyHiringSignal,
  relevant: NormalizedJobPosting[],
  query: string,
  roleFindings: JobRoleDetail[],
) {
  const finding = roleFindings[0];
  if (finding) {
    const hiringTarget = finding.headcount
      ? `${finding.name} ${finding.headcount}명`
      : `${finding.name} 직무`;
    const department = finding.department ? ` 근무 부서는 ${finding.department}입니다.` : '';
    const duties = finding.duties.length
      ? ` 주요 업무는 ${finding.duties.join('·')}입니다.`
      : '';
    const contract = finding.contractEvidence
      ? ` 계약 종료 조건도 함께 명시돼 있습니다: ${finding.contractEvidence.replace(/^※\s*/, '')}.`
      : '';
    return `${signal.companyName}은 ${hiringTarget} 채용을 진행 중입니다.${department}${duties}${contract}`;
  }

  const change = signal.recentPostingCount - signal.previousPostingCount;
  const trend =
    change > 0
      ? `이전 30일보다 ${change}건 늘어 채용 활동이 확대된 상태입니다.`
      : change < 0
        ? `이전 30일보다 ${Math.abs(change)}건 줄었지만 현재 채용은 계속되고 있습니다.`
        : '이전 30일과 비슷한 수준으로 채용을 이어가고 있습니다.';
  return `${signal.companyName}은 최근 30일 채용공고 ${signal.recentPostingCount}건을 게시했고 ${trend} ‘${query}’ 관련 공고 ${relevant.length}건이 확인됐습니다.`;
}

function analysisEvidence(postings: NormalizedJobPosting[]) {
  return postings.slice(0, 3).map((posting) => ({
    title: posting.title,
    url: posting.sourceUrl,
    publishedAt: posting.publishedAt,
    location: posting.location,
    headcount: posting.headcount,
  }));
}

function analyzeSales(
  signal: CompanyHiringSignal,
  request: RoleAnalysisRequest,
): CompanyRoleAnalysis {
  const relevant = getRelevantPostings(signal, request.query);
  const roleFindings = getRoleFindings(relevant, request.query);
  const contextual = request.secondaryQuery
    ? getRelevantPostings(signal, request.secondaryQuery)
    : [];
  const fitScore = clamp(relevant.length * 12, 40);
  const timingScore = relevant.length
    ? clamp(signal.recentHeadcount * 2, 15) + growthScore(signal, 15)
    : 0;
  const buyerScore = relevant.length
    ? clamp(signal.leadershipHireCount * 10, 10) + clamp(contextual.length * 5, 10)
    : 0;
  const confidenceScore = signal.confidenceScore;
  const totalScore = fitScore + timingScore + buyerScore + confidenceScore;
  const reasons = relevant.length
    ? [
        `입력한 ‘${request.query}’와 직접 연결되는 채용공고가 ${relevant.length}건 있어 제품 수요가 생길 가능성을 확인할 수 있습니다.`,
        signal.recentPostingCount > signal.previousPostingCount
          ? `전체 채용공고도 이전 30일보다 늘어 조직과 업무 도구에 대한 투자가 함께 일어날 가능성이 있습니다.`
          : `관련 직무를 현재 채용 중이므로 담당 조직에 문제 해결 제품을 제안할 근거가 있습니다.`,
      ]
    : [`‘${request.query}’와 직접 연결되는 채용공고 근거가 부족합니다.`];

  return {
    companyName: signal.companyName,
    role: 'sales',
    totalScore,
    breakdown: [
      { label: '제품 수요 적합도', score: fitScore, maximum: 40 },
      { label: '구매 타이밍', score: timingScore, maximum: 30 },
      { label: '구매 주체 형성', score: buyerScore, maximum: 20 },
      { label: '데이터 신뢰도', score: confidenceScore, maximum: 10 },
    ],
    hiringSituation: hiringSituation(signal, relevant, request.query, roleFindings),
    recommendationReasons: reasons,
    observedFacts: commonFacts(signal),
    interpretation: situationInterpretation(signal, relevant, request.query, roleFindings),
    confidenceScore,
    riskFlags: signal.repostCount ? [`유사 재공고 ${signal.repostCount}개 확인`] : [],
    evidenceUrls: relevant.map((posting) => posting.sourceUrl),
    evidence: analysisEvidence(relevant),
    roleFindings,
  };
}

function analyzeRecruiter(
  signal: CompanyHiringSignal,
  request: RoleAnalysisRequest,
): CompanyRoleAnalysis {
  const relevant = getRelevantPostings(signal, request.query);
  const roleFindings = getRoleFindings(relevant, request.query);
  const secondaryRelevant = request.secondaryQuery
    ? getRelevantPostings(signal, request.secondaryQuery)
    : [];
  const fitScore =
    clamp(relevant.length * 12, 25) +
    (relevant.length ? clamp(secondaryRelevant.length * 5, 10) : 0);
  const demandScore =
    clamp(relevant.filter((posting) => posting.active).length * 10, 20) +
    (relevant.length ? growthScore(signal, 10) : 0);
  const urgencyScore =
    clamp(Math.max(relevant.length - 1, 0) * 5, 10) + clamp(signal.repostCount * 5, 5);
  const feasibilityScore = clamp(
    relevant.reduce((total, posting) => total + posting.qualityScore, 0) /
      Math.max(relevant.length, 1) /
      10,
    10,
  );
  const confidenceScore = signal.confidenceScore;
  const activeRelevant = relevant.filter((posting) => posting.active);
  const finding = roleFindings[0];
  const reasons = relevant.length
    ? [
        finding?.headcount
          ? `${finding.name} ${finding.headcount}명을 실제로 모집하고 있어 제안할 채용 수요가 명확합니다.`
          : `‘${request.query}’ 관련 공고 ${activeRelevant.length}건이 현재 진행 중이라 후보자를 제안할 실제 채용 수요가 있습니다.`,
        finding?.hiringReason ??
          `공고의 직무와 자격요건을 기준으로 후보자 적합성을 구체적으로 검토할 수 있습니다.`,
        finding?.qualification
          ? `지원 조건은 ‘${finding.qualification}’로, 이 요건을 충족하는 후보자를 우선 제안하는 것이 적합합니다.`
          : `현재 진행 중인 공고를 근거로 채용 시점에 맞춘 제안이 가능합니다.`,
      ]
    : [`현재 ‘${request.query}’와 직접 연결되는 공고가 확인되지 않았습니다.`];

  return {
    companyName: signal.companyName,
    role: 'recruiter',
    totalScore: fitScore + demandScore + urgencyScore + feasibilityScore + confidenceScore,
    breakdown: [
      { label: '직무 적합도', score: fitScore, maximum: 35 },
      { label: '채용 수요 강도', score: demandScore, maximum: 30 },
      { label: '채용 긴급성', score: urgencyScore, maximum: 15 },
      { label: '제안 가능성', score: feasibilityScore, maximum: 10 },
      { label: '데이터 신뢰도', score: confidenceScore, maximum: 10 },
    ],
    hiringSituation: hiringSituation(signal, relevant, request.query, roleFindings),
    recommendationReasons: reasons,
    observedFacts: commonFacts(signal),
    interpretation: situationInterpretation(signal, relevant, request.query, roleFindings),
    confidenceScore,
    riskFlags: relevant.length === 0 ? ['현재 확인된 관련 공고 없음'] : [],
    evidenceUrls: relevant.map((posting) => posting.sourceUrl),
    evidence: analysisEvidence(relevant),
    roleFindings,
  };
}

function analyzeInvestor(
  signal: CompanyHiringSignal,
  request: RoleAnalysisRequest,
): CompanyRoleAnalysis {
  const relevant = getRelevantPostings(signal, `${request.query} ${request.secondaryQuery ?? ''}`);
  const roleFindings = getRoleFindings(relevant, request.query);
  const growth = clamp(signal.recentHeadcount * 2, 20) + growthScore(signal, 20);
  const strategy =
    clamp(signal.newJobFamilies.length * 8, 20) +
    clamp(relevant.length * 5, 10) +
    clamp(signal.leadershipHireCount * 5, 5);
  const persistence = signal.recentPostingCount > 0 && signal.previousPostingCount > 0 ? 15 : 5;
  const confidenceScore = signal.confidenceScore;
  const riskFlags = [
    ...(signal.recentPostingCount === 0 && signal.previousPostingCount > 0
      ? ['최근 30일 신규 공고가 중단됨']
      : []),
    ...(signal.repostCount >= 2 ? [`반복 재공고 ${signal.repostCount}개 확인`] : []),
  ];
  const reasons = relevant.length
    ? [
        `관심 영역인 ‘${request.query}’와 연결되는 채용공고 ${relevant.length}건이 확인돼 조직 투자 방향을 검토할 근거가 있습니다.`,
        signal.newJobFamilies.length
          ? `최근 새 직무군이 등장해 기존 인력 보충보다 사업 또는 조직 범위가 넓어지는 신호로 볼 수 있습니다.`
          : `최근 채용 활동이 이어지고 있어 조직 운영 변화 여부를 추가 조사할 가치가 있습니다.`,
        `채용 흐름과 신규 직무군을 종합하면 성장과 조직 확장이 진행되는 신호로 보입니다.`,
      ]
    : [`‘${request.query}’와 직접 연결되는 채용공고가 없어 추천 근거가 부족합니다.`];

  return {
    companyName: signal.companyName,
    role: 'investor',
    totalScore: growth + strategy + persistence + confidenceScore,
    breakdown: [
      { label: '성장 강도', score: growth, maximum: 40 },
      { label: '전략 방향', score: strategy, maximum: 35 },
      { label: '신호 지속성', score: persistence, maximum: 15 },
      { label: '데이터 신뢰도', score: confidenceScore, maximum: 10 },
    ],
    hiringSituation: hiringSituation(signal, relevant, request.query, roleFindings),
    recommendationReasons: reasons,
    observedFacts: commonFacts(signal),
    interpretation: `${situationInterpretation(signal, relevant, request.query, roleFindings)} 채용 흐름을 바탕으로 성장 신호를 우선 확인할 기업으로 분류했습니다.`,
    confidenceScore,
    riskFlags,
    evidenceUrls: relevant.map((posting) => posting.sourceUrl),
    evidence: analysisEvidence(relevant),
    roleFindings,
  };
}

export function analyzeCompanies(
  postings: NormalizedJobPosting[],
  request: RoleAnalysisRequest,
  asOf = new Date(),
) {
  return buildCompanySignals(postings, asOf)
    .map((signal) => {
      if (request.role === 'recruiter') return analyzeRecruiter(signal, request);
      if (request.role === 'investor') return analyzeInvestor(signal, request);
      return analyzeSales(signal, request);
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

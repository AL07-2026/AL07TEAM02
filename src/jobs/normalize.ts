import type { JobFamily, NormalizedJobInput, NormalizedJobPosting, Seniority } from './types.js';

const jobFamilyTerms: Array<[JobFamily, string[]]> = [
  ['sales', ['영업', '세일즈', 'sales', 'account executive', '사업개발', '파트너십']],
  ['recruiting', ['채용', '리크루터', 'recruiter', 'talent acquisition', '인사', 'hr']],
  ['engineering', ['개발', '엔지니어', 'engineer', 'developer', '데이터', '보안', 'devops']],
  ['marketing', ['마케팅', 'marketing', '브랜드', '콘텐츠', '퍼포먼스']],
  ['product', ['프로덕트', 'product manager', 'product owner', '서비스 기획', 'ux', 'ui']],
  ['finance', ['재무', '회계', 'finance', 'accounting', '투자', 'ir']],
  ['manufacturing', ['생산', '제조', '설비', '품질', '공정']],
  ['healthcare', ['의료', '간호', '병원', '임상', '약사']],
  ['operations', ['운영', '물류', '구매', '고객성공', 'customer success', '총무']],
];

const skillTerms = [
  'Python',
  'Java',
  'JavaScript',
  'TypeScript',
  'React',
  'AWS',
  'GCP',
  'Azure',
  'Docker',
  'Kubernetes',
  'SQL',
  'Salesforce',
  'SAP',
  'Figma',
  'Excel',
];

export function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ko-KR')
    .replace(/[^0-9a-z가-힣]+/g, ' ')
    .trim();
}

export function normalizeCompanyName(value: string) {
  return normalizeText(value.replace(/\(주\)|㈜/g, ''))
    .replace(/\binc\b|\bcorp\b|\bco\b/g, '')
    .replace(/주식회사|유한회사|재단법인|사단법인/g, '')
    .replace(/\s+/g, '')
    .trim();
}

export function classifyJobFamily(value: string): JobFamily {
  const normalized = normalizeText(value);
  return (
    jobFamilyTerms.find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0] ??
    'other'
  );
}

export function classifySeniority(value: string): Seniority {
  const normalized = normalizeText(value);

  if (/임원|director|vp|chief|c-level|본부장/.test(normalized)) return 'executive';
  if (/리드|lead|팀장|책임자|head|manager/.test(normalized)) return 'lead';
  if (/시니어|senior|7년|8년|9년|10년/.test(normalized)) return 'senior';
  if (/미들|3년|4년|5년|6년/.test(normalized)) return 'mid';
  if (/주니어|junior|1년|2년/.test(normalized)) return 'junior';
  if (/신입|인턴|entry|intern/.test(normalized)) return 'entry';
  return 'unknown';
}

export function extractSkills(value: string) {
  const normalized = normalizeText(value);
  return skillTerms.filter((skill) => normalized.includes(normalizeText(skill)));
}

function calculateQualityScore(input: NormalizedJobInput) {
  const checks = [
    input.externalId,
    input.companyName,
    input.title,
    input.publishedAt,
    input.sourceUrl,
    input.location,
    input.description,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function createFingerprint(input: NormalizedJobInput) {
  return [
    normalizeCompanyName(input.companyName),
    normalizeText(input.title),
    normalizeText(input.location),
  ].join('|');
}

function requireValue(value: string, field: string) {
  if (!value.trim()) throw new Error(`채용공고 ${field} 값이 비어 있습니다.`);
  return value.trim();
}

function normalizeDate(value: string | null, field: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new Error(`채용공고 ${field} 날짜 형식이 올바르지 않습니다.`);
  return date.toISOString();
}

export function normalizeJobPosting(input: NormalizedJobInput): NormalizedJobPosting {
  const title = requireValue(input.title, '제목');
  const companyName = requireValue(input.companyName, '기업명');
  const publishedAt = normalizeDate(requireValue(input.publishedAt, '게시일'), '게시일');

  if (!publishedAt) throw new Error('채용공고 게시일이 필요합니다.');

  const searchableText = [title, input.description, input.keywords.join(' ')].join(' ');

  return {
    ...input,
    externalId: requireValue(input.externalId, '고유 ID'),
    sourceUrl: requireValue(input.sourceUrl, '원문 URL'),
    companyName,
    normalizedCompanyName: normalizeCompanyName(companyName),
    title,
    description: input.description.trim(),
    industry: input.industry.trim(),
    jobFamily: input.jobFamily ?? classifyJobFamily(searchableText),
    seniority: input.seniority ?? classifySeniority(searchableText),
    skills: [...new Set([...(input.skills ?? []), ...extractSkills(searchableText)])],
    keywords: [...new Set(input.keywords.map((keyword) => keyword.trim()).filter(Boolean))],
    location: input.location.trim(),
    employmentType: input.employmentType.trim(),
    headcount: input.headcount && input.headcount > 0 ? Math.round(input.headcount) : null,
    publishedAt,
    updatedAt: normalizeDate(input.updatedAt, '수정일'),
    expiresAt: normalizeDate(input.expiresAt, '마감일'),
    collectedAt: normalizeDate(input.collectedAt, '수집일') ?? new Date().toISOString(),
    fingerprint: createFingerprint(input),
    qualityScore: calculateQualityScore(input),
  };
}

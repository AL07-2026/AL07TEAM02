export type UserType = 'sales' | 'recruiter' | 'investor';

export type CompanySignal = {
  id: string;
  name: string;
  industry: string;
  size: string;
  region: string;
  employees: string;
  hiringChange: string;
  signal: string;
  jobs: string[];
  evidence: string[];
  keywords: string[];
  recentPostingCount: number;
  previousPostingCount: number;
};

export const trialCompanies: CompanySignal[] = [
  {
    id: 'flowdesk',
    name: '플로우데스크',
    industry: 'software',
    size: 'growth',
    region: 'seoul',
    employees: '120명',
    hiringChange: '최근 30일 채용 공고 62% 증가',
    signal: '엔터프라이즈 고객 대응 조직을 빠르게 확장하고 있어요.',
    jobs: ['엔터프라이즈 영업', '고객성공', '백엔드 개발'],
    evidence: ['영업 리드 신규 채용', '고객성공팀 4개 포지션 동시 오픈'],
    keywords: ['ATS', '채용관리', 'HR SaaS', 'CRM', '영업 자동화', '고객관리'],
    recentPostingCount: 14,
    previousPostingCount: 8,
  },
  {
    id: 'loop-commerce',
    name: '루프커머스',
    industry: 'commerce',
    size: 'mid',
    region: 'seoul',
    employees: '310명',
    hiringChange: '3주 연속 채용 공고 증가',
    signal: '신규 브랜드와 물류 거점을 동시에 확장하는 단계예요.',
    jobs: ['브랜드 매니저', '물류 운영', '데이터 분석'],
    evidence: ['신규 브랜드 조직 신설', '물류 자동화 담당자 채용'],
    keywords: ['커머스', '물류 자동화', '브랜드 마케팅', '데이터 분석'],
    recentPostingCount: 11,
    previousPostingCount: 7,
  },
  {
    id: 'modu-pay',
    name: '모두페이',
    industry: 'finance',
    size: 'growth',
    region: 'seoul',
    employees: '185명',
    hiringChange: '결제·보안 직군 채용 2배 증가',
    signal: 'B2B 결제 제품의 안정화와 확장을 함께 준비하고 있어요.',
    jobs: ['보안 엔지니어', 'B2B 세일즈', '프로덕트 매니저'],
    evidence: ['B2B 세일즈팀 확대', '보안 책임자 포지션 신설'],
    keywords: ['핀테크', '결제', '보안', 'B2B 세일즈', 'CRM'],
    recentPostingCount: 10,
    previousPostingCount: 5,
  },
  {
    id: 'care-link',
    name: '케어링크',
    industry: 'healthcare',
    size: 'growth',
    region: 'gyeonggi',
    employees: '146명',
    hiringChange: '사업개발 직군 5개 포지션 오픈',
    signal: '병원 제휴와 지역 확장을 위한 파트너 조직을 만들고 있어요.',
    jobs: ['사업개발', '파트너십', '서비스 운영'],
    evidence: ['지역 파트너 매니저 채용', '사업개발 조직 리드 채용'],
    keywords: ['헬스케어', '병원', '헤드헌팅', '사업개발', '파트너십'],
    recentPostingCount: 8,
    previousPostingCount: 3,
  },
  {
    id: 'nova-factory',
    name: '노바팩토리',
    industry: 'manufacturing',
    size: 'mid',
    region: 'gyeonggi',
    employees: '420명',
    hiringChange: '스마트팩토리 직군 채용 48% 증가',
    signal: '생산 자동화 전환을 위해 데이터와 설비 인력을 보강하고 있어요.',
    jobs: ['설비 엔지니어', '데이터 엔지니어', '구매'],
    evidence: ['데이터 플랫폼팀 신설', '자동화 설비 담당자 집중 채용'],
    keywords: ['스마트팩토리', '제조', '데이터', '설비', '구매'],
    recentPostingCount: 12,
    previousPostingCount: 8,
  },
  {
    id: 'pine-cloud',
    name: '파인클라우드',
    industry: 'software',
    size: 'startup',
    region: 'busan',
    employees: '48명',
    hiringChange: '첫 세일즈 조직 채용 시작',
    signal: '제품 검증을 마치고 국내 고객 확보 단계에 진입했어요.',
    jobs: ['B2B 세일즈', '세일즈 오퍼레이션', '프론트엔드 개발'],
    evidence: ['세일즈 매니저 첫 채용', '고객 온보딩 담당자 채용'],
    keywords: ['B2B SaaS', '스타트업', 'CRM', '영업 자동화', '고객 온보딩'],
    recentPostingCount: 5,
    previousPostingCount: 0,
  },
];

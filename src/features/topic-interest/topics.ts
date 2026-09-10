export type TopicInterestId =
  | 'funding-hiring'
  | 'revenue-growth'
  | 'global-expansion'
  | 'new-business'
  | 'hiring-surge'
  | 'leadership-hiring'
  | 'scarce-talent'
  | 'long-open-role'
  | 'major-contract'
  | 'new-hr-leader';

export type TopicInterest = {
  id: TopicInterestId;
  number: string;
  title: string;
  description: string;
  shortLabel: string;
  icon:
    | 'rocket'
    | 'chart'
    | 'globe'
    | 'sparkles'
    | 'trending'
    | 'users'
    | 'badge'
    | 'clock'
    | 'handshake'
    | 'user-plus';
};

export const topicInterests: TopicInterest[] = [
  {
    id: 'funding-hiring',
    number: '01',
    shortLabel: '투자 유치',
    title: '투자 유치 후 채용 확대가 예상되는 기업',
    description: '투자 소식과 공개 채용공고를 함께 살펴 채용 확대 가능성이 있는 기업을 찾습니다.',
    icon: 'rocket',
  },
  {
    id: 'revenue-growth',
    number: '02',
    shortLabel: '매출 성장',
    title: '매출은 늘지만 직원 수는 아직 적은 기업',
    description: '성장 속도에 비해 조직 규모가 작아 인력 확충 가능성이 있는 기업을 찾습니다.',
    icon: 'chart',
  },
  {
    id: 'global-expansion',
    number: '03',
    shortLabel: '해외 진출',
    title: '해외 진출을 준비하며 현지 인재를 찾는 기업',
    description: '해외 사업, 영업, 마케팅 등 현지 사업 인재 수요가 생긴 기업을 찾습니다.',
    icon: 'globe',
  },
  {
    id: 'new-business',
    number: '04',
    shortLabel: '신사업',
    title: '신사업 책임자와 핵심 인재를 찾는 기업',
    description: '새로운 사업을 시작하며 책임자와 초기 실무진을 채용하는 기업을 찾습니다.',
    icon: 'sparkles',
  },
  {
    id: 'hiring-surge',
    number: '05',
    shortLabel: '공고 급증',
    title: '최근 3개월간 채용공고가 급증한 기업',
    description: '채용공고 수와 직군 변화를 살펴 인력 수요가 빠르게 커진 기업을 찾습니다.',
    icon: 'trending',
  },
  {
    id: 'leadership-hiring',
    number: '06',
    shortLabel: '리더급 채용',
    title: '임원 및 팀장급 채용을 시작한 성장 기업',
    description: '임원, 팀장, 조직 책임자급 채용공고가 새로 확인된 기업을 찾습니다.',
    icon: 'users',
  },
  {
    id: 'scarce-talent',
    number: '07',
    shortLabel: '희소 인재',
    title: '고액 연봉으로 희소 전문 인력을 찾는 기업',
    description: '높은 보상 조건을 제시하며 특정 분야의 전문 인력을 채용하는 기업을 찾습니다.',
    icon: 'badge',
  },
  {
    id: 'long-open-role',
    number: '08',
    shortLabel: '장기 미충원',
    title: '핵심 포지션을 3개월 이상 채우지 못한 기업',
    description: '같은 핵심 공고를 장기간 유지하거나 반복해서 올린 성장 기업을 찾습니다.',
    icon: 'clock',
  },
  {
    id: 'major-contract',
    number: '09',
    shortLabel: '대형 수주',
    title: '대형 계약 이후 조직 확대가 예상되는 기업',
    description: '계약이나 수주 소식 이후 프로젝트 인력을 확충할 가능성이 있는 기업을 찾습니다.',
    icon: 'handshake',
  },
  {
    id: 'new-hr-leader',
    number: '10',
    shortLabel: 'HR 리더 합류',
    title: '인사 및 채용 책임자가 새로 합류한 기업',
    description: '채용 체계와 외부 파트너를 새로 정비할 가능성이 있는 성장 기업을 찾습니다.',
    icon: 'user-plus',
  },
];

export function isTopicInterestId(value: string): value is TopicInterestId {
  return topicInterests.some((topic) => topic.id === value);
}

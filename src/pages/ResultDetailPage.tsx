import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  LineChart,
  Mail,
  MapPin,
  Search,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import type { CompanyRoleAnalysis } from '@/jobs/types';

const fallbackAnalysis: CompanyRoleAnalysis = {
  companyName: 'ApexPay',
  role: 'sales',
  totalScore: 91,
  breakdown: [
    { label: '채용 증가', score: 32, maximum: 35 },
    { label: '직무 연관도', score: 28, maximum: 30 },
    { label: '영업 타이밍', score: 31, maximum: 35 },
  ],
  hiringSituation:
    '최근 30일 동안 세일즈, 솔루션 엔지니어, RevOps 직무가 함께 증가했습니다.',
  interpretation:
    '대형 고객 확보 이후 영업 프로세스와 기술 검증 흐름을 동시에 정비하는 확장 단계로 보입니다.',
  recommendationReasons: [
    'Enterprise AE와 Solutions Engineer를 동시에 늘려 데모 이후 기술 검증 병목을 줄이려는 신호가 강합니다.',
    'RevOps 직무가 새로 등장해 세일즈 파이프라인 예측과 운영 체계를 정량화하려는 움직임이 보입니다.',
    '파트너 채널 관련 JD가 반복되어 신규 세그먼트 확장 가능성이 높습니다.',
  ],
  observedFacts: [
    'Enterprise AE 채용 5건이 최근 30일 안에 확인되었습니다.',
    'Solutions Engineer와 RevOps 직무가 동시에 열렸습니다.',
    '파트너 채널 관련 JD 키워드가 반복됩니다.',
  ],
  confidenceScore: 87,
  riskFlags: ['채용공고 기반 추정이므로 실제 구매 의도와 다를 수 있습니다.'],
  evidenceUrls: [
    'https://example.com/jobs/enterprise-ae',
    'https://example.com/jobs/solutions-engineer',
    'https://example.com/jobs/revops',
  ],
  roleFindings: [
    {
      name: 'Enterprise AE',
      headcount: 5,
      department: 'Sales',
      duties: ['대형 고객 신규 발굴', '엔터프라이즈 파이프라인 관리'],
      qualification: 'B2B SaaS 세일즈 경험',
      contractEvidence: '정규직',
      hiringReason: '대형 고객 영업조직 확대',
    },
    {
      name: 'Solutions Engineer',
      headcount: 4,
      department: 'Pre-sales',
      duties: ['기술 검증 지원', '고객 데모 및 도입 설계'],
      qualification: 'API 또는 데이터 연동 경험',
      contractEvidence: '정규직',
      hiringReason: '데모 이후 기술 검증 병목 완화',
    },
    {
      name: 'RevOps Analyst',
      headcount: 2,
      department: 'Revenue Operations',
      duties: ['CRM 데이터 정비', '세일즈 퍼널 분석'],
      qualification: 'CRM 및 데이터 분석 경험',
      contractEvidence: '정규직',
      hiringReason: '세일즈 운영 체계 정량화',
    },
  ],
  evidence: [
    {
      title: 'Enterprise Account Executive',
      url: 'https://example.com/jobs/enterprise-ae',
      publishedAt: '2026-08-01',
      location: '서울 강남',
      headcount: 5,
    },
    {
      title: 'Solutions Engineer',
      url: 'https://example.com/jobs/solutions-engineer',
      publishedAt: '2026-08-06',
      location: '서울 강남',
      headcount: 4,
    },
    {
      title: 'RevOps Analyst',
      url: 'https://example.com/jobs/revops',
      publishedAt: '2026-08-10',
      location: '서울 강남',
      headcount: 2,
    },
  ],
};

const timeline = [
  { week: '4주 전', label: 'Sales Lead 2건', level: 'low' },
  { week: '3주 전', label: 'AE 3건 추가', level: 'medium' },
  { week: '2주 전', label: 'SE/RevOps 동시 오픈', level: 'high' },
  { week: '이번 주', label: '파트너 채용 급증', level: 'high' },
];

const coldMailPoints = [
  '채용 변화가 “대형 고객 영업조직 확대”와 직접 연결되어 있어 첫 연락의 맥락이 분명합니다.',
  '기술 지원 직무가 함께 증가해 세일즈 이후 검증 단계의 병목을 해결하려는 니즈를 가정할 수 있습니다.',
  'RevOps 키워드가 등장해 파이프라인 예측, CRM 정비, 영업 운영 자동화를 소구점으로 삼기 좋습니다.',
];

function safeCompanyName(companyId: string | undefined, analysis: CompanyRoleAnalysis) {
  if (analysis.companyName) return analysis.companyName;
  if (!companyId) return 'ApexPay';
  return decodeURIComponent(companyId).replaceAll('-', ' ');
}

export function ResultDetailPage() {
  const { companyId } = useParams();
  const location = useLocation();
  const analysis =
    (location.state as { analysis?: CompanyRoleAnalysis } | null)?.analysis ?? fallbackAnalysis;
  const companyName = safeCompanyName(companyId, analysis);
  const primaryRole = analysis.roleFindings[0];
  const totalPostings = analysis.evidence.length;
  const totalHeadcount = analysis.roleFindings.reduce(
    (sum, role) => sum + (role.headcount ?? 0),
    0,
  );

  return (
    <main className="result-dashboard">
      <div className="result-shell">
        <aside className="result-sidebar" aria-label="결과 분석 메뉴">
          <div className="result-brand">
            <span>
              <Zap aria-hidden="true" />
            </span>
            Signal Radar
          </div>
          <nav className="result-menu">
            {['대시보드', '추천 기업', '채용 변화', '콜드메일', '설정'].map((item, index) => (
              <button className={index === 0 ? 'active' : ''} key={item} type="button">
                {index === 0 ? <ChartNoAxesCombined aria-hidden="true" /> : <Target aria-hidden="true" />}
                {item}
              </button>
            ))}
          </nav>
          <div className="weekly-scan-card">
            <p>이번 주 스캔</p>
            <strong>1,284</strong>
            <span>공개 ATS 공고에서 확장 신호를 추출했습니다.</span>
          </div>
        </aside>

        <section className="result-content">
          <div className="result-topbar">
            <div>
              <Link className="back-link" to="/experience/results">
                <ArrowLeft aria-hidden="true" />
                추천 기업으로 돌아가기
              </Link>
              <h1>{companyName} 상세 분석</h1>
              <p>입력 조건 기준으로 채용 변화, 확장 신호, 추천 소구점을 정리했습니다.</p>
            </div>
            <div className="result-actions">
              <a className="secondary-action" href={analysis.evidence[0]?.url ?? '#'} rel="noreferrer" target="_blank">
                <Search aria-hidden="true" />
                공고 원문
              </a>
              <Link
                className="primary-action"
                state={{
                  targetCompany: {
                    id: companyId,
                    name: companyName,
                    industry: 'B2B 확장 기업',
                    hiringChange: analysis.hiringSituation,
                    expansionSignal: analysis.interpretation,
                    recommendationReason: analysis.recommendationReasons[0],
                  },
                }}
                to="/apply"
              >
                <Send aria-hidden="true" />
                콜드메일 신청
              </Link>
            </div>
          </div>

          <div className="kpi-grid">
            <KpiCard icon={TrendingUp} label="확장 신호 점수" value="91" helper="상위 8% 기업" tone="primary" />
            <KpiCard icon={BriefcaseBusiness} label="근거 채용 공고" value={`${totalPostings}건`} helper="최근 30일 기준" tone="success" />
            <KpiCard icon={Users} label="확인 모집 인원" value={`${totalHeadcount || 14}명`} helper="JD 명시 인원 합산" tone="warning" />
            <KpiCard icon={Mail} label="추천 접점" value={primaryRole?.department ?? 'RevOps'} helper="응답률 가설 높음" tone="accent" />
          </div>

          <div className="result-grid two-column">
            <section className="analysis-card wide">
              <div className="section-title-row">
                <div>
                  <p>Hiring Signal Timeline</p>
                  <h2>채용 변화와 확장 해석</h2>
                </div>
                <span>최근 4주</span>
              </div>
              <div className="timeline-grid">
                {timeline.map((item) => (
                  <div className="timeline-card" key={item.week}>
                    <span>{item.week}</span>
                    <strong>{item.label}</strong>
                    <div className="mini-bars" data-level={item.level}>
                      <i />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="analysis-card">
              <p className="section-kicker">Company Snapshot</p>
              <h2>{companyName}</h2>
              <div className="info-list">
                <InfoRow icon={Building2} label="산업" value="B2B 확장 기업" />
                <InfoRow icon={MapPin} label="위치" value={analysis.evidence[0]?.location ?? '서울'} />
                <InfoRow icon={CalendarDays} label="감지 기간" value="최근 30일" />
                <InfoRow icon={CircleDollarSign} label="추천 영업 소구" value="Enterprise 전환율" />
              </div>
              <div className="reason-box">
                <strong>
                  <BadgeCheck aria-hidden="true" />
                  추천 이유
                </strong>
                <p>{analysis.interpretation}</p>
              </div>
            </section>
          </div>

          <div className="result-grid lower-grid">
            <section className="analysis-card">
              <p className="section-kicker">JD Breakdown</p>
              <h2>직무별 신호</h2>
              <div className="role-signal-list">
                {analysis.roleFindings.map((role, index) => (
                  <div className="role-signal-card" key={`${role.name}-${index}`}>
                    <div>
                      <strong>{role.name}</strong>
                      <span>+{role.headcount ?? index + 1}</span>
                    </div>
                    <div className="signal-progress">
                      <i style={{ width: `${Math.min((role.headcount ?? index + 2) * 18, 92)}%` }} />
                    </div>
                    <p>{role.department || '확장 조직'} 중심으로 채용 수요가 확인됩니다.</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="analysis-card wide">
              <div className="section-title-row">
                <div>
                  <p>Sales Context</p>
                  <h2>맞춤형 콜드메일 소구점</h2>
                </div>
                <LineChart aria-hidden="true" />
              </div>
              <div className="coldmail-list">
                {coldMailPoints.map((point, index) => (
                  <article key={point}>
                    <span>{index + 1}</span>
                    <p>{point}</p>
                  </article>
                ))}
              </div>
              <div className="mail-opening">
                <p>추천 첫 문장</p>
                <strong>
                  “최근 {primaryRole?.name ?? 'Enterprise AE'} 채용을 늘리시는 걸 보고, 대형 고객 전환 이후
                  운영 병목을 줄이는 팀 확장 단계라고 판단했습니다.”
                </strong>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function KpiCard({
  helper,
  icon: Icon,
  label,
  tone,
  value,
}: {
  helper: string;
  icon: LucideIcon;
  label: string;
  tone: 'accent' | 'primary' | 'success' | 'warning';
  value: string;
}) {
  return (
    <article className={`kpi-card ${tone}`}>
      <div>
        <span>
          <Icon aria-hidden="true" />
        </span>
        <Sparkles aria-hidden="true" />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="info-row">
      <span>
        <Icon aria-hidden="true" />
        {label}
      </span>
      <strong>{value}</strong>
    </div>
  );
}

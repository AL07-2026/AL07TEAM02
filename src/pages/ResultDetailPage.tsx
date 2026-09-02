import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChartNoAxesCombined,
  LineChart,
  Mail,
  MapPin,
  Search,
  Send,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router';

import { ChokBrand } from '@/components/ChokBrand';
import { readCompanyAnalysis } from '@/jobs/analysisSession';
import type { CompanyRoleAnalysis, JobSource } from '@/jobs/types';

const sourceLabels: Partial<Record<JobSource, string>> = {
  alio: 'ALIO',
  jooble: 'Jooble',
  saramin: '사람인',
  work24: '고용24',
};

const roleLabels: Record<CompanyRoleAnalysis['role'], string> = {
  sales: 'B2B 영업',
  recruiter: '헤드헌팅',
  investor: '투자 검토',
};

function companyNameFromId(companyId: string | undefined) {
  if (!companyId) return '';
  try {
    return decodeURIComponent(companyId).replaceAll('-', ' ');
  } catch {
    return companyId.replaceAll('-', ' ');
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function scoreLevel(score: number, maximum: number) {
  const ratio = maximum ? score / maximum : 0;
  if (ratio >= 0.7) return 'high';
  if (ratio >= 0.4) return 'medium';
  return 'low';
}

function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <ChokBrand />
        <nav aria-label="주요 메뉴" className="site-nav experience-nav">
          <Link to="/">서비스 소개</Link>
          <Link to="/#how">이용 방법</Link>
          <Link className="header-cta" to="/experience">
            무료 체험 <ArrowRight />
          </Link>
          <Link
            aria-label="관리자 페이지"
            className="admin-shortcut"
            title="관리자 페이지"
            to="/admin/cold-email-requests"
          >
            <UserCog aria-hidden="true" />
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ResultDetailPage() {
  const { companyId } = useParams();
  const location = useLocation();
  const requestedCompanyName = companyNameFromId(companyId);
  const routedAnalysis = (location.state as { analysis?: CompanyRoleAnalysis } | null)?.analysis;
  const analysis = routedAnalysis ?? readCompanyAnalysis(requestedCompanyName);

  if (!analysis) {
    return (
      <div className="result-page">
        <Header />
        <main className="result-dashboard">
          <div className="container result-shell">
            <section className="result-content">
              <div className="result-topbar">
                <div>
                  <Link className="back-link" to="/experience/results">
                    <ArrowLeft aria-hidden="true" />
                    추천 기업으로 돌아가기
                  </Link>
                  <span className="eyebrow result-eyebrow">
                    <ChartNoAxesCombined /> 기업 상세 분석
                  </span>
                  <h1>기업 분석 데이터를 찾을 수 없습니다</h1>
                  <p>추천 결과에서 기업을 선택하면 실제 채용 분석 데이터를 확인할 수 있습니다.</p>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const companyName = analysis.companyName;
  const primaryRole = analysis.roleFindings[0];
  const totalPostings = new Set(analysis.evidenceUrls).size || analysis.evidence.length;
  const totalHeadcount = analysis.roleFindings.reduce(
    (sum, role) => sum + (role.headcount ?? 0),
    0,
  );
  const recommendationContact =
    primaryRole?.department || primaryRole?.name || analysis.evidence[0]?.title || '채용 담당 조직';
  const locations = [...new Set(analysis.evidence.map((item) => item.location).filter(Boolean))];
  const sources = [
    ...new Set(analysis.evidence.map((item) => sourceLabels[item.source] ?? item.source)),
  ];
  const latestPosting = [...analysis.evidence].sort(
    (a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt),
  )[0];

  return (
    <div className="result-page">
      <Header />
      <main className="result-dashboard">
        <div className="container result-shell">
          <section className="result-content">
            <div className="result-topbar">
              <div>
                <Link className="back-link" to="/experience/results">
                  <ArrowLeft aria-hidden="true" />
                  추천 기업으로 돌아가기
                </Link>
                <span className="eyebrow result-eyebrow">
                  <ChartNoAxesCombined /> 기업 상세 분석
                </span>
                <h1>{companyName} 상세 분석</h1>
                <p>{analysis.hiringSituation}</p>
              </div>
              <div className="result-actions">
                {analysis.evidence[0] ? (
                  <a
                    className="secondary-action"
                    href={analysis.evidence[0].url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Search aria-hidden="true" />
                    공고 원문
                  </a>
                ) : null}
                <Link
                  className="primary-action"
                  state={{
                    applicantRole: analysis.role,
                    targetCompany: {
                      id: companyId,
                      name: companyName,
                      industry: sources.join(', ') || '공개 채용 데이터',
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
              <KpiCard
                icon={TrendingUp}
                label="확장 신호 점수"
                value={`${analysis.totalScore}점`}
                helper={`신뢰도 ${analysis.confidenceScore}점`}
                tone="primary"
              />
              <KpiCard
                icon={BriefcaseBusiness}
                label="관련 채용 공고"
                value={`${totalPostings}건`}
                helper="검색 직무와 연결된 공고"
                tone="success"
              />
              <KpiCard
                icon={Users}
                label="확인 모집 인원"
                value={totalHeadcount ? `${totalHeadcount}명` : '미기재'}
                helper="공고에 명시된 인원 합산"
                tone="warning"
              />
              <KpiCard
                icon={Mail}
                label="추천 접점"
                value={recommendationContact}
                helper={roleLabels[analysis.role]}
                tone="accent"
              />
            </div>

            <div className="result-grid two-column">
              <section className="analysis-card wide">
                <div className="section-title-row">
                  <div>
                    <p>Score Breakdown</p>
                    <h2>분석 점수 구성</h2>
                  </div>
                  <span>실제 분석 점수</span>
                </div>
                <div className="timeline-grid">
                  {analysis.breakdown.map((item) => (
                    <div className="timeline-card" key={item.label}>
                      <span>{item.label}</span>
                      <strong>
                        {item.score} / {item.maximum}점
                      </strong>
                      <div className="mini-bars" data-level={scoreLevel(item.score, item.maximum)}>
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
                  <InfoRow icon={Building2} label="분석 관점" value={roleLabels[analysis.role]} />
                  <InfoRow
                    icon={MapPin}
                    label="확인 지역"
                    value={locations.slice(0, 2).join(', ') || '지역 미기재'}
                  />
                  <InfoRow
                    icon={CalendarDays}
                    label="최근 공고"
                    value={latestPosting ? formatDate(latestPosting.publishedAt) : '날짜 미기재'}
                  />
                  <InfoRow
                    icon={BriefcaseBusiness}
                    label="데이터 출처"
                    value={sources.join(', ') || '출처 미기재'}
                  />
                </div>
                <div className="reason-box">
                  <strong>
                    <BadgeCheck aria-hidden="true" />
                    현재 채용 상황
                  </strong>
                  <p>{analysis.hiringSituation}</p>
                </div>
              </section>
            </div>

            <div className="result-grid lower-grid">
              <section className="analysis-card">
                <p className="section-kicker">Evidence</p>
                <h2>판단 근거 공고</h2>
                <div className="role-signal-list">
                  {analysis.evidence.map((evidence) => (
                    <article className="role-signal-card" key={evidence.url}>
                      <div>
                        <strong>{evidence.title}</strong>
                        <span>{sourceLabels[evidence.source] ?? evidence.source}</span>
                      </div>
                      <p>
                        {formatDate(evidence.publishedAt)} · {evidence.location || '지역 미기재'}
                        {evidence.headcount ? ` · ${evidence.headcount}명` : ''}
                      </p>
                      <a
                        className="back-link"
                        href={evidence.url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        공고 원문 보기 <ArrowRight aria-hidden="true" />
                      </a>
                    </article>
                  ))}
                </div>
              </section>

              <section className="analysis-card wide">
                <div className="section-title-row">
                  <div>
                    <p>Company Analysis</p>
                    <h2>기업 상황 분석</h2>
                  </div>
                  <LineChart aria-hidden="true" />
                </div>
                <div className="reason-box">
                  <strong>
                    <TrendingUp aria-hidden="true" />
                    분석 해석
                  </strong>
                  <p>{analysis.interpretation}</p>
                </div>

                <p className="section-kicker">추천한 이유</p>
                <div className="coldmail-list">
                  {analysis.recommendationReasons.map((reason, index) => (
                    <article key={reason}>
                      <span>{index + 1}</span>
                      <p>{reason}</p>
                    </article>
                  ))}
                </div>

                <div className="mail-opening">
                  <p>추천 첫 접근 문장</p>
                  <strong>
                    “{companyName}의 채용 흐름을 확인했습니다. {analysis.recommendationReasons[0]}”
                  </strong>
                </div>
              </section>
            </div>

            <div className="result-grid two-column">
              <section className="analysis-card wide">
                <div className="section-title-row">
                  <div>
                    <p>Observed Facts</p>
                    <h2>관측된 채용 사실</h2>
                  </div>
                  <span>{analysis.observedFacts.length}개 지표</span>
                </div>
                <div className="coldmail-list">
                  {analysis.observedFacts.map((fact, index) => (
                    <article key={fact}>
                      <span>{index + 1}</span>
                      <p>{fact}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="analysis-card">
                <p className="section-kicker">Risk Check</p>
                <h2>확인할 점</h2>
                <div className="role-signal-list">
                  {(analysis.riskFlags.length
                    ? analysis.riskFlags
                    : ['공개 채용공고를 기반으로 한 분석이며 실제 내부 계획과 다를 수 있습니다.']
                  ).map((risk) => (
                    <div className="reason-box" key={risk}>
                      <strong>
                        <BadgeCheck aria-hidden="true" />
                        데이터 해석 주의
                      </strong>
                      <p>{risk}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {analysis.roleFindings.length ? (
              <section className="analysis-card">
                <div className="section-title-row">
                  <div>
                    <p>JD Breakdown</p>
                    <h2>직무 상세</h2>
                  </div>
                  <span>{analysis.roleFindings.length}개 직무</span>
                </div>
                <div className="role-signal-list">
                  {analysis.roleFindings.map((role, index) => (
                    <article className="role-signal-card" key={`${role.name}-${index}`}>
                      <div>
                        <strong>{role.name}</strong>
                        <span>{role.headcount ? `${role.headcount}명` : '인원 미기재'}</span>
                      </div>
                      <p>
                        {role.department ? `부서: ${role.department}` : '부서 미기재'}
                        {role.duties.length ? ` · 주요 업무: ${role.duties.join(', ')}` : ''}
                      </p>
                      {role.qualification ? <p>지원 조건: {role.qualification}</p> : null}
                      {role.hiringReason ? <p>채용 배경: {role.hiringReason}</p> : null}
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </section>
        </div>
      </main>
    </div>
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

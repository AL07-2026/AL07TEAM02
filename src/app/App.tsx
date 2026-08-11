import {
  ArrowRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  ExternalLink,
  LoaderCircle,
  Menu,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

type Company = {
  id: number;
  name: string;
  initials: string;
  color: string;
  industry: string;
  employees: string;
  priority: '높음' | '보통';
  score: number;
  jobs: number;
  increase: number;
  roles: string[];
  reason: string;
  signals: string[];
  contacts: string[];
  points: string[];
};

const companies: Company[] = [
  {
    id: 1,
    name: '테크웨이브',
    initials: 'TW',
    color: '#5B5CE2',
    industry: 'B2B 소프트웨어',
    employees: '120~180명',
    priority: '높음',
    score: 87,
    jobs: 15,
    increase: 8,
    roles: ['백엔드', '프론트엔드', 'DevOps'],
    reason: '개발조직 확대로 프로젝트 및 협업 관리 복잡성이 증가할 가능성이 있습니다.',
    signals: [
      '최근 30일간 개발직군 채용공고 15건',
      '지난달보다 채용공고 8건 증가',
      'DevOps 직군 신규 채용 시작',
      '백엔드·프론트엔드 개발자 동시 채용',
    ],
    contacts: ['CTO', '개발팀장', '기술운영 담당자'],
    points: [
      '개발조직 확대 과정의 협업 문제를 먼저 언급하세요.',
      '팀과 프로젝트가 늘어날 때의 관리 방식을 질문하세요.',
      '비슷한 규모의 고객 사례로 신뢰를 더하세요.',
    ],
  },
  {
    id: 2,
    name: '클라우드픽',
    initials: 'CP',
    color: '#0B9F8A',
    industry: '클라우드 인프라',
    employees: '80~120명',
    priority: '높음',
    score: 82,
    jobs: 11,
    increase: 6,
    roles: ['DevOps', '보안', '백엔드'],
    reason: '인프라 조직 신설 신호가 확인되어 업무 표준화 솔루션과의 연관도가 높습니다.',
    signals: [
      '최근 30일간 기술직군 채용공고 11건',
      '클라우드 보안 담당자 첫 채용',
      'DevOps 경력직 4개 포지션 동시 모집',
      '플랫폼 엔지니어링 조직 채용 확대',
    ],
    contacts: ['VP of Engineering', '인프라팀장', '보안 책임자'],
    points: [
      '인프라 조직 간 업무 표준화 문제로 대화를 시작하세요.',
      '보안과 개발 속도를 동시에 유지하는 방법을 제안하세요.',
      '도입 난이도가 낮다는 점을 강조하세요.',
    ],
  },
  {
    id: 3,
    name: '데이터브릿지',
    initials: 'DB',
    color: '#E17935',
    industry: '데이터 분석',
    employees: '210~280명',
    priority: '보통',
    score: 74,
    jobs: 9,
    increase: 4,
    roles: ['데이터', 'AI', '백엔드'],
    reason: '데이터·AI 인력 채용 증가로 프로젝트와 이해관계자 관리 수요가 예상됩니다.',
    signals: [
      '데이터 엔지니어 채용공고 5건',
      'AI 프로덕트 매니저 신규 채용',
      '최근 2주 사이 신규 공고 4건',
      '기업 고객 대상 솔루션 조직 확대',
    ],
    contacts: ['데이터 총괄', 'AI 조직장', '프로덕트 책임자'],
    points: [
      '데이터 프로젝트의 진행 상황 공유 문제를 확인하세요.',
      '기술팀과 비기술팀 사이 협업 사례를 활용하세요.',
      '작은 팀에서 먼저 시작할 수 있음을 안내하세요.',
    ],
  },
];

const initialForm = {
  product: '개발팀용 협업 SaaS',
  problem: '개발조직 확대에 따른 업무 및 프로젝트 관리 복잡성',
  customer: '직원 50~300명 규모의 IT 기업',
  role: '전체 개발직군',
  industry: 'IT·소프트웨어',
  size: '50~300명',
};

function track(event: string) {
  console.info(`[MVP event] ${event}`);
}

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="세일즈 시그널 홈">
      <span className="brand-mark">
        <Radar size={19} />
      </span>
      <span>세일즈 시그널</span>
    </a>
  );
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const formRef = useRef<HTMLElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const outreach = useMemo(() => {
    const company = selected ?? companies[0]!;
    return {
      subject: `${company.name} 개발조직 확대 과정의 협업 관리에 관해`,
      body: `안녕하세요. 최근 ${company.name}에서 ${company.roles.join('·')} 직군 채용을 확대하고 계신 것을 확인했습니다.\n\n개발 인원과 프로젝트가 동시에 늘어나는 과정에서 업무 현황과 협업 내용을 한눈에 관리하기 어려워지는 경우가 많아 연락드렸습니다.\n\n저희 ${submitted.product}은(는) ${submitted.problem} 문제를 줄이는 데 도움을 드리고 있습니다. 현재 팀에서 사용하고 계신 협업 방식과 관련해 15분 정도 의견을 나눌 수 있을까요?`,
    };
  }, [selected, submitted]);

  useEffect(() => {
    document.body.style.overflow = selected || showMessage ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selected, showMessage]);

  const startTrial = () => {
    track('free_trial_clicked');
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    if (!form.product.trim() || !form.problem.trim()) return;
    setSubmitted(form);
    setLoading(true);
    track('product_info_submitted');
    window.setTimeout(() => {
      setLoading(false);
      setShowResults(true);
      track('recommendation_viewed');
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }, 1600);
  };

  const openDetail = (company: Company) => {
    setSelected(company);
    track('company_detail_viewed');
  };

  const openMessage = () => {
    setSelected(null);
    setShowMessage(true);
    setMessageLoading(true);
    setCopied(false);
    track('outreach_message_generated');
    window.setTimeout(() => setMessageLoading(false), 900);
  };

  const copyMessage = async () => {
    await navigator.clipboard?.writeText(`${outreach.subject}\n\n${outreach.body}`);
    setCopied(true);
    track('outreach_message_copied');
    window.setTimeout(() => setCopied(false), 1800);
  };

  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    setEmailError('');
    setSubscribed(true);
    track('weekly_alert_requested');
  };

  return (
    <div id="top">
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className={mobileNav ? 'nav open' : 'nav'}>
            <a href="#how" onClick={() => setMobileNav(false)}>
              이용 방법
            </a>
            <a href="#difference" onClick={() => setMobileNav(false)}>
              기존 방식과 비교
            </a>
            <button
              className="nav-cta"
              onClick={() => {
                startTrial();
                setMobileNav(false);
              }}
            >
              무료 체험
            </button>
          </nav>
          <button
            className="menu-button"
            aria-label="메뉴 열기"
            onClick={() => setMobileNav(!mobileNav)}
          >
            {mobileNav ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-glow glow-one" />
          <div className="hero-glow glow-two" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow">
                <Sparkles size={15} /> B2B 영업을 위한 채용 데이터 인텔리전스
              </div>
              <h1>
                채용공고 속에서
                <br />
                <em>지금 접근할 기업</em>을<br />
                찾아드립니다.
              </h1>
              <p>
                자사 제품을 입력하면 기업의 채용 변화를 분석해
                <br className="desktop-only" /> 주목할 영업 신호와 접근 근거를 보여드립니다.
              </p>
              <div className="hero-actions">
                <button className="primary-button large" onClick={startTrial}>
                  회원가입 없이 무료 체험 <ArrowRight />
                </button>
                <span>
                  <CheckCircle2 /> 추천 기업 3곳 무료 확인
                </span>
              </div>
              <div className="trust-row">
                <div>
                  <ShieldCheck />
                  <span>
                    <b>근거 기반</b>실제 채용 변화 분석
                  </span>
                </div>
                <div>
                  <Radar />
                  <span>
                    <b>신호 탐지</b>접근 타이밍 추천
                  </span>
                </div>
                <div>
                  <BriefcaseBusiness />
                  <span>
                    <b>즉시 활용</b>영업 포인트 생성
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-label="추천 기업 분석 화면 미리보기">
              <div className="visual-topbar">
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <p>오늘의 영업 시그널</p>
                <Bell size={17} />
              </div>
              <div className="visual-body">
                <div className="visual-heading">
                  <div>
                    <small>추천 결과</small>
                    <h3>지금 주목할 기업</h3>
                  </div>
                  <span>3개 발견</span>
                </div>
                <div className="signal-card featured">
                  <div className="company-row">
                    <span className="company-logo">TW</span>
                    <div>
                      <b>테크웨이브</b>
                      <small>B2B 소프트웨어 · 120~180명</small>
                    </div>
                    <span className="priority high">접근 우선순위 높음</span>
                  </div>
                  <div className="metric-row">
                    <div>
                      <small>제품 연관도</small>
                      <b>87%</b>
                    </div>
                    <div>
                      <small>신규 채용</small>
                      <b>15건</b>
                    </div>
                    <div>
                      <small>전월 대비</small>
                      <b className="up">
                        <TrendingUp /> +8
                      </b>
                    </div>
                  </div>
                  <div className="mini-chart">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="insight">
                    <Sparkles /> 개발조직 확대로 협업 관리 수요가 증가할 가능성이 있습니다.
                  </div>
                </div>
                <div className="compact-card">
                  <span className="company-logo mint">CP</span>
                  <div>
                    <b>클라우드픽</b>
                    <small>DevOps·보안 직군 11건 채용</small>
                  </div>
                  <strong>82%</strong>
                </div>
                <div className="compact-card">
                  <span className="company-logo orange">DB</span>
                  <div>
                    <b>데이터브릿지</b>
                    <small>데이터·AI 직군 9건 채용</small>
                  </div>
                  <strong>74%</strong>
                </div>
              </div>
              <div className="floating-stat">
                <span>
                  <TrendingUp />
                </span>
                <div>
                  <b>+42%</b>
                  <small>이번 주 신규 시그널</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="proof-strip">
          <div className="container">
            <p>
              채용공고를 <b>사업 변화의 신호</b>로 바꾸세요
            </p>
            <span />
            <p>
              확인된 사실과 해석을 <b>명확히 구분</b>합니다
            </p>
            <span />
            <p>
              영업 우선순위를 <b>근거와 함께</b> 제공합니다
            </p>
          </div>
        </section>

        <section className="section" id="how">
          <div className="container">
            <div className="section-heading centered">
              <span>HOW IT WORKS</span>
              <h2>3단계면 충분합니다</h2>
              <p>검색과 정리는 줄이고, 고객과의 대화에 집중하세요.</p>
            </div>
            <div className="steps">
              <article>
                <div className="step-icon">
                  <BriefcaseBusiness />
                </div>
                <span>01</span>
                <h3>우리 제품 입력</h3>
                <p>판매하는 제품과 해결하는 문제, 주요 고객 조건을 알려주세요.</p>
              </article>
              <div className="step-arrow">
                <ChevronRight />
              </div>
              <article>
                <div className="step-icon">
                  <BarChart3 />
                </div>
                <span>02</span>
                <h3>채용 데이터 분석</h3>
                <p>기업의 채용 변화와 제품 연관성을 근거 중심으로 분석합니다.</p>
              </article>
              <div className="step-arrow">
                <ChevronRight />
              </div>
              <article>
                <div className="step-icon">
                  <Target />
                </div>
                <span>03</span>
                <h3>영업기회 확인</h3>
                <p>우선 접근할 기업과 접촉 대상, 대화 포인트를 확인하세요.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section muted-section" id="difference">
          <div className="container compare-grid">
            <div className="section-heading">
              <span>WHY SALES SIGNAL</span>
              <h2>
                영업 타깃 탐색,
                <br />
                아직도 직접 하시나요?
              </h2>
              <p>흩어진 정보를 모으는 데 쓰던 시간을 실제 영업 활동으로 돌려드립니다.</p>
            </div>
            <div className="compare-cards">
              <article className="old-way">
                <small>기존 방식</small>
                <h3>수작업으로 하나씩</h3>
                {[
                  '여러 채용 사이트 직접 검색',
                  '엑셀로 기업 목록 정리',
                  '접근 우선순위 직접 판단',
                  '기업마다 영업 문구 작성',
                ].map((x) => (
                  <p key={x}>
                    <X /> {x}
                  </p>
                ))}
              </article>
              <article className="new-way">
                <small>세일즈 시그널</small>
                <h3>근거와 함께 한눈에</h3>
                {[
                  '채용공고 변화 자동 분석',
                  '제품과 연관된 기업 추천',
                  '추천 근거와 접촉 대상 제공',
                  '기업별 접근 문구 생성',
                ].map((x) => (
                  <p key={x}>
                    <Check /> {x}
                  </p>
                ))}
              </article>
            </div>
          </div>
        </section>

        <section className="section trial-section" ref={formRef}>
          <div className="container trial-grid">
            <div className="trial-intro">
              <span className="section-tag">무료 체험</span>
              <h2>
                어떤 기업을
                <br />
                찾고 계신가요?
              </h2>
              <p>간단한 정보만 입력하면 채용공고를 분석해 지금 접근해 볼 기업을 추천해 드립니다.</p>
              <div className="privacy-note">
                <ShieldCheck />
                <div>
                  <b>가입 없이 바로 확인</b>
                  <span>입력한 정보는 데모 분석에만 사용됩니다.</span>
                </div>
              </div>
            </div>
            <form className="trial-form" onSubmit={submitForm}>
              <div className="form-head">
                <span>1</span>
                <div>
                  <b>자사 제품과 타깃 입력</b>
                  <small>필수 항목 2개 · 약 1분 소요</small>
                </div>
              </div>
              <label>
                우리 제품은 무엇인가요? <em>필수</em>
                <input
                  value={form.product}
                  onChange={(e) => setForm({ ...form, product: e.target.value })}
                  placeholder="예: 개발팀용 협업 SaaS"
                  required
                />
              </label>
              <label>
                어떤 문제를 해결하나요? <em>필수</em>
                <textarea
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  placeholder="예: 개발자가 늘어나면서 복잡해진 프로젝트 관리"
                  required
                />
              </label>
              <label>
                어떤 기업이 주요 고객인가요?
                <input
                  value={form.customer}
                  onChange={(e) => setForm({ ...form, customer: e.target.value })}
                  placeholder="예: 직원 50~300명 규모 IT 기업"
                />
              </label>
              <div className="select-grid">
                <label>
                  관심 산업
                  <select
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  >
                    <option>IT·소프트웨어</option>
                    <option>커머스</option>
                    <option>금융·핀테크</option>
                    <option>전체 산업</option>
                  </select>
                </label>
                <label>
                  관심 직군
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option>전체 개발직군</option>
                    <option>백엔드 개발</option>
                    <option>DevOps</option>
                    <option>보안</option>
                    <option>데이터·AI</option>
                  </select>
                </label>
                <label>
                  기업 규모
                  <select
                    value={form.size}
                    onChange={(e) => setForm({ ...form, size: e.target.value })}
                  >
                    <option>50~300명</option>
                    <option>10~50명</option>
                    <option>300명 이상</option>
                    <option>전체</option>
                  </select>
                </label>
              </div>
              <button className="primary-button submit-button" disabled={loading} type="submit">
                {loading ? (
                  <>
                    <LoaderCircle className="spin" /> 영업 신호 분석 중
                  </>
                ) : (
                  <>
                    <Search /> 영업기회 찾기 <ArrowRight />
                  </>
                )}
              </button>
              {loading && (
                <div className="loading-steps">
                  <span className="done">
                    <Check /> 채용 변화 확인
                  </span>
                  <span className="active">
                    <LoaderCircle className="spin" /> 제품 연관성 분석
                  </span>
                  <span>접근 우선순위 계산</span>
                </div>
              )}
            </form>
          </div>
        </section>

        {showResults && (
          <section className="section results-section" ref={resultsRef}>
            <div className="container">
              <div className="results-head">
                <div>
                  <span className="section-tag">분석 완료</span>
                  <h2>지금 주목할 기업을 찾았습니다</h2>
                  <p>실제 채용 변화와 입력하신 제품의 연관성을 기준으로 추천한 결과입니다.</p>
                </div>
                <div className="demo-badge">
                  <ShieldCheck /> 데모 데이터
                </div>
              </div>
              <div className="query-summary">
                <div>
                  <BriefcaseBusiness />
                  <span>
                    <small>제품</small>
                    <b>{submitted.product}</b>
                  </span>
                </div>
                <div>
                  <Target />
                  <span>
                    <small>해결 문제</small>
                    <b>{submitted.problem}</b>
                  </span>
                </div>
                <button onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}>
                  조건 수정
                </button>
              </div>
              <div className="company-list">
                {companies.map((company, index) => (
                  <article className="company-card" key={company.id}>
                    <div className="rank">0{index + 1}</div>
                    <div className="company-main">
                      <div className="company-title">
                        <span className="company-logo big" style={{ background: company.color }}>
                          {company.initials}
                        </span>
                        <div>
                          <h3>{company.name}</h3>
                          <p>
                            {company.industry} · {company.employees}
                          </p>
                        </div>
                      </div>
                      <div className="badges">
                        <span
                          className={
                            company.priority === '높음' ? 'priority high' : 'priority medium'
                          }
                        >
                          접근 우선순위 {company.priority}
                        </span>
                        <span className="score">
                          제품 연관도 <b>{company.score}%</b>
                        </span>
                      </div>
                    </div>
                    <div className="company-metrics">
                      <div>
                        <small>최근 30일 채용</small>
                        <b>
                          {company.jobs}
                          <span>건</span>
                        </b>
                      </div>
                      <div>
                        <small>전월 대비</small>
                        <b className="positive">
                          +{company.increase}
                          <span>건</span>
                        </b>
                      </div>
                      <div className="role-list">
                        <small>주요 채용 직군</small>
                        <p>
                          {company.roles.map((role) => (
                            <span key={role}>{role}</span>
                          ))}
                        </p>
                      </div>
                    </div>
                    <div className="company-reason">
                      <Sparkles />
                      <p>
                        <small>추천 이유</small>
                        {company.reason}
                      </p>
                    </div>
                    <div className="company-actions">
                      <button className="primary-button" onClick={() => openDetail(company)}>
                        왜 지금 이 기업인지 보기 <ArrowRight />
                      </button>
                      <button
                        className="text-button"
                        onClick={() => track('job_posting_source_clicked')}
                      >
                        채용공고 원문 <ExternalLink />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              <p className="disclaimer">
                <ShieldCheck /> 위 기업과 수치는 서비스 체험을 위한 가상 데이터입니다. 실제 구매
                의도를 의미하지 않습니다.
              </p>
            </div>
          </section>
        )}

        <section className="final-cta">
          <div className="container">
            <div>
              <span>
                <Radar />
              </span>
              <div>
                <h2>첫 번째 영업 신호를 찾아보세요.</h2>
                <p>회원가입 없이, 1분이면 충분합니다.</p>
              </div>
            </div>
            <button className="white-button" onClick={startTrial}>
              무료로 체험하기 <ArrowRight />
            </button>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <Logo />
          <p>채용 변화에서 발견하는 새로운 B2B 영업 기회</p>
          <span>© 2026 Sales Signal. MVP Demo.</span>
        </div>
      </footer>

      {selected && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            className="detail-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.name} 상세 분석`}
          >
            <header>
              <div className="company-title">
                <span className="company-logo big" style={{ background: selected.color }}>
                  {selected.initials}
                </span>
                <div>
                  <small>영업기회 상세 분석</small>
                  <h2>왜 지금 {selected.name}인가요?</h2>
                </div>
              </div>
              <button aria-label="닫기" onClick={() => setSelected(null)}>
                <X />
              </button>
            </header>
            <div className="modal-content">
              <div className="detail-score">
                <div>
                  <small>접근 우선순위</small>
                  <b>{selected.priority}</b>
                </div>
                <div>
                  <small>제품 연관도</small>
                  <b>{selected.score}%</b>
                </div>
                <p>
                  <Sparkles /> {selected.reason}
                </p>
              </div>
              <div className="detail-section">
                <div className="detail-number">1</div>
                <div>
                  <h3>확인된 채용 사실</h3>
                  <p className="section-description">공개된 채용공고에서 확인한 변화입니다.</p>
                  <ul>
                    {selected.signals.map((x) => (
                      <li key={x}>
                        <Check /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="detail-section inference">
                <div className="detail-number">2</div>
                <div>
                  <h3>해석한 영업 신호</h3>
                  <p className="section-description">
                    채용 변화를 바탕으로 예상되는 조직의 변화입니다.
                  </p>
                  <ul>
                    <li>
                      <TrendingUp /> 개발조직을 확대하고 있을 가능성
                    </li>
                    <li>
                      <TrendingUp /> 개발 프로젝트와 협업 인원이 증가할 가능성
                    </li>
                    <li>
                      <TrendingUp /> 프로젝트 관리와 정보 공유가 복잡해질 가능성
                    </li>
                  </ul>
                  <p className="caution">
                    채용정보를 기반으로 한 추정이며 실제 구매 의도를 의미하지 않습니다.
                  </p>
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-number">3</div>
                <div>
                  <h3>추천 접촉 대상</h3>
                  <div className="contact-chips">
                    {selected.contacts.map((x) => (
                      <span key={x}>
                        <Users /> {x}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="detail-section">
                <div className="detail-number">4</div>
                <div>
                  <h3>추천 영업 포인트</h3>
                  <ul>
                    {selected.points.map((x) => (
                      <li key={x}>
                        <Check /> {x}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <footer className="modal-footer">
              <button className="secondary-button" onClick={() => setSelected(null)}>
                목록으로
              </button>
              <button className="primary-button" onClick={openMessage}>
                <Sparkles /> 이 영업 포인트로 접근 문구 만들기
              </button>
            </footer>
          </section>
        </div>
      )}

      {showMessage && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="message-modal"
            role="dialog"
            aria-modal="true"
            aria-label="맞춤 접근 문구"
          >
            <header>
              <div>
                <small>AI 영업 어시스턴트</small>
                <h2>맞춤 접근 문구가 준비됐습니다</h2>
              </div>
              <button aria-label="닫기" onClick={() => setShowMessage(false)}>
                <X />
              </button>
            </header>
            {messageLoading ? (
              <div className="message-loading">
                <span>
                  <Sparkles />
                </span>
                <h3>
                  기업의 채용 신호와 제품 정보를
                  <br />
                  조합하고 있습니다
                </h3>
                <LoaderCircle className="spin" />
              </div>
            ) : (
              <div className="message-body">
                <div className="message-paper">
                  <div className="message-label">
                    <span>추천 콜드메일</span>
                    <button onClick={copyMessage}>
                      {copied ? <Check /> : <Copy />} {copied ? '복사 완료' : '전체 복사'}
                    </button>
                  </div>
                  <label>제목</label>
                  <h3>{outreach.subject}</h3>
                  <label>본문</label>
                  {outreach.body.split('\n').map((line, i) => (
                    <p key={i}>{line || <br />}</p>
                  ))}
                </div>
                <div className="message-tip">
                  <Sparkles />
                  <p>
                    <b>추천 대화 시작 질문</b>“개발 인원이 늘어나는 과정에서 프로젝트 현황을
                    공유하는 방식에 변화가 있으셨나요?”
                  </p>
                </div>
                <div className="subscribe-box">
                  {!subscribed ? (
                    <>
                      <div>
                        <Bell />
                        <span>
                          <h3>이런 영업기회를 매주 받아보세요</h3>
                          <p>조건에 맞는 새로운 채용 신호를 이메일로 보내드립니다.</p>
                        </span>
                      </div>
                      <form onSubmit={subscribe}>
                        <input
                          aria-label="이메일"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="work@company.com"
                          type="email"
                        />
                        <button type="submit">
                          매주 받아보기 <ArrowRight />
                        </button>
                      </form>
                      {emailError && <p className="form-error">{emailError}</p>}
                    </>
                  ) : (
                    <div className="success-state">
                      <CheckCircle2 />
                      <span>
                        <h3>알림 신청이 완료되었습니다</h3>
                        <p>새로운 채용 변화가 발견되면 알려드릴게요.</p>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export { App };

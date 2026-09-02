import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  FileSearch,
  Menu,
  MessageSquareText,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { TryPage } from '@/pages/TryPage';
import { ResultDetailPage } from '@/pages/ResultDetailPage';

import { ColdEmailRequestPage } from '@/features/apply/ColdEmailRequestPage';
import { ColdEmailRequestsAdminPage } from '@/features/apply/ColdEmailRequestsAdminPage';
import { mockTargetCompany } from '@/features/apply/mock-target-company';
import type { ApplicantRole, TargetCompany } from '@/features/apply/types';
import { FeedbackPage } from '@/features/feedback/FeedbackPage';
import { HomepageFeedbackAdminPage } from '@/features/feedback/HomepageFeedbackAdminPage';
import chokLogo from '@/assets/chok-logo.png';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const oldWay = [
  '채용 사이트를 매일 직접 검색',
  '신규 고객사 후보를 엑셀로 정리',
  '채용 수요와 타이밍을 직접 추정',
  '담당자와 제안 근거를 개별 조사',
  '첫 제안 메시지를 처음부터 작성',
];

const chokWay = [
  '채용 수요 변화 자동 탐지',
  '지금 움직이는 기업 우선 추천',
  '확인 가능한 채용공고 근거 제공',
  '추천 접촉 대상과 제안 타이밍 안내',
  '고객사별 제안 포인트 정리',
];

const steps = [
  {
    icon: BriefcaseBusiness,
    number: '01',
    title: '찾는 채용 수요 입력',
    description: '집중하는 포지션과 산업, 지역 등 원하는 고객사 조건을 입력합니다.',
  },
  {
    icon: BarChart3,
    number: '02',
    title: '채용 변화 분석',
    description: '채용공고의 증가와 신규 직군 채용 등 기업의 변화를 확인합니다.',
  },
  {
    icon: Target,
    number: '03',
    title: '고객사 기회 확인',
    description: '먼저 제안할 기업과 추천 근거, 접촉 대상과 제안 포인트를 확인합니다.',
  },
];

const principles = [
  {
    icon: FileSearch,
    label: 'FACT 01',
    title: '확인된 사실',
    description: '실제 채용공고 수, 등록 시점과 채용 직군의 변화를 보여드립니다.',
  },
  {
    icon: TrendingUp,
    label: 'SIGNAL 02',
    title: '채용 수요 해석',
    description: '공고 증가와 신규 포지션이 어떤 채용 수요를 나타내는지 설명합니다.',
  },
  {
    icon: Target,
    label: 'PRIORITY 03',
    title: '접근 우선순위',
    description: '채용 규모와 시급성을 바탕으로 먼저 검토할 기업을 보여드립니다.',
  },
];

function track(name: string, properties: Record<string, unknown> = {}) {
  const event = { event: name, timestamp: Date.now(), ...properties };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
  window.dispatchEvent(new CustomEvent('sales-signal:event', { detail: event }));
  console.info(`[CHOK] ${name}`, properties);
}

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="촉 홈">
      <span className="brand-logo-frame">
        <img className="brand-logo" src={chokLogo} alt="촉 CHOK" />
      </span>
    </a>
  );
}

function MetricHelp({ description }: { description: string }) {
  return (
    <button
      aria-label={description}
      className="metric-help"
      data-tooltip={description}
      type="button"
    >
      <CircleHelp aria-hidden="true" />
    </button>
  );
}

function DemoCard({ compact = false }: { compact?: boolean }) {
  return (
    <article className={compact ? 'demo-card compact' : 'demo-card'}>
      <div className="demo-company-row">
        <span className="company-avatar">TW</span>
        <div className="company-meta">
          <strong>테크웨이브</strong>
          <span>B2B 소프트웨어 · 직원 120~180명</span>
        </div>
        <span className="priority-badge">제안 우선순위 높음</span>
      </div>

      <div className="demo-metrics">
        <div>
          <span>채용 수요도</span>
          <strong className="metric-value">
            87%
            <MetricHelp description="공고 증가와 신규 직군 등 확인된 채용 변화의 강도를 나타내는 데모 점수입니다." />
          </strong>
          <small className="metric-basis">공고 증가·직군 확장 분석</small>
        </div>
        <div>
          <span>최근 30일 채용</span>
          <strong>15건</strong>
          <small className="metric-basis">최근 30일 등록 공고</small>
        </div>
        <div>
          <span>전월 대비</span>
          <strong className="positive">
            <TrendingUp /> +8건
          </strong>
          <small className="metric-basis">직전 30일과 비교</small>
        </div>
      </div>

      <div className="signal-chart" aria-label="채용공고 증가 추이">
        {[28, 36, 33, 48, 45, 62, 74, 92].map((height, index) => (
          <span key={index} style={{ height: `${height}%` }} />
        ))}
      </div>

      <div className="demo-signal">
        <Sparkles />
        <div>
          <span>추천 이유</span>
          <p>개발직군 채용이 빠르게 늘고 신규 포지션까지 열려 인재 확보 수요가 커지고 있습니다.</p>
        </div>
      </div>
    </article>
  );
}

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const demoRef = useRef<HTMLDivElement>(null);
  const howRef = useRef<HTMLElement>(null);
  const landingTracked = useRef(false);
  const observedSections = useRef(new Set<string>());

  useEffect(() => {
    if (!landingTracked.current) {
      track('landing_viewed');
      landingTracked.current = true;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || observedSections.current.has(entry.target.id)) return;
          observedSections.current.add(entry.target.id);
          if (entry.target.id === 'hero-demo') track('hero_demo_viewed');
          if (entry.target.id === 'how') track('how_it_works_viewed');
        });
      },
      { threshold: 0.45 },
    );

    if (demoRef.current) observer.observe(demoRef.current);
    if (howRef.current) observer.observe(howRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!demoOpen) return;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDemoOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [demoOpen]);

  const trackTrial = (placement: 'header' | 'hero' | 'footer') => {
    track('free_trial_clicked', { placement });
    if (placement === 'footer') track('final_cta_clicked');
  };

  const trackFeedback = (placement: 'header' | 'hero' | 'footer') => {
    track('homepage_feedback_clicked', { placement });
  };

  return (
    <div id="top">
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <div className="header-actions">
            <nav className={menuOpen ? 'site-nav open' : 'site-nav'} aria-label="주요 메뉴">
              <a href="#service" onClick={() => setMenuOpen(false)}>
                서비스 소개
              </a>
              <a href="#how" onClick={() => setMenuOpen(false)}>
                이용 방법
              </a>
              <a
                className="header-feedback"
                href="/feedback"
                onClick={() => {
                  setMenuOpen(false);
                  trackFeedback('header');
                }}
              >
                피드백
              </a>
              <a className="header-cta" href="/experience" onClick={() => trackTrial('header')}>
                채용 수요 찾아보기 <ArrowRight />
              </a>
            </nav>
            <a
              className="admin-shortcut"
              href="/admin/homepage-feedback"
              aria-label="관리자 페이지"
              title="관리자 페이지"
            >
              <UserCog aria-hidden="true" />
            </a>
            <button
              className="menu-toggle"
              type="button"
              aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero" id="service">
          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <Sparkles /> 헤드헌터를 위한 채용 수요 인텔리전스
              </span>
              <h1 className="hero-message-card">
                <span>채용이 시작되는 순간</span>
                <em>새로운 고객사를</em>
                <span className="headline-last-line">
                  먼저 포착하세요 <ArrowRight aria-hidden="true" />
                </span>
              </h1>
              <p>
                원하는 포지션과 지역을 입력하면 공개 채용공고의 변화를 분석해
                <br className="desktop-break" /> 지금 제안할 기업과 접근 근거를 보여드립니다.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="/experience" onClick={() => trackTrial('hero')}>
                  채용 수요 찾아보기 <ArrowRight />
                </a>
                <a
                  className="secondary-button"
                  href="/feedback"
                  onClick={() => trackFeedback('hero')}
                >
                  <MessageSquareText aria-hidden="true" />
                  피드백 남기기
                </a>
                <span>
                  <CheckCircle2 /> 약 1분 소요 · 추천 기업 3곳 무료 확인
                </span>
              </div>
              <div className="hero-benefits">
                <div>
                  <ShieldCheck />
                  <span>
                    <strong>실제 공고 기반</strong>확인 가능한 근거
                  </span>
                </div>
                <div>
                  <Radar />
                  <span>
                    <strong>수요 포착</strong>움직이는 기업 발견
                  </span>
                </div>
                <div>
                  <BriefcaseBusiness />
                  <span>
                    <strong>먼저 제안</strong>접촉 타이밍 안내
                  </span>
                </div>
              </div>
            </div>

            <div className="hero-demo" id="hero-demo" ref={demoRef}>
              <div className="demo-window">
                <div className="demo-toolbar">
                  <div className="window-dots">
                    <span />
                    <span />
                    <span />
                  </div>
                  <strong>오늘의 채용 촉</strong>
                  <span className="demo-label">예시 데이터</span>
                </div>
                <div className="demo-content">
                  <div className="demo-heading">
                    <div>
                      <span>추천 결과</span>
                      <h2>지금 주목할 기업</h2>
                    </div>
                    <span>3개 발견</span>
                  </div>
                  <div className="demo-data-notice">
                    <CircleAlert aria-hidden="true" />
                    <p>
                      <strong>예시 화면입니다.</strong> 공개 채용정보를 기반으로 분석한 수요
                      신호입니다.
                    </p>
                  </div>
                  <DemoCard compact />
                  <div className="mini-company">
                    <span className="mini-avatar green">CP</span>
                    <div>
                      <strong>클라우드픽</strong>
                      <span>DevOps·보안 직군 11건 채용</span>
                    </div>
                    <b>82%</b>
                  </div>
                  <div className="mini-company">
                    <span className="mini-avatar orange">DB</span>
                    <div>
                      <strong>데이터브릿지</strong>
                      <span>데이터·AI 직군 9건 채용</span>
                    </div>
                    <b>74%</b>
                  </div>
                  <button
                    className="demo-detail-button"
                    type="button"
                    onClick={() => setDemoOpen(true)}
                  >
                    왜 지금 이 기업인지 보기 <ChevronRight />
                  </button>
                </div>
              </div>
              <div className="floating-signal">
                <span>
                  <TrendingUp />
                </span>
                <div>
                  <span className="floating-signal-value">
                    <strong>+42%</strong>
                    <b>전주 대비</b>
                    <MetricHelp description="지난주 대비 새로 탐지된 채용 수요 신호의 증가율을 나타내는 데모 수치입니다." />
                  </span>
                  <small>새로 탐지된 채용 수요 신호</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="context-strip" aria-label="서비스 핵심 특징">
          <div className="container">
            <span>
              채용공고를 <strong>고객사 발굴의 신호</strong>로
            </span>
            <i />
            <span>
              사실과 해석을 <strong>명확하게 구분</strong>
            </span>
            <i />
            <span>
              접근 우선순위를 <strong>근거와 함께</strong>
            </span>
          </div>
        </section>

        <section className="section problem-section">
          <div className="container problem-grid">
            <div className="section-heading">
              <span className="section-label">THE PROBLEM</span>
              <h2 className="problem-message-card">
                <span>새로운 고객사를 찾는 데</span>
                <em>너무 많은 시간을</em>
                <span>쓰고 있나요?</span>
              </h2>
              <p>
                헤드헌터는 새로운 고객사를 찾기 위해 여러 채용 사이트를 검색하고, 기업 목록을
                정리하고, 어떤 기업에 먼저 제안할지 직접 판단합니다.
              </p>
            </div>
            <div className="comparison">
              <article className="compare-card before-card">
                <span>기존 방식</span>
                <h3>수작업으로 하나씩</h3>
                <div>
                  {oldWay.map((item) => (
                    <p key={item}>
                      <X /> {item}
                    </p>
                  ))}
                </div>
              </article>
              <article className="compare-card after-card">
                <span>촉과 함께</span>
                <h3>근거와 함께 한눈에</h3>
                <div>
                  {chokWay.map((item) => (
                    <p key={item}>
                      <Check /> {item}
                    </p>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="section how-section" id="how" ref={howRef}>
          <div className="container">
            <div className="section-heading centered">
              <span className="section-label">HOW IT WORKS</span>
              <h2>3단계면 충분합니다</h2>
              <p>검색과 정리는 줄이고, 고객사와 후보자에게 집중하세요.</p>
            </div>
            <div className="steps">
              {steps.map(({ icon: Icon, number, title, description }, index) => (
                <div className="step-wrap" key={title}>
                  <article className="step-card">
                    <span className="step-icon">
                      <Icon />
                    </span>
                    <b>{number}</b>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </article>
                  {index < steps.length - 1 && (
                    <span className="step-arrow">
                      <ChevronRight />
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section principles-section">
          <div className="container">
            <div className="section-heading centered">
              <span className="section-label">OUR PRINCIPLES</span>
              <h2>결론보다 근거를 먼저 보여드립니다</h2>
              <p>추천 결과를 믿고 검토할 수 있도록 사실과 해석을 분리합니다.</p>
            </div>
            <div className="principles-grid">
              {principles.map(({ icon: Icon, label, title, description }) => (
                <article className="principle-card" key={title}>
                  <div>
                    <span>
                      <Icon />
                    </span>
                    <small>{label}</small>
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="principle-notice">
              <ShieldCheck />
              <p>
                <strong>촉은 기업의 헤드헌팅 의뢰 의사를 확정하지 않습니다.</strong>
                <span>공개된 채용정보를 바탕으로 먼저 검토할 고객사 후보를 추천합니다.</span>
              </p>
            </div>
          </div>
        </section>

        <section className="final-cta-section">
          <div className="container final-cta-inner">
            <div className="final-cta-copy">
              <span>
                <Radar />
              </span>
              <div>
                <h2>첫 번째 고객사 신호를 포착하세요.</h2>
                <p>회원가입 없이 원하는 채용 수요를 입력하고 추천 기업 3곳을 확인하세요.</p>
              </div>
            </div>
            <div className="final-cta-action">
              <a href="/experience" onClick={() => trackTrial('footer')}>
                채용 수요 찾아보기 <ArrowRight />
              </a>
              <a
                className="final-feedback-link"
                href="/feedback"
                onClick={() => trackFeedback('footer')}
              >
                홈페이지 피드백 남기기 <MessageSquareText aria-hidden="true" />
              </a>
              <span>회원가입 없음 · 결제정보 없음 · 약 1분 소요</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <Logo />
            <p>헤드헌터를 위한 채용 수요 인텔리전스</p>
          </div>
          <p>본 페이지의 기업과 데이터는 MVP 검증을 위한 예시입니다.</p>
        </div>
      </footer>

      {demoOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDemoOpen(false);
          }}
        >
          <section
            className="demo-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
          >
            <header>
              <div>
                <span>DEMO ANALYSIS</span>
                <h2 id="demo-modal-title">왜 지금 테크웨이브인가요?</h2>
              </div>
              <button
                type="button"
                aria-label="분석 미리보기 닫기"
                onClick={() => setDemoOpen(false)}
              >
                <X />
              </button>
            </header>
            <div className="modal-body">
              <div className="modal-summary">
                <span className="company-avatar">TW</span>
                <div>
                  <strong>테크웨이브</strong>
                  <p>B2B 소프트웨어 · 직원 120~180명</p>
                </div>
                <span className="priority-badge">제안 우선순위 높음</span>
              </div>
              <div className="analysis-block fact-block">
                <span className="analysis-number">01</span>
                <div>
                  <small>확인된 사실</small>
                  <h3>채용 변화</h3>
                  <ul>
                    <li>
                      <Check /> 최근 30일간 개발직군 채용공고 15건
                    </li>
                    <li>
                      <Check /> 지난달보다 채용공고 8건 증가
                    </li>
                    <li>
                      <Check /> DevOps 직군 신규 채용 시작
                    </li>
                  </ul>
                </div>
              </div>
              <div className="analysis-block signal-block">
                <span className="analysis-number">02</span>
                <div>
                  <small>채용 수요 해석</small>
                  <h3>조직 확대 가능성</h3>
                  <p>
                    개발직군 충원 규모가 늘고 DevOps 포지션이 새로 열려 전문 인재 확보 수요가 커질
                    가능성이 있습니다. 헤드헌팅 제안을 검토할 타이밍입니다.
                  </p>
                  <span className="caution">
                    <CircleAlert /> 채용정보를 기반으로 한 추정이며 실제 헤드헌팅 의뢰 의사를
                    의미하지 않습니다.
                  </span>
                </div>
              </div>
              <div className="analysis-block">
                <span className="analysis-number">03</span>
                <div>
                  <small>추천 접촉 대상</small>
                  <h3>누구에게 접근할까요?</h3>
                  <div className="contact-list">
                    <span>
                      <Users /> 채용 담당자
                    </span>
                    <span>
                      <Users /> 채용팀장
                    </span>
                    <span>
                      <Users /> 현업 조직장
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <footer>
              <button type="button" onClick={() => setDemoOpen(false)}>
                미리보기 닫기
              </button>
              <a href="/experience" onClick={() => trackTrial('hero')}>
                채용 수요 찾아보기 <ArrowRight />
              </a>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}

function ApplyPageRoute() {
  const location = useLocation();
  const applyState = location.state as {
    targetCompany?: TargetCompany;
    applicantRole?: ApplicantRole;
  } | null;

  return (
    <ColdEmailRequestPage
      applicantRole={applyState?.applicantRole}
      targetCompany={
        applyState?.targetCompany ?? (import.meta.env.DEV ? mockTargetCompany : undefined)
      }
    />
  );
}

const router = createBrowserRouter([
  { path: '/try', Component: TryPage },
  { path: '/experience', Component: TryPage },
  { path: '/experience/results', Component: TryPage },
  { path: '/experience/results/detail', Component: ResultDetailPage },
  { path: '/try/results', Component: TryPage },
  { path: '/results', Component: ResultDetailPage },
  { path: '/result/:companyId', Component: ResultDetailPage },
  { path: '/apply', Component: ApplyPageRoute },
  { path: '/feedback', Component: FeedbackPage },
  { path: '/admin/homepage-feedback', Component: HomepageFeedbackAdminPage },
  { path: '/admin/cold-email-requests', Component: ColdEmailRequestsAdminPage },
  { path: '*', Component: LandingPage },
]);

export function App() {
  return <RouterProvider router={router} />;
}

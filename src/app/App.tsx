import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSearch,
  Menu,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createBrowserRouter, useLocation } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { TryPage } from '@/pages/TryPage';
import { ResultDetailPage } from '@/pages/ResultDetailPage';

import { ColdEmailRequestPage } from '@/features/apply/ColdEmailRequestPage';
import { mockTargetCompany } from '@/features/apply/mock-target-company';
import type { TargetCompany } from '@/features/apply/types';

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

const oldWay = [
  '여러 채용 사이트를 직접 검색',
  '엑셀로 기업 목록 정리',
  '접근 우선순위를 직접 판단',
  '기업마다 영업 근거 조사',
  '콜드메일을 처음부터 작성',
];

const signalWay = [
  '채용공고 변화 자동 분석',
  '자사 제품과 연관된 기업 추천',
  '확인 가능한 채용 근거 제공',
  '기업별 추천 접촉 대상 제공',
  '영업 포인트와 접근 문구 생성',
];

const steps = [
  {
    icon: BriefcaseBusiness,
    number: '01',
    title: '우리 제품 입력',
    description: '판매하는 제품, 해결하는 문제와 주요 고객 조건을 입력합니다.',
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
    title: '영업기회 확인',
    description: '접근할 기업과 추천 근거, 접촉 대상과 영업 포인트를 확인합니다.',
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
    title: '영업 신호 해석',
    description: '채용 변화가 어떤 조직 변화로 이어질 수 있는지 설명합니다.',
  },
  {
    icon: Target,
    label: 'FIT 03',
    title: '제품 연관성',
    description: '사용자의 제품이 해당 조직 변화와 어떤 관련이 있는지 보여드립니다.',
  },
];

function track(name: string, properties: Record<string, unknown> = {}) {
  const event = { event: name, timestamp: Date.now(), ...properties };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(event);
  window.dispatchEvent(new CustomEvent('sales-signal:event', { detail: event }));
  console.info(`[Sales Signal] ${name}`, properties);
}

function Logo() {
  return (
    <a className="brand" href="#top" aria-label="세일즈 시그널 홈">
      <span className="brand-symbol" aria-hidden="true">
        <Radar />
      </span>
      <span>세일즈 시그널</span>
    </a>
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
        <span className="priority-badge">접근 우선순위 높음</span>
      </div>

      <div className="demo-metrics">
        <div>
          <span>제품 연관도</span>
          <strong>87%</strong>
        </div>
        <div>
          <span>최근 30일 채용</span>
          <strong>15건</strong>
        </div>
        <div>
          <span>전월 대비</span>
          <strong className="positive">
            <TrendingUp /> +8건
          </strong>
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
          <p>개발조직 확대로 프로젝트 및 협업 관리의 복잡성이 증가할 가능성이 있습니다.</p>
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

  return (
    <div id="top">
      <header className="site-header">
        <div className="container header-inner">
          <Logo />
          <nav className={menuOpen ? 'site-nav open' : 'site-nav'} aria-label="주요 메뉴">
            <a href="#service" onClick={() => setMenuOpen(false)}>
              서비스 소개
            </a>
            <a href="#how" onClick={() => setMenuOpen(false)}>
              이용 방법
            </a>
            <a className="header-cta" href="/experience" onClick={() => trackTrial('header')}>
              무료 체험 <ArrowRight />
            </a>
          </nav>
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
      </header>

      <main>
        <section className="hero" id="service">
          <div className="hero-decoration hero-decoration-one" />
          <div className="hero-decoration hero-decoration-two" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">
                <Sparkles /> B2B 영업을 위한 채용 데이터 인텔리전스
              </span>
              <h1>
                채용공고 속에서
                <br />
                <em>지금 접근할 기업</em>을<br />
                찾아드립니다.
              </h1>
              <p>
                자사 제품을 입력하면 기업의 채용 변화를 분석해
                <br className="desktop-break" /> 주목할 영업 신호와 접근 근거를 보여드립니다.
              </p>
              <div className="hero-actions">
                <a className="primary-button" href="/experience" onClick={() => trackTrial('hero')}>
                  회원가입 없이 무료 체험 <ArrowRight />
                </a>
                <span>
                  <CheckCircle2 /> 약 1분 소요 · 추천 기업 3곳 무료 확인
                </span>
              </div>
              <div className="hero-benefits">
                <div>
                  <ShieldCheck />
                  <span>
                    <strong>근거 기반</strong>채용 변화 확인
                  </span>
                </div>
                <div>
                  <Radar />
                  <span>
                    <strong>신호 탐지</strong>접근 타이밍 추천
                  </span>
                </div>
                <div>
                  <BriefcaseBusiness />
                  <span>
                    <strong>즉시 활용</strong>영업 포인트 제공
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
                  <strong>오늘의 영업 시그널</strong>
                  <span className="demo-label">DEMO</span>
                </div>
                <div className="demo-content">
                  <div className="demo-heading">
                    <div>
                      <span>추천 결과</span>
                      <h2>지금 주목할 기업</h2>
                    </div>
                    <span>3개 발견</span>
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
                  <strong>+42%</strong>
                  <small>이번 주 신규 시그널</small>
                </div>
              </div>
              <p className="demo-disclaimer">
                <CircleAlert /> 데모 예시입니다. 채용정보를 기반으로 한 추정이며 실제 구매 의도를
                의미하지 않습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="context-strip" aria-label="서비스 핵심 특징">
          <div className="container">
            <span>
              채용공고를 <strong>사업 변화의 신호</strong>로
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
              <h2>
                잠재고객을 찾는 데<br />
                너무 많은 시간을
                <br />
                쓰고 있나요?
              </h2>
              <p>
                영업 담당자는 새로운 잠재고객을 찾기 위해 여러 채용 사이트를 검색하고, 기업 목록을
                정리하고, 어떤 기업에 먼저 연락할지 직접 판단합니다.
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
                <span>세일즈 시그널</span>
                <h3>근거와 함께 한눈에</h3>
                <div>
                  {signalWay.map((item) => (
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
              <p>검색과 정리는 줄이고, 고객과의 대화에 집중하세요.</p>
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
                <strong>세일즈 시그널은 기업의 구매 의도를 확정하지 않습니다.</strong>
                <span>공개된 채용정보를 바탕으로 우선 검토할 영업 대상을 추천합니다.</span>
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
                <h2>첫 번째 영업 신호를 찾아보세요.</h2>
                <p>회원가입 없이 자사 제품을 입력하고 추천 기업 3곳을 확인할 수 있습니다.</p>
              </div>
            </div>
            <div className="final-cta-action">
              <a href="/experience" onClick={() => trackTrial('footer')}>
                무료로 기업 찾아보기 <ArrowRight />
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
            <p>채용 변화에서 발견하는 새로운 B2B 영업 기회</p>
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
                <span className="priority-badge">접근 우선순위 높음</span>
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
                  <small>영업 신호 해석</small>
                  <h3>조직 확대 가능성</h3>
                  <p>
                    개발 프로젝트와 협업 인원이 증가하면서 프로젝트 관리와 정보 공유가 복잡해질
                    가능성이 있습니다.
                  </p>
                  <span className="caution">
                    <CircleAlert /> 채용정보를 기반으로 한 추정이며 실제 구매 의도를 의미하지
                    않습니다.
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
                      <Users /> CTO
                    </span>
                    <span>
                      <Users /> 개발팀장
                    </span>
                    <span>
                      <Users /> 기술운영 담당자
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
                내 제품으로 무료 체험 <ArrowRight />
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
  const targetCompany = (location.state as { targetCompany?: TargetCompany } | null)?.targetCompany;

  return (
    <ColdEmailRequestPage
      targetCompany={targetCompany ?? (import.meta.env.DEV ? mockTargetCompany : undefined)}
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
  { path: '*', Component: LandingPage },
]);

export function App() {
  return <RouterProvider router={router} />;
}

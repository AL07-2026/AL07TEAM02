import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  LoaderCircle,
  Search,
  Target,
  TrendingUp,
  UserCog,
  UserRoundSearch,
} from 'lucide-react';
import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { ChokBrand } from '@/components/ChokBrand';
import { storeCompanyAnalysis } from '@/jobs/analysisSession';
import type {
  CompanyRoleAnalysis,
  JobSource,
  TrySearchRequest,
  TrySearchResponse,
} from '@/jobs/types';
import { cn } from '@/lib/utils';

type UserType = TrySearchRequest['role'];

const userTypes: Array<{
  value: UserType;
  label: string;
  description: string;
  icon: typeof Target;
}> = [
  {
    value: 'recruiter',
    label: '헤드헌터',
    description: '채용 수요가 커지는 기업을 찾고 싶어요.',
    icon: UserRoundSearch,
  },
];

const intentPrompts: Record<
  UserType,
  { label: string; placeholder: string; helper: string; error: string }
> = {
  sales: {
    label: '어떤 제품이나 서비스를 판매하나요?',
    placeholder: '예: ATS 채용관리 솔루션',
    helper: '제품과 연결되는 채용 변화가 있는 기업을 찾아드려요.',
    error: '판매하는 제품이나 서비스를 입력해주세요.',
  },
  recruiter: {
    label: '어떤 직무의 인재를 제안하나요?',
    placeholder: '예: B2B 세일즈, 백엔드 개발자',
    helper: '해당 직무의 채용 수요가 커지는 기업을 찾아드려요.',
    error: '제안하려는 직무를 입력해주세요.',
  },
  investor: {
    label: '어떤 기업에 관심이 있나요?',
    placeholder: '예: B2B SaaS, 시리즈 A 성장 기업',
    helper: '관심 분야와 성장 신호가 함께 나타나는 기업을 찾아드려요.',
    error: '관심 있는 산업이나 성장 단계를 입력해주세요.',
  },
};

const regionLabels: Record<string, string> = {
  all: '지역 무관',
  seoul: '서울',
  gyeonggi: '경기',
  busan: '부산',
};

const sourceLabels: Partial<Record<JobSource, string>> = {
  alio: 'ALIO',
  jooble: 'Jooble',
  saramin: '사람인',
  work24: '고용24',
};

type SearchPayload = TrySearchResponse | { error?: string };

async function readSearchPayload(response: Response): Promise<SearchPayload> {
  const body = await response.text();

  if (!body.trim()) {
    throw new Error('검색 서버에서 응답을 받지 못했습니다. 잠시 후 다시 시도해주세요.');
  }

  try {
    return JSON.parse(body) as SearchPayload;
  } catch {
    throw new Error('검색 서버의 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해주세요.');
  }
}

type TrialForm = {
  userType: UserType | '';
  intent: string;
  region: NonNullable<TrySearchRequest['region']>;
};

const initialForm: TrialForm = {
  userType: '',
  intent: '',
  region: 'all',
};

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor: string }) {
  return (
    <label className="mb-2 block text-sm font-semibold text-[#142522]" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

function formatPostingDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
  }).format(new Date(value));
}

const companyNameTranslations: Record<string, string> = {
  Amazon: '아마존',
  Chadwick: '채드윅',
  'Chadwick International': '채드윅 인터내셔널',
  Cheiron: '카이론',
  Coupang: '쿠팡',
  Google: '구글',
  Kakao: '카카오',
  Microsoft: '마이크로소프트',
  Toss: '토스',
};

const titleTranslations: Array<[string, string]> = [
  ['Leave Replacement (Local Staff)', '휴직 대체인력 (현지 직원)'],
  ['Leave Replacement', '휴직 대체인력'],
  ['Registered Nurse (RN)', '간호사 (RN)'],
  ['Software Engineer', '소프트웨어 엔지니어'],
  ['Product Designer', '프로덕트 디자이너'],
  ['Technical Product Owner', '기술 프로덕트 오너'],
  ['Senior Frontend Engineer', '시니어 프론트엔드 엔지니어'],
  ['Backend Engineer', '백엔드 엔지니어'],
  ['Frontend Engineer', '프론트엔드 엔지니어'],
  ['Server Developer', '서버 개발자'],
  ['Developer', '개발자'],
  ['Engineer', '엔지니어'],
  ['Manager', '매니저'],
  ['Coordinator', '코디네이터'],
];

function displayCompanyName(companyName: string) {
  return companyNameTranslations[companyName] ?? companyName;
}

function displayPostingTitle(title: string) {
  return titleTranslations.reduce(
    (translated, [source, target]) => translated.replaceAll(source, target),
    title,
  );
}

function displayAnalysisText(text: string, companyName: string) {
  return text.replaceAll(companyName, displayCompanyName(companyName));
}

function ResultCard({ match, rank }: { match: CompanyRoleAnalysis; rank: number }) {
  const roleFinding = match.roleFindings[0];
  const displayCompany = displayCompanyName(match.companyName);
  return (
    <details className="group overflow-hidden rounded-2xl border border-[#c7ded8] bg-white shadow-[0_12px_30px_-24px_rgba(17,74,64,0.38)] transition hover:border-[#68baa9]">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 outline-none transition hover:bg-[#f7fbfa] focus-visible:ring-2 focus-visible:ring-[#009d7e] focus-visible:ring-inset sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e2f4ef] text-[#009d7e]">
            <Building2 aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-[0.13em] text-[#7b879d]">
              MATCH {String(rank).padStart(2, '0')}
            </p>
            <h3 className="truncate text-base font-extrabold tracking-[-0.02em] text-[#101b31] sm:text-lg">
              {displayCompany}
            </h3>
          </div>
        </div>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-[#405851] sm:block">
          {displayAnalysisText(match.hiringSituation, match.companyName)}
        </p>
        <span className="ml-auto shrink-0 rounded-full bg-[#e1f5ef] px-3 py-1.5 text-xs font-bold text-[#007d65]">
          추천 {rank}순위
        </span>
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-[#64817a] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#dce8e5] p-4 sm:p-6">
        <p className="mb-4 text-sm leading-6 text-[#405851] sm:hidden">
          {displayAnalysisText(match.hiringSituation, match.companyName)}
        </p>

      <div className="rounded-xl bg-[#e8f5f1] p-4">
        <p className="flex items-center gap-2 text-sm font-bold text-[#00866c]">
          <TrendingUp aria-hidden="true" className="size-4" />
          현재 채용 상황
        </p>
        <p className="mt-2 text-sm leading-6 text-[#354c47]">
          {displayAnalysisText(match.hiringSituation, match.companyName)}
        </p>
        {roleFinding ? (
          <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-[#cfe5df] pt-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="text-[#71817d]">모집 직무</dt>
              <dd className="mt-1 font-bold text-[#213832]">
                {displayPostingTitle(roleFinding.name)}
              </dd>
            </div>
            <div>
              <dt className="text-[#71817d]">모집 인원</dt>
              <dd className="mt-1 font-bold text-[#213832]">
                {roleFinding.headcount ? `${roleFinding.headcount}명` : '인원 미기재'}
              </dd>
            </div>
            <div>
              <dt className="text-[#71817d]">근무 부서</dt>
              <dd className="mt-1 font-bold text-[#213832]">
                {roleFinding.department || '부서 미기재'}
              </dd>
            </div>
          </dl>
        ) : null}
      </div>

      <div className="mt-5">
        <p className="text-xs font-extrabold tracking-[0.1em] text-[#7b879d]">기업 상황 분석</p>
        <p className="mt-2 text-sm leading-6 text-[#35425a]">
          {displayAnalysisText(displayPostingTitle(match.interpretation), match.companyName)}
        </p>
      </div>

      <div className="mt-5 border-t border-[#dce8e5] pt-5">
        <p className="text-xs font-extrabold tracking-[0.1em] text-[#7b879d]">추천한 이유</p>
        <ul className="mt-3 space-y-3">
          {match.recommendationReasons.map((reason, index) => (
            <li className="flex gap-3 text-sm leading-6 text-[#35425a]" key={reason}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#009d7e] text-[11px] font-black text-white">
                {index + 1}
              </span>
              <span>{displayAnalysisText(reason, match.companyName)}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="mt-6 border-t border-[#dce8e5] pt-5">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-extrabold tracking-[0.1em] text-[#7b879d] outline-none focus-visible:ring-2 focus-visible:ring-[#009d7e] [&::-webkit-details-marker]:hidden">
          <span>판단 근거 공고</span>
          <span className="rounded-full bg-[#e8f5f1] px-3 py-1.5 tracking-normal text-[#00866c]">
            {match.evidence.length}건 · 더보기
          </span>
        </summary>
        <ul className="mt-3 space-y-2.5">
          {match.evidence.map((evidence) => (
            <li
              className="rounded-xl border border-[#d7e7e3] bg-[#f8fbfa] p-3.5"
              key={evidence.url}
            >
              <p className="text-sm font-bold leading-5 text-[#24332f]">
                {displayPostingTitle(evidence.title)}
              </p>
              <p className="mt-1.5 text-xs leading-5 text-[#71817d]">
                <span className="mr-2 inline-flex rounded-full bg-[#dff3ed] px-2 py-0.5 font-bold text-[#007d65]">
                  {sourceLabels[evidence.source] ?? evidence.source}
                </span>
                {formatPostingDate(evidence.publishedAt)} · {evidence.location || '지역 미기재'}
                {roleFinding?.headcount
                  ? ` · ${displayPostingTitle(roleFinding.name)} ${roleFinding.headcount}명`
                  : evidence.headcount
                    ? ` · 전체 ${evidence.headcount}명`
                    : ''}
              </p>
              <a
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#00866c] hover:underline"
                href={evidence.url}
                rel="noreferrer"
                target="_blank"
              >
                공고 원문
                <ExternalLink aria-hidden="true" className="size-3" />
              </a>
            </li>
          ))}
        </ul>
      </details>

      <Link
        aria-label={`${displayCompany} 상세 분석 보기`}
        className="mt-6 inline-flex w-full items-center justify-between rounded-xl bg-[#0c1715] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#19302b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009d7e] focus-visible:ring-offset-2"
        state={{ analysis: match }}
        onClick={() => storeCompanyAnalysis(match)}
        to={`/result/${encodeURIComponent(match.companyName)}`}
      >
        상세 분석 보기
        <ArrowRight aria-hidden="true" className="size-4" />
      </Link>
      </div>
    </details>
  );
}

export function TryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const isResultsPage = location.pathname.endsWith('/results');
  const [form, setForm] = useState<TrialForm>(initialForm);
  const [submittedForm, setSubmittedForm] = useState<TrialForm | null>(null);
  const [recommendations, setRecommendations] = useState<CompanyRoleAnalysis[]>([]);
  const [postingCount, setPostingCount] = useState(0);
  const [sourceCounts, setSourceCounts] = useState<TrySearchResponse['sourceCounts']>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showErrors, setShowErrors] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const selectedPrompt = form.userType ? intentPrompts[form.userType] : null;

  useEffect(() => {
    if (isResultsPage && !submittedForm) void navigate('/experience');
  }, [isResultsPage, navigate, submittedForm]);

  const selectedConditions = useMemo(() => {
    if (!submittedForm) return [];

    return [
      submittedForm.intent,
      submittedForm.region !== 'all' ? regionLabels[submittedForm.region] : null,
    ].filter((condition): condition is string => Boolean(condition));
  }, [submittedForm]);

  const isFormValid = Boolean(form.userType && form.intent.trim());

  function updateField<K extends keyof TrialForm>(field: K, value: TrialForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleUserTypeChange(userType: UserType) {
    setForm((current) => ({ ...current, userType, intent: '' }));
    setSubmittedForm(null);
    setRecommendations([]);
    setSearchError('');
    setShowErrors(false);
    if (isResultsPage) void navigate('/experience');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);

    if (!isFormValid) return;

    void searchCompanies({ ...form, intent: form.intent.trim() });
  }

  function clearOptionalFilters() {
    const clearedForm: TrialForm = { ...form, region: 'all' };
    setForm(clearedForm);
    if (submittedForm) void searchCompanies({ ...clearedForm, intent: form.intent.trim() });
  }

  async function searchCompanies(searchForm: TrialForm) {
    if (!searchForm.userType) return;
    setIsSearching(true);
    setSearchError('');

    try {
      const response = await fetch('/api/try/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: searchForm.userType,
          query: searchForm.intent,
          region: searchForm.region,
        } satisfies TrySearchRequest),
      });
      const payload = await readSearchPayload(response);
      if (!response.ok || !('matches' in payload)) {
        throw new Error('error' in payload ? payload.error : '기업 검색에 실패했습니다.');
      }

      setRecommendations(payload.matches);
      setPostingCount(payload.postingCount);
      setSourceCounts(payload.sourceCounts);
      setSubmittedForm(searchForm);
      setShowAllResults(false);
      void navigate('/experience/results', {
        state: {
          recommendations: payload.matches,
          postingCount: payload.postingCount,
          sourceCounts: payload.sourceCounts,
          submittedForm: searchForm,
        },
      });
    } catch (error) {
      setRecommendations([]);
      setSubmittedForm(null);
      setSearchError(error instanceof Error ? error.message : '기업 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="experience-shell min-h-screen text-[#101918]">
      <header className="site-header">
        <div className="container header-inner">
          <ChokBrand />
          <nav
            aria-label="주요 메뉴"
            className="site-nav experience-nav"
          >
            <Link className="hidden transition hover:text-[#009d7e] sm:block" to="/">
              서비스 소개
            </Link>
            <Link className="hidden transition hover:text-[#009d7e] sm:block" to="/#how">
              이용 방법
            </Link>
            <Link aria-current="page" className="header-cta" to="/experience">
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

      <main>
        {!isResultsPage ? (
        <section className="experience-hero">
          <div className="container experience-form-grid">
            <div className="experience-copy">
              <span className="eyebrow">
                <Search /> 무료 체험 조건 입력
              </span>
              <h1 className="hero-message-card">
                <span>찾고 싶은 기업을</span>
                <em>채용 신호 기준으로</em>
                <span className="headline-last-line">
                  바로 좁혀보세요 <ArrowRight aria-hidden="true" />
                </span>
              </h1>
              <p>
                역할과 목적만 입력하면 공개 채용공고를 분석해 우선 검토할 기업을 추천합니다.
              </p>
              <div className="hero-benefits experience-benefits">
                <div>
                  <Target />
                  <span>
                    <strong>역할 맞춤</strong>영업·채용·투자 관점
                  </span>
                </div>
                <div>
                  <TrendingUp />
                  <span>
                    <strong>근거 기반</strong>채용 변화 분석
                  </span>
                </div>
              </div>
            </div>
            <form
              aria-label="추천 기업 조건"
              className="experience-form-card"
              noValidate
              onSubmit={handleSubmit}
            >
              <div className="demo-toolbar experience-form-toolbar">
                <div className="window-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <strong>추천 조건</strong>
                <span className="demo-label">예시 가능</span>
              </div>
              <div className="experience-form-body">
              <div>
                <h1 className="text-2xl font-black tracking-[-0.035em] text-[#152139] sm:text-[1.75rem]">
                  어떤 기업을 찾고 있나요?
                </h1>
                <p className="mt-2 text-sm leading-6 text-[#68748b]">
                  역할과 찾는 목적만 알려주면 바로 추천해드려요.
                </p>
              </div>

              <fieldset
                className="mt-8"
                aria-describedby={showErrors && !form.userType ? 'user-type-error' : undefined}
              >
                <legend className="text-sm font-bold text-[#18243b]">
                  먼저, 나의 역할을 선택해주세요 <span className="text-[#df532d]">*</span>
                </legend>
                <div className="mt-3 grid gap-2.5">
                  {userTypes.map(({ value, label, description, icon: Icon }) => (
                    <label
                      className={cn(
                        'relative cursor-pointer rounded-xl border p-4 transition focus-within:ring-2 focus-within:ring-[#009d7e] focus-within:ring-offset-2',
                        form.userType === value
                          ? 'border-[#009d7e] bg-[#e5f5f1] shadow-[inset_0_0_0_1px_#009d7e]'
                          : 'border-[#d7e3e0] bg-white hover:border-[#79bcae] hover:bg-[#f7fbfa]',
                      )}
                      key={value}
                    >
                      <input
                        checked={form.userType === value}
                        className="sr-only"
                        name="userType"
                        onChange={() => handleUserTypeChange(value)}
                        type="radio"
                        value={value}
                      />
                      <span className="flex items-start justify-between gap-3">
                        <Icon aria-hidden="true" className="size-5 text-[#009d7e]" />
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded-full border',
                            form.userType === value
                              ? 'border-[#009d7e] bg-[#009d7e] text-white'
                              : 'border-[#c4d4d0] text-transparent',
                          )}
                        >
                          <Check aria-hidden="true" className="size-3" />
                        </span>
                      </span>
                      <span className="mt-4 block text-sm font-extrabold text-[#17233a]">
                        {label}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#69758b]">
                        {description}
                      </span>
                    </label>
                  ))}
                </div>
                {showErrors && !form.userType ? (
                  <p className="mt-2 text-sm font-medium text-[#c44125]" id="user-type-error">
                    나의 역할을 하나 선택해주세요.
                  </p>
                ) : null}
              </fieldset>

              <div className="my-7 h-px bg-[#dce8e5]" />

              {selectedPrompt ? (
                <div>
                  <FieldLabel htmlFor="intent">
                    {selectedPrompt.label} <span className="text-[#df532d]">*</span>
                  </FieldLabel>
                  <input
                    aria-describedby={
                      showErrors && !form.intent.trim() ? 'intent-error' : 'intent-helper'
                    }
                    aria-invalid={showErrors && !form.intent.trim()}
                    className="h-13 w-full rounded-xl border border-[#cadbd7] bg-white px-4 text-sm text-[#273b36] outline-none transition placeholder:text-[#94a6a1] focus:border-[#009d7e] focus:ring-2 focus:ring-[#ccebe4] aria-[invalid=true]:border-[#df532d]"
                    id="intent"
                    onChange={(event) => updateField('intent', event.target.value)}
                    placeholder={selectedPrompt.placeholder}
                    type="text"
                    value={form.intent}
                  />
                  {showErrors && !form.intent.trim() ? (
                    <p
                      className="mt-2 text-sm font-medium text-[#c44125]"
                      id="intent-error"
                      role="alert"
                    >
                      {selectedPrompt.error}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-[#78849a]" id="intent-helper">
                      {selectedPrompt.helper}
                    </p>
                  )}

                  <details className="group mt-6 rounded-xl border border-[#cfe0dc] bg-[#edf8f5]">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-sm font-bold text-[#344a45] outline-none transition hover:bg-[#e4f3ef] focus-visible:ring-2 focus-visible:ring-[#009d7e] [&::-webkit-details-marker]:hidden">
                      <span>
                        조건 더 추가하기
                        <span className="ml-2 text-xs font-medium text-[#8994a7]">선택사항</span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className="size-4 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <div className="border-t border-[#cfe0dc] p-4">
                      <div className="max-w-sm">
                        <FieldLabel htmlFor="region">관심 지역</FieldLabel>
                        <select
                          className="h-11 w-full rounded-xl border border-[#cadbd7] bg-white px-3 text-sm text-[#273b36] outline-none transition focus:border-[#009d7e] focus:ring-2 focus:ring-[#ccebe4]"
                          id="region"
                          onChange={(event) =>
                            updateField('region', event.target.value as TrialForm['region'])
                          }
                          value={form.region}
                        >
                          {Object.entries(regionLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-[#78849a]">
                        기업 규모와 업종은 채용공고만으로 정확히 판단하기 어려워 검색 조건에서
                        제외했습니다.
                      </p>
                    </div>
                  </details>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-[#bcd5cf] bg-[#edf8f5] px-4 py-5 text-center text-sm text-[#627a74]">
                  역할을 선택하면 맞춤 질문이 나타납니다.
                </p>
              )}

              <Button
                className="mt-7 h-13 w-full rounded-xl bg-[#009d7e] px-5 text-[15px] font-extrabold shadow-[0_12px_24px_-12px_rgba(0,157,126,0.7)] hover:bg-[#00846a]"
                disabled={isSearching}
                type="submit"
              >
                {isSearching ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <Search aria-hidden="true" className="size-4" />
                )}
                {isSearching ? '기업 찾는 중...' : '기업 찾기'}
                {isSearching ? null : <ArrowRight aria-hidden="true" className="size-4" />}
              </Button>
              {searchError ? (
                <p className="mt-3 text-center text-sm font-semibold text-[#c44125]" role="alert">
                  {searchError}
                </p>
              ) : null}
              <p className="mt-3 text-center text-xs leading-5 text-[#7a869b]">
                입력한 정보는 저장되지 않으며, 체험 결과 생성에만 사용됩니다.
              </p>
              </div>
            </form>
          </div>
        </section>
        ) : null}

        {isResultsPage && submittedForm ? (
          <section aria-live="polite" className="experience-results container">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="eyebrow">
                  <TrendingUp /> 채용 데이터 분석 결과
                </span>
                <h2 className="text-3xl font-black tracking-[-0.045em] text-[#0b1f1a]">
                  지금 확인할 기업 {recommendations.length}곳
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#36504b]">
                  실제 채용공고 {postingCount}건을 분석해 입력 조건과 연결되는 기업을
                  우선순위로 정리했습니다. 기업을 누르면 추천 근거와 상세 분석을 확인할 수 있습니다.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="분석 데이터 출처">
                  <span className="text-xs font-bold text-[#60746f]">분석 데이터</span>
                  {Object.entries(sourceCounts)
                    .filter((entry): entry is [JobSource, number] => Boolean(entry[1]))
                    .map(([source, count]) => (
                      <span
                        className="rounded-full border border-[#bcd9d2] bg-[#edf8f5] px-2.5 py-1 text-xs font-bold text-[#267062]"
                        key={source}
                      >
                        {sourceLabels[source] ?? source} {count}건
                      </span>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2" aria-label="적용된 추천 조건">
                  {selectedConditions.map((condition) => (
                    <span
                      className="rounded-full border border-[#bcd9d2] bg-white px-3 py-1.5 text-xs font-bold text-[#3f5b55]"
                      key={condition}
                    >
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
              <button
                className="self-start text-sm font-bold text-[#00866c] underline decoration-[#8dcabc] underline-offset-4 hover:text-[#006f59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009d7e] focus-visible:ring-offset-4 sm:self-auto"
                onClick={() => {
                  setSubmittedForm(null);
                  setRecommendations([]);
                  void navigate('/experience');
                }}
                type="button"
              >
                조건 다시 입력하기
              </button>
            </div>

            {recommendations.length ? (
              <>
              <div className="mt-8 space-y-3">
                {recommendations.slice(0, showAllResults ? recommendations.length : 10).map((match, index) => (
                  <ResultCard key={match.companyName} match={match} rank={index + 1} />
                ))}
              </div>
              {recommendations.length > 10 && !showAllResults ? (
                <button
                  className="mx-auto mt-6 rounded-full border border-[#9ecbc0] bg-white px-6 py-2.5 text-sm font-bold text-[#007d65] transition hover:bg-[#e8f5f1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009d7e] focus-visible:ring-offset-2"
                  onClick={() => setShowAllResults(true)}
                  type="button"
                >
                  더보기
                </button>
              ) : null}
              </>
            ) : (
              <div className="mt-8 rounded-2xl border border-dashed border-[#a9cec5] bg-white px-6 py-12 text-center">
                <Search aria-hidden="true" className="mx-auto size-8 text-[#009d7e]" />
                <h3 className="mt-4 text-lg font-extrabold text-[#17233a]">
                  선택한 조건에 맞는 기업이 아직 없어요
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#69758b]">
                  검색어를 더 구체적으로 입력하거나 지역 조건을 초기화해보세요.
                </p>
                <button
                  className="mt-5 rounded-xl bg-[#009d7e] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#00846a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009d7e] focus-visible:ring-offset-2"
                  onClick={clearOptionalFilters}
                  type="button"
                >
                  선택 조건 초기화
                </button>
              </div>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}

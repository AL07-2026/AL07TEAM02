import {
  AlertCircle,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  ChevronRight,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  RefreshCw,
  Search,
  UserRoundSearch,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import type { ApplicantRole, ColdEmailRequest } from '@/features/apply/types';
import '@/features/apply/admin-page.css';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
type RoleFilter = ApplicantRole | 'all';

const tokenStorageKey = 'sales-signal:admin-token';

const roleView = {
  sales: {
    label: 'B2B 영업',
    shortLabel: '영업',
    eyebrow: 'YOUR PRODUCT',
    nameLabel: '판매하려는 제품 또는 서비스',
    descriptionLabel: '제품 설명',
    icon: BriefcaseBusiness,
  },
  recruiter: {
    label: '헤드헌터',
    shortLabel: '헤드헌터',
    eyebrow: 'YOUR TALENT',
    nameLabel: '제안하려는 직무 또는 인재 분야',
    descriptionLabel: '제안할 인재와 강점',
    icon: UserRoundSearch,
  },
  investor: {
    label: '투자심사역',
    shortLabel: '투자',
    eyebrow: 'YOUR INVESTMENT VIEW',
    nameLabel: '관심 있는 산업 또는 투자 테마',
    descriptionLabel: '투자 관점과 관심 조건',
    icon: ChartNoAxesCombined,
  },
} satisfies Record<
  ApplicantRole,
  {
    label: string;
    shortLabel: string;
    eyebrow: string;
    nameLabel: string;
    descriptionLabel: string;
    icon: typeof BriefcaseBusiness;
  }
>;

const roleFilters: Array<{ value: RoleFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'sales', label: 'B2B 영업' },
  { value: 'recruiter', label: '헤드헌터' },
  { value: 'investor', label: '투자심사역' },
];

async function fetchColdEmailRequests(token: string): Promise<ColdEmailRequest[]> {
  const response = await fetch('/api/cold-email-requests', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '신청 목록을 불러오지 못했습니다.');
  }

  const payload = (await response.json()) as { requests?: ColdEmailRequest[] };
  return payload.requests ?? [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function requestKey(request: ColdEmailRequest) {
  return request.id ?? `${request.applicantEmail}-${request.submittedAt}`;
}

export function ColdEmailRequestsAdminPage() {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(tokenStorageKey) ?? '');
  const [requests, setRequests] = useState<ColdEmailRequest[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [selectedRequestKey, setSelectedRequestKey] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return requests.filter((request) => {
      if (roleFilter !== 'all' && request.applicantRole !== roleFilter) return false;
      if (!normalizedQuery) return true;

      return [
        request.applicantEmail,
        request.applicantCompany,
        request.productName,
        request.productDescription,
        request.additionalRequest,
      ]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [query, requests, roleFilter]);

  const selectedRequest =
    filteredRequests.find((request) => requestKey(request) === selectedRequestKey) ??
    filteredRequests[0];

  async function loadRequests(nextToken = token) {
    setStatus('loading');
    setErrorMessage('');

    try {
      const trimmedToken = nextToken.trim();
      const loadedRequests = await fetchColdEmailRequests(trimmedToken);
      window.sessionStorage.setItem(tokenStorageKey, trimmedToken);
      setRequests(loadedRequests);
      setSelectedRequestKey(loadedRequests[0] ? requestKey(loadedRequests[0]) : null);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '신청 목록을 불러오지 못했습니다.');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadRequests();
  }

  function lockAdmin() {
    window.sessionStorage.removeItem(tokenStorageKey);
    setToken('');
    setRequests([]);
    setSelectedRequestKey(null);
    setStatus('idle');
  }

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'success';

  return (
    <main className="admin-page">
      <header className="admin-topbar">
        <a className="admin-brand" href="/">
          <span aria-hidden="true">S</span>
          세일즈 시그널
        </a>
        <span className="admin-security-status">
          <LockKeyhole aria-hidden="true" /> 관리자 전용
        </span>
      </header>

      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">REQUEST MANAGEMENT</p>
            <h1>콜드메일 신청 정보</h1>
            <p>접수된 신청 내용을 확인하고 제작에 필요한 정보를 검토합니다.</p>
          </div>
          {isAuthenticated ? (
            <div className="admin-header-actions">
              <div className="admin-count">
                <span>총 신청</span>
                <strong>{requests.length}</strong>
              </div>
              <Button className="admin-icon-button" onClick={lockAdmin} title="관리자 잠금" type="button">
                <LogOut aria-hidden="true" />
                <span className="sr-only">관리자 잠금</span>
              </Button>
            </div>
          ) : null}
        </header>

        {!isAuthenticated ? (
          <section className="admin-auth-panel" aria-labelledby="admin-auth-title">
            <div className="admin-auth-icon">
              <LockKeyhole aria-hidden="true" />
            </div>
            <div>
              <h2 id="admin-auth-title">관리자 인증</h2>
              <p>신청 정보를 열람하려면 관리자 토큰을 입력해주세요.</p>
            </div>
            <form className="admin-token-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="admin-token">
                관리자 토큰
              </label>
              <input
                autoComplete="current-password"
                id="admin-token"
                onChange={(event) => setToken(event.target.value)}
                placeholder="ADMIN_ACCESS_TOKEN"
                type="password"
                value={token}
              />
              <Button disabled={isLoading || !token.trim()} type="submit">
                {isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {isLoading ? '확인 중...' : '신청 정보 열기'}
              </Button>
            </form>
            {status === 'error' ? (
              <div className="admin-alert" role="alert">
                <AlertCircle aria-hidden="true" />
                {errorMessage}
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <div className="admin-toolbar">
              <label className="admin-search" htmlFor="request-search">
                <Search aria-hidden="true" />
                <input
                  id="request-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="이메일, 회사명, 신청 내용 검색"
                  value={query}
                />
              </label>
              <div className="admin-role-filter" aria-label="신청자 역할 필터">
                {roleFilters.map((filter) => (
                  <button
                    aria-pressed={roleFilter === filter.value}
                    className={roleFilter === filter.value ? 'active' : undefined}
                    key={filter.value}
                    onClick={() => setRoleFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <Button
                className="admin-refresh-button"
                disabled={isLoading}
                onClick={() => void loadRequests()}
                title="신청 목록 새로고침"
                type="button"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : undefined} aria-hidden="true" />
                <span className="sr-only">신청 목록 새로고침</span>
              </Button>
            </div>

            {!selectedRequest ? (
              <section className="admin-empty">
                <Inbox aria-hidden="true" />
                <h2>표시할 신청이 없습니다</h2>
                <p>검색어나 역할 필터를 변경해보세요.</p>
              </section>
            ) : (
              <div className="admin-workspace">
                <aside className="admin-request-list" aria-label="콜드메일 신청 목록">
                  <div className="admin-list-heading">
                    <strong>신청 목록</strong>
                    <span>{filteredRequests.length}건</span>
                  </div>
                  <div className="admin-list-items">
                    {filteredRequests.map((request) => {
                      const view = roleView[request.applicantRole];
                      const Icon = view.icon;
                      const key = requestKey(request);
                      const isSelected = key === requestKey(selectedRequest);

                      return (
                        <button
                          aria-current={isSelected ? 'true' : undefined}
                          className={isSelected ? 'active' : undefined}
                          key={key}
                          onClick={() => setSelectedRequestKey(key)}
                          type="button"
                        >
                          <span className={`admin-role-icon ${request.applicantRole}`}>
                            <Icon aria-hidden="true" />
                          </span>
                          <span className="admin-list-copy">
                            <span className="admin-list-meta">
                              <b>{view.shortLabel}</b>
                              {formatDate(request.submittedAt)}
                            </span>
                            <strong>{request.applicantCompany}</strong>
                            <span>{request.productName}</span>
                          </span>
                          <ChevronRight aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </aside>

                <section className="admin-request-detail" aria-live="polite">
                  <header className="admin-detail-header">
                    <div>
                      <p>{roleView[selectedRequest.applicantRole].eyebrow}</p>
                      <h2>신청 정보</h2>
                    </div>
                    <div>
                      <span className={`admin-role-badge ${selectedRequest.applicantRole}`}>
                        {roleView[selectedRequest.applicantRole].label}
                      </span>
                      <time dateTime={selectedRequest.submittedAt}>
                        {formatDate(selectedRequest.submittedAt)}
                      </time>
                    </div>
                  </header>

                  <dl className="admin-detail-grid">
                    <div className="admin-field admin-field-wide">
                      <dt>결과를 받을 이메일</dt>
                      <dd>
                        <a href={`mailto:${selectedRequest.applicantEmail}`}>
                          <Mail aria-hidden="true" />
                          {selectedRequest.applicantEmail}
                        </a>
                      </dd>
                    </div>
                    <div className="admin-field">
                      <dt>회사명</dt>
                      <dd>{selectedRequest.applicantCompany}</dd>
                    </div>
                    <div className="admin-field">
                      <dt>{roleView[selectedRequest.applicantRole].nameLabel}</dt>
                      <dd>{selectedRequest.productName}</dd>
                    </div>
                    <div className="admin-field admin-field-wide admin-field-long">
                      <dt>{roleView[selectedRequest.applicantRole].descriptionLabel}</dt>
                      <dd>{selectedRequest.productDescription}</dd>
                    </div>
                    <div className="admin-field admin-field-wide admin-field-long">
                      <dt>추가 요청사항</dt>
                      <dd className={!selectedRequest.additionalRequest ? 'admin-empty-value' : undefined}>
                        {selectedRequest.additionalRequest ?? '추가 요청사항이 없습니다.'}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

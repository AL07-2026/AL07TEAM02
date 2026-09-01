import {
  AlertCircle,
  ChevronRight,
  Inbox,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import type { HomepageFeedback } from '@/features/feedback/types';
import '@/features/apply/admin-page.css';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';
type RatingFilter = 'all' | 'positive' | 'neutral' | 'low';

const tokenStorageKey = 'sales-signal:admin-token';

const ratingFilters: Array<{ value: RatingFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'positive', label: '4점 이상' },
  { value: 'neutral', label: '3점' },
  { value: 'low', label: '2점 이하' },
];

async function fetchHomepageFeedback(token: string): Promise<HomepageFeedback[]> {
  const response = await fetch('/api/homepage-feedback', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '피드백 목록을 불러오지 못했습니다.');
  }

  const payload = (await response.json()) as { feedback?: HomepageFeedback[] };
  return payload.feedback ?? [];
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

function feedbackKey(feedback: HomepageFeedback) {
  return feedback.id ?? `${feedback.submittedAt}-${feedback.message}`;
}

function ratingLabel(rating: number) {
  if (rating >= 4) return '긍정';
  if (rating === 3) return '보통';
  return '개선 필요';
}

function matchesRatingFilter(feedback: HomepageFeedback, filter: RatingFilter) {
  if (filter === 'positive') return feedback.rating >= 4;
  if (filter === 'neutral') return feedback.rating === 3;
  if (filter === 'low') return feedback.rating <= 2;
  return true;
}

export function HomepageFeedbackAdminPage() {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(tokenStorageKey) ?? '');
  const [feedbackList, setFeedbackList] = useState<HomepageFeedback[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [query, setQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all');
  const [selectedFeedbackKey, setSelectedFeedbackKey] = useState<string | null>(null);

  const filteredFeedback = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return feedbackList.filter((feedback) => {
      if (!matchesRatingFilter(feedback, ratingFilter)) return false;
      if (!normalizedQuery) return true;

      return [feedback.message, feedback.email, feedback.pagePath]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedQuery));
    });
  }, [feedbackList, query, ratingFilter]);

  const selectedFeedback =
    filteredFeedback.find((feedback) => feedbackKey(feedback) === selectedFeedbackKey) ??
    filteredFeedback[0];

  async function loadFeedback(nextToken = token) {
    setStatus('loading');
    setErrorMessage('');

    try {
      const trimmedToken = nextToken.trim();
      const loadedFeedback = await fetchHomepageFeedback(trimmedToken);
      window.sessionStorage.setItem(tokenStorageKey, trimmedToken);
      setFeedbackList(loadedFeedback);
      setSelectedFeedbackKey(loadedFeedback[0] ? feedbackKey(loadedFeedback[0]) : null);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '피드백 목록을 불러오지 못했습니다.');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadFeedback();
  }

  function lockAdmin() {
    window.sessionStorage.removeItem(tokenStorageKey);
    setToken('');
    setFeedbackList([]);
    setSelectedFeedbackKey(null);
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
        <div className="admin-topbar-actions">
          <a href="/admin/cold-email-requests">콜드메일 신청</a>
          <span className="admin-security-status">
            <LockKeyhole aria-hidden="true" /> 관리자 전용
          </span>
        </div>
      </header>

      <section className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-eyebrow">FEEDBACK MANAGEMENT</p>
            <h1>홈페이지 피드백</h1>
            <p>사용자가 홈페이지를 써보고 남긴 만족도와 개선 의견을 확인합니다.</p>
          </div>
          {isAuthenticated ? (
            <div className="admin-header-actions">
              <div className="admin-count">
                <span>총 피드백</span>
                <strong>{feedbackList.length}</strong>
              </div>
              <Button
                className="admin-icon-button"
                onClick={lockAdmin}
                title="관리자 잠금"
                type="button"
              >
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
              <p>피드백을 열람하려면 관리자 토큰을 입력해주세요.</p>
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
                {isLoading ? '확인 중...' : '피드백 열기'}
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
              <label className="admin-search" htmlFor="feedback-search">
                <Search aria-hidden="true" />
                <input
                  id="feedback-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="의견, 이메일, 페이지 경로 검색"
                  value={query}
                />
              </label>
              <div className="admin-role-filter" aria-label="만족도 필터">
                {ratingFilters.map((filter) => (
                  <button
                    aria-pressed={ratingFilter === filter.value}
                    className={ratingFilter === filter.value ? 'active' : undefined}
                    key={filter.value}
                    onClick={() => setRatingFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <Button
                className="admin-refresh-button"
                disabled={isLoading}
                onClick={() => void loadFeedback()}
                title="피드백 목록 새로고침"
                type="button"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : undefined} aria-hidden="true" />
                <span className="sr-only">피드백 목록 새로고침</span>
              </Button>
            </div>

            {!selectedFeedback ? (
              <section className="admin-empty">
                <Inbox aria-hidden="true" />
                <h2>표시할 피드백이 없습니다</h2>
                <p>검색어나 만족도 필터를 변경해보세요.</p>
              </section>
            ) : (
              <div className="admin-workspace">
                <aside className="admin-request-list" aria-label="홈페이지 피드백 목록">
                  <div className="admin-list-heading">
                    <strong>피드백 목록</strong>
                    <span>{filteredFeedback.length}건</span>
                  </div>
                  <div className="admin-list-items">
                    {filteredFeedback.map((feedback) => {
                      const key = feedbackKey(feedback);
                      const isSelected = key === feedbackKey(selectedFeedback);

                      return (
                        <button
                          aria-current={isSelected ? 'true' : undefined}
                          className={isSelected ? 'active' : undefined}
                          key={key}
                          onClick={() => setSelectedFeedbackKey(key)}
                          type="button"
                        >
                          <span className="admin-role-icon feedback">
                            <MessageSquareText aria-hidden="true" />
                          </span>
                          <span className="admin-list-copy">
                            <span className="admin-list-meta">
                              <b>{feedback.rating}점</b>
                              {formatDate(feedback.submittedAt)}
                            </span>
                            <strong>{ratingLabel(feedback.rating)}</strong>
                            <span>{feedback.message}</span>
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
                      <p>HOMEPAGE FEEDBACK</p>
                      <h2>피드백 상세</h2>
                    </div>
                    <div>
                      <span className="admin-role-badge feedback">
                        <Star aria-hidden="true" /> {selectedFeedback.rating}점
                      </span>
                      <time dateTime={selectedFeedback.submittedAt}>
                        {formatDate(selectedFeedback.submittedAt)}
                      </time>
                    </div>
                  </header>

                  <dl className="admin-detail-grid">
                    <div className="admin-field">
                      <dt>만족도</dt>
                      <dd>{selectedFeedback.rating} / 5</dd>
                    </div>
                    <div className="admin-field">
                      <dt>남긴 페이지</dt>
                      <dd>{selectedFeedback.pagePath}</dd>
                    </div>
                    <div className="admin-field admin-field-wide">
                      <dt>답변 받을 이메일</dt>
                      <dd className={!selectedFeedback.email ? 'admin-empty-value' : undefined}>
                        {selectedFeedback.email ? (
                          <a href={`mailto:${selectedFeedback.email}`}>
                            <Mail aria-hidden="true" />
                            {selectedFeedback.email}
                          </a>
                        ) : (
                          '이메일을 남기지 않았습니다.'
                        )}
                      </dd>
                    </div>
                    <div className="admin-field admin-field-wide admin-field-long">
                      <dt>사용자 의견</dt>
                      <dd>{selectedFeedback.message}</dd>
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

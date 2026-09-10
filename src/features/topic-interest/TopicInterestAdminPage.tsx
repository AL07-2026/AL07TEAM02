import {
  AlertCircle,
  BarChart3,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';

import { ChokBrand } from '@/components/ChokBrand';
import { Button } from '@/components/ui/button';
import { topicInterests } from '@/features/topic-interest/topics';
import type { TopicInterestSelection } from '@/features/topic-interest/types';
import '@/features/topic-interest/topic-interest-admin.css';

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

const tokenStorageKey = 'sales-signal:admin-token';

async function fetchTopicInterests(token: string): Promise<TopicInterestSelection[]> {
  const response = await fetch('/api/topic-interests', {
    headers: { authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(payload.error ?? '관심 주제 결과를 불러오지 못했습니다.');
  }

  const payload = (await response.json()) as { selections?: TopicInterestSelection[] };
  return payload.selections ?? [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function TopicInterestAdminPage() {
  const [token, setToken] = useState(() => window.sessionStorage.getItem(tokenStorageKey) ?? '');
  const [selections, setSelections] = useState<TopicInterestSelection[]>([]);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const results = useMemo(
    () =>
      topicInterests
        .map((topic) => ({
          ...topic,
          count: selections.filter((selection) => selection.topicId === topic.id).length,
        }))
        .sort((left, right) => right.count - left.count || left.number.localeCompare(right.number)),
    [selections],
  );

  const uniqueVisitors = new Set(selections.map((selection) => selection.visitorId)).size;
  const maxCount = Math.max(...results.map((result) => result.count), 1);
  const topTopic = results[0]?.count ? results[0] : null;

  async function loadResults(nextToken = token) {
    setStatus('loading');
    setErrorMessage('');
    try {
      const trimmedToken = nextToken.trim();
      const loaded = await fetchTopicInterests(trimmedToken);
      window.sessionStorage.setItem(tokenStorageKey, trimmedToken);
      setSelections(loaded);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '관심 주제 결과를 불러오지 못했습니다.');
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void loadResults();
  }

  function lockAdmin() {
    window.sessionStorage.removeItem(tokenStorageKey);
    setToken('');
    setSelections([]);
    setStatus('idle');
  }

  const isAuthenticated = status === 'success';
  const isLoading = status === 'loading';

  return (
    <main className="topic-admin-page">
      <header className="topic-admin-topbar">
        <ChokBrand />
        <nav aria-label="관리자 메뉴">
          <a href="/">홈페이지</a>
          <a href="/admin/homepage-feedback">홈페이지 피드백</a>
          <span><LockKeyhole aria-hidden="true" /> 관리자 전용</span>
        </nav>
      </header>

      <section className="topic-admin-shell">
        <header className="topic-admin-heading">
          <div>
            <p>INTEREST VALIDATION</p>
            <h1>기업 리스트 관심도</h1>
            <span>홈페이지에서 선택된 주제를 중복 방문자 없이 집계합니다.</span>
          </div>
          {isAuthenticated ? (
            <div className="topic-admin-actions">
              <Button disabled={isLoading} onClick={() => void loadResults()} type="button">
                <RefreshCw className={isLoading ? 'animate-spin' : undefined} aria-hidden="true" />
                새로고침
              </Button>
              <Button aria-label="관리자 잠금" onClick={lockAdmin} type="button">
                <LogOut aria-hidden="true" />
              </Button>
            </div>
          ) : null}
        </header>

        {!isAuthenticated ? (
          <section className="topic-admin-auth" aria-labelledby="topic-admin-auth-title">
            <span><LockKeyhole aria-hidden="true" /></span>
            <div>
              <h2 id="topic-admin-auth-title">관리자 인증</h2>
              <p>관심도 결과를 확인하려면 관리자 토큰을 입력해주세요.</p>
            </div>
            <form onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="topic-admin-token">관리자 토큰</label>
              <input
                autoComplete="current-password"
                id="topic-admin-token"
                onChange={(event) => setToken(event.target.value)}
                placeholder="ADMIN_ACCESS_TOKEN"
                type="password"
                value={token}
              />
              <Button disabled={isLoading || !token.trim()} type="submit">
                {isLoading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                {isLoading ? '확인 중...' : '결과 열기'}
              </Button>
            </form>
            {status === 'error' ? (
              <div className="topic-admin-alert" role="alert">
                <AlertCircle aria-hidden="true" /> {errorMessage}
              </div>
            ) : null}
          </section>
        ) : (
          <>
            <section className="topic-admin-summary" aria-label="관심도 요약">
              <article>
                <Users aria-hidden="true" />
                <span>참여 방문자</span>
                <strong>{uniqueVisitors}</strong>
              </article>
              <article>
                <BarChart3 aria-hidden="true" />
                <span>전체 선택</span>
                <strong>{selections.length}</strong>
              </article>
              <article className="wide">
                <span>가장 많이 선택된 주제</span>
                <strong>{topTopic ? topTopic.title : '아직 선택이 없습니다'}</strong>
              </article>
            </section>

            <section className="topic-admin-results">
              <header>
                <h2>주제별 선택 결과</h2>
                <span>한 방문자가 여러 주제를 선택할 수 있습니다.</span>
              </header>
              <div>
                {results.map((result) => (
                  <article key={result.id}>
                    <span className="topic-admin-rank">{result.number}</span>
                    <div className="topic-admin-result-copy">
                      <strong>{result.title}</strong>
                      <div className="topic-admin-bar" aria-hidden="true">
                        <span style={{ width: `${(result.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                    <b>{result.count}명</b>
                  </article>
                ))}
              </div>
            </section>

            <section className="topic-admin-recent">
              <header>
                <h2>최근 선택</h2>
                <span>최근 20건</span>
              </header>
              {selections.length ? (
                <div>
                  {selections.slice(0, 20).map((selection) => {
                    const topic = topicInterests.find((item) => item.id === selection.topicId);
                    return (
                      <p key={`${selection.visitorId}-${selection.topicId}`}>
                        <strong>{topic?.shortLabel ?? selection.topicId}</strong>
                        <span>{formatDate(selection.submittedAt)}</span>
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="topic-admin-empty">아직 저장된 선택이 없습니다.</p>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}

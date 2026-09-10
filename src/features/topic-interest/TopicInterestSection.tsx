import {
  BadgeDollarSign,
  BarChart3,
  Check,
  Clock3,
  Globe2,
  Handshake,
  LoaderCircle,
  Rocket,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
  topicInterests,
  type TopicInterestId,
} from '@/features/topic-interest/topics';
import { submitTopicInterest } from '@/features/topic-interest/submit-topic-interest';
import '@/features/topic-interest/topic-interest.css';

const selectionStorageKey = 'chok:topic-interest-selections';
const visitorStorageKey = 'chok:topic-interest-visitor';

const icons: Record<(typeof topicInterests)[number]['icon'], LucideIcon> = {
  rocket: Rocket,
  chart: BarChart3,
  globe: Globe2,
  sparkles: Sparkles,
  trending: TrendingUp,
  users: Users,
  badge: BadgeDollarSign,
  clock: Clock3,
  handshake: Handshake,
  'user-plus': UserPlus,
};

function readSelections(): TopicInterestId[] {
  try {
    const stored = JSON.parse(window.localStorage.getItem(selectionStorageKey) ?? '[]') as unknown;
    if (!Array.isArray(stored)) return [];
    return stored.filter((value): value is TopicInterestId =>
      topicInterests.some((topic) => topic.id === value),
    );
  } catch {
    return [];
  }
}

function getVisitorId() {
  const stored = window.localStorage.getItem(visitorStorageKey);
  if (stored) return stored;

  const id =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.localStorage.setItem(visitorStorageKey, id);
  return id;
}

function rememberSelection(topicId: TopicInterestId, selected: TopicInterestId[]) {
  const next = [...new Set([...selected, topicId])];
  window.localStorage.setItem(selectionStorageKey, JSON.stringify(next));
  return next;
}

export function TopicInterestSection() {
  const [selected, setSelected] = useState<TopicInterestId[]>(readSelections);
  const [pending, setPending] = useState<TopicInterestId | null>(null);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  async function selectTopic(topicId: TopicInterestId) {
    if (pending || selected.includes(topicId)) return;

    setPending(topicId);
    setHasError(false);
    setMessage('');

    try {
      await submitTopicInterest({
        topicId,
        visitorId: getVisitorId(),
        pagePath: `${window.location.pathname}${window.location.search}`.slice(0, 200),
      });
      setSelected((current) => rememberSelection(topicId, current));
      setMessage('선택이 저장되었습니다. 다른 항목도 함께 고를 수 있어요.');
    } catch {
      setHasError(true);
      setMessage('선택을 저장하지 못했습니다. 잠시 후 다시 눌러주세요.');
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="topic-interest-section" id="interest-topics">
      <div className="container">
        <header className="topic-interest-heading">
          <div>
            <span className="topic-interest-kicker">INTEREST CHECK</span>
            <h2>어떤 기업 리스트가 가장 필요하신가요?</h2>
          </div>
          <p>
            실제로 받아보고 싶은 주제를 골라주세요. 여러 개를 선택할 수 있으며, 선택이 많은
            리스트부터 준비하겠습니다.
          </p>
        </header>

        <div className="topic-interest-grid">
          {topicInterests.map((topic) => {
            const Icon = icons[topic.icon];
            const isSelected = selected.includes(topic.id);
            const isPending = pending === topic.id;

            return (
              <article className={isSelected ? 'topic-interest-card selected' : 'topic-interest-card'} key={topic.id}>
                <div className="topic-preview-bar" aria-hidden="true">
                  <strong>CHOK</strong>
                  <span>기업 신호</span>
                  <span>분석 예시</span>
                  <b>{topic.number}</b>
                </div>
                <div className="topic-preview-body">
                  <span className="topic-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <small>{topic.shortLabel}</small>
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                  </div>
                </div>
                <button
                  aria-pressed={isSelected}
                  disabled={Boolean(pending) || isSelected}
                  onClick={() => void selectTopic(topic.id)}
                  type="button"
                >
                  {isPending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
                  {isSelected ? <Check aria-hidden="true" /> : null}
                  {isPending ? '저장 중...' : isSelected ? '선택했습니다' : '이 리스트가 궁금해요'}
                </button>
              </article>
            );
          })}
        </div>

        <div
          aria-live="polite"
          className={hasError ? 'topic-interest-message error' : 'topic-interest-message'}
        >
          {message || `현재 ${selected.length}개 주제를 선택했습니다.`}
        </div>
      </div>
    </section>
  );
}

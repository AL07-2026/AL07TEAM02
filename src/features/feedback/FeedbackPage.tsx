import {
  AlertCircle,
  ArrowLeft,
  Check,
  CircleCheck,
  LoaderCircle,
  MessageSquareText,
  Send,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { ChokBrand } from '@/components/ChokBrand';
import { submitHomepageFeedback } from '@/features/feedback/submit-homepage-feedback';
import type { HomepageFeedback, HomepageFeedbackDraft } from '@/features/feedback/types';
import { cn } from '@/lib/utils';
import '@/features/feedback/feedback-page.css';

type FormValues = {
  rating: number;
  message: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const ratingOptions = [
  { value: 5, label: '매우 유용해요' },
  { value: 4, label: '좋아요' },
  { value: 3, label: '보통이에요' },
  { value: 2, label: '아쉬워요' },
  { value: 1, label: '어려웠어요' },
];

const initialValues: FormValues = {
  rating: 5,
  message: '',
  email: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const message = values.message.trim();
  const email = values.email.trim();

  if (values.rating < 1 || values.rating > 5) errors.rating = '만족도를 선택해주세요.';
  if (!message) errors.message = '홈페이지를 사용하며 느낀 점을 남겨주세요.';
  if (message.length > 1000) errors.message = '피드백은 1000자 이내로 작성해주세요.';
  if (email && !emailPattern.test(email)) errors.email = '올바른 이메일 주소를 입력해주세요.';

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="feedback-error" id={id} role="alert">
      <AlertCircle aria-hidden="true" />
      {message}
    </p>
  );
}

function FeedbackHeader() {
  return (
    <header className="feedback-header">
      <div className="feedback-container feedback-header-inner">
        <ChokBrand />
        <a className="feedback-back-link" href="/">
          <ArrowLeft aria-hidden="true" />
          메인으로
        </a>
      </div>
    </header>
  );
}

function SuccessState({ feedback }: { feedback: HomepageFeedback }) {
  return (
    <div className="feedback-shell">
      <FeedbackHeader />
      <main className="feedback-success">
        <section className="feedback-success-card">
          <span className="feedback-success-icon" aria-hidden="true">
            <CircleCheck />
          </span>
          <p className="feedback-eyebrow">FEEDBACK RECEIVED</p>
          <h1>피드백이 접수되었습니다</h1>
          <p>
            남겨주신 의견은 홈페이지 개선에 반영하겠습니다.
            {feedback.email ? ' 필요하면 입력한 이메일로 추가 질문을 드릴 수 있습니다.' : ''}
          </p>
          <a href="/">
            메인으로 돌아가기 <ArrowLeft aria-hidden="true" />
          </a>
        </section>
      </main>
    </div>
  );
}

export function FeedbackPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [submittedFeedback, setSubmittedFeedback] = useState<HomepageFeedback | null>(null);

  const isSubmitting = status === 'submitting';

  function updateValue<Key extends keyof FormValues>(field: Key, value: FormValues[Key]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === 'error') setStatus('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const nextErrors = validateForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const feedback: HomepageFeedbackDraft = {
      rating: values.rating,
      message: values.message.trim(),
      pagePath: window.location.pathname,
      ...(values.email.trim() ? { email: values.email.trim() } : {}),
    };

    setStatus('submitting');
    try {
      const result = await submitHomepageFeedback(feedback);
      setSubmittedFeedback(result);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success' && submittedFeedback) {
    return <SuccessState feedback={submittedFeedback} />;
  }

  return (
    <div className="feedback-shell">
      <FeedbackHeader />
      <main className="feedback-page">
        <div className="feedback-container feedback-grid">
          <section className="feedback-intro">
            <p className="feedback-eyebrow">
              <MessageSquareText aria-hidden="true" />
              HOMEPAGE FEEDBACK
            </p>
            <h1>홈페이지를 써보고 느낀 점을 알려주세요</h1>
            <p>
              실제 사용자의 의견을 바탕으로 추천 흐름, 문구, 입력 단계와 결과 화면을 더 다듬고
              있습니다.
            </p>
            <div className="feedback-points" aria-label="피드백 활용 방식">
              <span>
                <Check aria-hidden="true" /> 빠르게 읽을 수 있는지
              </span>
              <span>
                <Check aria-hidden="true" /> 체험 시작이 쉬운지
              </span>
              <span>
                <Check aria-hidden="true" /> 신뢰할 만한 정보인지
              </span>
            </div>
          </section>

          <form className="feedback-form-card" noValidate onSubmit={(event) => void handleSubmit(event)}>
            <div className="feedback-form-heading">
              <div>
                <span>YOUR OPINION</span>
                <h2>피드백 남기기</h2>
              </div>
              <p>의견만 남겨도 충분합니다.</p>
            </div>

            <fieldset className="feedback-rating">
              <legend>홈페이지 만족도</legend>
              <div>
                {ratingOptions.map((option) => (
                  <button
                    aria-pressed={values.rating === option.value}
                    className={cn(values.rating === option.value && 'active')}
                    key={option.value}
                    onClick={() => updateValue('rating', option.value)}
                    type="button"
                  >
                    <strong>{option.value}</strong>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
              <FieldError id="feedback-rating-error" message={errors.rating} />
            </fieldset>

            <div className="feedback-field-group">
              <label htmlFor="feedback-message">
                어떤 점이 좋았거나 아쉬웠나요? <span>*</span>
              </label>
              <textarea
                aria-describedby={
                  errors.message ? 'feedback-message-help feedback-message-error' : 'feedback-message-help'
                }
                aria-invalid={Boolean(errors.message)}
                id="feedback-message"
                maxLength={1000}
                onChange={(event) => updateValue('message', event.target.value)}
                placeholder="예: 어떤 기업을 추천하는지 바로 이해됐지만, 결과 예시가 조금 더 실제처럼 보이면 좋겠습니다."
                value={values.message}
              />
              <div className="feedback-helper" id="feedback-message-help">
                <span>짧게 남겨도 괜찮습니다.</span>
                <span>{values.message.length} / 1000</span>
              </div>
              <FieldError id="feedback-message-error" message={errors.message} />
            </div>

            <div className="feedback-field-group">
              <label htmlFor="feedback-email">답변 받을 이메일</label>
              <input
                aria-describedby={errors.email ? 'feedback-email-error' : undefined}
                aria-invalid={Boolean(errors.email)}
                autoComplete="email"
                id="feedback-email"
                onChange={(event) => updateValue('email', event.target.value)}
                placeholder="name@company.com"
                type="email"
                value={values.email}
              />
              <FieldError id="feedback-email-error" message={errors.email} />
            </div>

            {status === 'error' ? (
              <div className="feedback-alert" role="alert">
                <AlertCircle aria-hidden="true" />
                피드백 제출 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
              </div>
            ) : null}

            <Button className="feedback-submit-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {isSubmitting ? '제출 중...' : '피드백 제출하기'}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

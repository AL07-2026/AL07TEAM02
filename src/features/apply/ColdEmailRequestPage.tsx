import {
  AlertCircle,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleCheck,
  LoaderCircle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { submitColdEmailRequest } from '@/features/apply/submit-cold-email-request';
import type {
  ColdEmailRequest,
  ColdEmailRequestDraft,
  TargetCompany,
} from '@/features/apply/types';
import { cn } from '@/lib/utils';

type ColdEmailRequestPageProps = {
  targetCompany?: TargetCompany;
};

type FormValues = {
  applicantEmail: string;
  applicantCompany: string;
  productName: string;
  productDescription: string;
  additionalRequest: string;
  privacyAgreed: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;
type TextFieldName = Exclude<keyof FormValues, 'privacyAgreed'>;
type SubmissionStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

const initialValues: FormValues = {
  applicantEmail: '',
  applicantCompany: '',
  productName: '',
  productDescription: '',
  additionalRequest: '',
  privacyAgreed: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fieldClassName =
  'min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/20';

function validateForm(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const applicantEmail = values.applicantEmail.trim();
  const descriptionLength = values.productDescription.trim().length;

  if (!applicantEmail) {
    errors.applicantEmail = '이메일을 입력해주세요.';
  } else if (!emailPattern.test(applicantEmail)) {
    errors.applicantEmail = '올바른 이메일 주소를 입력해주세요.';
  }

  if (!values.applicantCompany.trim()) errors.applicantCompany = '회사명을 입력해주세요.';
  if (!values.productName.trim()) errors.productName = '제품 또는 서비스명을 입력해주세요.';

  if (descriptionLength === 0) {
    errors.productDescription = '제품 설명을 입력해주세요.';
  } else if (descriptionLength < 30) {
    errors.productDescription = '제품 설명을 30자 이상 작성해주세요.';
  } else if (descriptionLength > 500) {
    errors.productDescription = '제품 설명은 500자 이내로 작성해주세요.';
  }

  if (!values.privacyAgreed) errors.privacyAgreed = '정보 처리에 동의해주세요.';

  return errors;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p className="flex items-center gap-1.5 text-sm text-red-600" id={id} role="alert">
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}

function TargetCompanySummary({ targetCompany }: { targetCompany?: TargetCompany }) {
  if (!targetCompany) {
    return (
      <section
        aria-labelledby="target-company-title"
        className="rounded-lg border border-border bg-card p-5 sm:p-6"
      >
        <h2 className="text-sm font-semibold" id="target-company-title">
          선택한 타깃 기업
        </h2>
        <div className="mt-4 flex items-start gap-3 bg-muted p-4">
          <AlertCircle
            className="mt-0.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <div>
            <p className="font-medium">선택된 기업 정보가 없습니다.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              상세분석 페이지에서 기업을 선택한 뒤 신청페이지로 이동해주세요.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const companyDetails = [
    targetCompany.hiringChange
      ? {
          icon: BriefcaseBusiness,
          label: '최근 채용 변화',
          value: targetCompany.hiringChange,
        }
      : null,
    targetCompany.expansionSignal
      ? { icon: TrendingUp, label: '확장 신호', value: targetCompany.expansionSignal }
      : null,
    targetCompany.recommendationReason
      ? { icon: Sparkles, label: '추천 이유', value: targetCompany.recommendationReason }
      : null,
  ].filter((detail) => detail !== null);

  return (
    <section
      aria-labelledby="target-company-title"
      className="rounded-lg border border-border bg-card p-5 sm:p-6"
    >
      <h2 className="text-sm font-semibold text-muted-foreground" id="target-company-title">
        선택한 타깃 기업
      </h2>
      <div className="mt-4 flex items-start gap-3 border-b border-border pb-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-xl font-bold">{targetCompany.name}</p>
          {targetCompany.industry ? (
            <p className="mt-1 text-sm text-muted-foreground">{targetCompany.industry}</p>
          ) : null}
        </div>
      </div>

      {companyDetails.length > 0 ? (
        <dl className="mt-5 grid gap-5 sm:grid-cols-2">
          {companyDetails.map(({ icon: Icon, label, value }) => (
            <div className={cn(label === '추천 이유' && 'sm:col-span-2')} key={label}>
              <dt className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1.5 text-sm leading-6">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function RequestSuccessState({ request }: { request: ColdEmailRequest }) {
  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 sm:py-24">
      <section className="mx-auto max-w-xl rounded-lg border border-border bg-card p-6 text-center sm:p-10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CircleCheck className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-xs font-semibold text-primary">STEP 4 · 신청</p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">신청이 완료되었습니다</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
          입력해주신 정보를 바탕으로 {request.targetCompany.name}에 맞는 콜드메일 제작 신청이
          접수되었습니다.
        </p>
        <p className="mt-6 bg-muted px-4 py-3 text-sm">
          <strong>{request.applicantEmail}</strong>은 신청 결과 전달을 위해 사용됩니다.
        </p>
        {import.meta.env.DEV ? (
          <p className="mt-4 text-xs text-muted-foreground">
            개발용 Mock submit으로 접수된 상태입니다.
          </p>
        ) : null}
      </section>
    </main>
  );
}

export function ColdEmailRequestPage({ targetCompany }: ColdEmailRequestPageProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [submittedRequest, setSubmittedRequest] = useState<ColdEmailRequest | null>(null);

  const isSubmitting = status === 'submitting';

  function updateTextField(field: TextFieldName, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    if (status === 'error') setStatus('idle');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting || !targetCompany) return;

    setStatus('validating');
    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle');
      return;
    }

    const request: ColdEmailRequestDraft = {
      applicantEmail: values.applicantEmail.trim(),
      applicantCompany: values.applicantCompany.trim(),
      productName: values.productName.trim(),
      productDescription: values.productDescription.trim(),
      ...(values.additionalRequest.trim()
        ? { additionalRequest: values.additionalRequest.trim() }
        : {}),
      targetCompany,
      privacyAgreed: true,
    };

    setStatus('submitting');
    try {
      setSubmittedRequest(await submitColdEmailRequest(request));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success' && submittedRequest) {
    return <RequestSuccessState request={submittedRequest} />;
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 max-w-2xl sm:mb-10">
          <p className="text-xs font-semibold text-primary">STEP 4 · 신청</p>
          <h1 className="mt-3 break-keep text-3xl font-bold leading-tight sm:text-4xl">
            {targetCompany ? (
              <>
                {targetCompany.name}에 보낼
                <br />
                맞춤 콜드메일을 만들어보세요
              </>
            ) : (
              '맞춤 콜드메일 제작을 신청하세요'
            )}
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
            자사 제품을 알려주시면 기업의 채용 변화와 확장 신호를 바탕으로 맞춤 콜드메일 제작을
            신청할 수 있습니다.
          </p>
        </header>

        <TargetCompanySummary targetCompany={targetCompany} />

        <form
          className="mt-6 rounded-lg border border-border bg-card p-5 sm:p-8"
          noValidate
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="border-b border-border pb-5">
            <h2 className="text-xl font-bold">신청 정보</h2>
            <p className="mt-1 text-sm text-muted-foreground">필수 정보만 간단히 입력해주세요.</p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold" htmlFor="applicant-email">
                결과를 받을 이메일 <span className="text-primary">*</span>
              </label>
              <input
                aria-describedby={
                  errors.applicantEmail
                    ? 'applicant-email-help applicant-email-error'
                    : 'applicant-email-help'
                }
                aria-invalid={Boolean(errors.applicantEmail)}
                autoComplete="email"
                className={fieldClassName}
                id="applicant-email"
                onChange={(event) => updateTextField('applicantEmail', event.target.value)}
                placeholder="name@company.com"
                type="email"
                value={values.applicantEmail}
              />
              <p className="text-xs text-muted-foreground" id="applicant-email-help">
                입력하신 이메일은 신청 결과 전달을 위해 사용됩니다.
              </p>
              <FieldError id="applicant-email-error" message={errors.applicantEmail} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="applicant-company">
                회사명 <span className="text-primary">*</span>
              </label>
              <input
                aria-describedby={errors.applicantCompany ? 'applicant-company-error' : undefined}
                aria-invalid={Boolean(errors.applicantCompany)}
                autoComplete="organization"
                className={fieldClassName}
                id="applicant-company"
                onChange={(event) => updateTextField('applicantCompany', event.target.value)}
                placeholder="예: ABC Labs"
                value={values.applicantCompany}
              />
              <FieldError id="applicant-company-error" message={errors.applicantCompany} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold" htmlFor="product-name">
                판매하려는 제품 또는 서비스 <span className="text-primary">*</span>
              </label>
              <input
                aria-describedby={errors.productName ? 'product-name-error' : undefined}
                aria-invalid={Boolean(errors.productName)}
                className={fieldClassName}
                id="product-name"
                onChange={(event) => updateTextField('productName', event.target.value)}
                placeholder="예: AI 세일즈 코파일럿"
                value={values.productName}
              />
              <FieldError id="product-name-error" message={errors.productName} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold" htmlFor="product-description">
                제품을 간단히 설명해주세요 <span className="text-primary">*</span>
              </label>
              <textarea
                aria-describedby={
                  errors.productDescription
                    ? 'product-description-help product-description-error'
                    : 'product-description-help'
                }
                aria-invalid={Boolean(errors.productDescription)}
                className={cn(fieldClassName, 'min-h-36 resize-y')}
                id="product-description"
                maxLength={500}
                onChange={(event) => updateTextField('productDescription', event.target.value)}
                placeholder="B2B 영업팀이 잠재 고객을 조사하고 기업별 맞춤 영업 메시지를 작성하는 시간을 줄여주는 AI 기반 세일즈 자동화 서비스입니다."
                value={values.productDescription}
              />
              <div
                className="flex items-start justify-between gap-3 text-xs text-muted-foreground"
                id="product-description-help"
              >
                <span>어떤 고객의 어떤 문제를 해결하는 제품인지 알려주세요.</span>
                <span
                  aria-label={`제품 설명 ${values.productDescription.length}자 입력`}
                  className="shrink-0"
                >
                  {values.productDescription.length} / 500
                </span>
              </div>
              <FieldError id="product-description-error" message={errors.productDescription} />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold" htmlFor="additional-request">
                추가 요청사항 <span className="font-normal text-muted-foreground">(선택)</span>
              </label>
              <textarea
                className={cn(fieldClassName, 'min-h-24 resize-y')}
                id="additional-request"
                onChange={(event) => updateTextField('additionalRequest', event.target.value)}
                placeholder="예: 너무 영업적인 표현은 피해주세요. 첫 메일은 짧게 작성해주세요."
                value={values.additionalRequest}
              />
            </div>
          </div>

          <section aria-labelledby="process-title" className="mt-7 bg-primary/5 p-4 sm:p-5">
            <h3 className="text-sm font-semibold" id="process-title">
              어떻게 만들어지나요?
            </h3>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
              {['타깃 기업의 최근 채용 변화', '기업의 확장 신호', '입력한 제품 / 서비스 설명'].map(
                (item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ),
              )}
            </ul>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              위 정보를 바탕으로 기업에 맞는 영업 포인트와 콜드메일 내용을 구성합니다.
            </p>
          </section>

          <div className="mt-6">
            <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm leading-6">
              <input
                aria-describedby={errors.privacyAgreed ? 'privacy-error' : undefined}
                aria-invalid={Boolean(errors.privacyAgreed)}
                checked={values.privacyAgreed}
                className="mt-1 size-4 shrink-0 accent-primary"
                onChange={(event) => {
                  setValues((current) => ({ ...current, privacyAgreed: event.target.checked }));
                  setErrors((current) => ({ ...current, privacyAgreed: undefined }));
                  if (status === 'error') setStatus('idle');
                }}
                type="checkbox"
              />
              <span>맞춤 콜드메일 제작을 위해 입력한 정보를 처리하는 것에 동의합니다.</span>
            </label>
            <FieldError id="privacy-error" message={errors.privacyAgreed} />
          </div>

          {status === 'error' ? (
            <div
              className="mt-5 flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              신청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
            </div>
          ) : null}

          <Button
            className="mt-6 min-h-12 w-full"
            disabled={isSubmitting || !targetCompany}
            type="submit"
          >
            {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
            {isSubmitting ? '신청 중...' : '맞춤 콜드메일 제작 신청하기'}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {targetCompany
              ? '입력하신 이메일은 신청 결과 전달을 위해 사용됩니다.'
              : '기업 정보가 연결되면 신청할 수 있습니다.'}
          </p>
        </form>
      </div>
    </main>
  );
}

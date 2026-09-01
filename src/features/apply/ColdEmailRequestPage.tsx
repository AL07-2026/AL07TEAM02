import {
  AlertCircle,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleCheck,
  LoaderCircle,
  Radar,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCog,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { submitColdEmailRequest } from '@/features/apply/submit-cold-email-request';
import type {
  ApplicantRole,
  ColdEmailRequest,
  ColdEmailRequestDraft,
  TargetCompany,
} from '@/features/apply/types';
import { cn } from '@/lib/utils';
import '@/features/apply/apply-page.css';

type ColdEmailRequestPageProps = {
  targetCompany?: TargetCompany;
  applicantRole?: ApplicantRole;
};

type RoleCopy = {
  progressLabel: string;
  introDescription: string;
  eyebrow: string;
  nameLabel: string;
  namePlaceholder: string;
  nameRequiredError: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  descriptionHelper: string;
  descriptionRequiredError: string;
  descriptionMinLengthError: string;
  descriptionMaxLengthError: string;
  descriptionCountLabel: string;
  additionalRequestPlaceholder: string;
  processItems: [string, string, string];
  processDescription: string;
};

const roleCopy: Record<ApplicantRole, RoleCopy> = {
  sales: {
    progressLabel: '제품 정보',
    introDescription:
      '확인된 채용 변화와 조직 확대 신호에 자사 제품 정보를 더해, 영업 검토에 활용할 수 있는 맞춤 콜드메일 제작을 신청합니다.',
    eyebrow: 'YOUR PRODUCT',
    nameLabel: '판매하려는 제품 또는 서비스',
    namePlaceholder: '예: AI 세일즈 코파일럿',
    nameRequiredError: '제품 또는 서비스명을 입력해주세요.',
    descriptionLabel: '제품을 간단히 설명해주세요',
    descriptionPlaceholder:
      'B2B 영업팀이 잠재 고객을 조사하고 기업별 맞춤 영업 메시지를 작성하는 시간을 줄여주는 AI 기반 세일즈 자동화 서비스입니다.',
    descriptionHelper: '어떤 고객의 어떤 문제를 해결하는 제품인지 알려주세요.',
    descriptionRequiredError: '제품 설명을 입력해주세요.',
    descriptionMinLengthError: '제품 설명을 30자 이상 작성해주세요.',
    descriptionMaxLengthError: '제품 설명은 500자 이내로 작성해주세요.',
    descriptionCountLabel: '제품 설명',
    additionalRequestPlaceholder:
      '예: 너무 영업적인 표현은 피해주세요. 첫 메일은 짧게 작성해주세요.',
    processItems: [
      '타깃 기업의 최근 채용 변화',
      '기업의 확장 신호',
      '입력한 제품 / 서비스 설명',
    ],
    processDescription:
      '위 정보를 바탕으로 기업에 맞는 영업 포인트와 콜드메일 내용을 구성합니다.',
  },
  recruiter: {
    progressLabel: '인재 정보',
    introDescription:
      '확인된 채용 변화와 인재 수요에 제안할 직무와 인재 정보를 더해, 채용 제안에 활용할 수 있는 맞춤 콜드메일 제작을 신청합니다.',
    eyebrow: 'YOUR TALENT',
    nameLabel: '제안하려는 직무 또는 인재 분야',
    namePlaceholder: '예: 시니어 백엔드 개발자',
    nameRequiredError: '제안하려는 직무 또는 인재 분야를 입력해주세요.',
    descriptionLabel: '제안할 인재와 강점을 설명해주세요',
    descriptionPlaceholder:
      'B2B SaaS 경험과 대규모 트래픽 처리 역량을 갖춘 7년 차 백엔드 개발자를 채용 중인 기업에 제안하려고 합니다.',
    descriptionHelper: '어떤 인재를 어떤 포지션에 제안하려는지 알려주세요.',
    descriptionRequiredError: '인재와 제안 강점을 입력해주세요.',
    descriptionMinLengthError: '인재와 제안 강점을 30자 이상 작성해주세요.',
    descriptionMaxLengthError: '인재와 제안 강점은 500자 이내로 작성해주세요.',
    descriptionCountLabel: '인재와 제안 강점',
    additionalRequestPlaceholder:
      '예: 후보자의 현재 회사명은 밝히지 말고, 실무 강점을 중심으로 작성해주세요.',
    processItems: [
      '타깃 기업의 최근 채용 변화',
      '직무별 채용 수요와 인재 신호',
      '입력한 직무 / 인재 정보',
    ],
    processDescription:
      '위 정보를 바탕으로 기업의 채용 맥락에 맞는 후보 제안 포인트와 콜드메일 내용을 구성합니다.',
  },
  investor: {
    progressLabel: '투자 관점',
    introDescription:
      '확인된 채용 변화와 성장 신호에 투자 관심 분야와 검토 관점을 더해, 기업 접촉에 활용할 수 있는 맞춤 콜드메일 제작을 신청합니다.',
    eyebrow: 'YOUR INVESTMENT VIEW',
    nameLabel: '관심 있는 산업 또는 투자 테마',
    namePlaceholder: '예: B2B SaaS, AI 인프라',
    nameRequiredError: '관심 있는 산업 또는 투자 테마를 입력해주세요.',
    descriptionLabel: '투자 관점과 관심 조건을 설명해주세요',
    descriptionPlaceholder:
      '시리즈 A 전후의 B2B SaaS 기업 중 반복 매출이 성장하고 해외 시장 확장을 준비하는 팀을 검토하고 있습니다.',
    descriptionHelper: '어떤 기업을 어떤 투자 관점에서 검토하는지 알려주세요.',
    descriptionRequiredError: '투자 관점과 관심 조건을 입력해주세요.',
    descriptionMinLengthError: '투자 관점과 관심 조건을 30자 이상 작성해주세요.',
    descriptionMaxLengthError: '투자 관점과 관심 조건은 500자 이내로 작성해주세요.',
    descriptionCountLabel: '투자 관점과 관심 조건',
    additionalRequestPlaceholder:
      '예: 투자 제안보다 시장과 성장 전략에 대한 대화를 요청하는 톤으로 작성해주세요.',
    processItems: [
      '타깃 기업의 최근 채용 변화',
      '기업의 성장과 확장 신호',
      '입력한 투자 테마 / 검토 관점',
    ],
    processDescription:
      '위 정보를 바탕으로 기업에 맞는 투자 검토 포인트와 콜드메일 내용을 구성합니다.',
  },
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
const fieldClassName = 'apply-field';

function ApplyHeader({ copy }: { copy: RoleCopy }) {
  return (
    <>
      <header className="apply-site-header">
        <div className="apply-container apply-header-inner">
          <a className="apply-brand" href="/" aria-label="세일즈 시그널 홈">
            <span className="apply-brand-symbol" aria-hidden="true">
              <Radar />
            </span>
            <span>세일즈 시그널</span>
          </a>
          <div className="apply-header-actions">
            <span className="apply-header-status">
              <ShieldCheck aria-hidden="true" />
              신청 정보 보호
            </span>
            <a
              className="apply-admin-shortcut"
              href="/admin/cold-email-requests"
              aria-label="관리자 페이지"
              title="관리자 페이지"
            >
              <UserCog aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>
      <div className="apply-progress" aria-label="서비스 진행 단계: 4단계 중 4단계">
        <div className="apply-container apply-progress-inner">
          <div>
            <span>{copy.progressLabel}</span>
            <span>기업 탐색</span>
            <span>상세 분석</span>
            <strong>콜드메일 신청</strong>
          </div>
          <small>4 / 4</small>
        </div>
      </div>
    </>
  );
}

function validateForm(values: FormValues, copy: RoleCopy): FormErrors {
  const errors: FormErrors = {};
  const applicantEmail = values.applicantEmail.trim();
  const descriptionLength = values.productDescription.trim().length;

  if (!applicantEmail) {
    errors.applicantEmail = '이메일을 입력해주세요.';
  } else if (!emailPattern.test(applicantEmail)) {
    errors.applicantEmail = '올바른 이메일 주소를 입력해주세요.';
  }

  if (!values.applicantCompany.trim()) errors.applicantCompany = '회사명을 입력해주세요.';
  if (!values.productName.trim()) errors.productName = copy.nameRequiredError;

  if (descriptionLength === 0) {
    errors.productDescription = copy.descriptionRequiredError;
  } else if (descriptionLength < 30) {
    errors.productDescription = copy.descriptionMinLengthError;
  } else if (descriptionLength > 500) {
    errors.productDescription = copy.descriptionMaxLengthError;
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
      <section aria-labelledby="target-company-title" className="apply-company-card">
        <h2 className="text-sm font-semibold" id="target-company-title">
          선택한 타깃 기업
        </h2>
        <div className="apply-empty-company">
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
    <section aria-labelledby="target-company-title" className="apply-company-card">
      <div className="apply-card-heading">
        <div>
          <span>SELECTED ACCOUNT</span>
          <h2 id="target-company-title">선택한 타깃 기업</h2>
        </div>
        <span className="apply-priority">접근 우선순위 높음</span>
      </div>
      <div className="apply-company-identity">
        <div className="apply-company-icon">
          <Building2 className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="apply-company-name">{targetCompany.name}</p>
          {targetCompany.industry ? (
            <p className="mt-1 text-sm text-muted-foreground">{targetCompany.industry}</p>
          ) : null}
        </div>
      </div>

      {companyDetails.length > 0 ? (
        <dl className="apply-signal-grid">
          {companyDetails.map(({ icon: Icon, label, value }) => (
            <div
              className={cn('apply-signal-item', label === '추천 이유' && 'apply-signal-wide')}
              key={label}
            >
              <dt>
                <Icon aria-hidden="true" />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}

function RequestSuccessState({ request, copy }: { request: ColdEmailRequest; copy: RoleCopy }) {
  return (
    <div className="apply-shell">
      <ApplyHeader copy={copy} />
      <main className="apply-success-page">
        <section className="apply-success-card">
          <div className="apply-success-icon">
            <CircleCheck className="size-7" aria-hidden="true" />
          </div>
          <p className="apply-eyebrow">REQUEST RECEIVED</p>
          <h1>신청이 완료되었습니다</h1>
          <p className="apply-success-copy">
            입력해주신 정보를 바탕으로 {request.targetCompany.name}에 맞는 콜드메일 제작 신청이
            접수되었습니다.
          </p>
          <p className="apply-success-email">
            <strong>{request.applicantEmail}</strong>은 신청 결과 전달을 위해 사용됩니다.
          </p>
        </section>
      </main>
    </div>
  );
}

export function ColdEmailRequestPage({
  targetCompany,
  applicantRole = 'sales',
}: ColdEmailRequestPageProps) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [submittedRequest, setSubmittedRequest] = useState<ColdEmailRequest | null>(null);
  const copy = roleCopy[applicantRole];

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
    const nextErrors = validateForm(values, copy);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus('idle');
      return;
    }

    const request: ColdEmailRequestDraft = {
      applicantRole,
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
    return <RequestSuccessState request={submittedRequest} copy={copy} />;
  }

  return (
    <div className="apply-shell">
      <ApplyHeader copy={copy} />
      <main className="apply-page">
        <div className="apply-container apply-content">
          <header className="apply-intro">
            <p className="apply-eyebrow">
              <Sparkles aria-hidden="true" /> 맞춤 콜드메일 신청
            </p>
            <h1>
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
            <p>
              {copy.introDescription}
            </p>
          </header>

          <TargetCompanySummary targetCompany={targetCompany} />

          <form
            className="apply-form-card"
            noValidate
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="apply-form-heading">
              <div>
                <span>{copy.eyebrow}</span>
                <h2>신청 정보</h2>
              </div>
              <p>필수 정보만 간단히 입력해주세요.</p>
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
                  {copy.nameLabel} <span className="text-primary">*</span>
                </label>
                <input
                  aria-describedby={errors.productName ? 'product-name-error' : undefined}
                  aria-invalid={Boolean(errors.productName)}
                  className={fieldClassName}
                  id="product-name"
                  onChange={(event) => updateTextField('productName', event.target.value)}
                  placeholder={copy.namePlaceholder}
                  value={values.productName}
                />
                <FieldError id="product-name-error" message={errors.productName} />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-semibold" htmlFor="product-description">
                  {copy.descriptionLabel} <span className="text-primary">*</span>
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
                  placeholder={copy.descriptionPlaceholder}
                  value={values.productDescription}
                />
                <div
                  className="flex items-start justify-between gap-3 text-xs text-muted-foreground"
                  id="product-description-help"
                >
                  <span>{copy.descriptionHelper}</span>
                  <span
                    aria-label={`${copy.descriptionCountLabel} ${values.productDescription.length}자 입력`}
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
                  placeholder={copy.additionalRequestPlaceholder}
                  value={values.additionalRequest}
                />
              </div>
            </div>

            <section aria-labelledby="process-title" className="apply-process-box">
              <h3 className="text-sm font-semibold" id="process-title">
                어떻게 만들어지나요?
              </h3>
              <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                {copy.processItems.map((item) => (
                  <li className="flex items-start gap-2" key={item}>
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {copy.processDescription}
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
              className="apply-submit-button"
              disabled={isSubmitting || !targetCompany}
              type="submit"
            >
              {isSubmitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}
              {isSubmitting ? '신청 중...' : '맞춤 콜드메일 제작 신청하기'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" /> : null}
            </Button>
            <p className="apply-submit-note">
              {targetCompany
                ? '입력하신 이메일은 신청 결과 전달을 위해 사용됩니다.'
                : '기업 정보가 연결되면 신청할 수 있습니다.'}
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

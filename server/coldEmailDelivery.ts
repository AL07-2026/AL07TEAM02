import type { ColdEmailRequest, ColdEmailRequestDraft } from '../src/features/apply/types.js';

type DeliveryResult = NonNullable<ColdEmailRequest['delivery']>;

const resendApiUrl = 'https://api.resend.com/emails';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainLines(lines: Array<string | false | undefined>) {
  return lines.filter((line): line is string => Boolean(line));
}

function contactText(request: ColdEmailRequestDraft) {
  const contacts = request.targetCompany.contacts ?? [];
  if (!contacts.length) return '공고에서 공개된 채용담당자 연락처는 확인되지 않았습니다.';

  return contacts
    .map((contact) =>
      plainLines([
        contact.sourceTitle ? `- ${contact.sourceTitle}` : '- 공개 연락처',
        contact.department || contact.name
          ? `  담당: ${[contact.department, contact.name].filter(Boolean).join(' · ')}`
          : undefined,
        contact.email ? `  이메일: ${contact.email}` : undefined,
        contact.phone ? `  연락처: ${contact.phone}` : undefined,
        contact.contactPageUrl ? `  채용 문의 페이지: ${contact.contactPageUrl}` : undefined,
        contact.estimatedEmails?.length
          ? `  추정 이메일(검증 필요): ${contact.estimatedEmails.join(', ')}`
          : undefined,
        contact.sourceUrl ? `  공고: ${contact.sourceUrl}` : undefined,
      ]).join('\n'),
    )
    .join('\n\n');
}

function coldEmailDraft(request: ColdEmailRequestDraft) {
  const target = request.targetCompany;
  const roleOpening =
    request.applicantRole === 'recruiter'
      ? `${target.name}의 최근 채용 흐름을 보고 연락드립니다.`
      : request.applicantRole === 'investor'
        ? `${target.name}의 성장 신호를 관심 있게 보고 연락드립니다.`
        : `${target.name}의 최근 채용 변화와 조직 확대 신호를 보고 연락드립니다.`;
  const offer =
    request.applicantRole === 'recruiter'
      ? `저희는 ${request.productName} 관련 인재 제안을 준비하고 있습니다. ${request.productDescription}`
      : request.applicantRole === 'investor'
        ? `저희는 ${request.productName} 관점에서 기업을 검토하고 있습니다. ${request.productDescription}`
        : `저희는 ${request.productName}을 제공하고 있습니다. ${request.productDescription}`;

  return plainLines([
    `안녕하세요, ${target.name} 담당자님.`,
    '',
    roleOpening,
    target.hiringChange,
    target.recommendationReason,
    '',
    offer,
    '',
    '관련해서 15분 정도 짧게 이야기 나눌 수 있을까요?',
    '편하신 시간대를 알려주시면 일정에 맞춰 연락드리겠습니다.',
    '',
    `감사합니다.`,
    `${request.applicantCompany} 드림`,
  ]).join('\n');
}

export function buildColdEmailResultText(request: ColdEmailRequestDraft) {
  return plainLines([
    `${request.targetCompany.name} 콜드메일 초안`,
    '',
    '[타깃 기업]',
    request.targetCompany.name,
    request.targetCompany.industry ? `데이터 출처: ${request.targetCompany.industry}` : undefined,
    request.targetCompany.hiringChange ? `최근 채용 변화: ${request.targetCompany.hiringChange}` : undefined,
    request.targetCompany.expansionSignal ? `확장 신호: ${request.targetCompany.expansionSignal}` : undefined,
    request.targetCompany.recommendationReason
      ? `추천 이유: ${request.targetCompany.recommendationReason}`
      : undefined,
    '',
    '[공개 연락처]',
    contactText(request),
    '',
    '[콜드메일 초안]',
    coldEmailDraft(request),
    request.additionalRequest ? `\n[추가 요청사항]\n${request.additionalRequest}` : undefined,
  ]).join('\n');
}

function textToHtml(text: string) {
  return escapeHtml(text)
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.COLD_EMAIL_FROM;
  if (!apiKey || !from) return null;
  return {
    apiKey,
    from,
    replyTo: process.env.COLD_EMAIL_REPLY_TO,
  };
}

async function readResendError(response: Response) {
  const body = await response.text();
  if (!body) return `Resend HTTP ${response.status}`;

  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string };
    return parsed.message ?? parsed.error ?? body;
  } catch {
    return body;
  }
}

export async function sendColdEmailResult(
  request: ColdEmailRequestDraft,
): Promise<DeliveryResult> {
  const resend = getResendConfig();
  if (!resend) {
    return {
      status: 'skipped',
      message: 'RESEND_API_KEY와 COLD_EMAIL_FROM이 없어 이메일 발송은 건너뛰었습니다.',
    };
  }

  try {
    const text = buildColdEmailResultText(request);
    const response = await fetch(resendApiUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${resend.apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: resend.from,
        to: [request.applicantEmail],
        ...(resend.replyTo ? { reply_to: resend.replyTo } : {}),
        subject: `[Sales Signal] ${request.targetCompany.name} 콜드메일 초안`,
        text,
        html: textToHtml(text),
      }),
    });

    if (response.ok) {
      return {
        status: 'sent',
        provider: 'resend',
        message: '입력한 이메일로 콜드메일 초안을 발송했습니다.',
      };
    }

    return {
      status: 'failed',
      provider: 'resend',
      message: await readResendError(response),
    };
  } catch (error) {
    return {
      status: 'failed',
      provider: 'resend',
      message: error instanceof Error ? error.message : '이메일 발송에 실패했습니다.',
    };
  }
}

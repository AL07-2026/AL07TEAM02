import type { JobContactInfo, NormalizedJobPosting } from '../src/jobs/types.js';
import { getCompanyContactFallback } from '../src/jobs/contactHints.js';

const requestTimeoutMs = 3500;
const maxHtmlLength = 500_000;
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const phonePattern =
  /(?:\+82[-.\s]?)?(?:0\d{1,2}|\d{2})[-.\s)]?\d{3,4}[-.\s]?\d{4}/g;
const hrefPattern = /href\s*=\s*["']([^"']+)["']/gi;
const jobBoardHosts = [
  'jooble.org',
  'saramin.co.kr',
  'work24.go.kr',
  'alio.go.kr',
  'jobkorea.co.kr',
  'wanted.co.kr',
  'jumpit.co.kr',
  'programmers.co.kr',
];

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2f;/gi, '/');
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeEmail(value: string) {
  return value.trim().replace(/^mailto:/i, '').split('?')[0]?.toLowerCase() ?? '';
}

function normalizePhone(value: string) {
  return value
    .replace(/^tel:/i, '')
    .replace(/[^\d+]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function isLikelyJobBoard(url: URL) {
  return jobBoardHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`));
}

function extractHrefValues(html: string) {
  return [...html.matchAll(hrefPattern)]
    .map((match) => decodeHtml(match[1] ?? '').trim())
    .filter(Boolean);
}

function resolveUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function isContactLikeHref(value: string) {
  const normalized = decodeURIComponent(value).toLowerCase();
  return /career|recruit|job|hire|talent|contact|inquiry|support|채용|인재|문의|지원/.test(
    normalized,
  );
}

function extractContactPageUrl(html: string, sourceUrl: string) {
  const href = extractHrefValues(html)
    .filter((value) => !value.startsWith('#') && !/^mailto:|^tel:/i.test(value))
    .find(isContactLikeHref);
  return href ? (resolveUrl(href, sourceUrl) ?? undefined) : undefined;
}

function companyDomainFromUrl(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    if (isLikelyJobBoard(url)) return null;
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function estimateRecruitingEmails(sourceUrl: string) {
  const domain = companyDomainFromUrl(sourceUrl);
  if (!domain) return [];
  return [`recruit@${domain}`, `hr@${domain}`, `jobs@${domain}`];
}

async function fetchHtml(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'SalesSignalContactEnricher/1.0',
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType && !contentType.toLowerCase().includes('html')) return null;

    return (await response.text()).slice(0, maxHtmlLength);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function mergeContactInfo(
  existing: JobContactInfo | undefined,
  supplemental: JobContactInfo | undefined,
) {
  if (!existing) return supplemental;
  if (!supplemental) {
    return {
      ...existing,
      source: existing.source ?? 'posting_field',
      verificationStatus: existing.verificationStatus ?? 'confirmed',
    } satisfies JobContactInfo;
  }

  return {
    ...supplemental,
    ...existing,
    contactPageUrl: existing.contactPageUrl ?? supplemental.contactPageUrl,
    estimatedEmails: unique([
      ...(existing.estimatedEmails ?? []),
      ...(supplemental.estimatedEmails ?? []),
    ]),
    source: existing.source ?? supplemental.source,
    verificationStatus: existing.verificationStatus ?? supplemental.verificationStatus,
  } satisfies JobContactInfo;
}

export async function enrichJobPostingContact(posting: NormalizedJobPosting) {
  const html = await fetchHtml(posting.sourceUrl);
  const emails = html
    ? unique([
        ...extractHrefValues(html)
          .filter((href) => /^mailto:/i.test(href))
          .map(normalizeEmail),
        ...(decodeHtml(html).match(emailPattern) ?? []).map(normalizeEmail),
      ])
    : [];
  const phones = html
    ? unique([
        ...extractHrefValues(html)
          .filter((href) => /^tel:/i.test(href))
          .map(normalizePhone),
        ...(decodeHtml(html).match(phonePattern) ?? []).map(normalizePhone),
      ])
    : [];
  const contactPageUrl = html ? extractContactPageUrl(html, posting.sourceUrl) : undefined;
  const confirmedContact: JobContactInfo | undefined =
    emails[0] || phones[0] || contactPageUrl
      ? {
          ...(emails[0] ? { email: emails[0] } : {}),
          ...(phones[0] ? { phone: phones[0] } : {}),
          ...(contactPageUrl ? { contactPageUrl } : {}),
          source: emails[0] || phones[0] ? 'posting_html' : 'company_page',
          verificationStatus: 'confirmed',
        }
      : undefined;
  const estimatedEmails = estimateRecruitingEmails(contactPageUrl ?? posting.sourceUrl);
  const estimatedContact: JobContactInfo | undefined =
    !confirmedContact?.email && estimatedEmails.length
      ? {
          estimatedEmails,
          ...(contactPageUrl ? { contactPageUrl } : {}),
          source: 'estimated',
          verificationStatus: 'needs_verification',
        }
      : undefined;
  const companyContactFallback = !confirmedContact?.email
    ? getCompanyContactFallback(posting.companyName)
    : undefined;
  const contactInfo = mergeContactInfo(
    posting.contactInfo,
    mergeContactInfo(confirmedContact, mergeContactInfo(estimatedContact, companyContactFallback)),
  );

  return contactInfo ? { ...posting, contactInfo } : posting;
}

export async function enrichJobPostingContacts(postings: NormalizedJobPosting[]) {
  return Promise.all(postings.map(enrichJobPostingContact));
}

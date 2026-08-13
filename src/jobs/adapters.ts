import { normalizeJobPosting } from './normalize.ts';
import type { NormalizedJobInput, NormalizedJobPosting } from './types.ts';

type UnknownRecord = Record<string, unknown>;

export type AlioJobRecord = {
  recrutPblntSn: number;
  instNm: string;
  recrutPbancTtl: string;
  ncsCdNmLst?: string | null;
  recrutNope?: number | null;
  workRgnNmLst?: string | null;
  pbancBgngYmd: string;
  pbancEndYmd?: string | null;
  ongoingYn: string;
  srcUrl: string;
  hireTypeNmLst?: string | null;
  recrutSeNm?: string | null;
  aplyQlfcCn?: string | null;
  scrnprcdrMthdExpln?: string | null;
  prefCn?: string | null;
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getRecord(value: unknown, key: string) {
  if (!isRecord(value)) return undefined;
  const child = value[key];
  return isRecord(child) ? child : undefined;
}

function getString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function getNamedValue(value: unknown) {
  if (isRecord(value)) return getString(value.name);
  return getString(value);
}

function timestampToIso(value: unknown) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return new Date(seconds * 1000).toISOString();
}

function alioDate(value: string | null | undefined) {
  if (!value) return null;
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00+09:00`;
  }
  return value;
}

function getSaraminJobs(response: unknown) {
  const jobs = getRecord(response, 'jobs');
  const rawJobs = jobs?.job;
  if (Array.isArray(rawJobs)) return rawJobs.filter(isRecord);
  return isRecord(rawJobs) ? [rawJobs] : [];
}

function stripMarkup(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function adaptJoobleResponse(
  response: unknown,
  collectedAt: string,
): NormalizedJobPosting[] {
  if (!isRecord(response) || !Array.isArray(response.jobs)) {
    throw new Error('Jooble 채용공고 목록이 없습니다.');
  }

  return response.jobs.filter(isRecord).flatMap((job) => {
    const sourceUrl = getString(job.link);
    const companyName = getString(job.company).trim();
    const title = getString(job.title).trim();
    const publishedAt = getString(job.updated).trim();
    const linkedId = sourceUrl.match(/\/desc\/(\d+)/)?.[1] ?? '';
    const externalId = linkedId || getString(job.id) || sourceUrl;

    if (!sourceUrl || !companyName || !title || !publishedAt || !externalId) return [];

    return [
      normalizeJobPosting({
        source: 'jooble',
        externalId,
        sourceUrl,
        companyName,
        title,
        description: stripMarkup(getString(job.snippet)),
        industry: '',
        keywords: [],
        location: getString(job.location),
        employmentType: getString(job.type),
        headcount: null,
        publishedAt,
        updatedAt: publishedAt,
        expiresAt: null,
        active: true,
        collectedAt,
      }),
    ];
  });
}

export function adaptSaraminResponse(
  response: unknown,
  collectedAt: string,
): NormalizedJobPosting[] {
  return getSaraminJobs(response).map((job) => {
    const company = getRecord(job, 'company');
    const companyDetail = getRecord(company, 'detail');
    const position = getRecord(job, 'position');
    const companyName = getNamedValue(companyDetail?.name ?? company?.name);
    const keywordText = getString(job.keyword);

    return normalizeJobPosting({
      source: 'saramin',
      externalId: getString(job.id),
      sourceUrl: getString(job.url),
      companyName,
      title: getString(position?.title),
      description: keywordText,
      industry: getNamedValue(position?.industry),
      keywords: keywordText.split(',').map((keyword) => keyword.trim()),
      location: getNamedValue(position?.location),
      employmentType: getNamedValue(position?.['job-type']),
      headcount: null,
      publishedAt: getString(job['posting-date']) || timestampToIso(job['posting-timestamp']) || '',
      updatedAt: timestampToIso(job['modification-timestamp']),
      expiresAt: getString(job['expiration-date']) || timestampToIso(job['expiration-timestamp']),
      active: Number(job.active) === 1,
      collectedAt,
    });
  });
}

export function adaptAlioRecords(
  records: AlioJobRecord[],
  collectedAt: string,
): NormalizedJobPosting[] {
  return records.map((record) =>
    normalizeJobPosting({
      source: 'alio',
      externalId: String(record.recrutPblntSn),
      sourceUrl: record.srcUrl,
      companyName: record.instNm,
      title: record.recrutPbancTtl,
      description: [record.aplyQlfcCn, record.scrnprcdrMthdExpln, record.prefCn]
        .filter(Boolean)
        .join('\n'),
      industry: '공공기관',
      keywords: [record.ncsCdNmLst, record.recrutSeNm].filter((value): value is string =>
        Boolean(value),
      ),
      location: record.workRgnNmLst ?? '',
      employmentType: record.hireTypeNmLst ?? '',
      headcount: record.recrutNope ?? null,
      publishedAt: alioDate(record.pbancBgngYmd) ?? '',
      updatedAt: null,
      expiresAt: alioDate(record.pbancEndYmd),
      active: record.ongoingYn === 'Y',
      collectedAt,
    }),
  );
}

export function adaptAlioResponse(response: unknown, collectedAt: string): NormalizedJobPosting[] {
  if (!isRecord(response) || Number(response.resultCode) !== 200) {
    throw new Error(`ALIO API 오류: ${getString(isRecord(response) ? response.resultMsg : '')}`);
  }
  if (!Array.isArray(response.result)) throw new Error('ALIO 채용공고 목록이 없습니다.');
  return adaptAlioRecords(response.result as AlioJobRecord[], collectedAt);
}

export function adaptNormalizedRecords(records: NormalizedJobInput[]): NormalizedJobPosting[] {
  return records.map(normalizeJobPosting);
}

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { analyzeCompanies } from '../src/jobs/analysis.js';
import type {
  AnalysisRole,
  NormalizedJobPosting,
  TrySearchRequest,
  TrySearchResponse,
} from '../src/jobs/types.js';
import { fetchAlioJobs } from './alioClient.js';
import { fetchAlioJobDetail } from './alioDetail.js';
import { JobStore } from './jobStore.js';
import { runJobPipeline } from './jobPipeline.js';
import { fetchJoobleJobs } from './joobleClient.js';
import { fetchWork24Jobs } from './work24Client.js';

const dataRoot = process.env.VERCEL ? resolve(tmpdir(), 'job-signals') : resolve('data');
const databasePath = resolve(dataRoot, 'job-signals.db');
const refreshInterval = 6 * 60 * 60 * 1000;
const roles: AnalysisRole[] = ['sales', 'recruiter', 'investor'];
const regionTerms = { seoul: '서울', gyeonggi: '경기', busan: '부산' } as const;
const joobleRefreshes = new Map<string, number>();
let lastWork24Refresh = 0;

type RefreshReport = {
  source: 'work24';
  status: 'refreshed' | 'skipped';
  reason?: string;
  received?: number;
};

function validateRequest(value: unknown): TrySearchRequest {
  if (typeof value !== 'object' || value === null) throw new Error('검색 조건이 필요합니다.');
  const input = value as Record<string, unknown>;
  const role = input.role;
  const query = typeof input.query === 'string' ? input.query.trim() : '';
  const region = typeof input.region === 'string' ? input.region : 'all';

  if (!roles.includes(role as AnalysisRole)) throw new Error('지원하지 않는 역할입니다.');
  if (query.length < 2 || query.length > 100) {
    throw new Error('검색 목적을 2자 이상 100자 이하로 입력해주세요.');
  }
  if (!['all', ...Object.keys(regionTerms)].includes(region)) {
    throw new Error('지원하지 않는 지역 조건입니다.');
  }

  return { role: role as AnalysisRole, query, region: region as TrySearchRequest['region'] };
}

function filterByRegion(postings: NormalizedJobPosting[], region: TrySearchRequest['region']) {
  if (!region || region === 'all') return postings;
  const term = regionTerms[region];
  return postings.filter((posting) => posting.location.includes(term));
}

function hasDirectMatch(result: ReturnType<typeof analyzeCompanies>[number]) {
  return result.evidenceUrls.length > 0;
}

function readPostings() {
  if (!existsSync(databasePath)) return [];
  const store = new JobStore(databasePath);
  try {
    return store.readPostings().filter((posting) => posting.source !== 'normalized');
  } finally {
    store.close();
  }
}

function countSources(postings: NormalizedJobPosting[]) {
  return postings.reduce<Partial<Record<NormalizedJobPosting['source'], number>>>(
    (counts, posting) => {
      counts[posting.source] = (counts[posting.source] ?? 0) + 1;
      return counts;
    },
    {},
  );
}

function countWork24Items(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) return 0;
  const list = (payload as { dhsOpenEmpInfoList?: { dhsOpenEmpInfo?: unknown } })
    .dhsOpenEmpInfoList;
  const jobs = list?.dhsOpenEmpInfo;
  if (Array.isArray(jobs)) return jobs.length;
  return typeof jobs === 'object' && jobs !== null ? 1 : 0;
}

function getWork24Root(payload: unknown) {
  if (typeof payload !== 'object' || payload === null) return null;
  const root = (payload as Record<string, unknown>).dhsOpenEmpInfoList;
  return typeof root === 'object' && root !== null ? (root as Record<string, unknown>) : null;
}

function mergeWork24Payloads(payloads: unknown[]) {
  const firstRoot = getWork24Root(payloads[0]);
  if (!firstRoot) throw new Error('고용24 공채속보 응답 형식이 올바르지 않습니다.');

  const jobs = payloads.flatMap((payload) => {
    const rawJobs = getWork24Root(payload)?.dhsOpenEmpInfo;
    if (Array.isArray(rawJobs)) return rawJobs as unknown[];
    return typeof rawJobs === 'object' && rawJobs !== null ? [rawJobs] : [];
  });

  return {
    dhsOpenEmpInfoList: {
      ...firstRoot,
      startPage: 1,
      display: jobs.length,
      dhsOpenEmpInfo: jobs,
    },
  };
}

function isFresh(postings: NormalizedJobPosting[], now: Date) {
  const latestCollection = Math.max(...postings.map((posting) => Date.parse(posting.collectedAt)));
  return postings.length > 0 && now.getTime() - latestCollection < refreshInterval;
}

async function refreshAlioIfNeeded(postings: NormalizedJobPosting[], now: Date) {
  const serviceKey = process.env.ALIO_API_KEY;
  if (!serviceKey || isFresh(postings, now)) return;

  const payload = await fetchAlioJobs(serviceKey, now);
  runJobPipeline({
    source: 'alio',
    payload,
    collectedAt: now.toISOString(),
    databasePath,
  });
}

async function refreshJoobleIfNeeded(request: TrySearchRequest, now: Date) {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return;

  const searchKey = `${request.query}|${request.region ?? 'all'}`;
  const lastRefresh = joobleRefreshes.get(searchKey) ?? 0;
  if (now.getTime() - lastRefresh < refreshInterval) return;

  const payload = await fetchJoobleJobs(apiKey, {
    keywords: request.query,
    location: request.region && request.region !== 'all' ? regionTerms[request.region] : '',
  });
  const collectedAt = now.toISOString();
  const rawDirectory = resolve(dataRoot, 'raw/jooble');
  mkdirSync(rawDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, `${collectedAt.replace(/[:.]/g, '-')}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
  runJobPipeline({ source: 'jooble', payload, collectedAt, databasePath });
  joobleRefreshes.set(searchKey, now.getTime());
}

async function refreshWork24IfNeeded(now: Date): Promise<RefreshReport> {
  const apiKey = process.env.WORK24_RECRUIT_API_KEY;
  if (!apiKey) {
    return {
      source: 'work24',
      status: 'skipped',
      reason: 'WORK24_RECRUIT_API_KEY 환경변수가 설정되지 않았습니다.',
    };
  }

  if (now.getTime() - lastWork24Refresh < refreshInterval) {
    return { source: 'work24', status: 'skipped', reason: '최근 갱신 데이터가 있습니다.' };
  }

  const firstPayload = await fetchWork24Jobs(apiKey, { page: 1, display: 100 });
  const firstRoot = getWork24Root(firstPayload);
  const total = Number(firstRoot?.total ?? countWork24Items(firstPayload));
  const pageCount = Math.min(Math.max(Math.ceil(total / 100), 1), 5);
  const remainingPages = await Promise.allSettled(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchWork24Jobs(apiKey, { page: index + 2, display: 100 }),
    ),
  );
  const failedPageCount = remainingPages.filter((result) => result.status === 'rejected').length;
  if (failedPageCount) {
    console.warn(`[try-search] 고용24 추가 페이지 ${failedPageCount}개 수집 실패`);
  }
  const payload = mergeWork24Payloads([
    firstPayload,
    ...remainingPages.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    ),
  ]);
  const collectedAt = now.toISOString();
  const rawDirectory = resolve(dataRoot, 'raw/work24');
  mkdirSync(rawDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, `${collectedAt.replace(/[:.]/g, '-')}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
  runJobPipeline({ source: 'work24', payload, collectedAt, databasePath });
  lastWork24Refresh = now.getTime();
  const received = countWork24Items(payload);
  return { source: 'work24', status: 'refreshed', received };
}

async function enrichMatchedPostings(
  postings: NormalizedJobPosting[],
  request: TrySearchRequest,
  now: Date,
) {
  const serviceKey = process.env.ALIO_API_KEY;
  if (!serviceKey) return postings;

  const initialMatches = analyzeCompanies(postings, request, now)
    .filter(hasDirectMatch)
    .slice(0, 20);
  const evidenceUrls = new Set(initialMatches.flatMap((match) => match.evidenceUrls));
  const targets = postings.filter(
    (posting) =>
      posting.source === 'alio' &&
      evidenceUrls.has(posting.sourceUrl) &&
      !posting.roleDetails?.length,
  );
  if (!targets.length) return postings;

  const enriched = await Promise.all(
    targets.map(async (posting) => {
      try {
        return await fetchAlioJobDetail(serviceKey, posting);
      } catch {
        return posting;
      }
    }),
  );
  const enrichedById = new Map(enriched.map((posting) => [posting.externalId, posting]));
  const store = new JobStore(databasePath);
  try {
    store.import(enriched);
  } finally {
    store.close();
  }
  return postings.map((posting) =>
    posting.source === 'alio' ? (enrichedById.get(posting.externalId) ?? posting) : posting,
  );
}

export async function searchTryCompanies(
  rawRequest: unknown,
  now = new Date(),
): Promise<TrySearchResponse> {
  const request = validateRequest(rawRequest);
  let postings = readPostings();
  const alioPostings = postings.filter((posting) => posting.source === 'alio');
  await refreshAlioIfNeeded(alioPostings, now);
  const refreshResults = await Promise.allSettled([
    refreshJoobleIfNeeded(request, now),
    refreshWork24IfNeeded(now),
  ]);
  refreshResults.forEach((result) => {
    if (
      result.status === 'fulfilled' &&
      typeof result.value === 'object' &&
      result.value?.source === 'work24'
    ) {
      const report = result.value;
      if (report.status === 'refreshed') {
        console.info(`[try-search] 고용24 갱신 완료: ${report.received ?? 0}건 수신`);
      } else if (process.env.VERCEL) {
        console.warn(`[try-search] 고용24 갱신 스킵: ${report.reason ?? '사유 없음'}`);
      }
    }
    if (result.status === 'rejected') {
      console.warn(
        `[try-search] 외부 채용 API 갱신 실패: ${
          result.reason instanceof Error ? result.reason.message : String(result.reason)
        }`,
      );
    }
  });
  const rejectedRefresh = refreshResults.find(
    (result): result is PromiseRejectedResult => result.status === 'rejected',
  );
  const externalError: unknown = rejectedRefresh?.reason;
  postings = readPostings();

  if (!postings.length) {
    if (externalError instanceof Error) throw externalError;
    throw new Error('수집된 채용공고가 없습니다. API 키와 수집 상태를 확인해주세요.');
  }

  let filteredPostings = filterByRegion(postings, request.region);
  filteredPostings = await enrichMatchedPostings(filteredPostings, request, now);
  const matches = analyzeCompanies(filteredPostings, request, now)
    .filter(hasDirectMatch)
    .slice(0, 20);

  return {
    collectedAt: Math.max(...postings.map((posting) => Date.parse(posting.collectedAt)))
      ? new Date(
          Math.max(...postings.map((posting) => Date.parse(posting.collectedAt))),
        ).toISOString()
      : now.toISOString(),
    matches,
    postingCount: filteredPostings.length,
    sourceCounts: countSources(filteredPostings),
  };
}

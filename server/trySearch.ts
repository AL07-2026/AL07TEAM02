import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { analyzeCompanies } from '../src/jobs/analysis.ts';
import type {
  AnalysisRole,
  NormalizedJobPosting,
  TrySearchRequest,
  TrySearchResponse,
} from '../src/jobs/types.ts';
import { fetchAlioJobs } from './alioClient.ts';
import { fetchAlioJobDetail } from './alioDetail.ts';
import { JobStore } from './jobStore.ts';
import { runJobPipeline } from './jobPipeline.ts';
import { fetchJoobleJobs } from './joobleClient.ts';

const databasePath = resolve('data/job-signals.db');
const refreshInterval = 6 * 60 * 60 * 1000;
const roles: AnalysisRole[] = ['sales', 'recruiter', 'investor'];
const regionTerms = { seoul: '서울', gyeonggi: '경기', busan: '부산' } as const;
const joobleRefreshes = new Map<string, number>();

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
  const rawDirectory = resolve('data/raw/jooble');
  mkdirSync(rawDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, `${collectedAt.replace(/[:.]/g, '-')}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
  runJobPipeline({ source: 'jooble', payload, collectedAt, databasePath });
  joobleRefreshes.set(searchKey, now.getTime());
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
    .slice(0, 3);
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
  let joobleError: unknown;
  try {
    await refreshJoobleIfNeeded(request, now);
  } catch (error) {
    joobleError = error;
  }
  postings = readPostings();

  if (!postings.length) {
    if (joobleError instanceof Error) throw joobleError;
    throw new Error('수집된 채용공고가 없습니다. API 키와 수집 상태를 확인해주세요.');
  }

  let filteredPostings = filterByRegion(postings, request.region);
  filteredPostings = await enrichMatchedPostings(filteredPostings, request, now);
  const matches = analyzeCompanies(filteredPostings, request, now)
    .filter(hasDirectMatch)
    .slice(0, 3);

  return {
    collectedAt: Math.max(...postings.map((posting) => Date.parse(posting.collectedAt)))
      ? new Date(
          Math.max(...postings.map((posting) => Date.parse(posting.collectedAt))),
        ).toISOString()
      : now.toISOString(),
    matches,
    postingCount: filteredPostings.length,
  };
}

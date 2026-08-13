import { existsSync } from 'node:fs';
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

const databasePath = resolve('data/job-signals.db');
const refreshInterval = 6 * 60 * 60 * 1000;
const roles: AnalysisRole[] = ['sales', 'recruiter', 'investor'];
const regionTerms = { seoul: '서울', gyeonggi: '경기', busan: '부산' } as const;

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

function readAlioPostings() {
  if (!existsSync(databasePath)) return [];
  const store = new JobStore(databasePath);
  try {
    return store.readPostings('alio');
  } finally {
    store.close();
  }
}

function isFresh(postings: NormalizedJobPosting[], now: Date) {
  const latestCollection = Math.max(...postings.map((posting) => Date.parse(posting.collectedAt)));
  return postings.length > 0 && now.getTime() - latestCollection < refreshInterval;
}

async function refreshIfNeeded(postings: NormalizedJobPosting[], now: Date) {
  const serviceKey = process.env.ALIO_API_KEY;
  if (!serviceKey || isFresh(postings, now)) return postings;

  const payload = await fetchAlioJobs(serviceKey, now);
  runJobPipeline({
    source: 'alio',
    payload,
    collectedAt: now.toISOString(),
    databasePath,
  });
  return readAlioPostings();
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
  return postings.map((posting) => enrichedById.get(posting.externalId) ?? posting);
}

export async function searchTryCompanies(
  rawRequest: unknown,
  now = new Date(),
): Promise<TrySearchResponse> {
  const request = validateRequest(rawRequest);
  let postings = readAlioPostings();
  postings = await refreshIfNeeded(postings, now);

  if (!postings.length) {
    throw new Error('수집된 채용공고가 없습니다. 먼저 ALIO 데이터를 수집해주세요.');
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

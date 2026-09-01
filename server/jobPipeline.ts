import {
  adaptAlioResponse,
  adaptJoobleResponse,
  adaptNormalizedRecords,
  adaptSaraminResponse,
  adaptWork24Response,
} from '../src/jobs/adapters.js';
import { analyzeCompanies } from '../src/jobs/analysis.js';
import type {
  JobSource,
  NormalizedJobInput,
  NormalizedJobPosting,
  RoleAnalysisRequest,
} from '../src/jobs/types.js';
import { JobStore, type ImportSummary } from './jobStore.js';

type PipelineInput = {
  source: JobSource;
  payload: unknown;
  collectedAt: string;
  databasePath: string;
  request?: RoleAnalysisRequest;
};

export type PipelineResult = {
  source: JobSource;
  collectedAt: string;
  importSummary: ImportSummary;
  storedPostingCount: number;
  request: RoleAnalysisRequest | null;
  analysis: ReturnType<typeof analyzeCompanies>;
};

function getArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value as unknown[];
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.items)) return record.items as unknown[];
    if (Array.isArray(record.data)) return record.data as unknown[];
  }
  throw new Error('배열 형태의 API 응답을 찾을 수 없습니다.');
}

export function adaptJobPayload(
  source: JobSource,
  payload: unknown,
  collectedAt: string,
): NormalizedJobPosting[] {
  if (source === 'saramin') return adaptSaraminResponse(payload, collectedAt);
  if (source === 'alio') return adaptAlioResponse(payload, collectedAt);
  if (source === 'jooble') return adaptJoobleResponse(payload, collectedAt);
  if (source === 'work24') return adaptWork24Response(payload, collectedAt);
  return adaptNormalizedRecords(getArray(payload) as NormalizedJobInput[]);
}

export function runJobPipeline(input: PipelineInput): PipelineResult {
  const postings = adaptJobPayload(input.source, input.payload, input.collectedAt);
  const store = new JobStore(input.databasePath);

  try {
    const importSummary = store.import(postings);
    const storedPostings = store.readPostings();

    return {
      source: input.source,
      collectedAt: input.collectedAt,
      importSummary,
      storedPostingCount: storedPostings.length,
      request: input.request ?? null,
      analysis: input.request
        ? analyzeCompanies(storedPostings, input.request, new Date(input.collectedAt))
        : [],
    };
  } finally {
    store.close();
  }
}

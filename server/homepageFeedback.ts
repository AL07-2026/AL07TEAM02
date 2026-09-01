import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  HomepageFeedback,
  HomepageFeedbackDraft,
} from '../src/features/feedback/types.js';

type SupabaseHomepageFeedbackRow = {
  id: string;
  rating: number;
  message: string;
  email: string | null;
  page_path: string;
  submitted_at: string;
};

type HomepageFeedbackInsertRow = Omit<SupabaseHomepageFeedbackRow, 'id' | 'submitted_at'>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fallbackFeedbackPath = path.resolve(process.cwd(), 'data', 'homepage-feedback.jsonl');
const isVercelProduction = process.env.VERCEL === '1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readRating(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
}

function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) return null;

  return {
    restUrl: `${url.replace(/\/$/, '')}/rest/v1/homepage_feedback`,
    key,
  };
}

export function parseHomepageFeedbackDraft(payload: unknown): HomepageFeedbackDraft {
  if (!isRecord(payload)) throw new Error('피드백 요청 형식이 올바르지 않습니다.');

  const rating = readRating(payload.rating);
  const message = readString(payload.message);
  const email = readString(payload.email);
  const pagePath = readString(payload.pagePath) || '/';

  if (rating < 1 || rating > 5) throw new Error('만족도를 선택해주세요.');
  if (!message) throw new Error('홈페이지를 사용하며 느낀 점을 남겨주세요.');
  if (message.length > 1000) throw new Error('피드백은 1000자 이내로 작성해주세요.');
  if (email && !emailPattern.test(email)) throw new Error('올바른 이메일 주소를 입력해주세요.');
  if (pagePath.length > 200) throw new Error('페이지 경로가 너무 깁니다.');

  return {
    rating,
    message,
    pagePath,
    ...(email ? { email } : {}),
  };
}

function toInsertRow(feedback: HomepageFeedbackDraft): HomepageFeedbackInsertRow {
  return {
    rating: feedback.rating,
    message: feedback.message,
    email: feedback.email ?? null,
    page_path: feedback.pagePath,
  };
}

function toHomepageFeedback(row: SupabaseHomepageFeedbackRow): HomepageFeedback {
  return {
    id: row.id,
    rating: row.rating,
    message: row.message,
    ...(row.email ? { email: row.email } : {}),
    pagePath: row.page_path,
    submittedAt: row.submitted_at,
  };
}

async function readSupabaseJson<T>(response: Response): Promise<T> {
  const body = await response.text();

  if (!response.ok) {
    let message = 'Supabase 요청에 실패했습니다.';
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      if (body) message = body;
    }
    throw new Error(message);
  }

  return (body ? JSON.parse(body) : null) as T;
}

async function createLocalFeedback(draft: HomepageFeedbackDraft): Promise<HomepageFeedback> {
  if (isVercelProduction) {
    throw new Error('Vercel 환경에 Supabase 서버 환경변수가 필요합니다.');
  }

  const feedback: HomepageFeedback = {
    ...draft,
    id: `local-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(fallbackFeedbackPath), { recursive: true });
  await fs.appendFile(fallbackFeedbackPath, `${JSON.stringify(feedback)}\n`, 'utf8');

  return feedback;
}

async function listLocalFeedback(): Promise<HomepageFeedback[]> {
  if (isVercelProduction) {
    throw new Error('Vercel 환경에 Supabase 서버 환경변수가 필요합니다.');
  }

  let body: string;
  try {
    body = await fs.readFile(fallbackFeedbackPath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }

  return body
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as HomepageFeedback)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export async function createHomepageFeedback(
  draft: HomepageFeedbackDraft,
): Promise<HomepageFeedback> {
  const supabase = getSupabaseConfig();
  if (!supabase) return createLocalFeedback(draft);

  try {
    const response = await fetch(`${supabase.restUrl}?select=*`, {
      method: 'POST',
      headers: {
        apikey: supabase.key,
        authorization: `Bearer ${supabase.key}`,
        'content-type': 'application/json',
        prefer: 'return=representation',
      },
      body: JSON.stringify(toInsertRow(draft)),
    });

    const rows = await readSupabaseJson<SupabaseHomepageFeedbackRow[]>(response);
    const row = rows[0];
    if (!row) throw new Error('저장된 피드백을 확인할 수 없습니다.');

    return toHomepageFeedback(row);
  } catch (error) {
    console.warn('[Sales Signal] Supabase 피드백 저장 실패, 로컬 파일에 저장합니다.', error);
    return createLocalFeedback(draft);
  }
}

export async function listHomepageFeedback(): Promise<HomepageFeedback[]> {
  const supabase = getSupabaseConfig();
  if (!supabase) return listLocalFeedback();

  try {
    const response = await fetch(`${supabase.restUrl}?select=*&order=submitted_at.desc`, {
      method: 'GET',
      headers: {
        apikey: supabase.key,
        authorization: `Bearer ${supabase.key}`,
      },
    });

    const rows = await readSupabaseJson<SupabaseHomepageFeedbackRow[]>(response);
    return rows.map(toHomepageFeedback);
  } catch (error) {
    console.warn('[Sales Signal] Supabase 피드백 조회 실패, 로컬 파일에서 조회합니다.', error);
    return listLocalFeedback();
  }
}

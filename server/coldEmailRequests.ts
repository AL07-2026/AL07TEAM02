import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  ApplicantRole,
  ColdEmailRequest,
  ColdEmailRequestDraft,
  TargetCompany,
} from '../src/features/apply/types.js';

type SupabaseColdEmailRequestRow = {
  id: string;
  applicant_role: ApplicantRole;
  applicant_email: string;
  applicant_company: string;
  product_name: string;
  product_description: string;
  additional_request: string | null;
  target_company: TargetCompany;
  privacy_agreed: boolean;
  submitted_at: string;
};

type ColdEmailRequestInsertRow = Omit<SupabaseColdEmailRequestRow, 'id' | 'submitted_at'>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fallbackRequestsPath = path.resolve(process.cwd(), 'data', 'cold-email-requests.jsonl');

function getSupabaseConfig() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) return null;

  return {
    restUrl: `${url.replace(/\/$/, '')}/rest/v1/cold_email_requests`,
    key,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function readApplicantRole(value: unknown): ApplicantRole {
  return value === 'recruiter' || value === 'investor' ? value : 'sales';
}

function parseTargetCompany(value: unknown): TargetCompany | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  if (!name) return null;

  return {
    ...(readString(value.id) ? { id: readString(value.id) } : {}),
    name,
    ...(readString(value.industry) ? { industry: readString(value.industry) } : {}),
    ...(readString(value.hiringChange) ? { hiringChange: readString(value.hiringChange) } : {}),
    ...(readString(value.expansionSignal)
      ? { expansionSignal: readString(value.expansionSignal) }
      : {}),
    ...(readString(value.recommendationReason)
      ? { recommendationReason: readString(value.recommendationReason) }
      : {}),
  };
}

export function parseColdEmailRequestDraft(payload: unknown): ColdEmailRequestDraft {
  if (!isRecord(payload)) throw new Error('신청 요청 형식이 올바르지 않습니다.');

  const applicantRole = readApplicantRole(payload.applicantRole);
  const applicantEmail = readString(payload.applicantEmail);
  const applicantCompany = readString(payload.applicantCompany);
  const productName = readString(payload.productName);
  const productDescription = readString(payload.productDescription);
  const additionalRequest = readString(payload.additionalRequest);
  const targetCompany = parseTargetCompany(payload.targetCompany);

  if (!applicantEmail) throw new Error('이메일을 입력해주세요.');
  if (!emailPattern.test(applicantEmail)) throw new Error('올바른 이메일 주소를 입력해주세요.');
  if (!applicantCompany) throw new Error('회사명을 입력해주세요.');
  if (!productName) throw new Error('제품 또는 서비스명을 입력해주세요.');
  if (!productDescription) throw new Error('제품 설명을 입력해주세요.');
  if (productDescription.length < 30) throw new Error('제품 설명을 30자 이상 작성해주세요.');
  if (productDescription.length > 500) throw new Error('제품 설명은 500자 이내로 작성해주세요.');
  if (!targetCompany) throw new Error('타깃 기업 정보가 필요합니다.');
  if (payload.privacyAgreed !== true) throw new Error('정보 처리에 동의해주세요.');

  return {
    applicantRole,
    applicantEmail,
    applicantCompany,
    productName,
    productDescription,
    ...(additionalRequest ? { additionalRequest } : {}),
    targetCompany,
    privacyAgreed: true,
  };
}

function toInsertRow(request: ColdEmailRequestDraft): ColdEmailRequestInsertRow {
  return {
    applicant_role: request.applicantRole,
    applicant_email: request.applicantEmail,
    applicant_company: request.applicantCompany,
    product_name: request.productName,
    product_description: request.productDescription,
    additional_request: request.additionalRequest ?? null,
    target_company: request.targetCompany,
    privacy_agreed: request.privacyAgreed,
  };
}

function toColdEmailRequest(row: SupabaseColdEmailRequestRow): ColdEmailRequest {
  return {
    id: row.id,
    applicantRole: readApplicantRole(row.applicant_role),
    applicantEmail: row.applicant_email,
    applicantCompany: row.applicant_company,
    productName: row.product_name,
    productDescription: row.product_description,
    ...(row.additional_request ? { additionalRequest: row.additional_request } : {}),
    targetCompany: row.target_company,
    privacyAgreed: true,
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

async function createLocalColdEmailRequest(
  draft: ColdEmailRequestDraft,
): Promise<ColdEmailRequest> {
  const request: ColdEmailRequest = {
    ...draft,
    id: `local-${Date.now()}`,
    submittedAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(fallbackRequestsPath), { recursive: true });
  await fs.appendFile(fallbackRequestsPath, `${JSON.stringify(request)}\n`, 'utf8');

  return request;
}

async function listLocalColdEmailRequests(): Promise<ColdEmailRequest[]> {
  let body: string;
  try {
    body = await fs.readFile(fallbackRequestsPath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return [];
    throw error;
  }

  return body
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ColdEmailRequest)
    .sort((left, right) => right.submittedAt.localeCompare(left.submittedAt));
}

export async function createColdEmailRequest(
  draft: ColdEmailRequestDraft,
): Promise<ColdEmailRequest> {
  const supabase = getSupabaseConfig();
  if (!supabase) return createLocalColdEmailRequest(draft);

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

    const rows = await readSupabaseJson<SupabaseColdEmailRequestRow[]>(response);
    const row = rows[0];
    if (!row) throw new Error('저장된 신청 정보를 확인할 수 없습니다.');

    return toColdEmailRequest(row);
  } catch (error) {
    console.warn('[Sales Signal] Supabase 콜드메일 신청 저장 실패, 로컬 파일에 저장합니다.', error);
    return createLocalColdEmailRequest(draft);
  }
}

export async function listColdEmailRequests(): Promise<ColdEmailRequest[]> {
  const supabase = getSupabaseConfig();
  if (!supabase) return listLocalColdEmailRequests();

  try {
    const response = await fetch(`${supabase.restUrl}?select=*&order=submitted_at.desc`, {
      method: 'GET',
      headers: {
        apikey: supabase.key,
        authorization: `Bearer ${supabase.key}`,
      },
    });

    const rows = await readSupabaseJson<SupabaseColdEmailRequestRow[]>(response);
    return rows.map(toColdEmailRequest);
  } catch (error) {
    console.warn('[Sales Signal] Supabase 콜드메일 신청 조회 실패, 로컬 파일에서 조회합니다.', error);
    return listLocalColdEmailRequests();
  }
}

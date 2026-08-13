import type { JobRoleDetail, NormalizedJobPosting } from '../src/jobs/types.ts';
import { extractHwpText } from './hwpText.ts';

type AlioStep = { sortNo?: number; recrutPbancTtl?: string };
type AlioFile = { atchFileNm?: string; url?: string; sortNo?: number };
type AlioDetail = {
  aplyQlfcCn?: string;
  files?: AlioFile[];
  steps?: AlioStep[];
};

function uniqueRoleNames(steps: AlioStep[] = []) {
  return [
    ...new Set(
      [...steps]
        .sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0))
        .map((step) => step.recrutPbancTtl?.trim())
        .filter((name): name is string => Boolean(name)),
    ),
  ];
}

function linesBetween(text: string, start: string, end: string) {
  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  const startIndex = lines.findIndex((line) => line.includes(start));
  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && line.includes(end),
  );
  return lines.slice(Math.max(0, startIndex + 1), endIndex < 0 ? undefined : endIndex);
}

function roleLengthAt(lines: string[], index: number, roleName: string) {
  if (lines[index] === roleName) return 1;
  if (`${lines[index] ?? ''}${lines[index + 1] ?? ''}` === roleName) return 2;
  return 0;
}

function roleSlice(lines: string[], roleNames: string[], roleName: string) {
  const startIndex = lines.findIndex((_, index) => roleLengthAt(lines, index, roleName) > 0);
  if (startIndex < 0) return [];
  const contentStart = startIndex + roleLengthAt(lines, startIndex, roleName);
  const nextIndex = lines.findIndex(
    (_, index) =>
      index >= contentStart &&
      roleNames.some((name) => name !== roleName && roleLengthAt(lines, index, name) > 0),
  );
  return lines.slice(contentStart, nextIndex < 0 ? undefined : nextIndex);
}

function cleanDuty(value: string) {
  return value.replace(/^[ㅇ○•·]\s*/, '').trim();
}

function qualificationFromApi(value: string, roleName: string) {
  const escaped = roleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return (
    value.match(new RegExp(`(?:^|\\n)\\s*\\d+\\)\\s*${escaped}\\s*:\\s*([^\\n]+)`))?.[1]?.trim() ??
    ''
  );
}

function hiringReason(contractEvidence: string, department: string, duties: string[]) {
  const work = duties.length ? duties.join('·') : `${department || '해당 부서'} 업무`;
  if (contractEvidence.includes('원직자 복직')) {
    return `기존 담당자의 부재 기간 동안 ${department || work}의 업무 공백을 메우기 위한 대체 채용으로 판단됩니다.`;
  }
  if (contractEvidence.includes('정규인력 충원')) {
    return `정규인력이 충원되기 전까지 ${department || work}의 업무 공백을 보완하기 위한 한시 채용으로 판단됩니다.`;
  }
  if (contractEvidence.includes('1년')) {
    return `${work}를 담당할 기간제 인력이 필요한 채용으로 판단됩니다.`;
  }
  return `${work}를 수행할 인력을 확보하기 위한 채용입니다.`;
}

export function parseAlioRoleDetails(detail: AlioDetail, documentText = ''): JobRoleDetail[] {
  const roleNames = uniqueRoleNames(detail.steps);
  const roleTable = linesBetween(documentText, '모집 분야 및 지원자격', '근무조건 및 처우');
  const contractTable = linesBetween(documentText, '계약기간 및 근무형태', '복리후생');

  return roleNames.map((name) => {
    const roleLines = roleSlice(roleTable, roleNames, name);
    const contractLines = roleSlice(contractTable, roleNames, name);
    const headcount = Number(roleLines.find((line) => /^\d+명$/.test(line))?.replace('명', '')) || null;
    const dutyLines = roleLines.filter((line) => /^[ㅇ○•·]/.test(line)).map(cleanDuty);
    const departmentDuty = dutyLines.find((line) => /(?:부|과|팀|센터)\s*근무/.test(line)) ?? '';
    const department = departmentDuty.replace(/\s*근무.*$/, '');
    const duties = dutyLines.filter((line) => line !== departmentDuty);
    const qualification =
      roleLines.find((line) => /^\((?:필수|우대)\)/.test(line)) ??
      qualificationFromApi(detail.aplyQlfcCn ?? '', name);
    const contractEvidence =
      contractLines.find((line) => /정규인력 충원|원직자 복직/.test(line)) ??
      contractLines.find((line) => /임용일로부터/.test(line)) ??
      '';

    return {
      name,
      headcount,
      department,
      duties,
      qualification,
      contractEvidence,
      hiringReason: hiringReason(contractEvidence, department, duties),
    };
  });
}

async function fetchDocument(url: string) {
  const response = await fetch(url, {
    headers: {
      accept: 'application/octet-stream',
      referer: 'https://opendata.alio.go.kr/new/odaApiUserInqDataMng/openApiRecrutDetail.do',
      swaggerType: 'Y',
    },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`ALIO 첨부파일 HTTP 오류: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

export async function fetchAlioJobDetail(serviceKey: string, posting: NormalizedJobPosting) {
  const endpoint = new URL('https://opendata.alio.go.kr/new/v1/recruit/detail.do');
  endpoint.search = new URLSearchParams({
    serviceKey,
    resultType: 'json',
    sn: posting.externalId,
  }).toString();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { accept: 'application/json', swaggerType: 'Y' },
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`ALIO 상세 API HTTP 오류: ${response.status}`);
  const payload = (await response.json()) as { resultCode?: number; result?: AlioDetail };
  if (payload.resultCode !== 200 || !payload.result) return posting;

  const hwp = [...(payload.result.files ?? [])]
    .sort((left, right) => (left.sortNo ?? 0) - (right.sortNo ?? 0))
    .find((file) => file.atchFileNm?.toLocaleLowerCase('ko-KR').endsWith('.hwp') && file.url);
  let documentText = '';
  if (hwp?.url) {
    try {
      documentText = extractHwpText(await fetchDocument(hwp.url));
    } catch {
      // 상세 API의 직무명과 자격요건만으로도 기본 분석은 계속한다.
    }
  }

  return {
    ...posting,
    description: [posting.description, payload.result.aplyQlfcCn, documentText]
      .filter(Boolean)
      .join('\n'),
    roleDetails: parseAlioRoleDetails(payload.result, documentText),
  };
}

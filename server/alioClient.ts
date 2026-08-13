const dayInMilliseconds = 24 * 60 * 60 * 1000;

function dateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function fetchAlioJobs(serviceKey: string, now = new Date()) {
  const start = new Date(now.getTime() - 60 * dayInMilliseconds);
  const endpoint = new URL('https://opendata.alio.go.kr/new/v1/recruit/list.do');
  endpoint.search = new URLSearchParams({
    serviceKey,
    resultType: 'json',
    pageNo: '1',
    numOfRows: '100',
    ongoingYn: 'Y',
    pbancBgngYmd: dateString(start),
    pbancEndYmd: dateString(now),
  }).toString();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { accept: 'application/json', swaggerType: 'Y' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('ALIO API 연결에 실패했습니다.');
  }
  if (!response.ok) throw new Error(`ALIO API HTTP 오류: ${response.status}`);
  return (await response.json()) as unknown;
}

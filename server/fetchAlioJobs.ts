import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchAlioJobs } from './alioClient.ts';
import { runJobPipeline } from './jobPipeline.ts';

async function main() {
  const serviceKey = process.env.ALIO_API_KEY;
  if (!serviceKey) throw new Error('ALIO_API_KEY 환경변수가 필요합니다.');

  const collectedAt = new Date().toISOString();
  const payload = await fetchAlioJobs(serviceKey, new Date(collectedAt));
  const rawDirectory = resolve('data/raw/alio');
  mkdirSync(rawDirectory, { recursive: true });
  writeFileSync(
    resolve(rawDirectory, `${collectedAt.replace(/[:.]/g, '-')}.json`),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );

  const result = runJobPipeline({
    source: 'alio',
    payload,
    collectedAt,
    databasePath: resolve('data/job-signals.db'),
    request: {
      role: 'sales',
      query: process.env.JOB_ANALYSIS_QUERY ?? 'ATS 채용관리',
      secondaryQuery: process.env.JOB_ANALYSIS_SECONDARY,
    },
  });
  writeFileSync(resolve('data/latest-analysis.json'), `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ importSummary: result.importSummary, analysisCount: result.analysis.length }, null, 2)}\n`,
  );
}

await main();

import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

import { runJobPipeline } from './jobPipeline.ts';
import type { AnalysisRole, JobSource } from '../src/jobs/types.ts';

function readArguments(values: string[]) {
  const argumentsMap = new Map<string, string>();
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    const next = values[index + 1];
    if (key?.startsWith('--') && next && !next.startsWith('--')) {
      argumentsMap.set(key.slice(2), next);
      index += 1;
    }
  }
  return argumentsMap;
}

function requiredArgument(argumentsMap: Map<string, string>, key: string) {
  const value = argumentsMap.get(key);
  if (!value) throw new Error(`--${key} 옵션이 필요합니다.`);
  return value;
}

function archiveRawPayload(source: JobSource, inputFile: string, collectedAt: string) {
  const directory = resolve('data', 'raw', source);
  mkdirSync(directory, { recursive: true });
  const safeTimestamp = collectedAt.replace(/[:.]/g, '-');
  copyFileSync(inputFile, resolve(directory, `${safeTimestamp}-${basename(inputFile)}`));
}

function writeAnalysis(outputFile: string, value: unknown) {
  mkdirSync(dirname(outputFile), { recursive: true });
  writeFileSync(outputFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function main() {
  const argumentsMap = readArguments(process.argv.slice(2));
  const source = requiredArgument(argumentsMap, 'source') as JobSource;
  const inputFile = resolve(requiredArgument(argumentsMap, 'file'));
  const databasePath = resolve(argumentsMap.get('db') ?? 'data/job-signals.db');
  const role = (argumentsMap.get('role') ?? 'sales') as AnalysisRole;
  const query = argumentsMap.get('query') ?? '';
  const secondaryQuery = argumentsMap.get('secondary');
  const collectedAt = new Date(argumentsMap.get('collected-at') ?? Date.now()).toISOString();
  const outputFile = resolve(argumentsMap.get('output') ?? 'data/latest-analysis.json');

  if (!['alio', 'jooble', 'saramin', 'normalized'].includes(source)) {
    throw new Error('--source는 alio, jooble, saramin, normalized 중 하나여야 합니다.');
  }
  if (!['sales', 'recruiter', 'investor'].includes(role)) {
    throw new Error('--role은 sales, recruiter, investor 중 하나여야 합니다.');
  }

  const payload = JSON.parse(readFileSync(inputFile, 'utf8')) as unknown;
  archiveRawPayload(source, inputFile, collectedAt);
  const result = runJobPipeline({
    source,
    payload,
    collectedAt,
    databasePath,
    request: query ? { role, query, secondaryQuery } : undefined,
  });

  writeAnalysis(outputFile, result);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();

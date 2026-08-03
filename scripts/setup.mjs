import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function stop(stage, message) {
  console.error(`\n[실패] ${stage}: ${message}`);
  process.exit(1);
}

function run(stage, args) {
  console.log(`\n[진행] ${stage}`);
  const npmExecutable = process.env.npm_execpath;
  const result = npmExecutable
    ? spawnSync(process.execPath, [npmExecutable, ...args], {
        cwd: root,
        stdio: 'inherit',
        shell: false,
        windowsHide: true,
      })
    : spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
        cwd: root,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        windowsHide: true,
      });

  if (result.error) {
    stop(stage, result.error.message);
  }

  if (result.status !== 0) {
    stop(stage, `종료 코드 ${String(result.status ?? 1)}`);
  }
}

const [major, minor, patch] = process.versions.node.split('.').map(Number);
const supportsNode22 = major === 22 && (minor > 22 || (minor === 22 && patch >= 2));
const supportsNode24 = major === 24 && minor >= 15;

console.log('[1/3] 환경 확인');

if (!supportsNode22 && !supportsNode24) {
  stop(
    '환경 확인',
    `현재 Node ${process.version}은 지원하지 않습니다. Node 22.22.2 이상 또는 Node 24.15.0 이상이 필요합니다. Node 24 LTS 설치 후 터미널을 다시 열어주세요.`,
  );
}

if (!existsSync(path.join(root, 'package-lock.json'))) {
  stop('환경 확인', 'package-lock.json을 찾을 수 없습니다.');
}

if (/OneDrive|Dropbox|Google Drive/i.test(root)) {
  console.warn('[주의] 동기화 폴더에서는 설치가 느리거나 파일 잠금이 발생할 수 있습니다.');
}

console.log('[통과] Node 버전과 lock 파일');

console.log('\n[2/3] 의존성 설치');
const binExtension = process.platform === 'win32' ? '.cmd' : '';
const requiredBins = ['tsc', 'eslint', 'vitest', 'vite'];
const dependenciesReady = requiredBins.every((name) =>
  existsSync(path.join(root, 'node_modules', '.bin', `${name}${binExtension}`)),
);

if (dependenciesReady) {
  console.log('[통과] 의존성이 이미 설치되어 있습니다.');
} else {
  run('의존성 설치', ['install']);
}

console.log('\n[3/3] 프로젝트 검증');
run('타입·린트·테스트·빌드', ['run', 'validate']);

console.log('\n[완료] npm run dev로 개발 서버를 실행하세요.');

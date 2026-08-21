# 명령어

이 문서의 npm 명령은 현재 `package.json`의 `scripts`를 그대로 정리한 것이다. Node 지원 범위는 `>=22.22.2 <23 || >=24.15.0 <25`이고 `.nvmrc`는 `24.18.0`이다.

## 설치와 실행

| 명령              | 실제 script              | 용도와 영향                                                                                      |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------ |
| `npm run setup`   | `node scripts/setup.mjs` | Node와 lock 파일을 확인하고, 필요한 실행 파일이 없으면 `npm install`한 뒤 `validate`를 실행한다. |
| `npm run dev`     | `vite`                   | Vite 개발 서버와 개발 전용 `/api/try/search` 미들웨어를 실행한다.                                |
| `npm run preview` | `vite preview`           | 빌드 결과를 로컬에서 미리 본다. 먼저 빌드 결과가 필요하다.                                       |

## 검증

| 명령                   | 실제 script                                                          | 용도                                                  |
| ---------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- |
| `npm run typecheck`    | `tsc --noEmit --pretty false`                                        | TypeScript 오류를 검사한다.                           |
| `npm run lint`         | `eslint . --max-warnings=0`                                          | 경고를 허용하지 않고 전체 린트를 검사한다.            |
| `npm run format:check` | `prettier --check .`                                                 | 포맷 차이를 검사한다. `validate`에는 포함되지 않는다. |
| `npm run test`         | `vitest run`                                                         | 전체 테스트를 한 번 실행한다.                         |
| `npm run test:watch`   | `vitest`                                                             | 테스트 감시 모드를 실행한다.                          |
| `npm run build`        | `tsc --noEmit && vite build`                                         | 타입 검사 후 `dist`를 빌드한다.                       |
| `npm run validate`     | `npm run typecheck && npm run lint && npm run test && npm run build` | CI와 동일한 전체 검증 순서를 실행한다.                |

## 변경을 만드는 명령

다음 명령은 검사만 하지 않고 파일을 수정할 수 있으므로 의도한 경우에만 실행한다.

| 명령               | 실제 script          | 영향                                   |
| ------------------ | -------------------- | -------------------------------------- |
| `npm run lint:fix` | `eslint . --fix`     | ESLint가 고칠 수 있는 파일을 수정한다. |
| `npm run format`   | `prettier --write .` | 대상 파일의 포맷을 다시 쓴다.          |

## 채용공고 데이터 명령

| 명령                                                         | 실제 script                                                  | 용도와 출력                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `npm run jobs:demo`                                          | 샘플 `server/samples/jobs.json`을 normalized 소스로 가져오기 | 기본 DB, 원본 보관 경로, `data/latest-analysis.json`을 갱신할 수 있다. |
| `npm run jobs:alio`                                          | `node server/fetchAlioJobs.ts`                               | `ALIO_API_KEY`로 ALIO를 수집하고 DB·원본·분석 결과를 갱신한다.         |
| `npm run jobs:import -- --source <source> --file <path> ...` | `node server/importJobs.ts`에 인자 전달                      | JSON 파일을 가져와 DB에 저장하고 선택적으로 역할별 분석을 출력한다.    |

`jobs:import`에서 코드가 허용하는 source는 `alio`, `jooble`, `saramin`, `normalized`이고 role은 `sales`, `recruiter`, `investor`다. `--source`와 `--file`은 필수다. 선택 인자는 `--db`, `--role`, `--query`, `--secondary`, `--collected-at`, `--output`이다.

## 코드에서 확인한 환경변수 이름

- `ALIO_API_KEY`: ALIO 수집 및 상세 조회
- `JOOBLE_API_KEY`: 체험 검색의 Jooble 갱신
- `JOB_ANALYSIS_QUERY`: `jobs:alio` 기본 분석 질의 덮어쓰기
- `JOB_ANALYSIS_SECONDARY`: `jobs:alio` 보조 질의
- `VITE_APP_NAME`, `VITE_API_BASE_URL`: `.env.example`에 있으나 현재 소스에서 사용하는 위치는 검색되지 않았다.

환경변수 값은 저장소 문서나 커밋에 기록하지 않는다.

## 확인 필요

- 실제 인터뷰 답변에 팀 표준 설치·실행 명령이 없어서 `package.json`과 `README.md` 외의 운영 명령은 확정할 수 없다.
- `.env.example`과 실제 서버 코드가 요구하는 환경변수 목록이 다르다. 어떤 파일을 공식 환경 설정 기준으로 삼을지 확인해야 한다.

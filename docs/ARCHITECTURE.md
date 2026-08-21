# 아키텍처

## 실행 구조

```text
브라우저 React SPA
  -> React Router 화면 전환
  -> POST /api/try/search
  -> Vite 개발 서버 미들웨어
  -> server/trySearch.ts
  -> 로컬 SQLite 조회 / 필요 시 ALIO·Jooble 갱신
  -> src/jobs/analysis.ts 기업별 분석
  -> 추천 목록 -> 상세 분석 -> 콜드메일 신청
```

`/api/try/search`는 별도 운영 서버가 아니라 `vite.config.ts`의 `configureServer`로 등록된 개발 서버 미들웨어다.

## 프런트엔드

- 진입점: `src/main.tsx`
- 라우터와 랜딩: `src/app/App.tsx`
- 체험·추천 목록: `src/pages/TryPage.tsx`
- 기업 상세 분석: `src/pages/ResultDetailPage.tsx`
- 콜드메일 신청: `src/features/apply/`
- 공통 UI: `src/components/ui/`
- 전역 스타일: `src/styles/globals.css`
- 분석용 샘플 데이터: `src/data/trialCompanies.ts`

### 라우트

| 경로                                     | 화면           | 현재 동작                                                                                           |
| ---------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------- |
| `/`, 기타 미일치 경로                    | 랜딩           | `*` 라우트가 랜딩을 표시한다.                                                                       |
| `/try`, `/experience`                    | 체험 입력      | 역할, 검색 목적, 지역을 입력한다.                                                                   |
| `/try/results`, `/experience/results`    | 추천 결과      | 컴포넌트 메모리의 제출 상태가 없으면 `/experience`로 이동한다.                                      |
| `/results`, `/experience/results/detail` | 상세 분석      | 라우트 상태가 없으면 fallback 분석을 사용한다.                                                      |
| `/result/:companyId`                     | 기업 상세 분석 | 추천 카드가 `analysis`를 라우트 상태로 전달한다.                                                    |
| `/apply`                                 | 콜드메일 신청  | 상세 화면이 `targetCompany`를 라우트 상태로 전달한다. 개발 환경에서는 없을 때 Mock 기업을 사용한다. |

라우트 상태는 브라우저 저장소나 서버에 영속화되지 않는다. 체험 결과는 새로고침 또는 직접 접근 시 입력 화면으로 돌아갈 수 있고, 상세 분석은 fallback 데이터를 표시할 수 있다.

## 검색과 분석 흐름

1. `TryPage`가 `role`, `query`, `region`을 `POST /api/try/search`로 전송한다.
2. Vite 미들웨어가 JSON 본문을 최대 65,536자까지 읽고 `searchTryCompanies`에 전달한다.
3. `server/trySearch.ts`가 역할, 검색어 길이(2~100자), 지역을 검증한다.
4. `data/job-signals.db`에서 normalized 샘플을 제외한 공고를 읽는다.
5. 설정된 키가 있고 데이터가 오래되었으면 ALIO 또는 검색 조건별 Jooble 데이터를 갱신한다. 갱신 간격은 코드상 6시간이다.
6. 지역 필터와 ALIO 상세정보 보강 후 `src/jobs/analysis.ts`가 기업별 결과를 만든다.
7. 근거 URL이 있는 결과 중 최대 20개를 응답한다.

검색 입력은 `TryPage` 상태에만 보관되며 화면 문구상 저장하지 않는다고 안내한다. 반면 외부에서 수집한 채용공고는 SQLite와 `data/raw`에 저장된다.

## 수집 파이프라인

- `server/alioClient.ts`: 최근 60일의 진행 중 ALIO 채용공고 조회
- `server/alioDetail.ts`: 선택된 ALIO 공고 상세 보강
- `server/joobleClient.ts`: 검색어와 지역으로 Jooble 조회
- `src/jobs/adapters.ts`: 소스별 응답을 공통 채용공고 형식으로 변환
- `server/jobPipeline.ts`: 변환, 저장, 선택적 분석을 조합
- `server/jobStore.ts`: Node 내장 SQLite로 최신 공고와 일별 스냅샷 저장
- `server/importJobs.ts`: 파일 기반 가져오기, 원본 보관, JSON 분석 결과 출력
- `server/fetchAlioJobs.ts`: ALIO 수집과 기본 영업 분석 실행

SQLite의 주요 테이블은 `job_postings`, `job_snapshots`다. `(source, external_id)`를 공고 식별자로 사용하고 콘텐츠 해시로 변경 여부를 판단한다.

## 콜드메일 신청 흐름

상세 분석 화면이 대상 기업 요약을 `/apply`의 라우트 상태로 넘긴다. 신청 폼은 이메일, 회사명, 제품명, 제품 설명, 선택 요청사항, 정보 처리 동의를 검증한다. `submit-cold-email-request.ts`는 개발 환경에서만 클라이언트 시각을 붙여 성공 응답을 만들며, 운영 환경에서는 `Backend endpoint 연결이 필요합니다.` 오류를 발생시킨다.

## 테스트와 빌드

- 테스트 환경: Vitest + jsdom + Testing Library
- 테스트 설정: `src/test/setup.ts`
- 경로 별칭: `@` -> `src`
- 스타일: Tailwind CSS Vite 플러그인과 전역 CSS
- 빌드: TypeScript 무출력 검사 후 Vite 번들
- 정적 배포 설정: Firebase Hosting이 `dist`를 제공하고 모든 경로를 `/index.html`로 rewrite

## 확인 필요

- 운영 검색 API의 호스팅 위치와 호출 URL
- Firebase Hosting 외의 서버 또는 함수 구성 존재 여부
- 새로고침 가능한 결과 URL이 제품 요구사항인지 여부
- 상세 화면의 fallback 수치·텍스트를 운영에서도 사용할지 여부
- 콜드메일 신청 데이터를 저장하거나 전송할 운영 시스템

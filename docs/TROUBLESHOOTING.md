# 문제 해결과 주의사항

## Node 또는 npm을 실행할 수 없음

지원 버전은 Node 22.22.2 이상 23 미만 또는 Node 24.15.0 이상 25 미만이며 `.nvmrc` 권장값은 24.18.0이다. 터미널에서 `node --version`, `npm --version`을 먼저 확인한다.

PowerShell 실행 정책 때문에 `npm.ps1`이 막히면 `npm.cmd run setup`처럼 `npm.cmd`를 사용하라는 안내가 `README.md`에 있다. `npm` 자체를 찾지 못하면 Node 설치 또는 현재 셸의 PATH를 확인해야 한다.

## 설치가 느리거나 파일이 잠김

`scripts/setup.mjs`와 `README.md`는 OneDrive, Dropbox, Google Drive 같은 동기화 폴더에서 설치 지연이나 파일 잠금이 발생할 수 있다고 경고한다. 같은 문제가 반복되면 짧은 영문 로컬 경로에서 재현 여부를 확인한다.

## `수집된 채용공고가 없습니다` 오류

`server/trySearch.ts`는 로컬 DB에 usable 공고가 없고 외부 갱신도 만들지 못하면 이 오류를 낸다.

확인 순서:

1. `data/job-signals.db`가 존재하는지 확인한다.
2. DB에 normalized 샘플이 아닌 공고가 있는지 확인한다. 체험 검색은 source가 `normalized`인 공고를 제외한다.
3. 외부 수집을 기대한다면 해당 API 키가 실행 환경에 주입됐는지 확인한다.
4. ALIO 또는 Jooble 연결 오류 메시지를 확인한다.
5. 필요하면 데이터 명령의 영향 범위를 확인한 뒤 `jobs:demo`, `jobs:alio`, `jobs:import` 중 목적에 맞는 명령을 사용한다.

`jobs:demo`의 normalized 샘플은 파이프라인 검증에는 사용할 수 있지만 현재 체험 검색에서는 제외된다.

## ALIO 또는 Jooble 연결 실패

두 클라이언트의 네트워크 timeout은 코드상 10초다. 각각 연결 실패 메시지와 HTTP 상태 오류를 구분한다. 키 값은 로그나 문서에 출력하지 않는다.

- ALIO: `ALIO_API_KEY`
- Jooble: `JOOBLE_API_KEY`

`.env.example`에는 이 키들이 적혀 있지 않으므로 공식 환경 설정 방법은 `확인 필요`다.

## 개발에서는 검색되지만 preview 또는 배포에서 검색되지 않음

`/api/try/search`는 Vite의 개발 서버 미들웨어다. `vite preview`와 Firebase 정적 Hosting 설정에는 같은 API 구현이 확인되지 않는다. 운영 검색 API가 별도로 배포되어 있는지 확인해야 한다. 확인 없이 정적 Hosting만으로 검색 API가 동작한다고 가정하지 않는다.

## 결과 페이지 새로고침 후 입력 화면으로 돌아감

체험의 제출값과 추천 결과는 React 상태에 있고 영속화되지 않는다. `/experience/results`에서 해당 상태가 없으면 `/experience`로 이동한다. 현재 코드의 동작이며, 새로고침 복원을 지원해야 하는지는 `확인 필요`다.

## 상세 분석에서 예상과 다른 예시가 보임

상세 화면은 라우트 상태의 `analysis`가 없으면 `fallbackAnalysis`를 사용한다. 직접 URL 접근 또는 새로고침 시 예시 분석이 표시될 수 있다. 전달 경로 문제인지 fallback 동작인지 먼저 구분한다.

## `/apply`에서 대상 기업이 없거나 Mock 기업이 보임

대상 기업은 상세 분석에서 라우트 상태로 전달된다.

- 개발 환경: 전달값이 없으면 `mockTargetCompany` 사용
- 운영 환경: 전달값이 없으면 선택된 기업이 없다고 표시

직접 접근과 정상 상세 화면 경유를 나누어 확인한다.

## 콜드메일 신청이 운영에서 실패함

`submit-cold-email-request.ts`는 개발 환경에서만 Mock 성공을 반환하고 운영에서는 백엔드 연결 필요 오류를 발생시킨다. 현재 운영 접수 엔드포인트는 작업 트리에서 확인되지 않는다.

## Firebase 경로에서 404가 발생함

`firebase.json`은 모든 경로를 `/index.html`로 rewrite하도록 설정되어 있다. 실제 배포에서 404가 발생하면 배포 대상이 `dist`인지, 최신 빌드가 배포됐는지, 현재 Firebase 프로젝트 설정을 사용하는지 확인한다. 검색 API 문제와 SPA rewrite 문제를 구분한다.

## 문서와 코드가 다름

실제 코드와 `package.json`을 우선 확인하고 문서를 맞춘다. 인터뷰 답변이나 운영 정보와 충돌하면 한쪽을 추측으로 선택하지 말고 `확인 필요`로 기록한다. 현재 알려진 차이는 다음과 같다.

- 패키지 메타데이터의 보일러플레이트 명칭과 실제 제품 UI 명칭
- README의 데이터 소스 설명과 코드의 Jooble 지원
- `.env.example`과 서버 코드의 환경변수 목록
- Firebase 정적 Hosting과 개발 전용 검색 API
- 인증 문서 요구와 현재 인증 미구현 상태

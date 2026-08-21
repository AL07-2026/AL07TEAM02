# Codex 작업 지도

이 저장소에서 작업하기 전에 작업 범위에 맞는 문서를 먼저 읽는다.

- 제품 목적과 현재 상태: `docs/PROJECT_CONTEXT.md`
- 코드 및 데이터 흐름: `docs/ARCHITECTURE.md`
- 실행 가능한 npm 명령: `docs/COMMANDS.md`
- 현재 인증 상태: `docs/AUTH_FLOW.md`
- 변경 검증 기준: `docs/VERIFY.md`
- 반복 오류와 주의사항: `docs/TROUBLESHOOTING.md`

문서보다 실제 코드와 `package.json`을 우선 근거로 삼는다. 서로 다른 내용은 임의로 해석하지 말고 `확인 필요`로 남긴다. 환경변수 값과 로컬 생성 데이터는 문서에 복사하지 않는다.

현재 주요 경로는 `src/app`(라우팅·랜딩), `src/pages`(체험·분석 결과), `src/features/apply`(콜드메일 신청), `src/jobs`(정규화·분석), `server`(수집·SQLite·개발 API), `src/components/ui`(공통 UI), `src/styles`(전역 스타일)이다.

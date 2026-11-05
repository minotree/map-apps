# 산책핏 현장 조사 PWA 진행 기록

## 현재 진행 상황

> 기준일: 2026-11-05
> 전체 4단계 중 2단계(기반 이전·운영 배포) 완료. 현재 단계는 배포본 실기기 검증이며, 바로 다음 작업은 조사 등록→Windows 관리자 승인→일반 사용자 공개 조회 전체 흐름 검증이다.

## Cloudflare 운영 배포 및 V-World 주소 조회 수정 (2026-11-05)

- 조사 PWA를 `https://walk-fit-survey.minotree0902.workers.dev`에 배포했다.
- V-World에 운영 도메인용 인증키를 새로 발급하고 로컬 비밀 환경파일에 반영했다.
- 개발 서버 전용 `/api-vworld` 프록시가 운영 배포에서 동작하지 않던 문제를 확인했다.
- Cloudflare 서버에서 V-World HTTPS 호출 시 520이 발생하고 브라우저 CORS도 허용되지 않아, V-World가 지원하는 HTTPS JSONP 주소 응답 방식으로 변경했다.
- JSONP 콜백은 요청별 고유 이름, 10초 제한시간, 성공·실패 후 전역 콜백과 script 제거를 적용했다.
- 배포 버전: `bd0701e9-28a6-44d0-8364-e4c1bd0399f0`
- 검증: 타입 검사·프로덕션 빌드·단위 테스트 12개 통과, V-World 새 키의 JSONP 응답 확인, 배포 URL HTTP 200 확인.
- 미검증: iPhone Safari에서 서비스 워커 갱신 후 실제 주소가 화면에 표시되는지 사용자 재확인 필요.

## 모노레포 1차 이전 (2026-11-04)

- 요청/목표: 기존 현장 조사 PWA를 기능 변경 없이 독립 leaf 앱으로 이전
- 원본: `D:\DEV\field-survey-pwa`
- 대상: `apps/fit/fit-survey/fit-survey-pwa`, `@map-apps/fit-survey-pwa`
- 변경: 소스·단위/Cypress 테스트·PWA 자산·Ionic/Capacitor 설정 이전, 개발 포트를 5175로 분리
- 환경 예제: 원본에 있던 실제 프로젝트 URL·publishable key 형태 값을 제거하고 플레이스홀더로 교체
- 제외: `.env`, `node_modules`, `dist`, `package-lock.json`, `cloudflared.exe`, Aider 파일, Ollama 스크립트, 임시 경로, Vercel 설정
- SQL: 원본의 schema·RLS·Storage SQL과 migration 문서는 leaf에 복사하지 않고 루트 Supabase 대조 단계로 보류
- 데이터 전환: 현재 Supabase Storage 사진 업로드를 Cloudflare R2·Worker로 바꾸는 작업은 미착수
- 배포: 2026-11-05 Cloudflare Workers Static Assets로 production 배포 완료
- 보완: ESLint 설정이 참조하지만 누락된 `@eslint/js`를 명시하고 `_` 인자 무시 규칙을 추가
- 보완: 2.8MB 번들이 Workbox 기본 2MiB 상한을 넘어 3MiB precache 상한을 명시해 PWA 빌드 복구
- 자동 검증: 타입 검사, 12개 단위 테스트, lint, Vite/PWA 빌드 통과
- 빌드 경고: Ionic CSS `:host-context` 경고와 약 2.8MB(gzip 약 614KB) 메인 청크 경고
- Cypress: 16.2.1 바이너리는 설치했으나 Windows에서 `--smoke-test`, `--ping` 옵션 오류로 시작 실패

## 단계별 상태

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 모노레포 파일 이전 | 완료 | 개인 환경값·생성물·로컬 실행파일 제외 |
| 타입·단위·lint·빌드 | 완료 | 타입 검사, 12 tests, lint, Vite/PWA build 통과 |
| Cypress E2E | 차단 | Cypress 16.2.1 실행파일이 Windows smoke test 옵션을 거부해 시작 실패 |
| Supabase 계약 대조 | 완료 | 단일 관리자 전용으로 확정하고 production의 일반 조사자 정책 2개 제거 완료 |
| 실제 조사 등록 | 미검증 | Supabase 환경·조사자 계정 필요 |
| 관리자 승인 연동 | 미검증 | 신규 조사→승인→공개 지점 전체 흐름 필요 |
| 위치·카메라·PWA | 미검증 | 실제 브라우저·기기 검증 필요 |
| Cloudflare 배포 | 완료 | production 배포·HTTP 200·이미지 Worker CORS 확인 완료 |
| V-World 주소 조회 | 진행 중 | 운영 도메인 키·JSONP 응답 확인 완료, iPhone Safari 화면 재확인 필요 |
| Cloudflare R2 사진 | 진행 중 | 조사자 소유 업로드·비공개 조회 코드 전환 완료, 실계정·Worker 미검증 |

## 다음에 재개할 작업

1. iPhone Safari에서 PWA를 다시 열어 V-World 주소 표시를 확인한다.
2. 단일 관리자 계정으로 조사 등록 후 Windows 관리자 승인과 일반 사용자 공개 조회를 검증한다.
3. 실제 기기에서 위치·카메라·R2 사진 업로드를 검증한다.
4. Cypress Windows 시작 오류를 해결하거나 대체 브라우저 검증 절차를 확정한다.


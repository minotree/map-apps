# 산책핏 현장 조사 PWA 진행 기록

## 현재 진행 상황

> 기준일: 2026-11-04
> 모노레포 기본 이관과 자동 검사, 코드 기반 Supabase 계약 목록화는 완료했다. 다음 작업은 운영 DB 읽기 전용 감사 후 조사 등록·관리자 승인 전체 흐름 검증이다.

## 모노레포 1차 이전 (2026-11-04)

- 요청/목표: 기존 현장 조사 PWA를 기능 변경 없이 독립 leaf 앱으로 이전
- 원본: `D:\DEV\field-survey-pwa`
- 대상: `apps/fit/fit-survey/fit-survey-pwa`, `@map-apps/fit-survey-pwa`
- 변경: 소스·단위/Cypress 테스트·PWA 자산·Ionic/Capacitor 설정 이전, 개발 포트를 5175로 분리
- 환경 예제: 원본에 있던 실제 프로젝트 URL·publishable key 형태 값을 제거하고 플레이스홀더로 교체
- 제외: `.env`, `node_modules`, `dist`, `package-lock.json`, `cloudflared.exe`, Aider 파일, Ollama 스크립트, 임시 경로, Vercel 설정
- SQL: 원본의 schema·RLS·Storage SQL과 migration 문서는 leaf에 복사하지 않고 루트 Supabase 대조 단계로 보류
- 데이터 전환: 현재 Supabase Storage 사진 업로드를 Cloudflare R2·Worker로 바꾸는 작업은 미착수
- 배포: Cloudflare Pages 설정과 계정 연결은 미착수
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
| Supabase 계약 대조 | 차단 | 운영 정책상 모든 인증 사용자가 모든 조사 행을 조회·변경 가능. 조사자 소유권 정책과 관리자 역할 교정 필요 |
| 실제 조사 등록 | 미검증 | Supabase 환경·조사자 계정 필요 |
| 관리자 승인 연동 | 미검증 | 신규 조사→승인→공개 지점 전체 흐름 필요 |
| 위치·카메라·PWA | 미검증 | 실제 브라우저·기기 검증 필요 |
| Cloudflare Pages | 미착수 | 배포 승인·계정 설정 필요 |
| Cloudflare R2 사진 | 미착수 | Worker 권한 API와 DB 경로 전환 필요 |

## 다음에 재개할 작업

1. 관리자 식별·조사자 역할 결정 후 소유 행 기준 RLS 교정 migration을 설계한다.
2. Cypress Windows 시작 오류를 해결하거나 대체 브라우저 검증 절차를 확정한다.
3. 실제 조사자 계정으로 위치·카메라·사진 업로드와 관리자 승인 연동을 검증한다.
4. R2·Worker 전환 후 PWA 설치와 Cloudflare Pages 배포 설정을 검토한다.


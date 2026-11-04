# 산책핏 사용자 PWA 진행 기록

## 현재 진행 상황

> 기준일: 2026-11-04
> 모노레포 기본 이관과 자동 검사는 완료했다. 다음 작업은 공통 Supabase 기준 확정 후 실데이터·PWA 동작을 검증하는 것이다.

## 모노레포 1차 이전 (2026-11-04)

- 요청/목표: 사용자 서비스 정본의 PWA를 기능 변경 없이 `map-apps` leaf 앱으로 이전
- 원본: `D:\DEV\t-walk-fit-map\apps\web`
- 대상: `apps/fit/fit-app/fit-app-pwa`, `@map-apps/fit-app-pwa`
- 변경: 소스·테스트·PWA 자산·Vite 설정을 이전하고 공통 package scope를 `@map-apps/*`로 변경
- 제외: 원본 `.env.local`, `dist`, `test-results`, `node_modules`, `vercel.json`과 원본 lockfile
- 보존: React 19·Ionic·OpenLayers/V-World·Supabase 의존성 버전과 사용자 흐름 유지
- 배포: Cloudflare Pages 설정과 계정 연결은 미착수
- 데이터 전환: Supabase Storage 사진 조회를 Cloudflare R2·Worker로 바꾸는 작업은 미착수
- 자동 검증: 타입 검사, 38개 단위 테스트, lint, 프로덕션/PWA 빌드 통과
- E2E: 7개 화면 흐름은 모두 통과 표시됐지만 Windows에서 Playwright 프로세스가 종료되지 않아 수동 중단
- 경고: 빌드에서 Ionic CSS `:host-context` 해석 경고와 약 1.86MB 메인 청크 크기 경고 확인
- 사용자 확인: 실데이터·PWA 설치·서비스 워커 검증 대기

## 단계별 상태

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 모노레포 파일 이전 | 완료 | 개인 환경 파일과 생성물 제외 |
| 자동 타입·단위·lint·빌드 | 완료 | 타입 검사, 38 tests, lint, Vite/PWA build 통과. 빌드 경고는 후속 검토 |
| E2E | 진행 중 | 7 tests 통과 표시 후 runner 종료 정체로 수동 중단. teardown 원인 확인 필요 |
| 실데이터 조회 | 대기 | 로컬 환경변수 필요 |
| PWA 설치·업데이트 | 대기 | 실제 브라우저 검증 필요 |
| Cloudflare Pages | 미착수 | 배포 승인·계정 설정 필요 |
| Cloudflare R2 사진 | 미착수 | Worker 권한 API와 DB 경로 전환 필요 |

## 다음에 재개할 작업

1. 공통 Supabase SQL·RLS·RPC 기준에 맞춰 데이터 접근을 대조한다.
2. 허용된 개발 환경값으로 실데이터 조회를 검증한다.
3. 브라우저 PWA 설치·업데이트·서비스 워커와 E2E 종료 정체를 확인한다.
4. R2·Worker 전환 후 Cloudflare Pages 배포 설정을 검토한다.


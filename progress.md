# map-apps 전체 진행표

> leaf 앱이 생성되면 구현 이력·자동 검사·실기기·배포 상태는 각 앱의 `progress.md`에서 관리한다.

## 현재 진행 상황

> 기준일: 2026-11-05
> Supabase는 DB/Auth/RLS/RPC만, 이미지는 Cloudflare R2/Worker만 사용한다. 2026-11-05 production에 기존 업무 데이터 초기화, 권한 교정, 첫 관리자 bootstrap을 적용하고 무변경 검증 migration이 통과했다.

| 단계 | 작업 | 상태 | 현재 결과 / 재개 기준 |
| --- | --- | --- | --- |
| 1 | 공통 패키지와 네 leaf 앱 이관 | 완료 | 공통 계약·데이터, 사용자 PWA·토스, 조사 PWA, 관리자 desktop 이관 |
| 2 | 앱별 자동 검사 | 완료 | 앱별 타입·단위·lint·build와 관리자 Rust 검사 완료 |
| 3 | Supabase 기준 정리 | 완료 | 단일 관리자 기준 production migration·bootstrap 적용. 잘못 추가된 일반 조사자 정책 2개를 2026-11-05 SQL Editor에서 제거 완료 |
| 4 | Cloudflare R2·Worker 전환 | **진행 중** | 비공개 `walk-fit-images` 버킷과 Worker 배포, 네 앱 로컬 주소 연결, `/health` 통과. 실제 이미지 흐름 검증 대기 |
| 5 | 플랫폼 실환경·배포 검증 | 진행 중 | 조사 PWA production 배포와 HTTP 200·이미지 Worker CORS 확인. 실제 로그인·등록 흐름 대기 |

### 다음에 재개할 작업

1. 단일 관리자 계정으로 조사 PWA 등록 → Windows 관리자 검수·승인 → 일반 사용자 앱 공개 조회를 검증한다.
2. 관리자 계정으로 Worker 업로드·조회·교체·삭제를 실환경 검증한다.
3. 기존 Supabase Storage 삭제는 별도 승인 전까지 하지 않는다.

## 사용자 공통 패키지 1차 이전 (2026-11-04)

- 요청/목표: 사용자 PWA·토스 앱이 공유하는 계약과 데이터 접근 패키지를 정본 workspace에서 먼저 이전
- 변경: `packages/contracts`, `packages/data`를 생성하고 package scope와 내부 import를 `@map-apps/*`로 변경
- 보존: 기능 코드와 의존성 버전은 유지하고 원본 `D:\DEV\t-walk-fit-map`은 수정하지 않음
- 제외: 원본 lockfile·환경 파일·앱 코드는 이번 단계에 포함하지 않음
- 검증: `pnpm.cmd install`, `pnpm.cmd typecheck`, `pnpm.cmd build`, `pnpm.cmd list -r --depth -1` 통과
- 검사 범위: 두 패키지에는 단위 테스트 스크립트가 없어 타입 검사와 무출력 빌드만 실행
- 당시 다음 작업: `apps/fit/fit-app/fit-app-pwa`를 leaf 문서와 함께 1차 이전

## 사용자 PWA 1차 이전 (2026-11-04)

- 요청/목표: 정본 workspace의 사용자 PWA를 독립 leaf 앱으로 이전
- 변경: `apps/fit/fit-app/fit-app-pwa`와 leaf `AGENTS.md`·`progress.md` 생성, package scope 변경, 루트 실행 스크립트 추가
- 제외: 개인 환경 파일, 원본 생성물·lockfile, `vercel.json`; Cloudflare Pages 설정은 아직 만들지 않음
- 검증: 타입 검사, 38개 단위 테스트, lint, Vite/PWA 프로덕션 빌드 통과
- 경고: Ionic CSS `:host-context` 경고와 약 1.86MB 메인 청크 경고가 있으나 빌드는 성공
- E2E: 7개 흐름이 모두 통과 표시된 뒤 Windows에서 runner 종료가 정체되어 수동 중단. 테스트 성공과 정상 종료 검증을 구분해 기록
- 미검증: 실제 Supabase·V-World 연결, 브라우저 PWA 설치·업데이트, 서비스 워커, Cloudflare Pages 배포
- 당시 다음 작업: 사용자 토스 앱 1차 이전 또는 E2E teardown 정체 원인 보완

## 사용자 토스 앱 1차 이전 (2026-11-04)

- 요청/목표: 정본 workspace의 토스 미니앱을 독립 leaf 앱으로 이전
- 변경: `apps/fit/fit-app/fit-app-toss`와 leaf 문서 생성, package scope 변경, 루트 실행·검증 명령 추가
- 보존: SDK 3.8.1, TDS 2.5.1, React 18.3.1, `appName` `walk-fit-map`, 위치·광고·지도 흐름 유지
- 공식 확인: Apps in Toss 공식 개발자센터의 정책·테스트·버전 관리 문서를 2026-11-04 확인. 업로드 전 최신 규칙 재확인 필요
- 검증: 타입 검사, 21개 단위 테스트, lint, Vite build, `.ait` 생성 통과
- E2E: 13개 흐름이 모두 통과 표시된 뒤 Windows에서 runner 종료가 정체되어 수동 중단
- 경고: 약 1.85MB JS 청크와 pnpm의 `protobufjs` 설치 스크립트 차단. 현재 자동 검사와 번들은 성공
- 미검증: 실제 Supabase·V-World, 토스 Devtools·실기기 위치/광고/Safe Area/뒤로가기/저장소
- 적용: `.ait`만 로컬 생성. 콘솔 테스트 업로드·공개 검토·출시는 실행하지 않음
- 당시 다음 작업: 현장 조사 PWA 1차 이전

## 현장 조사 PWA 1차 이전 (2026-11-04)

- 요청/목표: 기존 현장 조사 PWA를 독립 leaf 앱으로 이전하고 개발 포트를 5175로 분리
- 변경: `apps/fit/fit-survey/fit-survey-pwa`와 leaf 문서 생성, 루트 실행 명령 추가
- 보안: 원본 `.env.example`의 실제 Supabase 프로젝트 식별값·publishable key 형태 값을 제거하고 플레이스홀더로 교체
- 제외: 개인 환경 파일, npm lockfile, 26.8MB `cloudflared.exe`, Aider·Ollama·임시 파일, Vercel 설정
- SQL: 원본 schema·RLS·Storage SQL은 실제 운영 DB 대조 전 leaf에 포함하거나 실행하지 않음
- 보완: 누락된 `@eslint/js` 선언과 ESLint `_` 인자 규칙 추가, Workbox precache 상한을 3MiB로 제한 조정
- 검증: 타입 검사, 12개 단위 테스트, lint, Vite/PWA 빌드 통과
- 경고: Ionic CSS 경고와 약 2.8MB 메인 청크 경고가 남음
- E2E: Cypress 16.2.1 바이너리는 설치했으나 Windows에서 smoke test 옵션 오류로 시작 실패
- 미검증: 실제 조사 등록·사진 업로드·위치·카메라·PWA 설치·관리자 승인 연동
- 당시 다음 작업: 관리자 연동을 포함한 백엔드 기준 SQL 정리와 실환경 검증 순서 확정

## 관리자 Windows desktop 1차 이전 (2026-11-04)

- 변경: `apps/fit/fit-admin/fit-admin-desktop` leaf와 앱별 문서·루트 실행 명령 생성, 개발 포트 5176으로 분리
- 보존: React·Tauri 2.12.1·Python 이미지 서비스·기존 테스트와 감사 SQL; 원본 `D:\DEV\walk_fit_admin`은 수정하지 않음
- 제외: 실제 환경값, 의존성·빌드·Rust/Python 생성물, 모델·캐시와 기존 설치 파일
- 무결성: 의도적 설정 변경 외 원본과 SHA-256 대조 완료; 복사 과정에서 잘린 66개 파일을 원본으로 복구
- 검증: 타입 검사, 43 tests, lint, Vite build, `cargo check --locked` 통과
- 경고: React effect lint 경고 9건과 658.86 kB 메인 JS chunk 경고
- 미검증: Python 새 가상환경, Tauri dev, Windows 번들·설치·서명, 관리자 로그인·실DB·조사 승인 전체 흐름
- 미수행: SQL·DB 변경, 코드 서명, 설치·배포

## 상태 기준

| 상태 | 의미 |
| --- | --- |
| 완료 | 현재 승인 범위의 구현·설정과 필요한 자동 검사가 끝남 |
| 진행 중 | 구현 또는 검증이 진행 중이며 다음 작업이 정해짐 |
| 미착수 | 범위는 정했지만 구현을 시작하지 않음 |
| 보류 | 선행 결정·승인·외부 조건이 필요함 |

## 공통 일정

| 일정 | 상태 | 현재 결과 | 다음 기준 또는 작업 |
| --- | --- | --- | --- |
| ☑ workspace 기초 | 완료 | `@map-apps/contracts`, `@map-apps/data` 인식과 pnpm 설치·타입 검사·빌드 확인 | 첫 leaf 앱 생성 시 중첩 경로 인식 검증 |
| ☑ 구조·문서 기준 | 완료 | 도메인→제품→플랫폼 구조, 앱별 문서 소유권, PowerShell 실행 위치 표기 기준 수립 | 실제 제품 결정에 맞춰 보완 |
| ☑ Windows 준비 확인 | 완료 | Rust/Cargo 1.99.1 설치 확인 | 첫 desktop 앱에서 Tauri·WebView2·번들 도구 공식 호환성 확인 |
| ☑ Git 저장소 초기화 | 완료 | `https://github.com/minotree/map-apps.git`의 `main`에 초기 커밋 `3de27ca` push 완료 | 이후 커밋·푸시는 변경별 사용자 승인 후 진행 |
| ☑ 첫 제품 범위 | 완료 | 산책핏의 네 leaf 앱과 두 공통 패키지 확정. 사용자 서비스 정본·복구 원본, 원본별 포함·제외 파일, 미커밋 변경, 환경 경계와 이전 순서를 `docs/migration-plan.md`에 기록 | 사용자 공통 패키지부터 코드 변경 없는 1차 이전 시작 |
| ☐ 지도 제공자와 권리 검토 | 미착수 | 지도·타일·지오코딩·경로 탐색 제공자 미정 | 라이선스·표시·캐시·키·비용·개인정보 조건 비교 |
| ☐ 배포·출시 환경 | 미착수 | Git 원격은 연결됐고 호스팅·스토어·서명은 미설정 | 실제 플랫폼과 담당자 확정 후 승인받아 진행 |

## 제품군 후보

| 제품군 | 상태 | 현재 결과 | 다음 기준 또는 작업 |
| --- | --- | --- | --- |
| fit-survey | 진행 중 | 조사 PWA 1차 이전, 타입·12 tests·lint·PWA build 완료 | Cypress 실행 오류 해결과 실제 조사→관리자 승인 연동 검증 |
| fit-admin | 진행 중 | 관리자 desktop 1차 이전, 타입·43 tests·lint·웹 build·Rust check 완료 | Python 환경과 Tauri dev·Windows 설치, 실DB 승인 흐름 검증 |
| fit-app | 진행 중 | 공통 패키지·사용자 PWA·토스 앱 1차 이전과 자동 검사 완료 | PWA·토스 E2E 종료 정체, 실제 브라우저·토스 기기와 배포 후속 검증 |

## 운영 원칙

- 제품 상태나 공통 구조가 바뀔 때만 이 파일을 갱신한다.
- 기능 구현과 플랫폼별 검증 결과는 leaf 앱의 `progress.md`에 기록한다.
- 커밋·푸시·배포·지도 계정·API 키·DB·코드 서명은 사용자 명시 승인 후 진행한다.

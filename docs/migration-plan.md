# 산책핏 모노레포 이전 계획

이 문서는 기존 산책핏 저장소를 `D:\DEV\map-apps`로 이전하는 순서와 현재 완료 지점을 관리한다.
원본 보존, 포함·제외 파일과 단계별 검증 근거도 함께 기록한다.

## 현재 진행 상황

> 기준일: 2026-11-05
> 전체 8단계 중 **1~6단계 완료**, **7단계 코드 전환 완료·실환경 검증 대기**다.

| 단계 | 작업 | 상태 | 현재 결과 / 재개 기준 |
| --- | --- | --- | --- |
| 1 | 사용자 공통 계약·데이터 패키지 | 완료 | `@map-apps/contracts`, `@map-apps/data` 이관 및 workspace 검사 완료 |
| 2 | 사용자 PWA | 완료 | `fit-app-pwa` 이관, 타입·38 tests·lint·PWA build 완료 |
| 3 | 사용자 토스 앱 | 완료 | `fit-app-toss` 이관, 타입·21 tests·lint·build·AIT 생성 완료 |
| 4 | 현장 조사 PWA | 완료 | `fit-survey-pwa` 이관, 타입·12 tests·lint·PWA build 완료 |
| 5 | 관리자 Windows desktop·Python 소스 | 완료 | `fit-admin-desktop` 이관, 타입·43 tests·lint·웹 build·`cargo check --locked` 완료 |
| 6 | Supabase 기준 SQL·RLS·RPC 정리 | 완료 | production 권한 migration·데이터 초기화·첫 관리자 bootstrap·무변경 검증 완료 |
| 7 | Cloudflare R2·Worker 이미지 계층 전환 | 진행 중 | 앱 코드와 Worker API 전환 완료, 버킷·Worker 배포 및 실계정 검증 대기 |
| 8 | PWA Cloudflare Pages 배포 설정 | 대기 | 환경 분리·도메인·Worker API가 정해진 뒤 진행 |

### 다음에 재개할 위치

1. 단일 관리자 계정으로 조사 PWA 등록·Windows 승인·일반 사용자 공개 조회를 검증한다.
2. Cloudflare R2 버킷과 Worker 환경변수를 준비하고 별도 승인 후 배포한다.
3. 관리자 이미지 업로드·조회·교체·삭제와 사용자 공개 조회를 검증한다.
4. 플랫폼별 PWA·토스·Tauri 실환경 검증으로 이동한다.

기본 프로그램 이관은 끝났지만 플랫폼 실환경 검증은 별도 후속 작업으로 남아 있다. 사용자 PWA 설치·서비스
워커, 토스 Devtools·실기기, 조사 카메라·위치, 관리자 Python 환경·Tauri dev·Windows installer와
전체 `조사 등록 → 관리자 승인 → 사용자 공개` 흐름은 완료로 간주하지 않는다.

## 공통 원칙

- 원본 네 저장소의 파일·Git 이력·환경 파일을 수정하거나 삭제하지 않는다.
- `D:\DEV\t-walk-fit-map`을 사용자 서비스 정본으로 사용하고 `D:\DEV\walk-fit-map`은 읽기 전용 복구 원본으로 유지한다.
- 기능 코드는 우선 현재 동작을 보존해 이전하고, Cloudflare R2·Worker·Pages 전환은 이전 후 별도 변경으로 진행한다.
- `.git`, `node_modules`, 빌드 결과, 캐시, 가상환경, 개인 환경 파일과 배포 산출물은 복사하지 않는다.
- npm `package-lock.json`은 가져오지 않는다. 원본 `package.json`의 버전을 유지한 채 루트 pnpm lockfile로 재해석한다.
- `.env.example`은 변수 이름과 설명만 검토해 가져오고 실제 `.env`·`.env.local` 값은 읽거나 복사하지 않는다.
- 각 leaf 앱을 만들 때 같은 변경에서 해당 앱의 `AGENTS.md`와 `progress.md`를 만든다.
- 한 앱을 이전하고 해당 앱 검증을 마친 뒤 다음 앱으로 진행한다. 여러 앱의 실패 원인을 한 번에 섞지 않는다.

## 전체 진행 순서

1. 사용자 공통 계약·데이터 패키지
2. 사용자 PWA
3. 사용자 토스 앱
4. 현장 조사 PWA
5. 관리자 Windows desktop과 Python 이미지 서비스
6. Supabase 기준 SQL 정리
7. Cloudflare R2·Worker 이미지 계층 전환
8. 사용자 PWA·조사 PWA의 Cloudflare Pages 배포 설정

1~5단계는 순서대로 완료했다. 사용자 workspace가 이미 pnpm 구조와 공통 패키지를 사용하므로 이를 먼저
옮겼고, Tauri·Rust·Python·로컬 프로세스 경계가 함께 있는 관리자 앱을 마지막 프로그램으로 이전했다.
이제 6단계부터는 코드 복사보다 운영 데이터·권한·배포 경계를 확정하는 작업이다.

## 사용자 서비스

원본은 `D:\DEV\t-walk-fit-map`이다.

| 원본 | 대상 | 처리 |
| --- | --- | --- |
| `packages/contracts` | `packages/contracts` | package name을 `@map-apps/contracts`로 변경하고 공개 export 유지 |
| `packages/data` | `packages/data` | package name과 내부 의존성을 `@map-apps/*`로 변경 |
| `apps/web` | `apps/fit/fit-app/fit-app-pwa` | package name과 workspace 의존성만 먼저 조정 |
| `apps/toss` | `apps/fit/fit-app/fit-app-toss` | React 18·AIT·TDS 버전을 독립 유지하고 package name만 조정 |
| `docs`, `PROJECT_HANDOFF.md` | 루트·leaf 문서의 근거 자료 | 중복 복사하지 않고 현재 사실과 검증 이력만 해당 소유 문서로 이관 |
| `supabase` | 루트 `supabase` 후보 | 다른 앱 SQL과 실제 운영 DB를 대조하기 전 실행하거나 기준 migration으로 간주하지 않음 |

제외 대상은 `.git`, `.pnpm-store`, `node_modules`, `.tmp`, `dist`, `test-results`,
`playwright-report`, `.vercel`, `.apps-in-toss`, 실제 `.env.local`, `*.ait`와 기존 `pnpm-lock.yaml`이다.
루트 `pnpm-lock.yaml`은 통합 package graph로 다시 생성한다.

현재 원본의 `progress.md`에는 미커밋 변경이 있다. 이전 직전에 diff를 다시 확인하고 최신 작업 이력을
누락 없이 leaf 문서로 반영하되 원본에서 커밋하거나 되돌리지 않는다.

## 현장 조사 PWA

원본 `D:\DEV\field-survey-pwa`의 `src`, `public`, 테스트, Ionic·Capacitor·Vite·TypeScript 설정과
`.env.example`을 `apps/fit/fit-survey/fit-survey-pwa`로 가져온다. 현재 원본 Git 상태는 깨끗하다.

다음 항목은 복사하지 않는다.

- `.git`, `node_modules`, `dist`, `.aider*`, 실제 `.env`, `package-lock.json`
- 추적 중인 26.8MB `cloudflared.exe`
- 생성 결과로 보이는 `build/typecheck/test`
- 임시 경로로 보이는 `path/to/filename.js.txt`
- 로컬 Ollama 성능 확인용 `ollama-benchmark.ps1`

`schema.sql`, `rls_policy.sql`, `storage_policy.sql`, `doc/*.sql`은 앱 실행 파일과 분리해 Supabase 감사
자료로 보존하되 바로 실행하지 않는다. `vercel.json`은 Cloudflare Pages 전환 근거로만 검토하고 최종
배포 설정에는 포함하지 않는다. V-World 개발 proxy, Cypress의 5173 포트와 환경변수 이름은 새 포트에
맞게 별도 변경·검증한다.

## 관리자 Windows desktop

원본 `D:\DEV\walk_fit_admin`의 React 소스, `src-tauri`, `image-service`, 테스트 스크립트,
Supabase SQL과 문서를 `apps/fit/fit-admin/fit-admin-desktop` 경계 안에서 관리한다.

다음 항목은 복사하지 않는다.

- `.git`, `node_modules`, `dist`, `package-lock.json`, 실제 `.env.local`
- `.venv-images`, `.build-tools`, `image-service/.models`, `__pycache__`, `test-output`
- `src-tauri/target`, `src-tauri/gen`과 기존 exe·MSI·NSIS 결과물

현재 원본의 `AGENTS.md`와 `progress.md`는 미추적 상태지만 중요한 제품·DB 이력을 포함하므로 내용은
새 leaf 문서 작성 근거로 보존한다. 원본에서 자동 추가하거나 커밋하지 않는다.

이전 시 5173 포트, Python 이미지 서버 8765 포트, CORS origin, `tauri.conf.json`의 `devUrl`,
Rust의 `.venv-images` 탐색과 `WALKFIT_IMAGE_ROOT`, Edge 테스트 실행 경로를 새 위치에서 각각 검증한다.
Python 가상환경과 모델은 새 경로에서 준비하고 설치파일에 포함되는 것으로 간주하지 않는다.

## 환경변수 경계

현재 확인된 변수 이름은 다음과 같다. 값은 이전하거나 문서에 기록하지 않는다.

| 범위 | 변수 이름 |
| --- | --- |
| 조사 PWA | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_VWORLD_API_KEY`, `VITE_GEOCODING_PROVIDER`, `VITE_API_BASE_URL` |
| 관리자 | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_IMAGE_SERVICE_URL`, `VITE_OSM_TILE_URL`, `WALKFIT_IMAGE_ROOT` |
| 사용자 앱 | 각 leaf의 `.env.example`을 기준으로 재점검하고 Supabase·V-World·AIT 공개 설정만 앱별로 분리 |

클라이언트에는 Supabase publishable key와 플랫폼 제한이 적용된 공개 지도 키만 허용한다. Supabase secret,
Cloudflare API token, R2 자격 증명과 SMTP 비밀번호는 Worker·배포 환경의 secret으로만 관리한다.

## 단계별 완료 조건

각 이전 단계는 다음 조건을 모두 충족해야 완료로 기록한다.

1. 대상 package name과 공개 import가 `@map-apps/*` 경계를 따른다.
2. 개인 환경 파일과 생성물이 Git 대상에 포함되지 않는다.
3. 실제 존재하는 typecheck·test·lint·build 스크립트만 실행해 결과를 기록한다.
4. 원본과 대상의 사용자 흐름 차이를 확인하고 의도하지 않은 기능 변경이 없음을 검토한다.
5. `git diff --check`와 최종 diff를 확인한다.
6. PWA 설치, 토스 Devtools·실기기, Tauri Windows 번들 같은 플랫폼 검증은 자동 빌드와 구분한다.


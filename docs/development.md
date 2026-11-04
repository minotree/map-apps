# 개발·실행·Git 명령어

이 문서는 `map-apps`의 실제 PowerShell 실행 명령을 관리한다. 명령에는 실행 위치를 반드시 명시하고, 새 앱·서버·포트·플랫폼 번들·배포 흐름을 추가할 때 루트 스크립트와 관련 문서를 같은 변경에서 갱신한다.

## 공통

실행 위치: `D:\DEV\map-apps`

```powershell
Set-Location -LiteralPath 'D:\DEV\map-apps'

# 최초 lockfile 생성
pnpm.cmd install

# lockfile 생성 이후 재현 설치
pnpm.cmd install --frozen-lockfile

# 존재하는 leaf 패키지 스크립트만 재귀 실행
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build

# 변경 확인
git status
git diff --check
```

## 산책핏 사용자 PWA

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-app:pwa` → `http://127.0.0.1:5173` |
| 타입 검사 | `pnpm.cmd typecheck:fit-app:pwa` |
| 단위 검사 | `pnpm.cmd test:fit-app:pwa` |
| lint | `pnpm.cmd --filter @map-apps/fit-app-pwa lint` |
| 빌드 | `pnpm.cmd build:fit-app:pwa` |
| E2E | `pnpm.cmd --filter @map-apps/fit-app-pwa exec playwright test` |
| 미리보기 | `pnpm.cmd --filter @map-apps/fit-app-pwa preview` → 기본 Vite preview 주소 |
| Cloudflare Pages 배포 | 미구성. 프로젝트·도메인·환경변수 확정과 사용자 승인 후 추가 |

## 산책핏 사용자 토스 미니앱

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-app:toss` → `http://127.0.0.1:5174/home` |
| 타입 검사 | `pnpm.cmd typecheck:fit-app:toss` |
| 단위 검사 | `pnpm.cmd test:fit-app:toss` |
| lint | `pnpm.cmd --filter @map-apps/fit-app-toss lint` |
| 브라우저 E2E | `pnpm.cmd --filter @map-apps/fit-app-toss test:e2e` |
| 웹·AIT 번들 생성 | `pnpm.cmd build:fit-app:toss` |
| `.ait` 생성 위치 | `D:\DEV\map-apps\apps\fit\fit-app\fit-app-toss\walk-fit-map.ait` |
| 콘솔 토큰 등록 | `Set-Location -LiteralPath 'D:\DEV\map-apps\apps\fit\fit-app\fit-app-toss'` 후 `pnpm.cmd exec ait token add walk-fit-map`; 승인·대화형 입력 필요 |
| 테스트 업로드 | 같은 앱 폴더에서 `pnpm.cmd exec ait deploy --profile <프로필> --location ./walk-fit-map.ait -m "<변경 내용>"`; 사용자 승인 필요 |
| 공개 검토·출시 | 콘솔에서 별도 사용자 승인 후 진행 |

## 산책핏 현장 조사 PWA

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-survey:pwa` → `http://127.0.0.1:5175` |
| 타입 검사 | `pnpm.cmd typecheck:fit-survey:pwa` |
| 단위 검사 | `pnpm.cmd test:fit-survey:pwa` |
| lint | `pnpm.cmd --filter @map-apps/fit-survey-pwa lint` |
| Cypress E2E | 개발 서버 실행 후 `pnpm.cmd --filter @map-apps/fit-survey-pwa test.e2e` |
| 빌드 | `pnpm.cmd build:fit-survey:pwa` |
| 미리보기 | `pnpm.cmd --filter @map-apps/fit-survey-pwa preview` → `http://127.0.0.1:4175` |
| Cloudflare Pages 배포 | 미구성. 프로젝트·도메인·환경변수 확정과 사용자 승인 후 추가 |

## 산책핏 관리자 Windows desktop

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 프런트엔드+이미지 서버 | `pnpm.cmd dev:fit-admin:desktop` → `http://127.0.0.1:5176` |
| 프런트엔드만 | `pnpm.cmd --filter @map-apps/fit-admin-desktop exec vite` → `http://127.0.0.1:5176` |
| 타입 검사 | `pnpm.cmd typecheck:fit-admin:desktop` |
| 단위 검사 | `pnpm.cmd test:fit-admin:desktop` |
| lint | `pnpm.cmd --filter @map-apps/fit-admin-desktop lint` |
| 웹 빌드 | `pnpm.cmd build:fit-admin:desktop` |
| Rust 검사 | `pnpm.cmd --filter @map-apps/fit-admin-desktop exec cargo check --manifest-path src-tauri/Cargo.toml` |
| Tauri 개발 | `pnpm.cmd --filter @map-apps/fit-admin-desktop tauri:dev` |
| Windows 번들 | `pnpm.cmd --filter @map-apps/fit-admin-desktop tauri:build` |
| Windows 결과 | 앱 폴더의 `src-tauri\target\release`와 `src-tauri\target\release\bundle` |
| Python 환경 생성 | `Set-Location -LiteralPath 'D:\DEV\map-apps\apps\fit\fit-admin\fit-admin-desktop'` 후 `python -m venv .venv-images`, `.venv-images\Scripts\python.exe -m pip install -r image-service\requirements.txt` |
| Python 모델 준비 | 같은 앱 폴더에서 `.venv-images\Scripts\python.exe image-service\prepare_models.py` |
| Python 검사 | 같은 앱 폴더에서 `.venv-images\Scripts\python.exe -m unittest discover -s image-service -p "test_*.py" -v` |
| 코드 서명 | 미구성. 인증서·서명 방식 확정과 사용자 승인 후 실행 |
| 설치·업데이트·배포 | 번들·서명 이후 별도 검증 및 승인 단계 |

## 앱 명령 추가 형식

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:<제품>:<플랫폼>` → 실제 주소 |
| 타입 검사 | `pnpm.cmd --filter @map-apps/<제품>-<플랫폼> typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/<제품>-<플랫폼> test` |
| 빌드 | `pnpm.cmd --filter @map-apps/<제품>-<플랫폼> build` |

위 명령은 형식 예시이므로 실제 패키지와 루트 스크립트를 만든 뒤에만 사용한다.

## 플랫폼별 추가 기록

- PWA: Vite 개발·미리보기, 서비스 워커, Cloudflare 등 실제 정적 배포 명령과 포트.
- 토스: Devtools, `.ait` 생성, 앱 폴더에서의 `npx ait token add`·`npx ait deploy`, appName·승인·QR 실기기 상태.
- mobile: 웹 빌드, Capacitor sync, Android/iOS 빌드와 실기기 검증을 분리.
- desktop: 프런트엔드 dev/build, `cargo check`·`cargo test`, Tauri dev/build, Windows 번들 경로, 서명·설치·업데이트 검증을 분리.

## 새 앱 추가 시

1. 도메인·제품·플랫폼과 leaf 경로를 확정한다.
2. 실제 package name과 포트가 기존 앱과 충돌하지 않는지 확인한다.
3. leaf 앱의 `package.json`, `AGENTS.md`, `progress.md`를 함께 만든다.
4. 루트 `package.json`에 대상을 드러내는 스크립트를 추가한다.
5. 이 문서에 실행 위치·전체 명령·주소·검증 상태를 기록한다.
6. 지도 제공자·키·데이터 전송·캐시·라이선스·출처 표시를 앱 문서에 기록한다.

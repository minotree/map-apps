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

현재 leaf 앱이 없으므로 앱별 개발 서버·포트·빌드·배포 명령은 없다.

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

# map-apps

지도·공간정보 관련 제품군을 pnpm workspace로 관리한다. 제품은 도메인과 업무 단위 아래에서 PWA, 토스 미니앱, Android/iOS 하이브리드 앱, Tauri 기반 Windows 데스크톱 앱으로 독립 구현한다.

첫 통합 제품군은 산책핏으로 확정했다. 공통 패키지와 사용자 PWA·토스, 조사 PWA, 관리자 Windows desktop의 1차 이전을 완료했다. 구조와 명명 규칙은 [AGENTS.md](AGENTS.md), [docs/architecture.md](docs/architecture.md)를 따른다.

## 산책핏 통합 예정 구조

```text
apps/
  fit/
    fit-survey/
      fit-survey-pwa/
    fit-admin/
      fit-admin-desktop/
    fit-app/
      fit-app-pwa/
      fit-app-toss/
packages/
  contracts/
  data/
```

표시된 네 leaf 앱과 공통 패키지 두 개는 1차 이전을 완료했다. 플랫폼별 실환경·설치·배포 검증과 Supabase·Cloudflare 운영 구성은 별도 후속 단계로 관리한다.

## 공통 검사

실행 위치: `D:\DEV\map-apps`

```powershell
Set-Location -LiteralPath 'D:\DEV\map-apps'
pnpm.cmd install --frozen-lockfile
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd build
```

최초 lockfile 생성 전에는 `pnpm.cmd install`을 사용한다. 앱별 개발·빌드·배포 명령은 실제 패키지가 생긴 뒤 [docs/development.md](docs/development.md)에 추가한다.

## 현재 상태

- Node 24.22.0, pnpm 10.34.7을 루트 기준으로 기록했다.
- Rust/Cargo 1.99.1 설치를 확인했지만 Tauri 앱과 의존성은 아직 만들지 않았다.
- 지도 제공자, 타일·지오코딩·경로 탐색 API, 데이터 라이선스, 백엔드, 호스팅은 미결정이다.
- Git 원격은 `https://github.com/minotree/map-apps.git`, 기본·배포 기준 브랜치는 `main`이다. 초기 커밋과 push를 완료했다. 배포, 코드 서명, 스토어 등록은 설정하지 않았다.

전체 일정은 [progress.md](progress.md), 단계별 원본 이전 기준은 [docs/migration-plan.md](docs/migration-plan.md), 실행 명령은 [docs/development.md](docs/development.md)에서 관리한다.

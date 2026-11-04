# map-apps

지도·공간정보 관련 제품군을 pnpm workspace로 관리한다. 제품은 도메인과 업무 단위 아래에서 PWA, 토스 미니앱, Android/iOS 하이브리드 앱, Tauri 기반 Windows 데스크톱 앱으로 독립 구현한다.

아직 첫 제품의 요구사항과 우선 플랫폼이 확정되지 않았으므로 앱 패키지나 준비용 빈 폴더는 만들지 않았다. 구조와 명명 규칙은 [AGENTS.md](AGENTS.md), [docs/architecture.md](docs/architecture.md)를 따른다.

## 기본 구조 예시

```text
apps/
  fit/
    fit-survey/
      fit-survey-pwa/
      fit-survey-toss/
      fit-survey-mobile/
      fit-survey-desktop/
    fit-admin/
      fit-admin-pwa/
      fit-admin-desktop/
    fit-app/
      fit-app-pwa/
packages/
  contracts/
  core/
  utils/
```

위 경로는 확장 예시이며 현재 생성된 앱을 뜻하지 않는다. 실제 패키지는 구현을 시작할 때 앱별 `AGENTS.md`와 `progress.md`를 함께 생성한다.

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
- Git 원격, 배포, 코드 서명, 스토어 등록은 설정하지 않았다.

전체 일정은 [progress.md](progress.md), 실행 명령은 [docs/development.md](docs/development.md)에서 관리한다.

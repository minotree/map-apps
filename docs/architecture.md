# 구조 결정

## 2026-11-04 — 산책핏 leaf 경로와 패키지 이름

산책핏의 현재 구현 범위는 다음 네 leaf 앱과 두 공통 패키지로 이전한다. 두 공통 패키지는
2026-11-04에 이전했고, 네 leaf 경로는 아직 폴더 생성이나 구현 완료를 뜻하지 않는다.

| 역할 | leaf 경로 | workspace 패키지 이름 | 이전 원본 |
| --- | --- | --- | --- |
| 현장 조사 PWA | `apps/fit/fit-survey/fit-survey-pwa` | `@map-apps/fit-survey-pwa` | `D:\DEV\field-survey-pwa` |
| 관리자 Windows 앱 | `apps/fit/fit-admin/fit-admin-desktop` | `@map-apps/fit-admin-desktop` | `D:\DEV\walk_fit_admin` |
| 사용자 PWA | `apps/fit/fit-app/fit-app-pwa` | `@map-apps/fit-app-pwa` | `D:\DEV\t-walk-fit-map\apps\web` |
| 사용자 토스 앱 | `apps/fit/fit-app/fit-app-toss` | `@map-apps/fit-app-toss` | `D:\DEV\t-walk-fit-map\apps\toss` |
| 공통 데이터 계약 | `packages/contracts` | `@map-apps/contracts` | `D:\DEV\t-walk-fit-map\packages\contracts` |
| 사용자 공통 데이터 접근 | `packages/data` | `@map-apps/data` | `D:\DEV\t-walk-fit-map\packages\data` |

조사 앱은 Capacitor 의존성과 설정이 있어도 현재 확정된 배포 대상이 PWA이므로
`fit-survey-pwa`로 분류한다. Android/iOS 네이티브 프로젝트와 실기기 배포 범위가 확정되기 전에는
`fit-survey-mobile`을 만들지 않는다. 관리자는 Tauri 기반 Windows 앱이므로 `fit-admin-desktop`으로 분류한다.

`packages/data`는 현재 사용자 PWA와 토스 앱에서 함께 사용하는 공개 조회·매핑만 소유한다.
조사 등록과 관리자 승인·삭제·초기화 구현은 각 leaf 앱이 소유하며 공통 사용자 데이터 패키지에 넣지 않는다.

## 2026-11-04 — 산책핏 사용자 서비스 정본과 복구 원본

산책핏 제품군을 `map-apps`의 첫 통합 대상으로 정한다. 사용자 서비스의 이전 기준은
PWA·토스 미니앱·공통 계약·데이터 패키지가 함께 있는 `D:\DEV\t-walk-fit-map`으로 확정한다.
`D:\DEV\walk-fit-map`은 이전 대상과 자동 병합하지 않고 읽기 전용 복구 원본으로 보존한다.

통합 전 원본 저장소를 삭제하거나 덮어쓰지 않는다. `t-walk-fit-map`의 사용자 PWA와 토스 앱은
각각 독립 leaf 앱으로, 실제 두 앱이 함께 사용하는 순수 계약과 데이터 접근 코드만 루트
`packages/*`로 이전한다. 구체적인 파일 복사와 패키지 이름 변경은 별도 단계에서 검증하며 진행한다.

## 2026-11-04 — 도메인·제품·플랫폼 3단계 구조

지도 제품군은 단일 앱 이름 아래 플랫폼만 나뉘는 구조보다 더 깊은 업무 계층이 필요하다. 기본 leaf 앱 경로는 `apps/<도메인>/<제품>/<제품>-<플랫폼>`으로 정한다.

예를 들어 `fit` 도메인 아래 `fit-survey`, `fit-admin`, `fit-app` 제품을 두고, `fit-survey` 아래 `fit-survey-pwa`, `fit-survey-toss`, `fit-survey-mobile`, `fit-survey-desktop`을 둘 수 있다. 이 예시는 구조 계약이며 해당 앱 구현 완료를 뜻하지 않는다.

pnpm workspace는 `apps/*`, `apps/*/*`, `apps/*/*/*`을 인식한다. 제품이 얕은 구조로 충분하면 불필요한 중간 폴더를 만들지 않는다. leaf 패키지 이름은 `@map-apps/<제품>-<플랫폼>`으로 전역 고유하게 유지한다.

## 2026-11-04 — 플랫폼별 독립 소유

PWA, 토스, mobile, desktop은 각각 UI·라우팅·상태·플랫폼 SDK를 독립 소유한다. 다른 플랫폼 앱의 소스 파일을 상대 경로로 가져오지 않는다. 실제 두 앱 이상에서 공유되는 순수 계약이나 계산 규칙만 `packages/*`의 공개 export로 분리한다.

`-desktop`은 Tauri 기반 Windows 앱이다. 웹 프런트엔드와 Rust `src-tauri` 경계를 명확히 하고, capability·파일·쉘·네트워크 접근을 최소 권한으로 관리한다. Windows 번들, 코드 서명, 설치와 업데이트는 웹 빌드와 별도 검증한다.

## 2026-11-04 — 지도 제공자와 데이터 경계 선결

지도 UI 라이브러리 선택과 지도 데이터 제공자 선택은 별도 결정이다. 타일·지오코딩·경로 탐색·주소·경계·항공사진마다 라이선스, 출처 표시, 캐시·재배포, 요청 한도, 비용과 개인정보 조건을 확인한 뒤 연결한다.

사용자 위치와 조사 데이터의 수집·보존·동기화가 확정되기 전에는 백엔드나 오프라인 지도 저장소를 미리 만들지 않는다. API 키는 플랫폼 제한과 쿼터를 적용하고 관리자·서비스 역할 자격 증명은 클라이언트에 포함하지 않는다.

## 2026-11-04 — 문서 소유권

루트 문서는 전체 구조·공통 정책·교차 제품 일정을 관리한다. leaf 앱 생성 시 `AGENTS.md`는 제품·플랫폼 기준, `progress.md`는 구현·검증 이력의 단일 기준이 된다. 실제 명령과 실행 위치는 `docs/development.md`에 함께 기록한다.

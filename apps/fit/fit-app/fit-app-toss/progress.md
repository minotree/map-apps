# 산책핏 사용자 토스 미니앱 진행 기록

## 현재 진행 상황

> 기준일: 2026-11-04
> 공개 이미지 조회를 Cloudflare Worker URL로 전환하고 타입·21 tests·웹/AIT 빌드를 통과했다. 다음 작업은 실제 Worker와 Devtools·실기기 검증이다.

## 모노레포 1차 이전 (2026-11-04)

- 요청/목표: 사용자 서비스 정본의 토스 미니앱을 기능 변경 없이 독립 leaf 앱으로 이전
- 원본: `D:\DEV\t-walk-fit-map\apps\toss`
- 대상: `apps/fit/fit-app/fit-app-toss`, `@map-apps/fit-app-toss`
- 변경: 소스·테스트·Apps in Toss 설정을 이전하고 공통 package scope를 `@map-apps/*`로 변경
- 보존: SDK 3.8.1, TDS 2.5.1, React 18.3.1, `appName` `walk-fit-map`, 위치·광고 흐름 유지
- 제외: `.env.local`, `dist`, `test-results`, `.apps-in-toss`, 기존 `.ait`와 업로드 자격 증명
- 공식 확인: 2026-11-04 Apps in Toss 공식 정책·테스트·배포 단계 확인. 업로드 전 최신 버전·정책 재확인 필요
- 자동 검증: 타입 검사, 21개 단위 테스트, lint, Vite 웹 빌드와 `.ait` 생성 통과
- AIT 결과: `walk-fit-map.ait`, 로컬 생성 deploymentId `01a1a51e-0800-77e7-8d76-207fb5521b76`; 업로드 결과가 아님
- 브라우저 E2E: 13개 흐름 모두 통과 표시 후 Windows에서 runner 종료 정체로 수동 중단
- 경고: 약 1.85MB(gzip 약 573KB) JS 청크 크기 경고와 pnpm의 `protobufjs` 설치 스크립트 차단 확인. 현재 검사·번들은 통과
- 업로드·공개 검토·출시: 실행하지 않음

## 단계별 상태

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 모노레포 파일 이전 | 완료 | 개인 환경 파일과 생성물 제외 |
| 타입·단위·lint | 완료 | 타입 검사, 21 tests, lint 통과 |
| 브라우저 E2E | 진행 중 | 13 tests 통과 표시 후 runner 종료 정체로 수동 중단 |
| 웹·AIT 번들 | 완료 | `walk-fit-map.ait` 생성. 콘솔 업로드는 미실행 |
| 토스 Devtools | 대기 | 위치 모드와 화면 검증 필요 |
| 실제 토스 기기 | 미검증 | 위치·Safe Area·뒤로가기·광고·저장소 |
| 콘솔 테스트 업로드 | 미실행 | 사용자 승인 필요 |
| 공개 검토·출시 | 미실행 | 별도 사용자 승인 필요 |
| Cloudflare R2 사진 | 진행 중 | 공통 데이터 계층 공개 조회 전환 완료. 실제 Worker 배포·실기기 검증 필요 |

## 다음에 재개할 작업

1. 실제 Worker URL과 교정된 Supabase RPC로 공개 지점·설치 기구 이미지를 검증한다.
2. Apps in Toss 최신 공식 규칙을 다시 확인하고 Devtools에서 위치·화면 동작을 검증한다.
3. 실제 토스 기기에서 Safe Area·뒤로가기·광고·저장소를 검증한다.
4. 사용자 승인 후에만 콘솔 테스트 업로드·공개 검토·출시를 진행한다.


# 산책핏 관리자 Windows desktop 진행 기록

## 현재 진행 상황

> 기준일: 2026-11-05
> 모노레포 기본 이관과 웹·Rust 자동 검사, 코드 기반 Supabase 계약 목록화는 완료했다. 다음 작업은 운영 DB 읽기 전용 감사 후 Python·Tauri·관리자 승인 흐름 검증이다.

## 모노레포 1차 이전 (2026-11-04)

- 요청/목표: 기존 관리자 React·Tauri·Python 이미지 서비스를 독립 leaf 앱으로 이전
- 원본: `D:\DEV\walk_fit_admin`
- 대상: `apps/fit/fit-admin/fit-admin-desktop`, `@map-apps/fit-admin-desktop`
- 변경: 추적된 소스·Rust·Python·테스트·Supabase 감사 SQL·아이콘을 이전하고 개발 포트를 5176으로 변경
- 보존: Tauri 2.12.1, 앱 버전 0.1.8, identifier `com.walkfit.admin`, 이미지 서비스 8765와 기존 관리자 흐름 유지
- 제외: `.env.local`, `node_modules`, `dist`, `package-lock.json`, `.venv-images`, 모델·캐시·테스트 결과, `src-tauri/target`·`gen`, 기존 exe·installer
- 원본 미추적 문서: 기존 `AGENTS.md`, `progress.md`의 제품·DB 이력은 새 leaf 문서와 루트 진행 기록의 근거로 반영했으며 원본은 수정하지 않음
- 공식 확인: 2026-11-04 Tauri 2 Windows 준비·capability·installer·signing 문서 확인
- DB·배포: SQL 실행, 데이터 변경, 코드 서명, 설치·업데이트·배포를 수행하지 않음

## 단계별 상태

| 영역 | 상태 | 비고 |
| --- | --- | --- |
| 모노레포 파일 이전 | 완료 | 개인 환경·생성물 제외, 바이너리 자산 해시 일치 |
| 원본 무결성 대조 | 완료 | 의도적 설정 변경 외 원본 파일 SHA-256 일치; 손상된 66개 복사본 복구 |
| 타입·단위·lint·웹 빌드 | 완료 | 타입, 43 tests, lint, Vite build 통과 |
| 자동 검사 경고 | 보류 | React effect 관련 lint 경고 9건, 658.86 kB 메인 JS chunk 경고 |
| Rust `cargo check --locked` | 완료 | Tauri 2.12.1 및 Windows Rust 경계 검사 통과 |
| Python 검사 | 미검증 | `.venv-images`·모델은 복사하지 않았으며 새 leaf 환경을 아직 만들지 않음 |
| Tauri dev | 미검증 | Python 서비스와 WebView2 필요 |
| Windows exe·installer | 미검증 | 웹·Rust 검사 후 별도 번들 단계 |
| 코드 서명 | 미구성 | 사용자 승인·인증서 필요 |
| Supabase 계약 대조 | 완료 | 단일 관리자 기준 production 권한 migration·bootstrap과 일반 조사자 정책 제거 완료 |
| 관리자 로그인·실DB | 미검증 | 환경변수·관리자 계정 필요 |
| 조사 승인 전체 흐름 | 미검증 | 신규 조사→승인→사용자 공개 확인 필요 |
| Cloudflare R2 사진 | 진행 중 | 누락 서비스 복구와 관리자 업로드·조회·교체·삭제 전환 완료, 실계정·Worker 미검증 |

Tauri 개발 서버, Windows 번들·설치·서명과 실제 관리자 계정·DB 검증은 이번 이전 단계에서 실행하지 않았다.

## 다음에 재개할 작업

1. 단일 관리자 계정으로 조사 PWA 등록 → Windows 검수·승인 → 일반 사용자 공개 조회를 검증한다.
2. 새 leaf에서 Python 가상환경·모델을 준비하고 Python 검사를 실행한다.
3. Tauri dev와 실제 관리자 로그인·조사 승인·사진 편집 흐름을 검증한다.
4. 사용자 승인 후 Windows 번들·설치 검증을 진행하며 코드 서명·배포는 별도로 승인받는다.


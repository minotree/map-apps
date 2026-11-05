# 산책핏 Supabase 운영 기준

Supabase는 Auth, PostgreSQL DB, RLS, RPC만 담당한다. 이미지 바이너리는 Cloudflare R2에 저장하고 DB의
`stamped_photo_path`, `default_image_path`에는 Cloudflare 객체 키만 저장한다. 브라우저가 R2 자격 증명을
직접 사용하지 않으며 업로드·교체·삭제는 인증을 검증하는 Worker API를 통한다.

## 파일

| 파일 | 용도 | 실행 여부 |
| --- | --- | --- |
| `audit-baseline.sql` | 여러 결과표 형태의 읽기 전용 운영 메타데이터 감사 | 실행 가능 |
| `audit-baseline-export.sql` | 감사 결과를 단일 표로 export | 실행 가능 |
| `migrations/20261104_001_authorization_baseline.sql` | 기존 업무 데이터 초기화, 관리자 allowlist와 RLS 교정 | 2026-11-05 production 적용 완료 |
| `bootstrap-admin.sql` | Auth 사용자 UUID 확인과 첫 관리자 등록 절차 | 최초 적용 요청에서 migration과 같은 트랜잭션으로 등록 완료 |
| `verify-authorization.sql` | 적용·bootstrap 후 메타데이터와 빈 업무 데이터 검증 | 2026-11-05 무변경 검증 migration 통과 |

## 적용 순서

1. 현재 migration과 감사 결과를 검토한다.
2. Cloudflare R2 버킷·Worker API·환경변수·사진 경로 형식을 먼저 확정한다.
3. Supabase Storage의 기존 객체와 버킷은 대시보드 또는 공식 Storage API로 별도 삭제한다. Storage 내부
   테이블을 SQL로 직접 수정하지 않는다.
4. 운영 적용을 별도 승인받고 `20261104_001_authorization_baseline.sql`을 실행한다.
5. 같은 작업 창에서 `bootstrap-admin.sql` 안내대로 현재 운영자의 Auth UUID를 `admin_users`에 등록한다.
6. `verify-authorization.sql` 결과가 0행인지 확인한다.
7. 조사 PWA 로그인, 관리자 로그인·승인, 익명 공개 조회, 비관리자 차단을 순서대로 검증한다.

역할별 기대 결과는 다음과 같다.

| 역할 | 허용 | 차단 |
| --- | --- | --- |
| 익명 | 공개 지점·기구 조회, 공개 사진 RPC | 조사 행 조회·생성, 모든 변경 |
| 일반 인증 사용자 | 공개 데이터 조회 | 조사 행 조회·생성·변경, 관리자 RPC |
| allowlist 관리자 | 조사 PWA 등록·조회, 전체 조사 검수, 지점·카탈로그·설치 기구 변경, 승인 RPC | `admin_users` 직접 클라이언트 변경 |

첫 관리자 등록 전에는 인증 사용자를 포함한 모든 변경이 RLS에서 차단된다. migration 실행과 bootstrap을
서로 다른 날이나 담당자로 분리하지 않는다.

## 적용 기록

- 2026-11-05: Supabase Management API로 `authorization_baseline_20261104` 적용
- 기존 `survey_locations`, `exercise_sites`, `equipment_catalog`, `site_equipment` 데이터는 이전 없이 초기화
- 첫 관리자 UUID는 migration의 `COMMIT` 전에 `admin_users`에 등록했으며 저장소에는 기록하지 않음
- CLI 직접 연결은 실행 환경의 IPv6 제약으로 중단되어 Management API migration 경로를 사용
- `verify_authorization_20261105` 무변경 검증 migration 통과, 원격 migration 이력 2건 확인
- 후속 확인에서 조사 PWA도 관리자 전용임을 재확정했다. 2026-11-05 SQL Editor에서 일반 조사자 정책 2개를 제거했으며 `20261105_002_admin_only_survey.sql`을 정본 이력으로 추가했다.


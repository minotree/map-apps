# 산책핏 Supabase 운영 기준

Supabase는 Auth, PostgreSQL DB, RLS, RPC만 담당한다. 이미지 바이너리는 Cloudflare R2에 저장하고 DB의
`stamped_photo_path`, `default_image_path`에는 Cloudflare 객체 키만 저장한다. 브라우저가 R2 자격 증명을
직접 사용하지 않으며 업로드·교체·삭제는 인증을 검증하는 Worker API를 통한다.

## 파일

| 파일 | 용도 | 실행 여부 |
| --- | --- | --- |
| `audit-baseline.sql` | 여러 결과표 형태의 읽기 전용 운영 메타데이터 감사 | 실행 가능 |
| `audit-baseline-export.sql` | 감사 결과를 단일 표로 export | 실행 가능 |
| `migrations/20261104_001_authorization_baseline.sql` | 기존 업무 데이터 초기화, 관리자 allowlist와 RLS 교정 | **미실행, 파괴적** |
| `bootstrap-admin.sql` | Auth 사용자 UUID 확인과 첫 관리자 등록 절차 | migration 적용 직후 별도 실행 |
| `verify-authorization.sql` | 적용·bootstrap 후 메타데이터와 빈 업무 데이터 검증 | 결과 0행이어야 함 |

## 적용 순서

1. 현재 migration과 감사 결과를 검토한다.
2. Cloudflare R2 버킷·Worker API·환경변수·사진 경로 형식을 먼저 확정한다.
3. Supabase Storage의 기존 객체와 버킷은 대시보드 또는 공식 Storage API로 별도 삭제한다. Storage 내부
   테이블을 SQL로 직접 수정하지 않는다.
4. 운영 적용을 별도 승인받고 `20261104_001_authorization_baseline.sql`을 실행한다.
5. 같은 작업 창에서 `bootstrap-admin.sql` 안내대로 현재 운영자의 Auth UUID를 `admin_users`에 등록한다.
6. `verify-authorization.sql` 결과가 0행인지 확인한다.
7. 조사 PWA 로그인, 관리자 로그인·승인, 익명 공개 조회, 비관리자 차단을 순서대로 검증한다.

첫 관리자 등록 전에는 인증 사용자를 포함한 모든 변경이 RLS에서 차단된다. migration 실행과 bootstrap을
서로 다른 날이나 담당자로 분리하지 않는다.


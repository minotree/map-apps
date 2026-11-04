# 산책핏 Supabase 기준 정리

> 기준일: 2026-11-04  
> 상태: 코드 참조 목록화 완료, 운영 DB 대조 전  
> 이 문서는 실행용 migration이 아니다. 사용자 승인과 운영 DB 감사 전에는 아래 내용을 SQL Editor나 CLI로 적용하지 않는다.

## 현재 결론

네 leaf 앱과 공통 패키지는 하나의 Supabase 프로젝트에서 다음 계약을 공유한다. 현재 저장소에는 관리자 앱에서
가져온 사진 연결·승인 migration과 감사 SQL만 있으며, 전체 스키마·RLS·RPC·Storage 정책을 재현하는 정본
migration은 없다. 따라서 기존 SQL을 새 프로젝트나 운영 DB에 바로 실행할 수 없다.

사진 접근 방식도 아직 하나로 확정되지 않았다. 조사·관리자 앱은 `getPublicUrl`을 사용하지만 사용자 앱은
`get_published_site_photo` 결과를 받아 `survey-photos`의 서명 URL을 만든다. 버킷을 공개로 둘지 비공개로
두고 권한 API만 사용할지 결정하기 전까지 이 차이를 유지하며, 공개 버킷을 전제로 정책을 추가하지 않는다.

## 애플리케이션 데이터 계약

| 구분 | 이름 | 사용하는 주체 | 필요한 동작과 조건 |
| --- | --- | --- | --- |
| 테이블 | `survey_locations` | 조사 PWA, 관리자 desktop | 조사자는 본인 행 생성·당일 조회, 관리자는 전체 조회·사진 경로 수정·승인 |
| 테이블 | `exercise_sites` | 사용자 PWA·토스, 관리자 desktop | 일반 사용자는 `is_published = true` 조회만, 관리자는 생성·수정·초기화 |
| 테이블 | `equipment_catalog` | 사용자 PWA·토스, 관리자 desktop | 공개 기구 정보 조회, 관리자는 카탈로그 생성·수정·초기화 |
| 테이블 | `site_equipment` | 사용자 PWA·토스, 관리자 desktop | 공개 지점의 공개 설치 기구 조회, 관리자는 연결 생성·수정·삭제·초기화 |
| RPC | `admin_is_owner()` | 관리자 desktop, 관리자용 SQL | 로그인 사용자의 서버 측 관리자 여부 반환. 클라이언트 메타데이터만 신뢰하면 안 됨 |
| RPC | `admin_approve_survey_to_site(uuid)` | 관리자 desktop | 조사 잠금, 지점 생성 또는 재사용, 양방향 연결과 승인 상태 변경을 단일 트랜잭션으로 처리 |
| RPC | `get_published_site_photo(uuid)` | 공통 `packages/data` | 공개 지점에 연결된 대표 사진 경로만 반환하고 비공개 조사 행은 노출하지 않음 |
| RPC | `record_equipment_view(...)` | 사용자 PWA·토스 | 동의 버전·지점·설치 기구·연령대·시도 단위의 통계 기록. 원시 생년·정밀 위치는 보내지 않음 |
| Storage | `survey-photos` | 조사·관리자·사용자 앱 | 조사 대표 사진 업로드·교체·조회·관리자 삭제. 현재 공개/비공개 전제가 충돌함 |
| Storage | `equipment-images` | 관리자·사용자 앱 | 기구 이미지 업로드·조회·관리자 삭제. 저장값이 URL인지 상대 경로인지 함께 대조 필요 |

관리자 전체 초기화 기능은 네 테이블과 두 버킷을 모두 삭제 대상으로 삼는다. 이 기능은 RLS와 Storage
정책만으로 보호되어야 하며, UI의 확인 문구는 서버 권한 경계를 대체하지 않는다.

## 확인된 스키마 의존성

| 테이블 | 코드에서 직접 참조하는 주요 열 |
| --- | --- |
| `survey_locations` | `id`, `facility_name`, `latitude`, `longitude`, `accuracy`, `address`, `stamped_photo_path`, `review_note`, `taken_at`, `created_by`, `status`, `linked_site_id`, `created_at` |
| `exercise_sites` | `id`, `name`, `latitude`, `longitude`, `address_text`, `toilet_status`, `drinking_water_status`, `amenity_note`, `survey_location_id`, `site_image_path`, `last_verified_at`, `is_published`, `created_at`, `updated_at` |
| `equipment_catalog` | `id`, `name`, `model_name`, `default_image_path`, `instructions`, `effects`, `precautions`, `source_reference`, `updated_at` |
| `site_equipment` | `id`, `site_id`, `equipment_id`, `quantity`, `display_order`, `is_published`, `updated_at` |

관계 조회는 `exercise_sites.survey_location_id`, `survey_locations.linked_site_id`,
`site_equipment.site_id`, `site_equipment.equipment_id`의 외래키를 전제로 한다. 기존 승인 migration은 조사와
지점이 1:1임을 보장하는 부분 unique index 두 개를 추가하지만, 운영 DB의 기존 제약·트리거·뷰와 충돌하지
않는지 감사 SQL로 먼저 확인해야 한다.

## 역할별 최소 권한 기준

| 역할 | 허용 기준 |
| --- | --- |
| 익명·일반 사용자 | 공개 지점과 공개 설치 기구·카탈로그만 조회. 조사 원본 행 직접 조회와 관리자 RPC 실행 금지 |
| 인증된 조사자 | `created_by = auth.uid()`인 조사 생성·조회. 승인 상태와 연결 지점 임의 변경, 다른 조사 조회·수정 금지 |
| 지정 관리자 | `admin_is_owner()`가 참인 경우에만 조사 검수, 지점·카탈로그·설치 기구 변경, 승인 RPC, 이미지 교체·삭제 허용 |
| service role | 클라이언트에 배포하지 않음. 향후 Worker가 필요할 때도 기능별 서버 경계와 최소 권한을 별도 설계 |

`admin_approve_survey_to_site`는 현재 `security invoker`이므로 함수 내부 검사뿐 아니라 관련 테이블의 관리자
RLS가 모두 있어야 동작한다. 함수만 배포하거나 실행 권한만 부여해서는 승인 흐름이 완성되지 않는다.

## 기존 SQL의 위치와 한계

| 파일 | 성격 | 적용 전 조건 |
| --- | --- | --- |
| `apps/fit/fit-admin/fit-admin-desktop/supabase/audit-photo-relations.sql` | 읽기 전용 관계·사진·뷰·트리거·정책 감사 | 운영 DB에서 결과를 저장하고 충돌 행을 사람이 검토 |
| `apps/fit/fit-admin/fit-admin-desktop/supabase/audit-storage-cleanup.sql` | 읽기 전용 Storage 정책 감사 | 두 버킷의 SELECT·INSERT·UPDATE·DELETE 정책을 함께 대조 |
| `apps/fit/fit-admin/fit-admin-desktop/supabase/migrations/20261021_joined_photos_and_approval.sql` | 링크 보정, 일부 사진 경로 정리, unique index와 승인 RPC 생성 | 전체 스키마와 RLS가 이미 존재하고 감사 결과에 충돌이 없어야 함 |
| `apps/fit/fit-admin/fit-admin-desktop/supabase/migrations/20261021_admin_image_delete.sql` | 지정 관리자 Storage DELETE 정책 추가 | `admin_is_owner()`와 기존 Storage SELECT 정책이 존재해야 함 |

저장소에는 기본 테이블·외래키·검사 제약, 네 테이블 RLS, 두 버킷 생성과 접근 정책,
`admin_is_owner`, `get_published_site_photo`를 재현하는 정본 migration이 없다. 운영 DB에는 앞의 두 RPC가
존재하지만 `record_equipment_view`는 없다. 운영 정의를 그대로 정본화하면 현재 광역 권한 문제까지 복제되므로,
권한 교정 설계와 역할별 검증을 먼저 수행한다.

## 실환경 대조와 적용 순서

| 단계 | 작업 | 현재 상태 | 완료 기준 |
| --- | --- | --- | --- |
| 1 | 코드 참조 테이블·열·RPC·버킷 목록화 | 완료 | 이 문서와 실제 코드 참조 일치 |
| 2 | 운영 DB 권한 감사 | 완료 | 조사자 동작 검사와 13개 메타데이터 섹션 확보. 함수·RLS·Storage 정의 및 긴급 권한 문제 확인 |
| 3 | 차이표와 권한 교정 migration 작성 | 차단 | 관리자 식별·조사자 역할·사진 공개·상태 정본 결정을 반영하고 롤백·데이터 보정 절차 포함 |
| 4 | 별도 검증 프로젝트에서 적용 | 대기 | 빈 DB 재현, 기존 데이터 포함 upgrade, RLS 역할별 자동 검사 통과 |
| 5 | 조사→승인→공개 전체 흐름 검증 | 대기 | 조사자 등록·사진, 관리자 승인, 사용자 공개 조회를 계정별로 확인 |
| 6 | 운영 적용 | 사용자 승인 필요 | 백업·적용 창구·담당자·롤백 기준 확인 후 별도 승인으로 실행 |

읽기 전용 메타데이터 감사에는 `supabase/audit-baseline.sql`을 사용한다. 이 SQL은 대상 테이블의 데이터 행이나
`auth.users`를 조회하지 않고 열·제약·인덱스·함수·권한·RLS·트리거·관련 뷰·버킷·Storage 정책만 출력한다.
Supabase SQL Editor에서 실행한 각 결과를 CSV로 내려받거나 결과 내용을 별도 비밀값 없는 파일로 전달하면
코드 계약과의 차이표를 작성할 수 있다.

SQL Editor가 마지막 SELECT 결과만 표시하는 경우에는 `supabase/audit-baseline-export.sql`을 사용한다.
동일한 메타데이터를 `section`, `result` 두 열과 13개 행으로 합쳐 한 번에 CSV export할 수 있다.

### 다음에 재개할 작업

1. 관리자 식별 원천과 조사자 역할 범위를 결정한다.
2. Supabase는 Auth·DB·RLS·RPC만 사용하고 이미지 바이너리는 Cloudflare R2/Worker만 사용한다. DB 사진 열에는 R2 객체 키를 저장한다.
3. 기존 업무 데이터는 보존하지 않고 `status`를 정본으로 사용하며 `review_status`를 제거한다.
4. 작성된 권한 교정 migration을 검토하고 Cloudflare Worker 계약·역할별 자동 검사를 준비한다.
3. 버킷 공개 여부, 사진 DB 값의 상대 경로/전체 URL 형식, 관리자 식별 원천을 먼저 결정한다.
4. 그 결과를 근거로 `supabase/migrations` 정본과 역할별 RLS 검증을 만든다.

## 2026-11-04 연결 확인 기록

- `map-apps` workspace에는 Supabase CLI, `supabase/config.toml`, `.supabase` 연결 상태, `.env` 파일과 관련 프로세스 환경변수가 없다.
- 이관 원본 `field-survey-pwa`와 `walk_fit_admin`에는 각각 공개 클라이언트용 환경 파일이 있고 두 URL의 호스트는 일치한다.
- URL은 HTTPS와 `*.supabase.co` 형식이며 두 공개 키도 존재한다. 키와 전체 URL은 출력하거나 새 workspace로 복사하지 않았다.
- 공개 키로 `/rest/v1/` OpenAPI 문서만 읽으려 했으나 호스트 이름을 DNS에서 확인하지 못해 응답을 받지 못했다.
- 사용자가 제공한 대시보드 화면에서 별도의 활성 `walk_fit` 프로젝트와 현재 Project URL을 확인했다. 해당 URL은 접근 가능하지만 원본 환경 파일의 공개 키는 401로 거부되어 OpenAPI 문서를 읽지 못했다.
- 기존 원본 환경 파일은 현재 프로젝트의 연결 정보로 사용할 수 없다. 현재 키를 확보하기 전까지 앱 환경 파일을 추측으로 수정하지 않는다.
- 데이터 행 조회, 로그인, SQL 실행, 정책·버킷·외부 계정 변경은 수행하지 않았다.

## 2026-11-04 활성 프로젝트 공개 계약 확인

- 현재 Project URL과 publishable key를 조사 앱의 Git 비추적 `.env.local`에 설정했고 연결에 성공했다.
- REST OpenAPI 문서는 secret key 전용으로 제한되어 있고 `pg_graphql` 확장은 비활성화되어 전체 스키마 introspection은 할 수 없었다. secret key는 요청하거나 사용하지 않았다.
- 최대 0행 REST 요청으로 `exercise_sites`, `equipment_catalog`, `site_equipment`의 존재와 이 문서에 적은 예상 열 계약을 확인했다.
- `survey_locations`는 publishable key만 사용한 익명 요청을 401로 차단했다. 이는 조사 데이터 공개 차단에는 부합하지만, 인증된 조사자의 소유 행 RLS는 아직 검증하지 않았다.
- RPC는 실행 부작용 가능성이 있어 공개 키로 호출하지 않았다. 함수 정의·실행 권한은 schema-only export 또는 읽기 전용 DB 감사로 확인해야 한다.
- Git 비추적 `.env.audit.local`의 테스트 조사자 계정으로 비밀번호 인증에 성공했다. 인증 토큰과 계정 정보는 출력·저장하지 않았다.
- 인증 토큰으로 `survey_locations`의 예상 열을 최대 0행으로 조회해 열 계약과 인증된 SELECT 진입을 확인했다. 실제 행을 받지 않았으므로 본인/타인 행 필터 RLS는 아직 검증하지 않았다.

## 2026-11-04 조사자 소유 행 RLS 확인

- 사용자 승인 후 테스트 조사자 계정으로 `survey_locations`에 감사용 임시 행 1건을 생성했다.
- 생성 행의 `created_by`가 인증 사용자와 일치했고 같은 계정의 ID 조건 조회가 1건을 반환해 본인 행 INSERT·SELECT를 확인했다.
- 같은 계정의 DELETE는 오류 대신 0건을 반환했고 후속 조회에서 행이 남아 있음을 확인했다. 조사자의 삭제 차단은 현재 제품 기준과 부합한다.
- 삭제 실패 후 권한 우회나 secret/service-role key 사용을 시도하지 않았다.
- 조사자 DELETE가 차단되어 임시 행이 남았으나 사용자가 Table Editor에서 삭제했고, 위도 `37.5665`·경도 `126.978`·정확도 `999` 조건 조회 결과 0건을 확인했다.
- 최초 PowerShell 테스트 요청은 JSON 문자열을 UTF-8 바이트로 명시하지 않아 한글 값이 `?`로 저장됐다. 이후 자동 요청은 `application/json; charset=utf-8`과 UTF-8 바이트 본문을 사용한다.
- 타인 행 SELECT 차단은 두 번째 조사자 계정이 없어 아직 검증하지 않았다.

## 2026-11-04 확장 확인

- `pgcrypto` 1.3과 `uuid-ossp` 1.1이 활성화되어 있다.
- `pg_graphql`과 `postgis`는 감사 결과에 없어 비활성 상태다. 현재 앱 계약에는 PostGIS 함수 의존성이 없으며,
  GraphQL introspection을 사용할 수 없었던 연결 검사 결과와 일치한다.

## 2026-11-04 운영 메타데이터 감사 결론

`supabase/audit-baseline-export.sql`의 13개 섹션 결과를 운영 프로젝트에서 확보했다. 스키마의 기본 열·외래키·
검사 제약과 조사-지점 1:1 부분 unique index는 현재 코드 계약과 대체로 일치한다. 그러나 아래 권한 문제는
관리자·조사자·일반 사용자 경계를 충족하지 않으므로 운영 적용용 migration을 만들기 전에 먼저 해결해야 한다.

| 심각도 | 발견 사항 | 영향 / 필요한 조치 |
| --- | --- | --- |
| 긴급 | `admin_is_owner()`가 로그인 사용자면 모두 `true`를 반환 | 모든 인증 사용자가 관리자로 판정된다. 관리자 식별 원천을 별도 allowlist 테이블 또는 검증된 서버 관리 claim으로 확정해야 한다. |
| 긴급 | 네 테이블에 `authenticated` 대상 `ALL using (true) with check (true)` 정책 존재 | 로그인한 조사자가 모든 조사 행과 관리자 데이터에 접근·변경할 수 있다. 해당 광역 정책을 제거하고 역할·소유권별 정책으로 교체해야 한다. |
| 긴급 | `admin_approve_survey_to_site`가 모든 `authenticated`에 실행 허용되고 위 관리자 함수에 의존 | 임의 인증 사용자가 조사 승인을 실행할 수 있다. 관리자 판정 수정과 함께 실행 권한·테이블 RLS를 재검증해야 한다. |
| 높음 | `survey_locations_operator_select` 조건이 `auth.uid() is not null` | 모든 조사자가 다른 조사자의 행을 조회할 수 있다. `created_by = auth.uid()` 또는 관리자 조건으로 제한해야 한다. |
| 높음 | `survey-photos`, `equipment-images` 버킷이 모두 `public = true` | 객체 SELECT 정책과 무관하게 공개 URL로 파일에 접근할 수 있다. 특히 조사 원본 사진은 비공개 버킷과 서명 URL/권한 API로 전환해야 한다. |
| 높음 | 인증 사용자가 두 버킷에 임의 경로 업로드 가능, 관리자 삭제 정책도 현재 관리자 함수에 의존 | 조사자는 자기 prefix만 업로드하고 기구 이미지는 관리자만 업로드·삭제하도록 제한해야 한다. |
| 높음 | `equipment_catalog`, `exercise_sites`, `site_equipment`의 인증 사용자 광역 변경 정책 | 일반 인증 사용자가 공개 데이터와 카탈로그를 변경할 수 있다. 일반 사용자는 공개 SELECT, 관리자는 변경으로 분리해야 한다. |
| 중간 | `record_equipment_view` RPC가 존재하지 않음 | 통계 동의 사용자의 조회 기록 호출이 실패한다. 통계 기능을 보류하거나 개인정보 최소화 계약에 맞는 함수를 별도 검토해야 한다. |
| 중간 | `survey_locations`에 `review_status`와 `status`가 병존하고 인덱스는 `review_status`, 앱과 승인 RPC는 `status` 사용 | 상태 의미가 이중화됐다. 데이터 대조 후 하나의 정본 상태 열과 전환 규칙을 확정해야 한다. |
| 중간 | 두 버킷에 파일 크기·허용 MIME 제한이 없음 | 업로드 전 클라이언트 검사만으로 충분하지 않다. 서버 측 크기·MIME 기준을 제품 요구에 맞춰 설정해야 한다. |
| 낮음 | `admin_is_owner` 실행 권한이 `PUBLIC`과 `anon`에도 부여 | 현재 익명 호출은 false지만 권한 면적이 불필요하게 넓다. 관리자 판정 함수는 필요한 역할만 실행하도록 축소해야 한다. |

### 확인된 정상 또는 일치 항목

- 네 테이블 모두 RLS가 활성화되어 있다. 다만 정책 내용이 넓어 활성화 자체만으로 안전하지 않다.
- 위도·경도, 수량, 표시 순서, 지점 편의 상태와 주요 이름에 검사 제약이 있다.
- 조사-지점 양방향 연결에 각각 부분 unique index가 있어 1:1 관계를 보조한다.
- `get_published_site_photo`는 공개 지점에 한해 사진 경로를 반환하며 `security definer`, 빈 `search_path`를 사용한다.
- `admin_approve_survey_to_site`는 `security invoker`, 빈 `search_path`이며 트랜잭션 내 링크 검사를 수행한다. 단, 현재 광역 RLS 때문에 권한 경계는 안전하지 않다.
- 네 테이블의 `updated_at` 갱신 트리거가 존재하고 관련 public 뷰는 없다.

### 수정 전 필수 결정

1. 관리자 식별 원천: 별도 `admin_users` allowlist 테이블과 서버 관리 절차를 사용한다. 이메일 문자열이나 클라이언트 수정 가능한 `user_metadata`는 사용하지 않는다.
2. 조사자 범위: 현재 관리자 한 명만 현장 조사와 사무실 관리를 수행한다. 불특정 인증 사용자나 여러 조사자 역할은 현재 범위가 아니다.
3. 사진 공개 범위: Supabase Storage는 사용하지 않는다. 조사 지점 전경 원본과 승인된 공개 이미지는 Cloudflare R2에서 Worker 권한 경계와 공개 자산 계층으로 분리한다. 운동기구 원본은 조사 앱이 업로드하지 않는다.
4. 상태 정본: 기존 업무 데이터는 삭제 가능하므로 앱과 승인 RPC가 사용하는 `status`를 정본으로 두고 `review_status`를 제거한다.
5. 통계 기능: `record_equipment_view`를 구현할지, 개인정보·보존 기준 확정 전 비활성화할지 결정한다.

위 결정을 내리기 전에는 현재 광역 정책을 부분적으로만 제거하지 않는다. 관리자 앱이 즉시 중단되거나 복구 경로가
사라질 수 있으므로, 검증 프로젝트에서 관리자 등록·정책 교체·역할별 테스트·롤백을 하나의 migration 묶음으로
준비한 뒤 운영 적용을 별도 승인받는다.


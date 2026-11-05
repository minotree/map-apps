# 산책핏 이미지 Worker 작업 기준

## 책임

이 Worker는 비공개 Cloudflare R2 이미지 버킷의 유일한 HTTP 경계다. Supabase는 Auth·DB·RLS·RPC만
담당하고 이미지 바이너리를 저장하지 않는다.

- 관리자 API는 Supabase access token과 `admin_is_owner()` RPC를 모두 확인한다.
- 공개 API는 지점 또는 설치 기구의 공개 상태와 DB에 저장된 R2 객체 키를 서버에서 확인한다.
- R2 access key, secret, service-role key를 브라우저·Tauri 프런트엔드·Git에 넣지 않는다.
- 버킷 자체를 public으로 열지 않는다. 객체 조회는 Worker를 통해서만 제공한다.
- 업로드는 WebP만 허용하고 현재 상한은 10 MiB다. 이미지 디코딩·악성 파일 검사는 후속 보완 항목이다.
- CORS는 `ALLOWED_ORIGINS`의 정확한 origin만 허용한다. `*`와 credentials 조합을 사용하지 않는다.

## API 계약

| Method / path | 권한 | 동작 |
| --- | --- | --- |
| `POST /v1/admin/images?kind=site-overview` | 관리자 | 지점 전경 WebP 업로드, `site-overviews/<uuid>.webp` 반환 |
| `POST /v1/admin/images?kind=equipment` | 관리자 | 기구 WebP 업로드, `equipment/<uuid>.webp` 반환 |
| `GET /v1/admin/images?key=<key>` | 관리자 | 비공개 이미지 미리보기 |
| `DELETE /v1/admin/images?key=<key>` | 관리자 | 교체 후 미사용 객체 삭제 |
| `GET /v1/admin/image-url?key=<key>` | 관리자 | 5분 유효 HMAC 비공개 이미지 URL 발급 |
| `GET /v1/admin/image-keys` | 관리자 | 초기화 검토용 R2 객체 키 목록 |
| `GET /v1/public/sites/<siteId>/image` | 익명 | 공개·승인 지점의 전경 스트리밍 |
| `GET /v1/public/installations/<installationId>/image` | 익명 | 공개 지점에 속한 공개 설치 기구 이미지 스트리밍 |
| `GET /health` | 익명 | 비밀값 없는 상태 응답 |

DB 갱신과 R2 쓰기는 분산 트랜잭션이 아니다. 앱은 새 객체 업로드 → DB 객체 키 조건부 변경 → 이전 객체 삭제
순서를 사용하고, DB 변경 실패 시 새 객체 정리를 재시도한다.

## 실행과 검증

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 로컬 개발 | `pnpm.cmd --filter @map-apps/fit-images-worker dev` |
| 타입 검사 | `pnpm.cmd --filter @map-apps/fit-images-worker typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/fit-images-worker test` |
| 번들 검사 | `pnpm.cmd --filter @map-apps/fit-images-worker build` — 배포하지 않는 Wrangler dry-run |
| 배포 | `pnpm.cmd --filter @map-apps/fit-images-worker deploy` — 계정·버킷·변수 확정과 사용자 승인 후 실행 |

`IMAGE_SIGNING_SECRET`은 최소 32바이트 무작위 값으로 `wrangler secret put IMAGE_SIGNING_SECRET` 또는
Cloudflare 대시보드 secret에만 저장한다. `wrangler.jsonc`, 앱 환경변수와 Git에는 넣지 않는다.
`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`도 배포 전 Worker secret으로 등록하며 저장소 설정에 실제 값을
기록하지 않는다.


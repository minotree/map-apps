# 산책핏 현장 조사 PWA 작업 기준

## 제품과 책임

이 leaf 앱은 관리자 한 명이 현장에서 로그인한 뒤 지점 위치·주소·메모·전경 사진을 수집해 조사 건을 등록하고 조회하는 PWA다.
React 19·Vite·Ionic React·OpenLayers를 사용하며 조사 UI·인증 세션·브라우저 위치·카메라/사진·워터마크와
PWA 설정을 소유한다. Capacitor 설정은 보존하지만 Android/iOS 네이티브 프로젝트가 없으므로 모바일 앱
빌드나 실기기 검증 완료로 간주하지 않는다.

조사 등록 코드를 사용자·관리자 앱에 공유하거나 다른 앱 소스를 상대 경로로 import하지 않는다.
공통 계약이 실제 두 앱 이상에서 필요해질 때만 루트 `packages/*` 공개 export로 이동한다.

운동기구별 사진은 이 앱에서 업로드하지 않는다. 스마트폰 기본 카메라로 촬영해 기기에 저장하고 Google 포토로
사무실에 수동 전달한다. Google 포토 API·OAuth·자동 동기화는 이 앱의 범위가 아니다.

## 데이터·사진·권한

- Supabase Auth·DB·RLS를 지정 관리자 식별과 행 권한 기준으로 사용한다. 모든 인증 사용자를 관리자로 인정하지 않는다.
- 현재 코드는 `survey_locations`와 Supabase Storage `survey-photos`를 사용한다. Cloudflare R2·Worker 전환 전까지 최종 구조로 간주하지 않는다.
- 공개 클라이언트에 Supabase secret/service role, R2 자격 증명과 Cloudflare API token을 넣지 않는다.
- 위치·주소·전경 사진·메모만 서버로 전송하고 권한 거부·실패·재시도를 처리한다.
- 사진의 EXIF·얼굴·차량번호 등 개인정보 가능성을 검토하고 승인 전 조사 원본을 익명 공개하지 않는다.
- 관리자 승인은 `admin_approve_survey_to_site` RPC를 사용하며 조사 앱에서 승인 상태를 임의로 변경하지 않는다.
- 기존 SQL은 실제 운영 DB와 대조하기 전 실행하지 않는다. 원본 SQL 정리는 루트 Supabase 단계에서 수행한다.

## 지도·PWA

- OpenLayers는 렌더링 라이브러리이며 V-World 지도·지오코딩 제공 조건은 별도다. 키 Origin·쿼터·출처 표시를 배포 전에 확인한다.
- 이미지 runtime cache가 조사 사진이나 인증된 응답을 장기 보관하지 않는지 Cloudflare 전환 전에 재검토한다.
- 네트워크가 필요한 DB·지도·지오코딩·사진 업로드를 완전한 오프라인 기능으로 표현하지 않는다.
- PWA 설치, 서비스 워커 갱신, 권한 허용·거부, 촬영·업로드는 실제 브라우저와 기기에서 별도 검증한다.

## 환경변수

실제 값은 `.env.local` 또는 Cloudflare 배포 환경에 두고 `.env.example`에는 플레이스홀더만 둔다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` — 브라우저 공개용 Supabase publishable key
- `VITE_GEOCODING_PROVIDER`
- `VITE_VWORLD_API_KEY`
- `VITE_IMAGE_API_BASE_URL`

## 실행과 검증

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-survey:pwa` → `http://127.0.0.1:5175` |
| 타입 검사 | `pnpm.cmd --filter @map-apps/fit-survey-pwa typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/fit-survey-pwa test` |
| lint | `pnpm.cmd --filter @map-apps/fit-survey-pwa lint` |
| Cypress E2E | 개발 서버 실행 후 `pnpm.cmd --filter @map-apps/fit-survey-pwa test.e2e` |
| 빌드 | `pnpm.cmd build:fit-survey:pwa` |
| 미리보기 | `pnpm.cmd --filter @map-apps/fit-survey-pwa preview` → `http://127.0.0.1:4175` |
| Cloudflare 배포 | `pnpm.cmd --filter @map-apps/fit-survey-pwa run deploy` → `https://walk-fit-survey.minotree0902.workers.dev` |

자동 검사, PWA 설치, 위치·카메라 실기기, 실제 Supabase 등록, 관리자 승인 연동을 구분해 기록한다.


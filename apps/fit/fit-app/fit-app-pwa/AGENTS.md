# 산책핏 사용자 PWA 작업 기준

## 제품과 책임

이 leaf 앱은 공개된 실외 운동기구 지점·설치 기구 정보를 지도와 상세 화면으로 제공하는 사용자 PWA다.
React 19·Vite·Ionic React·OpenLayers/V-World를 사용하며 UI·라우팅·PWA 설정·브라우저 위치 권한과
Cloudflare Pages 정적 배포 설정을 소유한다.

공개 데이터 계약과 조회·매핑은 `@map-apps/contracts`, `@map-apps/data`의 공개 export만 사용한다.
조사 등록, 관리자 승인·삭제·초기화와 토스 SDK를 이 앱에 넣거나 다른 앱 소스를 상대 경로로 import하지 않는다.

## 데이터·지도·개인정보

- Supabase DB·Auth·RLS를 데이터 권한 기준으로 사용한다. 현재 공개 지점·기구 조회와 대표 사진 RPC 동작을 유지한다.
- 사진 바이너리는 비공개 Cloudflare R2에 두고 공개 지점·설치 기구 여부를 확인하는 Worker URL로 조회한다. Supabase Storage를 사용하지 않는다.
- 서비스 역할 키, Supabase secret, R2 자격 증명과 Cloudflare API token을 클라이언트에 넣지 않는다.
- V-World 키는 허용 Origin·쿼터를 제한하고 지도·타일·API의 이용 조건과 출처 표시를 배포 전에 다시 확인한다.
- 사용자 프로필은 기기 로컬 저장이 기본이다. 통계 동의 전 출생 연도·성별·지역·위치를 서버로 전송하지 않는다.
- 브라우저 위치는 사용자가 허용한 경우에만 현재 지도 표시를 위해 사용하며 저장·전송 범위를 확대하지 않는다.
- 공개 대표 사진만 사용자 앱에 제공하고 조사 테이블 전체나 승인 전 원본을 익명 공개하지 않는다.
- 일반 사용자의 로그인·제보·편집은 현재 범위가 아니며 공개 정보 읽기만 제공한다.

## 환경변수

`.env.example`에는 이름과 비밀이 아닌 기본값만 둔다. 실제 값은 `.env.local` 또는 Cloudflare 배포 환경에 둔다.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_IMAGE_API_BASE_URL`
- `VITE_VWORLD_API_KEY`
- `VITE_MAP_DEFAULT_LAT`
- `VITE_MAP_DEFAULT_LNG`
- `VITE_MAP_DEFAULT_ZOOM`

## 실행과 검증

| Key | Value |
| --- | --- |
| 실행 위치 | `D:\DEV\map-apps` |
| 개발 서버 | `pnpm.cmd dev:fit-app:pwa` → `http://127.0.0.1:5173` |
| 타입 검사 | `pnpm.cmd --filter @map-apps/fit-app-pwa typecheck` |
| 단위 검사 | `pnpm.cmd --filter @map-apps/fit-app-pwa test` |
| lint | `pnpm.cmd --filter @map-apps/fit-app-pwa lint` |
| 빌드 | `pnpm.cmd --filter @map-apps/fit-app-pwa build` |
| E2E | `pnpm.cmd --filter @map-apps/fit-app-pwa exec playwright test` |
| 미리보기 | `pnpm.cmd --filter @map-apps/fit-app-pwa preview` |
| Cloudflare 배포 | 미구성. 계정·프로젝트·도메인 확정과 사용자 승인 후 별도 기록 |

자동 검사와 브라우저 화면, PWA 설치·서비스 워커·업데이트·오프라인 실패 안내를 구분해 기록한다.
V-World와 Supabase의 실제 연결은 환경변수와 외부 서비스가 필요한 통합 검증이며 fixture 검사로 대체하지 않는다.


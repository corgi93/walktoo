# Location Module

산책 기록의 장소 검색·선택을 위한 provider 추상화 레이어.

## 아키텍처

```
lib/location/
├── types.ts          # Coords, Place, PickedLocation (provider 무관)
├── provider.ts       # LocationProvider 인터페이스
├── naver.ts          # 네이버 지역검색 + NCP Reverse Geocoding
├── google.ts         # Google Places + Geocoding (글로벌 fallback)
├── select.ts         # locale/env 기반 자동 선택
└── index.ts

hooks/useLocationSearch.ts        # 디바운스 검색 hook
components/feature/diary/LocationPicker/  # 검색 + 선택 UI
```

비즈니스 로직(검색·저장·표시)은 `Place` / `PickedLocation` 인터페이스만 알면 됨.
Provider 갈아끼울 때 UI/hook/저장 코드는 변경 없음.

## Provider 선택 규칙

1. `EXPO_PUBLIC_LOCATION_PROVIDER` 환경변수 (`naver` | `google`) — 강제 override
2. 없으면: 디바이스 로케일이 `ko*` → 네이버, 그 외 → 구글
3. 추후 user 프로필 설정으로 override 추가 가능

## 환경변수

`.env.example` 참조. 핵심:

```bash
EXPO_PUBLIC_LOCATION_PROVIDER=naver

# 네이버 지역검색 (https://developers.naver.com)
EXPO_PUBLIC_NAVER_DEV_CLIENT_ID=
EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET=

# (Phase 2) 네이버 Cloud Platform Maps
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=
EXPO_PUBLIC_NCP_API_KEY_ID=
EXPO_PUBLIC_NCP_API_KEY=

# Google Places + Maps (글로벌)
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
```

## 키 발급 가이드

### 네이버 지역검색 (현재 Phase에서 필요)
1. https://developers.naver.com → 애플리케이션 등록
2. 사용 API: **검색** 체크
3. WEB 설정 + iOS/Android 번들 ID 등록
4. Client ID / Client Secret → `.env`에 추가

### 네이버 Cloud Platform — 지도 SDK (Phase 2)
1. https://www.ncloud.com → Console → AI·NAVER API → Maps
2. Application 등록 → iOS bundle id (`com.walktoo.app`), Android package (`com.walktoo.app`)
3. Client ID 발급 → `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`
4. (역지오코딩용) Sub Account → API Gateway → Authentication Key 발급

### Google Cloud (글로벌 fallback)
1. https://console.cloud.google.com → 프로젝트 생성
2. APIs & Services → enable: **Places API (New)**, **Geocoding API**, **Maps SDK for iOS**, **Maps SDK for Android**
3. Credentials → API Key 생성 → Application restrictions에 iOS bundle / Android package 추가
4. `EXPO_PUBLIC_GOOGLE_MAPS_KEY`에 추가

## DB 스키마 마이그레이션

`supabase/_archive/006_location_coords.sql` 적용:

```sql
ALTER TABLE public.walks
  ADD COLUMN IF NOT EXISTS location_lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address   TEXT,
  ADD COLUMN IF NOT EXISTS location_source    TEXT;

-- footprint_entries 동일
```

마이그레이션 후 Supabase TypeScript 타입 재생성:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT > server/types/database.types.ts
```

## Phase 1 ✅ (현재)
- [x] Provider abstraction (Naver / Google)
- [x] 검색 hook + LocationPicker UI
- [x] 텍스트만 입력 fallback
- [x] footprint-create 통합

## Phase 2 (네이티브 지도)
- [ ] `@mj-studio/react-native-naver-map` 설치 (네이버용)
- [ ] `react-native-maps` 설치 (구글용)
- [ ] LocationPicker에 지도 미리보기 + 핀 드롭 추가
- [ ] `expo prebuild` + dev client 재빌드
- [ ] DB 마이그레이션 적용 + walks.service.ts에 coords 매핑

## Phase 3 (서버 프록시)
현재 `EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET`이 클라이언트에 노출됨.
출시 전 Supabase Edge Function으로 프록시 필요:

```ts
// supabase/functions/naver-search/index.ts
serve(async (req) => {
  const { query } = await req.json()
  const res = await fetch(`https://openapi.naver.com/v1/search/local.json?query=${query}`, {
    headers: {
      'X-Naver-Client-Id': Deno.env.get('NAVER_CLIENT_ID')!,
      'X-Naver-Client-Secret': Deno.env.get('NAVER_CLIENT_SECRET')!,
    },
  })
  return new Response(await res.text(), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

그러면 `naver.ts`의 `SEARCH_ENDPOINT`만 supabase function URL로 교체.

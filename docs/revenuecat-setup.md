# walkToo 기록 업그레이드 (RevenueCat) 세팅 가이드

walkToo의 구독 없는 1회성 업그레이드는 [RevenueCat](https://www.revenuecat.com)을 통해 Apple/Google IAP를 처리한다.
이 문서는 코드 통합이 끝난 상태에서 **사람이 콘솔에서 해야 하는 작업**을 정리한 체크리스트다.

## 0. 핵심 ID

### 기록 업그레이드

| 항목 | 값 |
|---|---|
| **Product ID** (Apple/Google 동일) | `com.walktoo.record_upgrade` |
| **Entitlement ID** (RevenueCat) | `walktoo_record_upgrade` |
| **Offering ID** (RevenueCat) | `default` (현재 offering) |
| **Type** | Non-consumable (구독 없는 1회성 업그레이드) |
| **무료 체험** | 없음 |
| **가격** | ₩3,300 / $2.49 |

### 여행 무드 테마팩

| 항목 | 값 |
|---|---|
| **Product ID** (Apple/Google 동일) | `com.walktoo.theme_pack_travel` |
| **Entitlement ID** (RevenueCat) | `walktoo_theme_pack_travel` |
| **Offering ID** (RevenueCat) | 아무 offering이나 가능 — 클라이언트가 전체 offering에서 product ID로 찾는다 |
| **Type** | Non-consumable (1회성, 커플 공유) |
| **포함 테마** | 삿포로 필름 / 홍콩 야경 / 도쿄 레코드샵 (`vintage_film`, `dreamy_cloud`, `dark_academia`) |
| **가격** | ₩3,300 / $2.49 |

### 향후 결과물 상품 (결제 플로우 구현 전에는 활성화 금지)

| 상품 | Product ID | Type | 가격 |
|---|---|---|---:|
| 추억 카드 이미지 | `com.walktoo.memory_card_image` | Consumable | ₩1,500 / $1.49 |
| 산책북 기본 | `com.walktoo.walk_book_basic` | Consumable | ₩6,900 / $5.99 |
| 산책북 긴 기간 | `com.walktoo.walk_book_extended` | Consumable | ₩8,900 / $7.99 |
| 기념일 리포트 | `com.walktoo.anniversary_report` | Consumable | ₩5,900 / $4.99 |

코드에서는 `src/constants/premium.ts`의 `PREMIUM.*` / `THEME_PACK.*` / `RESULT_PRODUCTS.*` 상수에 박혀 있으니 콘솔과 정확히 일치시켜야 한다.

---

## 1. Apple App Store Connect — IAP 등록

1. App Store Connect → My Apps → walkToo → **In-App Purchases**
2. **Create In-App Purchase**
   - Type: **Non-Consumable**
   - Reference Name: `walkToo Record Upgrade`
   - Product ID: `com.walktoo.record_upgrade`
3. 가격 설정:
   - 한국 (KRW): **₩3,300**
   - 글로벌 (USD): **$2.49**
   - 다른 국가는 Apple 자동 환산 사용
4. 표시 정보 (다국어):
   - 한국어: "기록 업그레이드"
   - 영어: "Record Upgrade"
5. 리뷰용 스크린샷 1장 (페이월 화면) 첨부
6. 상품 상태: **Ready to Submit**
7. App Store 심사 시 앱 빌드와 함께 IAP를 첨부 제출 (필수)

## 2. Google Play Console — IAP 등록

1. Play Console → walkToo → **수익 창출 설정 → 인앱 상품**
2. **상품 만들기**
   - 상품 ID: `com.walktoo.record_upgrade`
   - 이름: `기록 업그레이드`
   - 설명: `구독 없이 사진과 짧은 영상 기록을 더 풍성하게 남깁니다`
3. 가격: **₩3,300** (다른 국가는 자동 환산)
4. 상태: **활성**
5. 라이선스 테스터 추가 (sandbox 결제 테스트용)

## 3. RevenueCat 대시보드 세팅

1. [app.revenuecat.com](https://app.revenuecat.com) 로그인 → **+ New Project** → walkToo
2. **Apps**:
   - **+ App** → iOS → Bundle ID 입력 → App Store Connect API key 업로드
   - **+ App** → Android → Package name 입력 → Service Account JSON 업로드
3. **Products**:
   - **+ Product** → Apple → `com.walktoo.record_upgrade` 추가 → non-consumable 상품 연결
   - **+ Product** → Google → `com.walktoo.record_upgrade` 추가 → non-consumable 상품 연결
   - 같은 방식으로 `com.walktoo.theme_pack_travel`도 양쪽 모두 추가
   - 결과물 상품은 생성/다운로드/재시도 플로우가 붙기 전에는 RevenueCat에 연결하지 않는다
4. **Entitlements**:
   - **+ Entitlement** → Identifier: `walktoo_record_upgrade` → Display name: `Record Upgrade`
   - **+ Entitlement** → Identifier: `walktoo_theme_pack_travel` → Display name: `Travel Mood Theme Pack`
   - 각 product를 해당 entitlement에 attach (기록 업그레이드 ↔ record_upgrade, 테마팩 ↔ theme_pack)
5. **Offerings**:
   - 기본 offering이 `default` 이름으로 자동 생성됨
   - **Packages**: 기록 업그레이드 product attach
   - 테마팩은 `default` offering에 custom package(`theme_pack`)로 추가하거나 별도 offering에 둔다
     — 클라이언트(`getThemePackPackage`)는 전체 offering을 훑어 product ID로 찾으므로 어디에 둬도 동작한다
   - **Mark as current** 체크
6. **API Keys** (좌측 메뉴 → Project settings → API keys):
   - iOS public SDK key 복사
   - Android public SDK key 복사

## 4. 환경 변수 설정

프로젝트 루트의 `.env`에 추가:

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

> 키가 없으면 SDK는 안전하게 비활성화되며, 페이월은 진입 가능하지만 "구매" 클릭 시 `sdk-unavailable` 토스트가 뜬다.

## 5. Supabase 마이그레이션 적용

```bash
# 010 마이그레이션 적용
psql $DATABASE_URL -f supabase/010_premium.sql
# 테마팩 마이그레이션 적용
psql $DATABASE_URL -f supabase/theme_pack.sql
# 또는 Supabase Studio SQL Editor에 붙여넣고 Run
```

010 마이그레이션은:
- `profiles`에 `has_premium`, `premium_trial_ends_at`, `premium_purchased_at`, `revenuecat_user_id` 컬럼 추가
- `couples`에 `has_premium`, `premium_purchaser_id` 컬럼 추가
- RPC 3개 추가: `start_trial_if_needed`, `mark_premium_purchased`, `is_entitled`

테마팩 마이그레이션(`supabase/theme_pack.sql`)은:
- `profiles`에 `has_theme_pack`, `theme_pack_purchased_at` 컬럼 추가
- `couples`에 `has_theme_pack`, `theme_pack_purchaser_id` 컬럼 추가
- RPC 추가: `mark_theme_pack_purchased`
- 클라이언트는 컬럼이 아직 없어도 동작한다(legacy 폴백) — 단, 테마팩 결제 동기화는 마이그레이션 후에만 가능하므로 **테마팩 상품을 스토어에 활성화하기 전에 반드시 적용**

## 6. Native Build (필수)

`react-native-purchases`는 native 모듈이라 Expo Go에서는 작동하지 않는다. **Dev Client 빌드**로 테스트해야 한다.

```bash
# iOS dev build
pnpm build:ios:dev

# Android dev build
pnpm build:android:dev
```

또는 로컬 prebuild + run:
```bash
npx expo prebuild
npx expo run:ios --device
npx expo run:android --device
```

## 7. Sandbox 테스트

### iOS
1. App Store Connect → Users and Access → **Sandbox Testers** → 새 테스터 계정 생성
2. iOS 기기 설정 → App Store → 본인 계정 로그아웃
3. dev build 실행 → 페이월 진입 → "구매" → Sandbox 계정으로 로그인 프롬프트
4. 구매 흐름 진행 (실제 과금 X)
5. 구매 후 토스트 + Supabase `profiles.has_premium = true` 확인

### Android
1. Play Console에서 추가한 라이선스 테스터 계정의 Google 계정으로 기기 로그인
2. dev build를 internal testing track으로 업로드
3. internal test 링크로 설치 → 페이월 → "구매" → 테스트 결제 흐름

## 8. App Store / Google Play 심사 시 주의사항

- IAP가 있는 앱은 첫 제출 시 IAP 메타데이터(스크린샷, 리뷰 노트)를 함께 제출해야 한다
- 리뷰 노트에 "Record Upgrade is a one-time non-consumable purchase. It expands optional media capacity; core diary records remain free." 명시
- 환불 정책 안내 페이지(앱 내 또는 웹) 링크 제공 권장

## 9. 향후 개선 (Phase 2)

- **RevenueCat ↔ Supabase webhook**: 클라이언트 RPC sync 대신 서버 사이드 webhook으로 race condition 완전 제거
- **트라이얼 만료 알림**: D-1 push notification으로 conversion 유도
- **환불 처리**: RevenueCat의 refund webhook 받아 `mark_premium_revoked` RPC 호출
- **다국가 가격 차등**: RevenueCat offering으로 PPP(구매력평가) 기반 가격
- **A/B 테스트**: RevenueCat의 experiments 기능으로 페이월 카피/가격 실험

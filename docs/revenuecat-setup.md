# walkToo 기록 업그레이드 (RevenueCat) 세팅 가이드

walkToo의 구독 없는 1회성 업그레이드는 [RevenueCat](https://www.revenuecat.com)을 통해 Apple/Google IAP를 처리한다.
이 문서는 코드 통합이 끝난 상태에서 **사람이 콘솔에서 해야 하는 작업**을 정리한 체크리스트다.

## 0. 핵심 ID

| 항목 | 값 |
|---|---|
| **Product ID** (Apple/Google 동일) | `com.walktoo.record_upgrade` |
| **Entitlement ID** (RevenueCat) | `walktoo_record_upgrade` |
| **Offering ID** (RevenueCat) | `default` (현재 offering) |
| **Type** | Non-consumable (구독 없는 1회성 업그레이드) |
| **무료 체험** | 없음 |

코드에서는 `constants/premium.ts`의 `PREMIUM.PRODUCT_ID` / `PREMIUM.ENTITLEMENT_ID` 상수에 박혀 있으니 콘솔과 정확히 일치시켜야 한다.

---

## 1. Apple App Store Connect — IAP 등록

1. App Store Connect → My Apps → walkToo → **In-App Purchases**
2. **Create In-App Purchase**
   - Type: **Non-Consumable**
   - Reference Name: `walkToo Record Upgrade`
   - Product ID: `com.walktoo.record_upgrade`
3. 가격 설정:
   - 한국 (KRW): **₩2,200**
   - 글로벌 (USD): **$1.99**
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
   - 설명: `구독 없이 사진, 짧은 영상, 다이어리 테마 경험을 확장합니다`
3. 가격: **₩2,200** (다른 국가는 자동 환산)
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
4. **Entitlements**:
   - **+ Entitlement** → Identifier: `walktoo_record_upgrade` → Display name: `Record Upgrade`
   - 위 두 product를 이 entitlement에 attach
5. **Offerings**:
   - 기본 offering이 `default` 이름으로 자동 생성됨
   - **Packages**: `Lifetime` 패키지에 위 product들 attach
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
# 또는 Supabase Studio SQL Editor에 붙여넣고 Run
```

마이그레이션은:
- `profiles`에 `has_premium`, `premium_trial_ends_at`, `premium_purchased_at`, `revenuecat_user_id` 컬럼 추가
- `couples`에 `has_premium`, `premium_purchaser_id` 컬럼 추가
- RPC 3개 추가: `start_trial_if_needed`, `mark_premium_purchased`, `is_entitled`

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
- 리뷰 노트에 "Record Upgrade is a one-time non-consumable purchase. It expands optional media and decoration features; core diary records remain free." 명시
- 환불 정책 안내 페이지(앱 내 또는 웹) 링크 제공 권장

## 9. 향후 개선 (Phase 2)

- **RevenueCat ↔ Supabase webhook**: 클라이언트 RPC sync 대신 서버 사이드 webhook으로 race condition 완전 제거
- **트라이얼 만료 알림**: D-1 push notification으로 conversion 유도
- **환불 처리**: RevenueCat의 refund webhook 받아 `mark_premium_revoked` RPC 호출
- **다국가 가격 차등**: RevenueCat offering으로 PPP(구매력평가) 기반 가격
- **A/B 테스트**: RevenueCat의 experiments 기능으로 페이월 카피/가격 실험

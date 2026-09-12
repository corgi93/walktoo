# walkToo Store Release Console Runbook

작성일: 2026-08-15

이 문서는 Chrome에서 Apple App Store Connect, Google Play Console, Google Cloud/Firebase, RevenueCat, Supabase, Expo EAS를 열고 출시 준비를 끝내기 위한 실행 문서다. Claude나 다른 브라우저 보조 에이전트에게 이 파일을 그대로 주고 작업해도 값이 흔들리지 않도록, 현재 코드에 박힌 ID와 콘솔 입력값을 함께 고정한다.

목표는 iOS/Android 모두 RevenueCat 결제까지 붙인 첫 출시 제출이다. 단, Apple Developer/Google Play 개발자 계정 심사, D-U-N-S, 세금/은행/판매자 인증이 아직 끝나지 않았으면 하루 제출은 불가능할 수 있다.

## 0. Claude에게 줄 실행 프롬프트

Chrome에서 Claude를 켜고 아래 프롬프트를 먼저 붙여넣는다.

```text
나는 walkToo Expo React Native 앱을 iOS/Android 스토어에 출시하려고 한다.
아래 문서를 절대값 source of truth로 보고 Chrome 콘솔 작업을 순서대로 도와줘.

규칙:
- 문서의 ID, 가격, entitlement, package, bundle 값을 임의로 바꾸지 마.
- 각 콘솔 작업은 현재 화면에서 어디를 클릭해야 하는지 단계별로 말해줘.
- 계정 인증, 세금/은행, 권한 부족, 심사 제출 불가 같은 blocker가 보이면 즉시 멈추고 이유와 우회 순서를 알려줘.
- Apple/Google/RevenueCat 상품이 서로 연결되기 전에는 결제 테스트를 진행하지 마.
- "평생", "무료 업그레이드", "환불 불가", "영구 이용" 문구는 쓰지 마.
- 자동 갱신 없는 12개월 이용권이라는 표현을 유지해.
```

## 1. 출시 전 P0 게이트

아래 항목 중 하나라도 미완료면 콘솔 작업보다 먼저 정리한다.

- Apple Developer Program 유료 계정 활성화 완료
- App Store Connect Agreements, Tax, Banking 활성화 완료
- Google Play Developer 계정 검증 완료
- Google Play 결제 프로필, 판매자/조직 정보, 세금 정보 완료
- Supabase 운영 DB 마이그레이션 완료: `docs/db-apply-release.md`
- EAS project 접근 가능: owner `cogi`, project `walktoo`
- 실제 기기 2대 이상 준비: iPhone 1대, Android 1대
- 스토어 심사용 개인정보 처리방침 URL과 서비스 약관 URL 준비

### 현재 코드 기준 P0 주의점

이 항목은 콘솔만으로 해결되지 않는다. 빌드 전에 Codex/Claude에게 코드 패치를 맡긴다.

1. Google Sign-In iOS URL scheme 확인
   - 현재 `app.json`의 Google Sign-In plugin이 문자열만 있다.
   - iOS Google 로그인을 안정화하려면 `iosUrlScheme`이 필요할 수 있다.
   - Google iOS OAuth client 생성 후 나온 reversed client ID를 app config에 반영한다.

2. EAS production environment 연결
   - 현재 `eas.json` production profile에는 `"environment": "production"`이 없다.
   - EAS Environment Variables를 쓸 경우 production profile에 environment를 연결해야 한다.

3. Expo Push projectId
   - 코드가 `EXPO_PUBLIC_PROJECT_ID`를 읽는다.
   - production env에 `EXPO_PUBLIC_PROJECT_ID=fe8e3729-de65-4da5-9734-3ade2a92a40e`를 반드시 넣거나, app config fallback을 코드에 추가한다.

4. Android/iOS background location 권한
   - 현재 `app.json`은 Android `ACCESS_BACKGROUND_LOCATION`, iOS Always location description을 포함한다.
   - 실제 백그라운드 GPS 경로 기록을 출시 핵심 기능으로 심사 설명할 수 없으면 제거하는 편이 안전하다.
   - 유지하면 Google Play의 민감 권한 선언과 심사용 시연 영상/설명이 필요하다.

5. Naver Client Secret 노출
   - `EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET`은 앱에 포함되므로 진짜 secret으로 취급하면 안 된다.
   - 출시 전 권장안은 Supabase Edge Function 프록시로 이동이다.
   - 하루 출시가 목표면 최소한 키 제한/모니터링을 걸고, 출시 직후 서버 프록시로 옮긴다.

## 2. 현재 코드 고정값

### App

| 항목 | 값 |
|---|---|
| App name | `walkToo` |
| Expo slug | `walktoo` |
| Expo owner | `cogi` |
| EAS projectId | `fe8e3729-de65-4da5-9734-3ade2a92a40e` |
| URL scheme | `walktoo` |
| iOS Bundle ID | `com.walktoo.app` |
| Android Package Name | `com.walktoo.app` |
| Version | `1.0.0` |
| Primary category recommendation | Lifestyle |
| Secondary category recommendation | Health & Fitness |

### RevenueCat and Store Products

#### Couple Pass

| 항목 | 값 |
|---|---|
| 상품명 KR | `워크투 커플 패스 1년` |
| 상품명 EN | `walkToo Couple Pass Annual` |
| Apple Product ID | `com.walktoo.couple_pass_annual` |
| Google Subscription ID | `com.walktoo.couple_pass_annual` |
| Google Base Plan ID | `annual_prepaid` |
| RevenueCat Android Product ID | `com.walktoo.couple_pass_annual:annual_prepaid` |
| RevenueCat Entitlement ID | `walktoo_couple_pass` |
| RevenueCat Offering ID | `default` |
| iOS Type | Non-Renewing Subscription |
| Android Type | Subscription prepaid base plan |
| Duration | 12 months from purchase |
| Auto renew | No |
| Free trial | No |
| KRW price | `₩9,900` |
| USD price | `$6.99` |

Store description:

```text
구매일로부터 12개월 동안 사진과 짧은 영상 기록을 더 풍성하게 남깁니다. 자동 갱신은 없습니다.
```

Review note:

```text
Couple Pass is a non-renewing 12-month pass. It expands optional media capacity for the currently connected couple; core diary records remain free. It does not auto-renew.
```

#### Travel Mood Theme Pack

| 항목 | 값 |
|---|---|
| 상품명 KR | `여행 무드 테마팩` |
| 상품명 EN | `Travel Mood Theme Pack` |
| Product ID | `com.walktoo.theme_pack_travel` |
| RevenueCat Entitlement ID | `walktoo_theme_pack_travel` |
| Type | Non-consumable |
| KRW price | `₩3,300` |
| USD price | `$2.49` |
| Included themes | `vintage_film`, `dreamy_cloud`, `dark_academia` |

Store description:

```text
삿포로 필름, 홍콩 야경, 도쿄 레코드샵 무드의 다이어리 테마 3종을 사용할 수 있습니다.
```

### Do Not Register Yet

아래 상품은 코드에 상수만 있고 구매/복구/생성 플로우가 완성되지 않았으므로 스토어와 RevenueCat에 활성화하지 않는다.

| 상품 | Product ID |
|---|---|
| 커플 패스+테마팩 | `com.walktoo.bundle_couple_pass_theme` |
| 투로그 카드 이미지 | `com.walktoo.memory_card_image` |
| 투로그북 기본 | `com.walktoo.walk_book_basic` |
| 투로그북 긴 기간 | `com.walktoo.walk_book_extended` |
| 기념일 리포트 | `com.walktoo.anniversary_report` |

## 3. 하루 출시 작업 순서

이 순서대로 해야 재작업이 적다.

1. Apple/Google 계정, 세금/은행/판매자 상태 확인
2. Google Cloud/Firebase 프로젝트 생성
3. Google OAuth, Android SHA-1, iOS OAuth client 생성
4. Firebase/FCM v1, Expo push credentials 준비
5. App Store Connect 앱 생성, Bundle ID/capability/IAP 등록
6. Google Play 앱 생성, package, Play App Signing, 상품 등록
7. RevenueCat 프로젝트 생성, iOS/Android store 연결, products/entitlements/offerings 연결
8. EAS production env 등록
9. Supabase provider/redirect/DB 확인
10. Production build
11. EAS Submit 또는 콘솔 업로드
12. TestFlight/Internal testing 결제 검증
13. Store listing/privacy/data safety/permission declarations 완료
14. Review 제출

## 4. Chrome 탭 준비

아래 탭을 미리 열어둔다.

- Apple Developer: https://developer.apple.com/account
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- Google Cloud Console: https://console.cloud.google.com
- Firebase Console: https://console.firebase.google.com
- RevenueCat: https://app.revenuecat.com
- Expo Dashboard: https://expo.dev/accounts/cogi/projects/walktoo
- Supabase Dashboard: https://supabase.com/dashboard

## 5. Account and Organization Setup

### Apple

권장 계정:

- 개인 Apple ID가 아니라 조직 Apple Developer 계정
- 조직 등록이면 legal entity와 D-U-N-S 필요
- Account Holder는 대표 또는 권한 있는 사람
- 개발자/운영자는 App Manager 또는 Admin 권한으로 초대

확인:

- Membership active
- Agreements active
- Paid Apps agreement active
- Tax and Banking active
- Users and Access에서 API key 생성 가능 권한 보유

### Google

권장 계정:

- 개인 Gmail 하나에 묶지 말고 조직 Google Play Developer 계정
- 조직 계정이면 법적 이름/주소와 D-U-N-S/결제 프로필 일치 확인
- Owner는 대표 또는 공용 운영 계정
- 개발자는 Play Console user 권한으로 초대

확인:

- Developer account verified
- Payments profile complete
- Merchant/payment setup complete
- Play App Signing 사용 가능
- Internal testing track 사용 가능

## 6. Google Cloud and Firebase

### 6.1 Project

1. Google Cloud Console 접속
2. Project 생성: `walktoo-production`
3. Billing 연결
4. APIs and Services에서 필요한 API 활성화

필수:

- Google Sign-In/OAuth
- Android Publisher API
- Firebase Cloud Messaging API

장소 fallback을 Google로도 쓸 경우:

- Places API
- Geocoding API
- Maps SDK for iOS
- Maps SDK for Android

### 6.2 OAuth Consent Screen

1. APIs and Services > OAuth consent screen
2. App name: `walkToo`
3. User support email: 운영 이메일
4. Developer contact email: 운영 이메일
5. Publishing status: Production
6. Scopes: 기본 profile/email 수준만 사용

### 6.3 OAuth Clients

Create Credentials > OAuth client ID에서 생성한다.

#### Web client

- Type: Web application
- Name: `walkToo Web OAuth`
- 저장 후 Client ID를 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`에 사용

#### iOS client

- Type: iOS
- Name: `walkToo iOS`
- Bundle ID: `com.walktoo.app`
- 저장 후 Client ID를 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`에 사용
- Reversed client ID를 `app.json` Google Sign-In plugin의 `iosUrlScheme`에 사용

#### Android client

- Type: Android
- Name: `walkToo Android Play Signing`
- Package name: `com.walktoo.app`
- SHA-1: Play Console > Release > Setup > App integrity에서 App signing certificate SHA-1 사용

주의:

- Play App Signing 전에는 upload key SHA-1과 app signing SHA-1이 다를 수 있다.
- 내부 테스트 업로드 후 Play Console에서 app signing SHA-1을 확인해 Android OAuth client에 추가한다.
- 개발 빌드 테스트가 필요하면 EAS/dev keystore SHA-1도 별도 Android OAuth client로 추가한다.

### 6.4 Firebase and FCM v1

1. Firebase Console에서 `walktoo-production` 프로젝트 연결
2. Android app 추가
   - Android package: `com.walktoo.app`
   - App nickname: `walkToo Android`
3. iOS app 추가
   - Bundle ID: `com.walktoo.app`
   - App nickname: `walkToo iOS`
4. Cloud Messaging 확인
5. FCM v1 service account credential을 Expo/EAS credentials에 연결

Expo push를 쓰는 현재 구조에서는 클라이언트가 Expo Push Token을 받고 서버가 Expo Push API로 발송한다. Android 푸시가 production에서 동작하려면 FCM v1 credential이 EAS/Expo 쪽에 연결되어 있어야 한다.

## 7. Apple Developer and App Store Connect

### 7.1 Bundle ID

Apple Developer > Certificates, Identifiers & Profiles > Identifiers:

- Type: App IDs
- Description: `walkToo`
- Bundle ID: `com.walktoo.app`

Capabilities:

- Sign in with Apple
- Push Notifications
- In-App Purchase

권한이 실제로 필요한지 확인:

- Location
- Motion
- Camera
- Microphone

### 7.2 App Store Connect App

App Store Connect > My Apps > New App:

- Platform: iOS
- Name: `walkToo`
- Primary language: Korean
- Bundle ID: `com.walktoo.app`
- SKU: `walktoo-ios`
- User Access: Full Access

App Information:

- Category: Lifestyle
- Secondary Category: Health & Fitness
- Content Rights: 앱 내 자체 콘텐츠와 사용자 생성 콘텐츠 중심
- Age Rating: 위치/사용자 콘텐츠/사진/영상 사용 여부를 보수적으로 답변

### 7.3 Apple Sign In

확인:

- App ID에 Sign in with Apple enabled
- `app.json`에 `ios.usesAppleSignIn = true`
- production iOS build에서 Apple 로그인 버튼이 표시되고 실제 로그인 가능

### 7.4 App Store IAP

App Store Connect > walkToo > Monetization > In-App Purchases:

#### Couple Pass

- Type: Non-Renewing Subscription
- Reference Name: `walkToo Couple Pass Annual`
- Product ID: `com.walktoo.couple_pass_annual`
- Price: Korea `₩9,900`, US `$6.99`
- Display Name KR: `워크투 커플 패스 1년`
- Description KR: `구매일로부터 12개월 동안 사진과 짧은 영상 기록을 더 풍성하게 남깁니다. 자동 갱신은 없습니다.`
- Display Name EN: `walkToo Couple Pass Annual`
- Description EN: `A non-renewing 12-month pass that expands optional media capacity for the currently connected couple.`
- Review screenshot: paywall screen
- Status target: Ready to Submit

#### Theme Pack

- Type: Non-Consumable
- Reference Name: `walkToo Travel Mood Theme Pack`
- Product ID: `com.walktoo.theme_pack_travel`
- Price: Korea `₩3,300`, US `$2.49`
- Display Name KR: `여행 무드 테마팩`
- Description KR: `삿포로 필름, 홍콩 야경, 도쿄 레코드샵 무드의 다이어리 테마 3종을 사용할 수 있습니다.`
- Display Name EN: `Travel Mood Theme Pack`
- Description EN: `Unlock three travel-inspired diary themes.`
- Review screenshot: theme selection/paywall screen
- Status target: Ready to Submit

첫 제출에서는 앱 버전 심사에 IAP를 함께 포함한다.

### 7.5 Sandbox Tester

Users and Access > Sandbox:

- sandbox tester 2개 생성
- 테스트 기기 App Store 계정은 일반 계정 로그아웃
- 구매 프롬프트에서 sandbox tester 로그인

### 7.6 App Privacy

App Store Connect > App Privacy는 보수적으로 작성한다. 실제 수집/연동 기준:

- Contact Info: email, optional phone/name if enabled
- User Content: diary text, photos, short videos
- Identifiers: user ID, push token, RevenueCat app user ID
- Purchases: IAP purchase state
- Location: selected/recorded place and coordinates
- Health/Fitness or Motion: step/motion-derived activity data
- Diagnostics: crash/log data only if connected service collects it

Tracking:

- 광고/타사 추적 SDK가 없으면 tracking은 No로 답변

Review note에 넣을 문구:

```text
walkToo is a private couple diary app. Users can record daily walks, short notes, photos, videos, and optional places. Couple Pass is a non-renewing 12-month pass; it does not auto-renew. Core diary records remain free.
```

Background location을 유지하는 경우 추가 설명:

```text
Location access is used only when a user records or selects a place for a diary entry. Background location is requested only if the user enables walk tracking. The app does not sell location data or use it for advertising.
```

실제 백그라운드 트래킹 기능을 설명할 수 없으면 background location permission을 빌드에서 제거한다.

## 8. Google Play Console

### 8.1 Create App

Play Console > Create app:

- App name: `walkToo`
- Default language: Korean
- App or game: App
- Free or paid: Free
- Declarations: 앱이 정책을 준수한다고 확인

App setup:

- Package name after first upload: `com.walktoo.app`
- App category: Lifestyle
- Tags: diary, lifestyle, health/fitness 관련 태그 중 실제와 맞는 것만 선택
- Contact details: 운영 이메일, website, privacy policy URL

### 8.2 Play App Signing

첫 AAB 업로드 후:

- Release > Setup > App integrity
- Play App Signing 활성화
- App signing certificate SHA-1 복사
- Google Cloud Android OAuth client에 package `com.walktoo.app` + SHA-1 추가

### 8.3 Internal Testing Track

1. Testing > Internal testing
2. 테스터 이메일 리스트 생성
3. 첫 AAB 업로드
4. rollout은 internal로 시작
5. 테스트 링크로 Android 실기기 설치

### 8.4 Google Play Subscription

Monetize with Play > Products > Subscriptions:

- Product ID: `com.walktoo.couple_pass_annual`
- Name: `워크투 커플 패스 1년`
- Description: `구매일로부터 12개월 동안 사진과 짧은 영상 기록을 더 풍성하게 남깁니다. 자동 갱신은 없습니다.`

Base plan:

- Base plan ID: `annual_prepaid`
- Type: Prepaid
- Duration: 1 year
- Auto-renewing: No
- Price KR: `₩9,900`
- Price US: `$6.99`
- Status: Active

RevenueCat에서 쓸 Android product identifier는 `com.walktoo.couple_pass_annual:annual_prepaid`다.

### 8.5 Google Play In-App Product

Monetize with Play > Products > In-app products:

- Product ID: `com.walktoo.theme_pack_travel`
- Name: `여행 무드 테마팩`
- Description: `삿포로 필름, 홍콩 야경, 도쿄 레코드샵 무드의 다이어리 테마 3종을 사용할 수 있습니다.`
- Type: Managed product / non-consumable equivalent
- Price KR: `₩3,300`
- Price US: `$2.49`
- Status: Active

### 8.6 License Testers

Setup > License testing:

- 결제 테스트용 Google 계정 추가
- Internal testing 테스터 리스트에도 같은 계정 추가

### 8.7 Data Safety

Google Play Data Safety는 App Store privacy와 일관되게 작성한다.

수집 가능 데이터:

- Personal info: email, name/nickname, optional phone
- Photos and videos: user uploads
- Location: selected place/coordinates
- App activity: diary/activity records
- Health and fitness: step/activity data if declared by Play category
- Device or other IDs: user ID, push token, RevenueCat ID
- Purchase history: IAP entitlement

Data sharing:

- Supabase, RevenueCat, Expo Push, Google/Apple auth 등 processor/SDK 사용 여부를 실제 약관 기준으로 답변
- 광고/추적 목적 공유가 없으면 광고 추적은 No

### 8.8 Sensitive Permissions

현재 Android permissions:

- `ACTIVITY_RECOGNITION`
- `CAMERA`
- `POST_NOTIFICATIONS`
- `ACCESS_FINE_LOCATION`
- `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `RECORD_AUDIO`
- `FOREGROUND_SERVICE`
- `FOREGROUND_SERVICE_LOCATION`
- `RECEIVE_BOOT_COMPLETED`

권장:

- 하루 출시라면 background location이 정말 필요한지 먼저 결정한다.
- 필요 없으면 코드에서 제거하고 다시 빌드한다.
- 유지하면 Play Console의 background location declaration과 심사용 영상/설명을 준비한다.

심사용 설명 초안:

```text
walkToo uses location to let a couple save the place of a walk or diary entry. Location is shown only to the connected couple. The app does not use location for advertising or third-party tracking.
```

## 9. RevenueCat

### 9.1 Project

RevenueCat > New Project:

- Project name: `walkToo`

Apps:

- iOS app
  - App name: `walkToo iOS`
  - Bundle ID: `com.walktoo.app`
  - Store: App Store
- Android app
  - App name: `walkToo Android`
  - Package name: `com.walktoo.app`
  - Store: Google Play

### 9.2 Service Credentials

Apple:

- App Store Connect > Users and Access > Integrations > App Store Connect API
- Create API Key
- 권장 role: App Manager 이상
- `.p8`, Key ID, Issuer ID를 안전한 곳에 저장
- RevenueCat iOS app settings에 업로드

Google:

- Google Cloud IAM에서 RevenueCat용 service account 생성
- Play Console API access에서 service account 연결
- 최소 권한으로 앱/주문/구독 조회 및 관리 권한 부여
- JSON key를 RevenueCat Android app settings에 업로드

### 9.3 Products

Products에 추가:

- Apple `com.walktoo.couple_pass_annual`
- Apple `com.walktoo.theme_pack_travel`
- Google `com.walktoo.couple_pass_annual:annual_prepaid`
- Google `com.walktoo.theme_pack_travel`

RevenueCat에서 Google subscription은 base plan까지 포함한 `subscription_id:base_plan_id` 형식으로 잡는다.

### 9.4 Entitlements

Entitlements:

- Identifier: `walktoo_couple_pass`
  - Display name: `Couple Pass`
  - Attach:
    - Apple `com.walktoo.couple_pass_annual`
    - Google `com.walktoo.couple_pass_annual:annual_prepaid`

- Identifier: `walktoo_theme_pack_travel`
  - Display name: `Travel Mood Theme Pack`
  - Attach:
    - Apple `com.walktoo.theme_pack_travel`
    - Google `com.walktoo.theme_pack_travel`

### 9.5 Offering

Offerings:

- Offering ID: `default`
- Mark as current
- Package for Couple Pass:
  - package identifier: `$rc_annual` 또는 custom `couple_pass_annual`
  - product: platform별 couple pass product
- Package for Theme Pack:
  - custom identifier: `theme_pack`
  - product: platform별 theme pack product

코드는 theme pack product를 전체 offering에서 product ID로 찾으므로, current offering 안에 두는 것이 가장 단순하다.

### 9.6 SDK Keys

RevenueCat > Project settings > API keys:

- iOS public SDK key -> `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- Android public SDK key -> `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

## 10. EAS Environment Variables

Expo Dashboard > Project > Environment variables 또는 EAS CLI로 production env를 만든다.

현재 코드에 필요한 production variables:

```bash
EXPO_PUBLIC_PROJECT_ID=fe8e3729-de65-4da5-9734-3ade2a92a40e
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=goog_xxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_LOCATION_PROVIDER=naver
EXPO_PUBLIC_NAVER_DEV_CLIENT_ID=YOUR_NAVER_CLIENT_ID
EXPO_PUBLIC_NAVER_DEV_CLIENT_SECRET=YOUR_NAVER_CLIENT_SECRET
EXPO_PUBLIC_NAVER_MAP_CLIENT_ID=YOUR_NCP_MAP_CLIENT_ID
EXPO_PUBLIC_NAVER_MAP_WEB_BASE_URL=https://walktoo.local
EXPO_PUBLIC_NCP_API_KEY_ID=YOUR_NCP_API_KEY_ID
EXPO_PUBLIC_NCP_API_KEY=YOUR_NCP_API_KEY
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR_GOOGLE_MAPS_KEY
EXPO_PUBLIC_AES_KEY=YOUR_AES_KEY
```

EAS CLI 예시:

```bash
eas env:set --name EXPO_PUBLIC_PROJECT_ID --value fe8e3729-de65-4da5-9734-3ade2a92a40e --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxxxxxxxxxxxxxxxxxxxxxxxxx --environment production --visibility sensitive
eas env:set --name EXPO_PUBLIC_REVENUECAT_ANDROID_KEY --value goog_xxxxxxxxxxxxxxxxxxxxxxxxxx --environment production --visibility sensitive
eas env:list --environment production
```

주의:

- `EXPO_PUBLIC_*` 값은 최종 앱 번들에서 읽을 수 있으므로 진짜 secret을 넣지 않는다.
- EAS visibility `sensitive`는 로그/대시보드 노출을 줄일 뿐, 클라이언트 앱에 포함되는 값 자체를 비밀로 만들지는 않는다.
- `eas.json` production profile에 `"environment": "production"`이 있어야 production env가 빌드에 안정적으로 들어간다.

## 11. Supabase

### 11.1 DB

`docs/db-apply-release.md` 기준으로 운영 DB SQL을 적용한다.

필수 확인:

- `idx_walks_unique_couple_date_kind`
- `profiles.premium_expires_at`
- `couples.premium_expires_at`
- `profiles.has_theme_pack`
- `couples.has_theme_pack`
- RPC:
  - `create_walk_with_entry`
  - `add_entry_to_walk`
  - `join_couple_by_code`
  - `disconnect_couple`
  - `mark_premium_purchased`
  - `mark_premium_revoked`
  - `mark_theme_pack_purchased`
  - `mark_theme_pack_revoked`
  - `is_entitled`

### 11.2 Auth Providers

Supabase Dashboard > Authentication > Providers:

Google:

- Enable Google
- Client ID: Google Web OAuth client ID
- Client Secret: Google Web OAuth client secret

Apple:

- Enable Apple
- Apple Services/Client configuration은 Supabase Apple provider 가이드에 맞춰 등록
- Native iOS는 ID token sign-in 경로를 테스트한다.

Redirect URLs:

- `walktoo://auth/callback`
- Expo/dev client preview redirect가 필요하면 개발용 URL도 별도 등록

### 11.3 Storage

확인:

- 사진/영상 bucket 존재
- RLS policy 적용
- 업로드/삭제 테스트
- 공개 URL/서명 URL 정책이 앱 코드와 일치

## 12. Build and Submit

### 12.1 Local Preflight

```bash
pnpm install
npx tsc --noEmit
pnpm lint
git status --short --branch
```

실패하면 제출하지 않는다.

### 12.2 Dev/Sandbox Build

```bash
pnpm build:ios:dev
pnpm build:android:dev
```

실기기 확인:

- Apple login
- Google login
- 커플 연결
- 기록 작성
- 사진 업로드
- 영상 기록
- 위치 선택
- 푸시 권한/토큰 저장
- paywall 진입
- RevenueCat offering 로드

### 12.3 Production Build

```bash
pnpm build:production:all
```

빌드 완료 후:

- iOS `.ipa`는 App Store Connect/TestFlight로 제출
- Android `.aab`는 Play Console internal testing으로 제출

EAS Submit:

```bash
pnpm submit:ios
pnpm submit:android
```

EAS Submit은 바이너리 업로드 도구다. 스토어 listing, screenshots, privacy, data safety, review notes는 콘솔에서 따로 완료해야 한다.

## 13. Sandbox Purchase Test

### iOS TestFlight

1. TestFlight processing 완료 확인
2. Sandbox tester 계정 준비
3. TestFlight 앱 설치
4. 로그인
5. 커플 연결
6. Paywall 진입
7. Couple Pass 구매
8. RevenueCat customer page에서 entitlement 활성 확인
9. Supabase 확인:

```sql
SELECT id, has_premium, premium_purchased_at, premium_expires_at, revenuecat_user_id
FROM public.profiles
WHERE has_premium = true
ORDER BY premium_purchased_at DESC
LIMIT 10;
```

10. 상대방 계정에서도 premium 적용 확인
11. Restore purchases 확인
12. Theme Pack 구매/복구 확인

### Android Internal Testing

1. Internal testing AAB 활성화
2. License tester 계정으로 Play Store 로그인
3. 테스트 링크로 앱 설치
4. Paywall 진입
5. Couple Pass prepaid purchase
6. RevenueCat entitlement 활성 확인
7. Supabase premium state 확인
8. Theme Pack 구매/복구 확인
9. Google login이 안 되면 Play app signing SHA-1을 Google Cloud Android OAuth client에 추가했는지 확인

## 14. Store Listing Assets

필수:

- App icon
- Feature graphic for Google Play
- Phone screenshots
- Privacy policy URL
- Terms URL
- Support email
- Marketing URL은 선택

추천 스크린샷 흐름:

1. 로그인/온보딩
2. 홈/커플 연결
3. 오늘 기록 작성
4. 둘 다 작성 후 공개
5. 지도/기록 모아보기
6. Paywall

Short description KR:

```text
커플이 각자의 하루를 투로그로 남기고, 둘 다 남기면 서로의 기록이 열리는 산책 다이어리
```

Full description KR:

```text
walkToo는 커플이 각자의 하루와 함께 걷는 시간을 투로그로 가볍게 남기는 산책 다이어리입니다.
사진이나 짧은 영상, 최대 30자의 한마디, 걸음 수를 기록하고 둘 다 작성하면 서로의 하루가 열립니다.
기본 기록은 무료로 사용할 수 있고, 커플 패스는 사진과 짧은 영상 기록을 더 풍성하게 확장합니다.
커플 패스는 자동 갱신 없는 12개월 이용권입니다.
```

Review notes:

```text
Test account:
- Email: REVIEW_TEST_EMAIL
- Password: REVIEW_TEST_PASSWORD

Purchase:
- Couple Pass is a non-renewing 12-month pass.
- It expands optional media capacity for the currently connected couple.
- Core diary records remain free.
- It does not auto-renew.
```

## 15. Final Review Checklist

### iOS

- [ ] App Store Connect app created
- [ ] Bundle ID `com.walktoo.app`
- [ ] Sign in with Apple capability enabled
- [ ] Push Notifications capability enabled
- [ ] IAP `com.walktoo.couple_pass_annual` Ready to Submit
- [ ] IAP `com.walktoo.theme_pack_travel` Ready to Submit
- [ ] Sandbox tester created
- [ ] App Privacy completed
- [ ] Screenshots uploaded
- [ ] Review notes include test account and IAP explanation
- [ ] TestFlight build selected
- [ ] IAP attached to app review submission

### Android

- [ ] Play app created
- [ ] Package `com.walktoo.app`
- [ ] Play App Signing enabled
- [ ] App signing SHA-1 added to Google Cloud Android OAuth client
- [ ] Internal testing track created
- [ ] Subscription `com.walktoo.couple_pass_annual`
- [ ] Base plan `annual_prepaid`
- [ ] In-app product `com.walktoo.theme_pack_travel`
- [ ] License tester added
- [ ] Data Safety completed
- [ ] Sensitive permission declarations completed
- [ ] Screenshots and feature graphic uploaded
- [ ] Internal testing purchase works

### RevenueCat

- [ ] iOS app connected
- [ ] Android app connected
- [ ] App Store Connect API key uploaded
- [ ] Google service account JSON uploaded
- [ ] Apple couple pass product linked
- [ ] Apple theme pack product linked
- [ ] Google couple pass product `com.walktoo.couple_pass_annual:annual_prepaid` linked
- [ ] Google theme pack product linked
- [ ] Entitlement `walktoo_couple_pass`
- [ ] Entitlement `walktoo_theme_pack_travel`
- [ ] Offering `default` marked current
- [ ] iOS SDK key in EAS production env
- [ ] Android SDK key in EAS production env

### App Runtime

- [ ] `npx tsc --noEmit` pass
- [ ] `pnpm lint` pass
- [ ] iOS login pass
- [ ] Android login pass
- [ ] Push token saved
- [ ] Place search works or text fallback works
- [ ] Photo/video upload works
- [ ] Couple Pass purchase works
- [ ] Restore purchase works
- [ ] Theme Pack purchase works
- [ ] Supabase entitlement sync works
- [ ] Partner account receives premium benefit

## 16. Known Launch Risks

1. Background location permission can delay review.
   - Remove if not absolutely needed.

2. Naver search secret is client-exposed.
   - Move to server proxy as soon as possible.

3. RevenueCat webhook is not the primary sync path yet.
   - Current app uses client-side sync/self-healing.
   - Add webhook after first release for refund/revoke/race-condition hardening.

4. Google prepaid plans need exact RevenueCat identifier.
   - Use `com.walktoo.couple_pass_annual:annual_prepaid`, not just `com.walktoo.couple_pass_annual`.

5. EAS env must be connected to production profile.
   - Missing env causes RevenueCat, push, maps, Google login failures in production binary.

## 17. Official References

- Expo submit overview: https://docs.expo.dev/deploy/submit-to-app-stores/
- Expo iOS submit: https://docs.expo.dev/submit/ios/
- Expo Android submit: https://docs.expo.dev/submit/android/
- Expo EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- Expo push setup: https://docs.expo.dev/push-notifications/push-notifications-setup/
- Expo FCM credentials: https://docs.expo.dev/push-notifications/fcm-credentials/
- Expo Google authentication: https://docs.expo.dev/guides/google-authentication/
- Expo Apple Authentication: https://docs.expo.dev/versions/latest/sdk/apple-authentication/
- React Native Google Sign-In Expo setup: https://react-native-google-signin.github.io/docs/setting-up/expo
- React Native Google Sign-In config: https://react-native-google-signin.github.io/docs/setting-up/get-config-file
- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Apple Auth: https://supabase.com/docs/guides/auth/social-login/auth-apple
- RevenueCat App Store Connect API key: https://www.revenuecat.com/docs/service-credentials/itunesconnect-app-specific-shared-secret/app-store-connect-api-key-configuration
- RevenueCat Google service credentials: https://www.revenuecat.com/docs/service-credentials/creating-play-service-credentials
- RevenueCat Google prepaid plans: https://www.revenuecat.com/docs/subscription-guidance/google-prepaid-plans
- RevenueCat Google product setup: https://www.revenuecat.com/docs/getting-started/entitlements/android-products
- Apple D-U-N-S: https://developer.apple.com/help/account/membership/D-U-N-S/
- Apple program enrollment: https://developer.apple.com/help/account/membership/program-enrollment/
- Apple IAP types: https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types/
- Apple submit IAP: https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-in-app-purchase/
- Apple app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Google Play account requirements: https://support.google.com/googleplay/android-developer/answer/13628312
- Google Play subscriptions: https://support.google.com/googleplay/android-developer/answer/140504
- Google Play in-app products: https://support.google.com/googleplay/android-developer/answer/1153481
- Google Play app signing SHA-1: https://developers.google.com/android/guides/client-auth
- Google API key restrictions: https://docs.cloud.google.com/docs/authentication/api-keys

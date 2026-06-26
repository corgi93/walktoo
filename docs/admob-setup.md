# walkToo AdMob 세팅 가이드

walkToo 광고는 무료 사용자에게만 낮은 빈도로 노출한다. 배너, 전면, 보상형 광고는 쓰지 않고 Native Ad 카드만 사용한다.

## 1. 현재 정책

| 항목 | 값 |
|---|---|
| SDK | `react-native-google-mobile-ads` |
| 포맷 | Native Ad |
| 위치 | 기록 탭 하단 |
| 빈도 | 세션당 최대 1회 |
| 조건 | 무료 사용자 + 산책 기록 5개 이상 |
| 프리미엄/트라이얼 | 광고 없음 |

## 2. 현재 코드 위치

- 광고 정책 상수: `constants/ads.ts`
- AdMob 초기화: `lib/ads/index.ts`
- 광고 카드 UI: `components/feature/ads/NativeAdCard.tsx`
- 노출 위치: `app/(tabs)/records.tsx`

## 3. AdMob 콘솔에서 만들 것

1. AdMob에서 앱 추가
   - Android package: `com.walktoo.app`
   - iOS bundle id: `com.walktoo.app`
2. Native Ad Unit 생성
3. 발급된 값을 환경변수에 넣기

```bash
EXPO_PUBLIC_ADMOB_NATIVE_AD_UNIT_ID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
```

## 4. 앱 ID 교체

`app.json`의 `react-native-google-mobile-ads` 플러그인에는 현재 Google 테스트 App ID가 들어가 있다.
출시 전에는 AdMob에서 발급받은 실제 App ID로 교체해야 한다.

```json
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy",
    "iosAppId": "ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy"
  }
]
```

## 5. 빌드 주의

이 SDK는 native module이라 Expo Go에서는 작동하지 않는다. `app.json` 플러그인 변경 후 dev/prod client를 새로 빌드해야 한다.

```bash
pnpm build:android:dev
pnpm build:ios:dev
```

광고 로드에 실패하면 앱은 조용히 광고를 숨긴다.

# Designer 가이드

walkToo의 디자인은 **토스 디자인 리드**의 사고방식을 기준으로 한다. 도메인은 다르지만, "사용자의 인지 부하를 줄이고 본질에 집중시키는" 원칙은 그대로 적용한다.

## 페르소나 — 토스 디자인 리드

- **"왜?"를 끝까지 묻는다.** 화면에 무언가를 추가할 때마다 "이게 사용자에게 진짜로 필요한가?"를 통과해야 한다.
- **빼는 것이 디자인이다.** 추가보다 정리가 어렵다. 비슷한 정보, 중복 CTA, 장식 요소를 먼저 의심한다.
- **1픽셀 단위로 집착한다.** 정렬·간격·위계가 어긋나면 사용자는 이유를 모른 채 신뢰를 잃는다.
- **데이터/사용자 행동으로 결정한다.** "예쁘다"는 결정 근거가 아니다.
- **빠른 반복.** 시안 한 장보다 동작하는 프로토타입 한 번이 더 많이 가르쳐 준다.

## walkToo에 적용

- 핵심 톤은 따뜻한 로즈 코랄 + 레트로 픽셀이다. 톤을 지키되, **사용성이 톤보다 우선**이다. 픽셀 스타일 때문에 가독성·터치 영역·접근성이 깨지면 안 된다.
- 다이어리 꾸미기 같은 **표현 영역**은 자유롭게 두되, **정보 영역**(기록·일정·메모·결제)은 인지 부하를 최소화한다.
- 한 화면에는 **한 가지 목적**. 보조 액션은 명확히 작게 둔다.
- **Empty / Loading / Error 상태**도 정식 화면이다. 비어 있을 때가 첫인상인 경우가 많다.
- **텍스트도 디자인이다.** 카피가 길어지면 디자인이 책임진 게 아니다. 짧고 다정한 한국어로 다듬는다.

## 시각 레퍼런스

### 한글 폰트

- 새 폰트 제안은 **한글 적용 여부를 먼저 검증**한다. 한국어 본문, 버튼, 탭, 알림, 다이어리 캡션에서 깨지거나 시스템 fallback으로 튀면 채택하지 않는다.
- `NeoDunggeunmo`는 현재 브랜드 픽셀 톤의 기본값이다. 다만 긴 본문, 작은 caption, 숫자/날짜가 많은 정보 화면에서 가독성이 떨어지면 아래 한글 폰트와 역할을 나눌 수 있다.
- 추천 한글 후보:
  - `Galmuri11` 또는 `Galmuri14`: 도트/레트로 감성을 유지하면서 한글을 직접 지원하는 픽셀 후보. 제목, 배지, 짧은 상태 문구, 게임풍 UI에 적합하다. 본문 전체에는 피로할 수 있다.
  - `Pretendard`: 가장 안전한 현대 UI 한글 후보. 기록/일정/결제처럼 정보 밀도가 높은 화면의 본문, 숫자, 보조 정보에 적합하다.
  - `SUIT`: 모바일 UI 본문용 후보. 차분하고 정돈된 인상이 필요할 때 `Pretendard` 대안으로 검토한다.
  - `Noto Sans KR` 또는 `Source Han Sans KR`: 글리프 커버리지와 호환성을 최우선으로 보는 fallback 후보.
- 권장 조합:
  - 기본 픽셀 톤 유지: `NeoDunggeunmo` 단일.
  - 가독성 보강: `NeoDunggeunmo` for headings/buttons + `Pretendard` or `SUIT` for body/caption/numbers.
  - 더 선명한 도트 강화: `Galmuri11` for display/labels + `Pretendard` or `SUIT` for body.
- 한글 폰트를 바꾸면 iOS/Android에서 `bodySmall`, `label`, `headingSmall`, 긴 한국어 버튼, 숫자/날짜가 섞인 문장을 반드시 확인한다.

### Fontshare

- Fontshare 후보는 한글 커버리지가 없는 경우가 많으므로 **한국어 UI의 주 폰트로 쓰지 않는다.** 한글 폰트가 먼저 정해진 뒤 라틴/숫자/영문 디스플레이 accent로만 붙인다.
- React Native 앱에서는 Fontshare CDN CSS를 직접 런타임 의존성으로 두지 않는다. 채택 시 라이선스와 글리프 범위를 확인한 뒤 `src/assets/fonts/`에 font file을 넣고 `expo-font`로 로드한다.
- 한 화면에서 폰트 패밀리는 기본 1개, 강한 프로모션/다이어리 표현 화면에서도 최대 2개까지만 쓴다.
- 추천 조합:
  - `Pretendard/SUIT + Satoshi`: 한국어 본문 가독성을 유지하면서 영문/숫자만 더 세련되게 보강한다.
  - `Pretendard/SUIT + Cabinet Grotesk`: 둥글고 따뜻한 영문 accent가 필요할 때 쓴다.
  - `Galmuri/NeoDunggeunmo + Array`: 픽셀에 가까운 디스플레이 조합. 스플래시, 이벤트 타이틀, 한두 단어짜리 영문 장식에만 제한한다.
  - `Galmuri/NeoDunggeunmo + Clash Display`: 레트로 게임 타이틀처럼 강한 화면에만 쓴다. 홈/기록 같은 반복 사용 화면에는 과하다.
  - `Pretendard/SUIT + Sentient` 또는 `Zodiak`: 다이어리/추억/포토북의 영문 캡션이나 에디토리얼 타이틀 후보. UI 본문에는 쓰지 않는다.
- 피한다: 긴 all-caps 문장, 한국어 fallback이 어색한 본문, 과한 serif 감성, `displayLarge`보다 작은 크기의 장식 폰트 남용.

### Magic UI

- Magic UI는 React/Tailwind/Motion 기반 animated component 레퍼런스다. 이 앱은 React Native이므로 라이브러리를 그대로 설치하는 기준이 아니라 **motion density, glow, shimmer, reveal 패턴의 참고 자료**로만 사용한다.
- 구현은 기존 토큰(`src/styles/theme.ts`, `src/styles/type.ts`)과 RN 기본 `Animated`, `react-native-svg`, 이미 설치된 Expo/RN API 안에서 먼저 검토한다. 새 animation dependency는 디자인 이득과 유지비를 설명할 수 있을 때만 제안한다.
- 어울리는 사용처: 온보딩의 한 장면, 프리미엄/paywall 하이라이트, 다이어리 저장 완료, Empty 상태의 작은 즐거움.
- 피한다: 대형 gradient/orb 배경, 과한 glow, 랜딩 페이지식 hero 구성, 반복 사용 화면에서 계속 움직이는 장식, 텍스트 가독성을 해치는 shimmer.
- Magic UI에서 영감을 받더라도 walkToo의 픽셀 스타일은 `shadowRadius: 0`, 작은 radius, 명확한 border, 로즈 코랄/웜 surface 토큰 안에서 재해석한다.

## 검토 체크리스트

1. **왜 필요한가** — 이 화면/요소가 사라지면 사용자가 실제로 불편한가?
2. **위계** — 가장 중요한 정보가 가장 먼저, 가장 크게 보이는가?
3. **상태** — Empty / Loading / Error / Disabled가 정의되어 있는가?
4. **접근성** — 최소 터치 영역(44pt), 색 대비, 폰트 가독성(`NeoDunggeunmo`의 한계 포함)을 점검했는가?
5. **일관성** — `src/styles/theme.ts`·`src/styles/type.ts`·`src/styles/diaryThemes.ts` 토큰을 벗어나지 않는가? 비슷한 패턴이 이미 있다면 그것을 따른다.
6. **카피** — 한국어가 짧고 명확한가? 사용자를 가르치려 들지 않는가?
7. **마이크로 인터랙션** — 누른 직후 피드백이 있는가? 너무 화려한 애니메이션은 인지 부하다.

## 산출물 톤

- 디자인 제안은 **"왜 필요한지 → 무엇을 바꾸는지 → 어떻게 검증할지"** 순서로 정리한다.
- 화면 단위가 아니라 **사용자 여정 단위**로 본다.
- 기획(planner)·Expo 개발 가이드와 충돌하는 결정은 그 사실을 명시한다.

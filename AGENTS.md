# walkToo Codex Guide

이 문서는 Codex가 이 저장소에서 작업할 때 유지해야 할 핵심 컨텍스트다. Claude 전용 권한 설정(`.claude/settings.local.json`)은 옮기지 않는다.

## Project

- Expo Router 기반 React Native 앱이다. 패키지 매니저는 `pnpm`을 우선 사용한다.
- 앱 이름은 `walkToo`: 커플 산책 다이어리 앱. 걸음 수, 메모, 사진을 각자 기록하고 둘 다 완성하면 공개되는 흐름이 핵심이다.
- 경로 alias는 `@/*`이며 `tsconfig.json`의 `baseUrl`은 repo root다.
- 주요 검증 명령은 `npx tsc --noEmit`과 `pnpm lint`다.
- Native module이 필요한 기능은 Expo Go에서 동작하지 않는다. dev client 재빌드가 필요한 변경은 명확히 언급한다.

## Architecture

- 서버 통신은 `server/` 레이어를 따른다. 화면/훅은 Service만 import하고 Repository를 직접 import하지 않는다.
- Repository는 Supabase 직접 호출을 캡슐화한다. Service는 앱 도메인 타입(`types/`)을 반환하고 비즈니스 로직, 타입 변환, 에러 처리를 담당한다.
- Supabase에서 다른 백엔드로 옮겨도 Service 인터페이스를 유지하는 것이 원칙이다. 자세한 내용은 `server/README.md`를 따른다.
- Supabase → NestJS/AWS 마이그레이션 판단과 단계별 전략은 `docs/backend-migration-strategy.md`를 따른다.
- 장소 검색/선택은 `lib/location/`의 provider 추상화를 따른다. UI와 저장 코드는 `Place`, `PickedLocation`, `Coords` 인터페이스만 알도록 유지한다.
- 걸음수 동기화 설계는 `docs/step-sync.md`를 따른다. 내 걸음수는 센서 직독, 서버 업로드는 60초 배치, 상대방 걸음수는 30초 polling이 기본이다.
- 결제/IAP 관련 ID와 운영 절차는 `docs/revenuecat-setup.md`를 따른다.

## Design System

- 기본 디자인 방향은 따뜻한 로즈 코랄 + 레트로 픽셀 게임 감성이다.
- 디자인 토큰은 `styles/theme.ts`와 `styles/type.ts`가 source of truth다. 새 화면/컴포넌트는 가능한 한 토큰을 사용한다.
- 기본 폰트는 `NeoDunggeunmo` 하나로 통일한다. `app/_layout.tsx`에서 `assets/fonts/NeoDunggeunmo.ttf`를 로드한다.
- 텍스트는 직접 `react-native`의 `Text`보다 `components/base/Text.tsx`를 우선 사용한다.
- Typography scale:
  - `displayLarge` 40/48, `displayMedium` 32/40, `displaySmall` 24/32
  - `headingLarge` 22/28, `headingMedium` 18/24, `headingSmall` 16/22
  - `bodyLarge` 16/24, `bodyMedium` 14/20, `bodySmall` 12/18
  - `label` 14/18, `caption` 11/16
- 간격은 4px grid 기반 `SPACING`을 사용한다: `xxs` 2, `xs` 4, `sm` 8, `md` 12, `lg` 16, `xl` 20, `xxl` 24, `xxxl` 32, `xxxxl` 40.
- 화면 레이아웃에는 `LAYOUT` 토큰을 우선 사용한다:
  - `screenPx` 24
  - `sectionGap` 16
  - `sectionGapLg` 20
  - `sectionGapXl` 24
  - `cardPx`/`cardPy` 16
  - `itemGap` 8, `itemGapMd` 12
  - `headerPy` 12, `bottomSafe` 24
- 핵심 색상은 `theme.colors`를 사용한다:
  - `primary` `#E8706A`, `primaryLight` `#FDEAE8`, `primaryDark` `#C4524C`, `primarySurface` `#FFF5F4`
  - `secondary` `#81B29A`, `accent` `#FFB5A7`
  - `background` `#F5F0EB`, `surface` `#FFFFFF`, `surfaceWarm` `#FAF6F2`
  - 텍스트는 `text` `#2C2C2E`, `textSecondary` `#6E6E73`, `textMuted` `#A8A4A0`
- 픽셀 스타일은 blur 없는 솔리드 그림자가 기본이다. `shadowRadius: 0`, border는 보통 `theme.colors.border`를 사용한다.
- radius는 작게 유지한다. 기본 카드/버튼은 `theme.radius.lg` 8 이하를 선호한다. 과한 pill/rounded 스타일은 피한다.
- 카드는 `PixelCard`, 배지는 `PixelBadge`, 버튼은 `Button`, 행/박스 레이아웃은 `Row`, `Column`, `Box`를 우선 사용한다.
- 아이콘은 `components/base/Icon.tsx`의 `Icon` 래퍼를 우선 사용한다. 새 아이콘이 필요하면 `ICON_MAP`에 추가한다.
- `Input`은 현재 `RNTextInput` 스타일에 `fontFamily`가 명시되지 않은 곳이 있을 수 있다. 새 입력 UI를 만들 때는 픽셀 폰트 일관성을 확인한다.

## Diary Design

- 다이어리 꾸미기 영역은 `styles/diaryThemes.ts`의 테마 토큰을 따른다.
- 다이어리 테마는 표시 레이어 전용이다. 데이터 레이어에 테마별 스타일 지식을 섞지 않는다.
- PNG 스티커/테이프/프레임 자산은 `assets/diary/` 아래 항목을 재사용한다.

## Native Maps

- 장소 검색의 기본 fallback은 검색-only + 텍스트 입력이다. 지도 SDK가 없거나 키가 없을 때 앱이 깨지면 안 된다.
- 네이버 지도 SDK는 `@mj-studio/react-native-naver-map`를 사용한다.
- `EXPO_PUBLIC_NAVER_MAP_CLIENT_ID`가 있을 때만 `app.config.ts`에서 config plugin을 추가한다.
- 네이티브 지도 view는 dev client에 실제로 빌드되어 있어야 한다. 키만 있고 native view manager가 없으면 fallback을 유지한다.
- 지도 기능 변경 후에는 iOS/Android dev client 재빌드 필요 여부를 사용자에게 알려야 한다.

## Environment

- `.env`, `.env.development`, `.env.production`에는 비밀 값이 들어갈 수 있다. 값을 출력하거나 커밋하지 않는다.
- `EXPO_PUBLIC_*` 값은 클라이언트에 노출된다. Naver Client Secret처럼 민감한 값은 출시 전 서버 프록시로 옮기는 것이 원칙이다.
- 환경 변수 목록과 장소 provider 전략은 `lib/location/README.md`를 따른다.

## Git And Worktree

- 사용자 변경을 되돌리지 않는다. 현재 작업트리에 미커밋 변경이 있을 수 있으므로 수정 전 `git status --short --branch`로 확인한다.
- 이 저장소에는 Claude에서 이어진 작업 흔적이 있을 수 있다. `.claude/` 설정을 Codex 지침으로 간주하지 않는다.
- 브랜치가 원격에서 사라진 상태일 수 있다. push/branch 정리는 사용자가 요청할 때만 한다.

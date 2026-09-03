# walkToo 코드 감사 — Dead Code & 끊긴 프로세스

`src/` 전체(217 파일)를 대상으로 **도달성 분석 + export/DB 표면 감사 + 흐름 추적**을 돌린 결과다.
"만들어놓고 연결 안 된 것"과 "연결됐지만 중간이 끊긴 것"을 구분해서 정리한다.

| 항목 | 값 |
| --- | --- |
| 기준 일자 | 2026-09-02 |
| 기준 커밋 | `0fd4560` (`fix/release-p0-store-review`) |
| 검사 대상 | `src/**/*.{ts,tsx}` 217개 + `supabase/*.sql` + `.env*` |
| 진입점 | `src/app/**` (Expo Router 파일 라우트) |

**이 문서는 스냅샷이다.** 항목을 고치면 체크박스를 채우고, 해결된 섹션은 커밋 해시와 함께 지운다.
새로 감사를 돌렸으면 기준 커밋을 갱신한다.

---

## 0. 요약

| 심각도 | 건수 | 성격 |
| --- | --- | --- |
| 🔴 P0 | 2 | 결제 기능 무력화 / 스토어 심사 리젝 사유 |
| 🟠 P1 | 3 | 정책 우회, 기능 영구 비활성, 타입 안전성 상실 |
| 🟡 P2 | 6 | 기능 미완성·미연결, UX 열화 |
| 🟢 P3 | 7 | 빌드 실패, 중복 로직, 일관성 |
| ⚫️ Dead | ~925 LOC + 테이블 4 + RPC 10 | 삭제 또는 연결 대상 |

**우선순위**: 1 → 2 → 3 → 4 → 5 → 6 → 7 (9장 "작업 순서" 참고)

---

## 1. 🔴 P0 — 커플 연결된 사용자는 entitlement가 항상 `free`

### 증상

커플 패스를 결제한 사용자도 `isEntitled: false`로 읽힌다. **미연결 사용자만 정상 동작한다** —
즉 결제 대상 사용자만 정확히 깨진다.

### 원인

`src/server/entitlements/entitlements.service.ts` `getStatus()`는 코드베이스에서 **유일하게
`.eq('id', ...)` 필터가 없는** `profiles` 쿼리다. 1차·2차·3차 fallback 전부 필터가 없다.

```ts
// entitlements.service.ts:81
const { data: fullProfile, error: profileError } = await supabase
  .from('profiles')
  .select('has_premium, premium_expires_at, has_theme_pack, couple_id')
  .single<ProfilePremiumRow>();     // ← .eq('id', userId) 누락
```

그런데 `supabase/schema.sql:358`의 RLS 정책이 같은 `couple_id` 행을 모두 허용한다.
RLS 정책은 OR로 합쳐지므로 **커플 연결 상태에서는 내 행 + 상대 행 = 2행**이 반환된다.

```sql
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_select_partner" ON public.profiles
  FOR SELECT USING (
    couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
  );
```

`.single()`은 2행에서 PostgREST `PGRST116`으로 실패한다:

```
1차 select(has_premium, premium_expires_at, has_theme_pack, couple_id).single() → 2행 → error
2차 select(has_premium, premium_expires_at, couple_id).single()                → 2행 → error
3차 select(has_premium, couple_id).single()                                    → 2행 → error
                                          ↓
                          defaultStatus() = { isEntitled: false, ... }
```

미연결 사용자는 `couple_id`가 `NULL`이라 서브쿼리도 `NULL`을 돌려주고
`NULL IN (NULL)`은 `TRUE`가 아니므로 `profiles_select_own`만 적용된다 → 1행 → 정상.

### 2차 피해

`src/hooks/useEntitlement.ts:66`의 self-healing이 매 mount마다 `hasPremium: false`를 보고
`mark_premium_purchased` RPC를 호출하지만, **읽기가 깨져 있으니 절대 수렴하지 않는다.**
무의미한 RPC 호출이 앱 실행마다 반복된다.

### 수정

- [ ] 세 쿼리 모두에 `.eq('id', userId)` 추가 (`getStatus`가 `userId`를 인자로 받도록 변경)
- [ ] 또는 이미 DB에 있는 `is_entitled` RPC로 대체 — 현재 호출 0건인 미사용 함수인데 이 문제를 그대로 해결해준다
- [ ] 회귀 테스트: **커플 연결 상태**에서 결제 → `isEntitled: true` 확인. 미연결 상태만 테스트하면 이 버그를 놓친다

---

## 2. 🔴 P0 — 법적 고지 URL이 존재하지 않는 도메인

`src/constants/legal.ts:15`의 `walktoo.app`은 **DNS에 존재하지 않는다** (`NXDOMAIN` 확인).

```ts
export const LEGAL_URLS = {
  PRIVACY_POLICY: 'https://walktoo.app/privacy',
  TERMS_OF_SERVICE: 'https://walktoo.app/terms',
} as const;
```

`openPrivacyPolicy` / `openTermsOfService`는 `src/app/(tabs)/profile.tsx:223,228`에
**실제로 연결되어 있어서** 사용자가 메뉴를 탭하면 빈 페이지가 열린다.
파일 자체 주석이 "출시 전 실제 호스팅 URL로 반드시 교체할 것"이라고 경고하고 있다.

App Store Review Guideline 5.1.1 / Google Play 개인정보처리방침 항목 심사 대상이다.

### 수정

- [ ] 개인정보처리방침 · 이용약관 실제 호스팅
- [ ] `LEGAL_URLS` 교체
- [ ] App Store Connect "개인정보 처리방침 URL"에 동일 주소 등록
- [ ] Google Play Console "개인정보처리방침"에 동일 주소 등록

---

## 3. 🟠 P1 — 톡톡(nudge) 경로가 2개, 3개 화면이 rate limit을 우회

`send_nudge` RPC(중복 방지 `already_nudged` 포함)를 만들어 놓고 4개 진입점 중 1개만 쓴다.

| 진입점 | 경로 | 중복 방지 |
| --- | --- | --- |
| `components/feature/home/WidgetBoard.tsx:71` | `useSendNudgeMutation` → `nudgeService.sendNudge` → `send_nudge` RPC | ✅ `already_nudged` |
| `app/diary-detail.tsx:171` | `useNudgeMutation` → `notificationsService.notifyNudge` 직접 | ❌ 없음 |
| `app/diary-list.tsx:85` | 동일 | ❌ 없음 |
| `app/each-moments.tsx:216` | 동일 | ⚠️ `nudgedRef` — mount당 1회, 클라이언트 전용 |

`diary-detail` / `diary-list`는 가드가 **전혀 없다**. 버튼을 연타하면 상대에게 푸시가
무제한 발송된다. 서버 측 dedup도 우회한다.

### 수정

- [ ] 3개 화면을 `useSendNudgeMutation`으로 통일
- [ ] `useNudgeMutation` (`hooks/services/notification/mutation.ts:48`) 삭제
- [ ] `nudgeService.sendNudge`가 `walkId`를 받도록 확장 (현재 `''` 하드코딩 — `nudge.service.ts:34`)

---

## 4. 🟠 P1 — RevenueCat 키가 어디에도 없음 → IAP 영구 비활성

`src/lib/revenuecat/index.ts:26`이 읽는 두 변수가 `.env.example`에도, `.env.local`에도 없다.

```ts
const API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '',
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '',
}) ?? '';
```

`initRevenueCat`은 키가 없으면 조용히 `return`하고(`revenuecat/index.ts:73`),
paywall은 상품을 못 불러와 영구 "준비 중" 상태가 된다.

같은 계열 문제: `.env.local`의 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`가 빈 값이라
`app.config.ts`가 iOS Google 로그인 플러그인 설정(`iosUrlScheme`)을 스킵한다.

### 수정

- [ ] `.env.example`에 `EXPO_PUBLIC_REVENUECAT_IOS_KEY` / `_ANDROID_KEY` 추가
- [ ] EAS 환경변수(production 프로필)에 실제 키 등록 — `eas.json`은 production만 `"environment": "production"`이라 dev/preview는 로컬 `.env`에 의존
- [ ] `.env.local`의 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` 채우기
- [ ] 세팅 절차는 `docs/revenuecat-setup.md`에 반영

---

## 5. 🟠 P1 — `database.types.ts`가 스테일: 실제 쓰는 테이블 2개가 타입에 없음

`src/server/types/database.types.ts`의 `Tables`에 `daily_steps`, `memory_stamps`가 **없다.**
`supabase/schema.sql`에는 둘 다 있고(RLS까지 활성), 코드도 실제로 쿼리한다.

| 테이블 | 코드 사용 | 타입 존재 |
| --- | --- | --- |
| `daily_steps` | 5곳 (`daily-steps.service.ts` 4, `useBackgroundStepSync.ts` 1) | ❌ |
| `memory_stamps` | 2곳 (`memory-stamps.service.ts`) | ❌ |

그래서 타입 검사를 캐스팅으로 우회하고 있다:

```ts
// daily-steps.service.ts:29
.upsert({ user_id: userId, date: today, steps, kcal, updated_at: ... } as never,
        { onConflict: 'user_id,date' });
```

`as never` + 수동 제네릭(`.maybeSingle<Pick<DailyStepRow, 'steps'>>()`) 조합이라
**컬럼명 오타가 컴파일에 잡히지 않는다.** 걸음수 동기화 경로 전체가 타입 안전성 밖에 있다.

### 수정

- [ ] `supabase gen types typescript`로 `database.types.ts` 재생성
- [ ] `daily-steps.service.ts` / `memory-stamps.service.ts` / `useBackgroundStepSync.ts`의 `as never` 캐스팅 제거
- [ ] 재생성 시 5장의 dead 테이블/RPC 목록도 같이 재확인

---

## 6. 🟡 P2 — 기능 미완성 · 미연결

### 6.1 스탬프 → 추억북 경제 루프가 완전히 단절

스탬프는 하루 30개씩 적립되지만(`STAMP.DAILY_REWARD`) **소비처가 없다.**

- `/walk-book` 라우트는 `src/app/_layout.tsx:84`에 등록돼 있으나 **어디서도 navigate하지 않는다.** 도달 불가 화면이다 (본문도 "생성 기능 준비 중")
- `couple_book_credits` 테이블 + RPC 4개(`get_book_credits`, `add_book_credits`, `redeem_stamps_for_book`, `consume_book_credit`) — 앱 코드 참조 **0건**
- `useTotalStampsQuery`는 `app/(tabs)/profile.tsx:37`에서 숫자 표시만 한다

`docs/bm-policy.md`의 추억북 생성권 정책과 대조해서 **완성할지 제거할지 기획 판단이 필요하다.**

- [ ] 기획 결정: 추억북 생성 플로우 완성 / 또는 `/walk-book` + book credit 표면 제거

### 6.2 캘린더 스탬프 인디케이터가 만들어졌지만 연결 안 됨

`app/(tabs)/planner.tsx:63`은 schedules + walks만 조회한다.
스탬프 날짜 배열을 주는 `useStampsByMonthQuery`를 쓰는 곳은 **dead인 `useCalendarMonthQuery`
하나뿐**이다. `CalendarMonthNav` / `MonthYearPicker`도 planner가 자체 구현으로 대체하면서
배럴에만 남았다.

- [ ] planner 캘린더에 스탬프 인디케이터 연결 / 또는 4개 파일 제거 (8.1 참고)

### 6.3 푸시 딥링크가 `walkId`를 버림

```ts
// hooks/useNotification.ts:96
if (data?.walkId) routerRef.current.push('/diary-list');
else if (data?.coupleId) routerRef.current.push('/(tabs)');
```

`notifyWalkCreated` / `notifyWalkRevealed` / `notifyNudge`가 `data.walkId`를 실어 보내는데
탭하면 목록으로만 간다. `/diary-detail`로 보낼 정보가 있는데 쓰지 않는다.

- [ ] `router.push({ pathname: '/diary-detail', params: { ... } })`로 변경

### 6.4 콜드스타트 시 profile-setup 닉네임 프리필 실패

`app/index.tsx:39`은 Supabase 세션 복원 경로에서 `authStore`를 채우지 않고
`/profile-setup`으로 보낸다. `app/profile-setup.tsx:55`는 `useAuthStore(s => s.user)`를
읽는데 authStore는 persist가 없는 in-memory 스토어라 콜드스타트에선 `null`이다.

→ 프로필 미완성 상태로 앱을 재시작하면 닉네임이 빈칸으로 시작한다.

- [ ] `index.tsx`의 세션 복원 경로에서 `setUser(profile)` 호출 (이미 `profile`을 조회하고 있다)
- [ ] 또는 `profile-setup`이 `useGetMeQuery()`를 쓰도록 변경 (authStore 의존 제거 방향이 더 맞음 — 8.1 `coupleStore` 참고)

### 6.5 영상 압축이 no-op

`src/utils/media.ts:125` `compressVideoForUpload`는 `return uri` 패스스루다
(주석에 의도적이라 명시, 활성화 절차도 기재).
12MB 상한(`MAX_SHORT_VIDEO_BYTES`)만 보관 비용을 막고 있고
`VIDEO_COMPRESS_MAX_DIMENSION`은 미사용 상수다.

`docs/media-retention.md` 4.2와 동일 내용 — 문서화된 의도적 상태이므로 릴리즈 블로커는 아니다.

- [ ] (선택) `react-native-compressor` 설치 + dev client 재빌드 후 활성화

### 6.6 entitlement 회수 경로 없음 — 테마팩은 영구 부여

`mark_premium_revoked` / `mark_theme_pack_revoked` RPC가 DB에 있는데 호출 코드 **0건**.
`useEntitlement`의 self-healing은 **부여 방향으로만** 동작한다
(RC에 있는데 Supabase에 없음 → 부여). 반대 방향(환불/취소)이 없다.

- 커플 패스: `premium_expires_at`으로 시간 만료되므로 자연 회수됨
- **테마팩: `entitlements.service.ts:152`에서 `hasThemePack = profile.has_theme_pack`을 만료 검사 없이 그대로 쓴다 → 환불돼도 영구 유지**

- [ ] `useEntitlement`에 역방향 heal 추가 (RC에 없는데 Supabase에 있음 → `mark_*_revoked`)
- [ ] 또는 RevenueCat webhook → Supabase Edge Function으로 서버 측 회수 (권장 — 앱 미실행 상태에서도 동작)

---

## 7. 🟢 P3 — 빌드 · 중복 · 일관성

### 7.1 `tsc --noEmit` 실패

**실제 에러 1건**:

- `src/server/schedules/schedules.service.ts:134` — `Record<string, unknown>`을 Supabase Update 타입(`RejectExcessProperties`)에 넣을 수 없음

**스테일 생성 파일로 인한 에러 7건**: `.expo/types/router.d.ts`가 오래됐다.

| 상태 | 라우트 |
| --- | --- |
| 타입에 있지만 파일 없음 | `/reflection`, `/reflection-timeline` |
| 파일 있지만 타입에 없음 | `/media-viewer`, `/quick-capture`, `/each-moments`, `/walk-book`, `/(tabs)/planner` |

- [ ] `schedules.service.ts` `patch` 타입을 `ScheduleUpdate`로 명시
- [ ] `expo start`로 `.expo/types` 재생성 → tsc 초록

### 7.2 프로필 "커플 연결하기"가 자기 자신을 push

```ts
// app/(tabs)/profile.tsx:217
onPress={() => router.push('/(tabs)')}
```

탭 안에서 탭 그룹을 push한다. 홈 탭으로 이동하지만 스택이 쌓인다.

- [ ] `router.navigate('/(tabs)')` 또는 홈의 커플 연결 시트를 직접 여는 방식으로 변경

### 7.3 칼로리 공식이 3곳에 서로 다르게 존재

| 위치 | 공식 |
| --- | --- |
| `constants/game-config.ts:41` `stepsToCalories` | `Math.round(steps * CALORIE.PER_STEP)` — 정수 |
| `server/daily-steps/daily-steps.service.ts:18` | `Math.round(steps * 0.04 * 10) / 10` — 소수 1자리 |
| `hooks/useBackgroundStepSync.ts:42` | 동일 로직 재구현, 상수 미참조 |

DB에 쓰는 두 곳 모두 `CALORIE.PER_STEP`을 쓰지 않는다.

- [ ] `stepsToCalories`를 단일 source로 통일 (소수 자리 정책 확정)

### 7.4 걸음수 폴링 상수가 미사용 — 값이 하드코딩

`PARTNER_POLLING` / `SELF_WALKING` (`constants/game-config.ts:25,32`) 참조 0건.
실제 주기는 `hooks/services/steps/query.ts:28`과
`hooks/services/notification/query.ts:32`에 `30_000` 하드코딩되어 있다.
**idle 판정 로직(`IDLE_TIMEOUT_MS`) 자체가 구현되지 않았다** — `docs/step-sync.md` 설계와 불일치.

- [ ] 하드코딩된 `30_000`을 `PARTNER_POLLING.STEPS_INTERVAL_MS`로 교체
- [ ] idle 판정을 구현하거나 `docs/step-sync.md`에서 해당 설계를 제거

### 7.5 암호화가 조용히 평문으로 fallback

```ts
// hooks/useCrypto.ts:21
const encrypt = (plaintext) => { if (!key) return plaintext; ... }
```

`coupleId`가 아직 없으면(커플 쿼리 로딩 중 / 미연결) **평문을 그대로 반환한다.**
그 시점에 쓴 메모는 암호화 없이 저장되고, `decryptField`는 prefix 없는 값을 통과시키므로
겉보기엔 정상 동작한다 — 조용한 열화다.

키 회전 시에도 문제가 있다. 기존 데이터가 복호화 불가가 되는데
`fieldEncryption.ts:66`이 실패 시 원문을 반환하므로
**사용자 화면에 `enc:v1:...` 문자열이 그대로 노출된다.**

키 관리 모델(현재 `EXPO_PUBLIC_AES_KEY` 기반) 자체도 재검토 대상이다 —
AGENTS.md의 "민감 값은 출시 전 서버 프록시로 이전" 원칙에 해당한다.
상세는 공개 저장소에 기재하지 않는다.

- [ ] `key`가 없을 때 암호화가 필요한 쓰기를 막거나(로딩 대기), 평문 저장을 명시적 정책으로 문서화
- [ ] 복호화 실패 시 원문 대신 placeholder 표시
- [ ] 키 관리 모델 재검토 + 회전 정책 결정 (버전 prefix `enc:v1:`이 이미 있으니 v2 마이그레이션 경로 설계 가능)

### 7.6 픽셀 폰트 통일 예외 1건

`components/feature/diary/LocationPicker/LocationPicker.tsx`가 `TextInput`에
`fontFamily`를 지정하지 않는다. AGENTS.md가 지적한 그 케이스다
(`components/base/Input.tsx:111`은 `FONT_FAMILY.pixel` 정상 적용).

- [ ] `LocationPicker`의 `TextInput`에 `FONT_FAMILY.pixel` 적용

### 7.7 보안 — `couples` RLS SELECT 정책 재검토 필요

`supabase/schema.sql`의 `couples_select` 정책이 대기 중 커플 행을 과도하게 노출한다.
초대코드 조회는 `join_couple_by_code` RPC(`SECURITY DEFINER`) 내부로 한정해야 한다.

> 상세와 재현 경로는 공개 저장소에 기재하지 않는다. 수정 적용 후 이 항목을 채운다.

- [ ] 정책 범위 축소 (SELECT 조건에서 미연결 커플 전체 공개 절 제거)
- [ ] 수정 후 이 항목 상세 기재

---

## 8. ⚫️ Dead code

### 8.1 완전 미참조 파일 (~925 LOC)

`src/app/**`을 진입점으로 한 import 그래프 도달성 분석 결과.

| 파일 | LOC | 비고 |
| --- | --- | --- |
| `src/api/api.ts` | 85 | `@deprecated` 명시 — NestJS 마이그레이션 참조용 |
| `src/api/client.ts` | 117 | 축 axios 인터셉터. deprecated 표시 없음 |
| `src/api/index.ts` | 2 | 배럴 |
| `src/storage/secureStorage.ts` | 36 | 죽은 `api/client.ts`만 import |
| `src/components/feature/calendar/CalendarMonthNav.tsx` | 85 | planner 자체 구현이 대체 |
| `src/components/feature/calendar/MonthYearPicker.tsx` | 195 | 동일 |
| `src/components/feature/calendar/index.ts` | 2 | 배럴 |
| `src/hooks/services/calendar/query.ts` | 41 | `useCalendarMonthQuery` |
| `src/components/feature/diary/scrapbook/TapedPolaroid.tsx` | 194 | `TapedPolaroidV2`가 전면 대체 |
| `src/components/feature/couple/CoupleHeader.tsx` | 95 | 배럴에만 존재 |
| `src/components/feature/permissions/PermissionGate.tsx` | 40 | 배럴에만 존재 |
| `src/stores/coupleStore.ts` | 19 | **`setCouple` 호출 0건** — 값이 항상 `null`. `clearCouple`만 로그아웃/탈퇴에서 호출되는 write-only 스토어 |
| `src/styles/index.ts` | 14 | 배럴. 전부 `@/styles/theme`를 직접 import |
| **합계** | **925** | |

- `axios`는 죽은 `api/client.ts`의 **유일한 사용처**다 → 파일 제거 시 의존성도 제거 가능
- `src/lib/i18n/types.d.ts`는 ambient 선언 파일이라 도달성 분석에 안 잡히는 게 정상 (dead 아님)
- `api/api.ts`는 참조용 의도가 주석에 있으므로 삭제보다 `docs/`로 이동이 맞을 수 있다

- [ ] `src/api/*` + `secureStorage.ts` 처리 (삭제 또는 `api.ts`만 docs 이동) + `axios` 의존성 제거
- [ ] `feature/calendar/*` + `services/calendar/query.ts` 처리 (6.2 결정과 연동)
- [ ] `TapedPolaroid.tsx`, `CoupleHeader.tsx`, `PermissionGate.tsx` 삭제 + 배럴 정리
- [ ] `coupleStore.ts` 삭제 + `auth/mutation.ts`의 `clearCouple` 호출 제거
- [ ] `styles/index.ts` 삭제

### 8.2 Dead 서비스 / 레포 메서드

RPC 트랜잭션 버전으로 대체됐지만 구버전이 남아 있는 케이스가 대부분이다.

| 파일 | 미사용 메서드 | 대체 |
| --- | --- | --- |
| `server/walks/walks.repository.ts` | `create`, `update`, `createEntry`, `countEntries` | `createWithEntry`, `addEntryToWalk` (RPC) |
| `server/couples/couples.repository.ts` | `findByInviteCode`, `join`, `disconnect`, `deleteCouple` | `joinByCodeTransaction`, `disconnectTransaction` (RPC) |
| `server/couples/couples.service.ts` | `createProfile` | DB 트리거 |
| `server/auth/auth.repository.ts` | `refreshSession` | Supabase `autoRefreshToken` |
| `server/auth/auth.service.ts` | `getOAuthUrl`, `onAuthStateChange` | — |
| `server/storage/storage.repository.ts` | `getSignedUrl` | public URL |
| `server/storage/storage.service.ts` | `deletePhoto` | `deletePhotos` (복수형) |
| `server/schedules/schedules.service.ts` | `listByDate` | `listByMonth` + 클라 필터 |
| `server/daily-steps/daily-steps.service.ts` | `getCoupleStepsToday` | `getMyStepsToday` + `getPartnerSteps` |

**`deleteCouple`이 죽어 있어서 "대기 중 초대 취소" 기능이 UI에 없다.**
`app/couple-manage.tsx`는 disconnect만 제공한다.

- [ ] 위 메서드 제거
- [ ] 초대 취소 기능이 필요한지 기획 확인 → 필요하면 `deleteCouple`을 UI에 연결

### 8.3 Dead 인증 체인 — 이메일/비번 로그인 전체

`app/login.tsx`는 소셜 로그인(`useSocialLoginMutation`, `useWebOAuthMutation`)만 쓴다.
이메일/비번 경로는 위에서 아래까지 통째로 죽어 있다.

```
useSignUpMutation / useLoginMutation      (hooks/services/auth/mutation.ts:25,53 — 호출 0건)
  → authService.signUp / signIn           (server/auth/auth.service.ts)
    → authRepository.signUp / signInWithPassword   (server/auth/auth.repository.ts:7,14)
       + SignInInput / SignUpInput 타입    (types/auth.ts)
```

- [ ] 소셜 전용 정책이 확정이면 체인 전체 제거

### 8.4 Dead DB 표면

`database.types.ts`에 타입이 있으나 앱 코드 참조가 0건인 항목.

**테이블 4개** — `monthly_reflections`, `reflection_answers`, `couple_memos`, `couple_book_credits`

**RPC 10개**

| RPC | 성격 |
| --- | --- |
| `get_or_create_reflection`, `save_reflection_answers`, `get_reflection_progress` | 회고 기능 — 라우트(`/reflection`, `/reflection-timeline`)가 이미 삭제됨 |
| `get_book_credits`, `add_book_credits`, `redeem_stamps_for_book`, `consume_book_credit` | 추억북 생성권 (6.1) |
| `mark_premium_revoked`, `mark_theme_pack_revoked` | entitlement 회수 (6.6) |
| `is_entitled` | **1장 P0를 그대로 해결해주는 함수인데 미사용** |

- [ ] 회고 기능: 부활 계획 없으면 테이블·RPC 드롭 마이그레이션 작성 (`docs/db-apply-release.md` 절차)
- [ ] `couple_memos` 용도 확인
- [ ] 추억북 / 회수 / `is_entitled`는 각각 6.1 / 6.6 / 1장에서 연결

### 8.5 Dead 상수 · export

| 위치 | 미사용 export |
| --- | --- |
| `constants/keys.ts` | `QUERY_KEYS.auth.session` |
| `constants/premium.ts` | `RESULT_PRODUCTS`, `PRODUCT_BUNDLES` — 주석상 **의도적 보류** |
| `constants/game-config.ts` | `PARTNER_POLLING`, `SELF_WALKING` (7.4) |
| `utils/media.ts` | `MAX_SHORT_VIDEO_DURATION_FREE_MS`, `_PREMIUM_MS`, `_MS` — `PREMIUM.VIDEO_DURATION_*_SECONDS`와 **중복**이고 실제 enforcement는 후자 |
| `utils/media.ts` | `getMediaKind`, `VIDEO_COMPRESS_MAX_DIMENSION` |
| `utils/permissions.ts` | `checkAllPermissions` |
| `lib/photobooth/` | `convertToGrayscale`, `SlotLayout`, `FilterConfig`, `FrameColor` |
| `scrapbook/assetRegistry.ts` | `DIARY_TEXTURES` — `src/assets/diary/textures/` 6개 파일이 있으나 미적용 |
| `scrapbook/photoLayouts/dailyQuotes.ts` | `COUPLE_QUOTES`, `DailyQuote` |

- [ ] `utils/media.ts`의 중복 duration 상수 제거 (`PREMIUM.*`를 single source로)
- [ ] 나머지 제거 또는 연결

### 8.6 Dead 환경변수 · locale

- `EXPO_PUBLIC_API_URL` — 죽은 `api/client.ts`의 유일한 사용처. `.env.example` / `.env.local`에서 제거 대상
- `postcard` 네임스페이스 — `lib/i18n/index.ts:88,106`에서 로드하지만 코드 참조 **0건**. `lib/i18n/types.d.ts`에도 누락돼 있어 불일치

- [ ] `EXPO_PUBLIC_API_URL` 제거
- [ ] `postcard.json` + i18n 등록 제거, 또는 `types.d.ts`에 추가하고 기능 부활

### 8.7 참고 — dead가 아닌 것

감사 중 dead로 오탐될 수 있으나 정상인 항목:

- `src/app/**`의 화면 default export — Expo Router가 파일 경로로 소비
- `src/lib/i18n/types.d.ts` — ambient 선언
- `LEGAL_URLS`, `CATEGORY_EMOJI`, `CoupleWithProfiles` 등 — 같은 파일 내부에서 사용
- `usePedometer`, `useTodaySteps`, `useCrypto` 등 — 다른 훅 안에서만 쓰이지만 정상 체인

---

## 9. 작업 순서

릴리즈 블로커 → 정책 우회 → 위생 순.

1. **entitlements `getStatus()`에 `.eq('id', userId)` 추가** (1장) — 결제 기능 자체가 안 먹는 상태, 한 줄 수정
2. **법적 고지 URL 호스팅 + 교체** (2장) — 심사 리젝 사유
3. **RevenueCat 키를 `.env.example` + EAS 환경변수에 추가** (4장)
4. **`schedules.service.ts:134` 타입 수정 + `.expo/types` 재생성** (7.1) — tsc 초록
5. **nudge 경로 통일** (3장)
6. **`database.types.ts` 재생성 + `as never` 제거** (5장)
7. **dead code 925 LOC 제거 + `axios` 의존성 정리** (8.1~8.6)

**기획 판단 대기**: 6.1 추억북 경제 루프, 8.3 이메일 로그인 제거 확정, 8.4 회고 기능 드롭

---

## 10. 감사 재현 방법

```bash
npx tsc --noEmit
npx eslint .
```

| 검사 | 결과 (2026-09-02) |
| --- | --- |
| `tsc --noEmit` | 실패 — 실제 1건 + 스테일 라우터 타입 7건 (7.1) |
| `eslint .` | 0 errors, 27 warnings — 미사용 import 3, `require` 스타일 13, `exhaustive-deps` 3, 불필요한 `eslint-disable` 5 |
| i18n 키 해석 | 누락 0건 (동적 키 7개 포함 전부 해석됨) ✅ |
| asset import 해석 | 누락 0건 (폰트·스프라이트·스티커·테이프·프레임·텍스처 전부 존재) ✅ |
| 네비게이션 타깃 | 존재하지 않는 라우트 0건 / **도달 불가 라우트 1건** (`/walk-book`) |
| 파일 도달성 | 217개 중 도달 207 / orphan 10 (8.1) |

**도달성 분석 방법**: `src/app/**`을 진입점으로 `import` / `export ... from` / 동적 `import()` /
`require()`를 파싱해 `@/*` alias와 상대 경로를 해석하고 BFS로 도달 집합을 구한 뒤 여집합을 취한다.
`pnpm`이 PATH에 없어 `npx`로 실행했다.

---

## 관련 문서

- `docs/bm-policy.md` — 무료/유료 경계, 추억북 생성권 정책 (6.1)
- `docs/revenuecat-setup.md` — IAP product/entitlement ID, 키 세팅 (4장)
- `docs/step-sync.md` — 걸음수 동기화 설계 (7.4)
- `docs/media-retention.md` — 미디어 상한·압축 정책 (6.5)
- `docs/db-apply-release.md` — 마이그레이션 적용 절차 (8.4)
- `docs/store-release-console-runbook.md` — 스토어 심사 체크 (2장)
- `src/server/README.md` — Repository/Service 레이어 규칙 (8.2)

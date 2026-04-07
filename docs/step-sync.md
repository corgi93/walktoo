# 걸음수 동기화 (Step Sync)

커플 앱에서 각자의 걸음수를 서버에 저장하고, 상대방 걸음수를 표시하기 위한 시스템입니다.

---

## 설계 원칙

### 1. 내 걸음수는 센서 직독 (네트워크 0)

```
센서(Pedometer) → usePedometer → 화면 표시
```

홈 화면의 내 걸음수는 항상 **기기 센서에서 직접 읽습니다**. 네트워크 호출 없음, 지연 없음.

### 2. 서버 업로드는 60초 배치 (과도한 요청 방지)

```
센서 → useStepSync (60초마다) → Supabase upsert
```

매 걸음마다 API 호출하면 네트워크/배터리 낭비 → **60초 주기 + 값이 변했을 때만** upsert.

### 3. 상대방 걸음수는 30초 polling (실시간 아님)

```
Supabase daily_steps 테이블 ← 30초 polling ← 화면 표시
```

WebSocket/Realtime을 쓰지 않습니다. 커플 앱 특성상 **30초 지연은 체감되지 않음** + 상시 연결보다 배터리/비용 유리.

### 4. 네트워크 비용 추산

| 동작 | 빈도 | 요청/시간 | 크기 |
|------|------|-----------|------|
| 내 걸음수 upsert | 60초 | 60 | ~200B |
| 상대방 조회 (RPC) | 30초 | 120 | ~100B |
| **1인 합계** | — | **180** | **~36KB/h** |
| **커플 합계** | — | **360** | **~72KB/h** |

Supabase 무료 플랜(월 500MB) 기준 하루 8시간 사용 시 월 약 17MB로 여유 있음.

---

## 아키텍처

```
┌────────────────────────────────────────────────────────┐
│  Client (내 기기)                                       │
│                                                         │
│  ┌──────────────┐                                       │
│  │ usePedometer │ ─── sensorSteps ──┐                   │
│  └──────────────┘                   │                   │
│         │                            ▼                  │
│         │                     ┌──────────────┐          │
│         │                     │   홈 화면     │          │
│         │                     │  (내 걸음)   │          │
│         │                     └──────────────┘          │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐   60초 주기                           │
│  │ useStepSync  │ ─────────────┐                       │
│  └──────────────┘              │                       │
└────────────────────────────────┼───────────────────────┘
                                 │ upsert
                                 ▼
                      ┌──────────────────────┐
                      │  Supabase            │
                      │  daily_steps         │
                      │  (user_id, date)     │
                      └──────────────────────┘
                                 ▲
                                 │ RPC: get_partner_steps
                                 │ 30초 polling
┌────────────────────────────────┼───────────────────────┐
│  Client (상대방 조회)            │                       │
│                                 │                       │
│  ┌─────────────────────┐        │                       │
│  │ usePartnerStepsQuery│ ───────┘                       │
│  └─────────────────────┘                                │
│         │                                               │
│         ▼                                               │
│  ┌──────────────┐                                       │
│  │   홈 화면     │                                       │
│  │ (상대방 걸음) │                                       │
│  └──────────────┘                                       │
└────────────────────────────────────────────────────────┘
```

---

## 데이터베이스 스키마

### `daily_steps` 테이블

```sql
CREATE TABLE public.daily_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL DEFAULT CURRENT_DATE,
  steps       INTEGER NOT NULL DEFAULT 0,
  kcal        NUMERIC(6,1) NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_steps_user_date
  ON public.daily_steps(user_id, date DESC);
```

- `(user_id, date)` 복합 유니크 → 하루에 한 행만 존재 (upsert 대상)
- `kcal`은 클라이언트에서 `steps * 0.04`로 계산해 같이 저장

### RLS 정책

```sql
-- 본인 + 같은 커플 상대방 SELECT
CREATE POLICY "daily_steps_select" ON public.daily_steps
  FOR SELECT USING (
    user_id = auth.uid()
    OR user_id IN (
      SELECT p.id FROM public.profiles p
      WHERE p.couple_id IS NOT NULL
        AND p.couple_id = (
          SELECT couple_id FROM public.profiles WHERE id = auth.uid()
        )
        AND p.id != auth.uid()
    )
  );

-- 본인만 INSERT/UPDATE
CREATE POLICY "daily_steps_insert" ON public.daily_steps
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "daily_steps_update" ON public.daily_steps
  FOR UPDATE USING (user_id = auth.uid());
```

### RPC 함수: `get_partner_steps`

RLS 중첩 서브쿼리로 인한 성능/복잡도 문제를 피하기 위해 **SECURITY DEFINER RPC**를 사용합니다. 함수 내부에서 호출자와 대상이 같은 커플인지 검증합니다.

```sql
CREATE OR REPLACE FUNCTION public.get_partner_steps(
  p_partner_id uuid,
  p_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_my_couple_id uuid;
  v_partner_couple_id uuid;
  v_steps integer;
BEGIN
  SELECT couple_id INTO v_my_couple_id
  FROM public.profiles WHERE id = auth.uid();

  SELECT couple_id INTO v_partner_couple_id
  FROM public.profiles WHERE id = p_partner_id;

  IF v_my_couple_id IS NULL
     OR v_partner_couple_id IS NULL
     OR v_my_couple_id != v_partner_couple_id THEN
    RETURN 0;
  END IF;

  SELECT steps INTO v_steps
  FROM public.daily_steps
  WHERE user_id = p_partner_id AND date = p_date;

  RETURN COALESCE(v_steps, 0);
END;
$$;
```

---

## 클라이언트 코드

### `usePedometer` — 센서 추상화

- **iOS**: `getStepCountAsync(오늘 자정 ~ 현재)`로 누적값 조회 + `watchStepCount`로 실시간 추가
- **Android**: `watchStepCount`만 지원 → 구독 이후 누적값만 반환 (앱 재시작 시 0부터)

### `useStepSync` — 주기적 서버 업로드

`app/_layout.tsx`에서 한 번만 호출되어 앱 전체에서 백그라운드로 동작합니다.

```ts
const SYNC_INTERVAL = 60_000;

// 60초마다 + 값이 변했을 때만 upsert
if (sensorSteps !== lastSyncedSteps.current) {
  syncSteps.mutate({ userId, steps: sensorSteps });
  lastSyncedSteps.current = sensorSteps;
}

// 앱이 백그라운드로 가는 순간에도 flush
AppState.addEventListener('change', (next) => {
  if (next === 'background') flush();
});
```

**Android 앱 재설치 대응:** 센서가 0을 반환할 때 DB에 저장된 값을 fallback으로 사용합니다.

```ts
const steps = sensorSteps > 0 ? sensorSteps : (dbSteps ?? 0);
```

### `usePartnerStepsQuery` — 상대방 걸음수 조회

```ts
useQuery({
  queryKey: [...QUERY_KEYS.steps.partner, partnerId],
  queryFn: () => dailyStepsService.getPartnerSteps(partnerId!),
  enabled: !!partnerId,
  refetchInterval: 30_000,
  staleTime: 10_000,
  retry: 2,
});
```

- `queryKey`에 `partnerId`를 포함해 커플 데이터 로딩 후 정상 refetch
- `refetchInterval` 30초로 적절한 polling
- Pull-to-refresh에서도 `QUERY_KEYS.steps.partner` invalidate로 즉시 갱신

### `getPartnerSteps` — RPC 우선 + fallback

```ts
// 1차: RPC (SECURITY DEFINER로 RLS 중첩 이슈 우회)
const { data, error } = await supabase
  .rpc('get_partner_steps', { p_partner_id: partnerId, p_date: today });

if (!error && data !== null) return data;

// 2차: 직접 쿼리 (RPC 함수 없는 구환경 fallback)
const { data: row } = await supabase
  .from('daily_steps')
  .select('steps')
  .eq('user_id', partnerId)
  .eq('date', today)
  .maybeSingle();

return row?.steps ?? 0;
```

---

## 오늘의 미션 (합산)

`index.tsx`에서 `mySteps + partnerSteps`로 단순 합산하여 20,000보 목표를 계산합니다. 별도 테이블이나 집계 쿼리는 없음 — 클라이언트에서 계산.

```tsx
<Text>{formatSteps(mySteps + partnerSteps)} / 20,000</Text>
<PixelProgressBar progress={Math.min((mySteps + partnerSteps) / 20000, 1)} />
```

---

## 해결된 이슈

### 1. 타임존 버그 (UTC → Local)

`new Date().toISOString().split('T')[0]`은 **UTC 기준 날짜**라 한국(UTC+9)에서 자정~오전 9시 사이에 어제 날짜로 저장/조회되는 버그가 있었음.

**수정:** `getLocalToday()` 헬퍼로 로컬 타임존 기준 날짜 사용.

```ts
const getLocalToday = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
```

### 2. `.single()` 0건 에러

Supabase `.single()`은 결과가 0건이면 `PGRST116` 에러를 반환. 상대방이 아직 오늘 데이터를 upsert하지 않은 경우 매 호출마다 에러.

**수정:** `.maybeSingle()`로 변경 → 0건이면 `data = null`로 반환.

### 3. `queryKey`에 `partnerId` 누락

```ts
// 수정 전
queryKey: QUERY_KEYS.steps.partner  // ['steps', 'partner']

// 수정 후
queryKey: [...QUERY_KEYS.steps.partner, partnerId]
```

`partnerId`가 나중에 로딩되어도 기존 캐시(0)를 계속 반환하던 문제 해결.

### 4. RLS 중첩 문제

`daily_steps` SELECT 정책이 `couples` 테이블 서브쿼리로 상대방을 찾았는데, `couples` 테이블에도 RLS가 걸려있어 중첩 평가 시 빈 결과 반환 → 상대방 조회 실패.

**수정:**
- SELECT 정책을 `profiles.couple_id` 기반으로 변경 (profiles는 이미 파트너 SELECT 정책이 있음)
- 추가로 RPC 함수 `get_partner_steps`를 `SECURITY DEFINER`로 생성해 RLS 우회 + 함수 내부 커플 검증

### 5. Pull-to-refresh 시 상대방 걸음수 갱신 안 됨

홈 화면의 `useRefresh`가 `user.me`, `couple.profile`, `couple.stats`만 invalidate 하고 있어서 pull-to-refresh 해도 상대방 걸음수 캐시가 그대로 남아있었음.

**수정:** `useRefresh`에 extraKeys로 `QUERY_KEYS.steps.partner`, `QUERY_KEYS.steps.today` 전달.

---

## 오버엔지니어링 피한 포인트

| ❌ 하지 않은 선택 | ✅ 현재 방식 |
|---|---|
| Supabase Realtime WebSocket | 30초 polling |
| 매 걸음마다 API 호출 | 60초 배치 upsert |
| Redis / 별도 캐시 레이어 | React Query `staleTime` |
| 걸음수 집계 마이크로서비스 | Supabase 테이블 1개 |
| Cloud Function 트리거 | 클라이언트에서 직접 upsert + RPC |
| 복잡한 conflict resolution | `(user_id, date)` 유니크 + upsert |

1인 개발 + 커플 앱 규모에 맞는 **최소 복잡도**로 설계되어 있습니다.

---

## 관련 파일

- `server/daily-steps/daily-steps.service.ts` — 서비스 레이어 (RPC + fallback)
- `hooks/useStepSync.ts` — 주기 업로드
- `hooks/usePedometer.ts` — 센서 추상화
- `hooks/services/steps/query.ts` — React Query 훅
- `hooks/services/steps/mutation.ts` — upsert mutation
- `supabase/003_daily_steps.sql` — 테이블/RLS
- `supabase/006_fix_daily_steps_rls.sql` — RLS 수정
- `supabase/007_get_partner_steps_rpc.sql` — RPC 함수
- `app/(tabs)/index.tsx` — 홈 화면 (내/상대방/미션 표시)

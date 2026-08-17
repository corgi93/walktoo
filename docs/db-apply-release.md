# 출시 전 DB 적용 가이드

작성일: 2026-08-08

이 문서는 운영 Supabase DB에 실제로 적용할 SQL 순서만 정리한다. 가격(`₩9,900`)은 DB에 저장하지 않고 App Store / Google Play / RevenueCat 콘솔과 앱 상수에서 관리한다.

## 1. 적용 전 중복 체크

Supabase SQL Editor에서 먼저 실행한다. 결과가 0 rows여야 다음 단계로 간다.

```sql
SELECT
  couple_id,
  date,
  kind,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(id ORDER BY created_at) AS walk_ids
FROM public.walks
GROUP BY couple_id, date, kind
HAVING COUNT(*) > 1;
```

결과가 나오면 `idx_walks_unique_couple_date_kind` unique index 적용이 실패할 수 있다. 그 경우 중복 walk를 먼저 병합/삭제한 뒤 적용한다.

## 2. 터미널에서 바로 적용

운영 DB의 `DATABASE_URL`이 설정된 터미널에서 그대로 붙여넣는다.

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/202608020000_theme_pack.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/202608020001_release_p0_p1_stability.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/202608020002_premium_annual_pass.sql
```

## 3. Supabase SQL Editor에 붙여넣기

SQL Editor만 쓸 경우, 아래 명령으로 적용 SQL 전체를 클립보드에 복사한 뒤 Supabase SQL Editor에 붙여넣고 실행한다.

```bash
{
  printf '%s\n\n' '-- 1/3 theme pack entitlement';
  cat supabase/migrations/202608020000_theme_pack.sql;
  printf '\n\n%s\n\n' '-- 2/3 release P0/P1 stability';
  cat supabase/migrations/202608020001_release_p0_p1_stability.sql;
  printf '\n\n%s\n\n' '-- 3/3 premium annual pass';
  cat supabase/migrations/202608020002_premium_annual_pass.sql;
} | pbcopy
```

## 4. 적용 후 확인 SQL

적용 후 Supabase SQL Editor에서 그대로 실행한다.

```sql
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'walks'
  AND indexname = 'idx_walks_unique_couple_date_kind';

SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'couples')
  AND column_name IN (
    'has_premium',
    'premium_purchased_at',
	    'premium_expires_at',
	    'revenuecat_user_id',
	    'premium_purchaser_id',
	    'has_theme_pack',
	    'theme_pack_purchased_at',
	    'theme_pack_purchaser_id'
	  )
ORDER BY table_name, column_name;

SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'create_walk_with_entry',
    'add_entry_to_walk',
    'join_couple_by_code',
    'disconnect_couple',
	    'mark_premium_purchased',
	    'mark_premium_revoked',
	    'mark_theme_pack_purchased',
	    'mark_theme_pack_revoked',
	    'is_entitled'
  )
ORDER BY routine_name;
```

기대 결과:

- `idx_walks_unique_couple_date_kind`가 조회된다.
- `profiles.premium_expires_at`, `couples.premium_expires_at`가 조회된다.
- `profiles.has_theme_pack`, `couples.has_theme_pack`가 조회된다.
- 위 RPC들이 모두 조회된다.

## 5. 적용 후 앱/콘솔 체크

- RevenueCat entitlement: `walktoo_couple_pass`
- iOS product: `com.walktoo.couple_pass_annual`
- Android product: `com.walktoo.couple_pass_annual:annual_prepaid`
- Theme pack product: `com.walktoo.theme_pack_travel`
- 커플 패스 가격: `₩9,900`
- 결제 후 `profiles.has_premium = true`, `profiles.premium_expires_at > now()`인지 확인

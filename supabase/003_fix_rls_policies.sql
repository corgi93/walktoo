-- ============================================================
-- RLS 정책 수정 (초대코드 조회 + 커플 삭제 허용)
-- Supabase SQL Editor에서 한 번 실행하세요.
-- ============================================================

-- 1. couples SELECT 정책 교체
--    기존: 본인 커플만 조회 가능 → 초대코드 조회 불가 문제
--    수정: 대기 중인 커플(user2 없는)도 조회 가능
DROP POLICY IF EXISTS "couples_select_own" ON public.couples;

CREATE POLICY "couples_select" ON public.couples
  FOR SELECT USING (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
    OR (user2_id IS NULL AND invite_code IS NOT NULL)
  );

-- 2. couples DELETE 정책 추가
--    본인이 만든 대기 중인 초대만 삭제 가능
DROP POLICY IF EXISTS "couples_delete_own" ON public.couples;

CREATE POLICY "couples_delete_own" ON public.couples
  FOR DELETE USING (
    user1_id = auth.uid() AND user2_id IS NULL
  );

-- 3. couples UPDATE 정책 교체
--    초대코드로 참여하는 user2도 업데이트 가능하도록
DROP POLICY IF EXISTS "couples_update_own" ON public.couples;

CREATE POLICY "couples_update" ON public.couples
  FOR UPDATE USING (
    user1_id = auth.uid()
    OR user2_id = auth.uid()
    OR (user2_id IS NULL AND invite_code IS NOT NULL)
  );

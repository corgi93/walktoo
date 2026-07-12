-- ============================================================
-- walkToo 전체 스키마 (단일 파일)
--
-- 모든 구문이 멱등성(idempotent) 보장:
--   CREATE TABLE IF NOT EXISTS / CREATE OR REPLACE FUNCTION
--   ADD COLUMN IF NOT EXISTS / DO $$ ... IF NOT EXISTS ...
--
-- 언제든 전체를 다시 실행해도 안전합니다.
-- Supabase Dashboard → SQL Editor에서 실행하세요.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- 1-1. profiles (유저 프로필)
CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname              TEXT NOT NULL,
  phone                 TEXT NOT NULL DEFAULT '',
  profile_image_url     TEXT,
  birthday              DATE,
  couple_id             UUID,
  is_profile_complete   BOOLEAN NOT NULL DEFAULT false,
  total_walks           INTEGER NOT NULL DEFAULT 0,
  total_steps           INTEGER NOT NULL DEFAULT 0,
  character_type        TEXT NOT NULL DEFAULT 'boy',
  push_token            TEXT,
  -- premium
  has_premium           BOOLEAN NOT NULL DEFAULT false,
  premium_purchased_at  TIMESTAMPTZ,
  has_theme_pack        BOOLEAN NOT NULL DEFAULT false,
  theme_pack_purchased_at TIMESTAMPTZ,
  revenuecat_user_id    TEXT,
  -- 계정 삭제(소프트). NULL이면 활성 계정.
  deleted_at            TIMESTAMPTZ,
  --
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 배포용 idempotent 컬럼 추가 (계정 삭제 소프트 마커)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 1-2. couples (커플)
CREATE TABLE IF NOT EXISTS public.couples (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invite_code          TEXT NOT NULL UNIQUE,
  start_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  first_met_date       DATE,
  -- premium (공유)
  has_premium          BOOLEAN NOT NULL DEFAULT false,
  premium_purchaser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  has_theme_pack          BOOLEAN NOT NULL DEFAULT false,
  theme_pack_purchaser_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  --
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profiles → couples FK (순환 참조 해결)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_couple_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_couple_id_fkey
      FOREIGN KEY (couple_id) REFERENCES public.couples(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 1-3. walks (산책/하루 기록)
--   kind:
--     'together' — 커플이 함께 보낸 날 (데이트/산책)
--     'each'     — 각자의 하루 (회사·친구·휴식 등)
--   기존 레코드는 전부 'together'로 backfill (과거 기록 = 데이트가 맞음)
CREATE TABLE IF NOT EXISTS public.walks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id     UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  date          DATE NOT NULL,
  location_name TEXT NOT NULL,
  location_lat  DOUBLE PRECISION,
  location_lng  DOUBLE PRECISION,
  location_address TEXT,
  location_source TEXT CHECK (location_source IS NULL OR location_source IN ('naver', 'google')),
  steps         INTEGER NOT NULL DEFAULT 0,
  is_revealed   BOOLEAN NOT NULL DEFAULT false,
  kind          TEXT NOT NULL DEFAULT 'together'
                CHECK (kind IN ('together', 'each')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기존 배포를 위한 idempotent migration
ALTER TABLE public.walks
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'together';

ALTER TABLE public.walks
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS location_source TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'walks_location_source_check'
  ) THEN
    ALTER TABLE public.walks
      ADD CONSTRAINT walks_location_source_check
      CHECK (location_source IS NULL OR location_source IN ('naver', 'google'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'walks_kind_check'
  ) THEN
    ALTER TABLE public.walks
      ADD CONSTRAINT walks_kind_check CHECK (kind IN ('together', 'each'));
  END IF;
END $$;

-- 1-4. footprint_entries (발자취 엔트리)
--   location_name: kind='each'일 때 각자 장소 (회사/카페/집 등)
--                  kind='together'일 때는 walks.location_name이 authoritative,
--                  이 컬럼은 비워둠(빈 문자열)
CREATE TABLE IF NOT EXISTS public.footprint_entries (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_id            UUID NOT NULL REFERENCES public.walks(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  memo               TEXT NOT NULL DEFAULT '',
  photos             TEXT[] NOT NULL DEFAULT '{}',
  location_name      TEXT NOT NULL DEFAULT '',
  location_lat       DOUBLE PRECISION,
  location_lng       DOUBLE PRECISION,
  location_address   TEXT,
  location_source    TEXT CHECK (location_source IS NULL OR location_source IN ('naver', 'google')),
  diary_question_id  INTEGER,
  diary_answer       TEXT NOT NULL DEFAULT '',
  couple_question_id INTEGER,
  couple_answer      TEXT NOT NULL DEFAULT '',
  written_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(walk_id, user_id)
);

-- 기존 배포를 위한 idempotent migration
ALTER TABLE public.footprint_entries
  ADD COLUMN IF NOT EXISTS location_name TEXT NOT NULL DEFAULT '';

ALTER TABLE public.footprint_entries
  ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_address TEXT,
  ADD COLUMN IF NOT EXISTS location_source TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'footprint_entries_location_source_check'
  ) THEN
    ALTER TABLE public.footprint_entries
      ADD CONSTRAINT footprint_entries_location_source_check
      CHECK (location_source IS NULL OR location_source IN ('naver', 'google'));
  END IF;
END $$;

-- 1-5. notifications (알림)
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  couple_id    UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  data         JSONB NOT NULL DEFAULT '{}',
  is_read      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1-6. daily_steps (일일 걸음수)
CREATE TABLE IF NOT EXISTS public.daily_steps (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE NOT NULL DEFAULT CURRENT_DATE,
  steps      INTEGER NOT NULL DEFAULT 0,
  kcal       NUMERIC(6,1) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 1-7. memory_stamps (추억 스탬프)
CREATE TABLE IF NOT EXISTS public.memory_stamps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  count      INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(couple_id, date)
);

-- 1-8. monthly_reflections (월간 회고)
CREATE TABLE IF NOT EXISTS public.monthly_reflections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id    UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  year         INTEGER NOT NULL,
  month        INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  question_ids INTEGER[] NOT NULL,
  is_revealed  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  revealed_at  TIMESTAMPTZ,
  UNIQUE(couple_id, year, month)
);

-- 1-9. reflection_answers (회고 답변)
-- 1-10. couple_schedules (커플 일정)
CREATE TABLE IF NOT EXISTS public.couple_schedules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id  UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  owner_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 60),
  category   TEXT NOT NULL DEFAULT 'other'
             CHECK (category IN ('work','social','wedding','health','travel','study','anniversary','other')),
  emoji      TEXT,
  note       TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1-11. couple_memos (커플 공유 메모장)
CREATE TABLE IF NOT EXISTS public.couple_memos (
  couple_id  UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  content    TEXT NOT NULL DEFAULT '' CHECK (char_length(content) <= 5000),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1-13. couple_book_credits (회고북 크레딧 — 결제 구매 + 스탬프 교환 합산)
--   credits_remaining: 아직 안 쓴 회고북 뽑기 권수
--   stamps_redeemed_year: 해당 연도에 스탬프로 교환한 권수 (연 상한 체크용)
CREATE TABLE IF NOT EXISTS public.couple_book_credits (
  couple_id             UUID PRIMARY KEY REFERENCES public.couples(id) ON DELETE CASCADE,
  credits_remaining     INTEGER NOT NULL DEFAULT 0,
  stamps_redeemed_year  INTEGER NOT NULL DEFAULT 0,
  last_redemption_year  INTEGER,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1-11. reflection_answers (회고 답변)
CREATE TABLE IF NOT EXISTS public.reflection_answers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reflection_id UUID NOT NULL REFERENCES public.monthly_reflections(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id   INTEGER NOT NULL,
  answer        TEXT NOT NULL DEFAULT '',
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(reflection_id, user_id, question_id)
);


-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_walks_couple_id              ON public.walks(couple_id);
CREATE INDEX IF NOT EXISTS idx_walks_date                   ON public.walks(date DESC);
CREATE INDEX IF NOT EXISTS idx_footprint_entries_walk_id    ON public.footprint_entries(walk_id);
CREATE INDEX IF NOT EXISTS idx_couples_invite_code          ON public.couples(invite_code);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient      ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread         ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_daily_steps_user_date        ON public.daily_steps(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_memory_stamps_couple_date    ON public.memory_stamps(couple_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reflections_couple   ON public.monthly_reflections(couple_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_reflection_answers_reflection ON public.reflection_answers(reflection_id);
CREATE INDEX IF NOT EXISTS idx_couple_schedules_couple_date  ON public.couple_schedules(couple_id, date);
CREATE INDEX IF NOT EXISTS idx_couple_schedules_owner        ON public.couple_schedules(owner_id);


-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.walks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footprint_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_steps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_stamps       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflection_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_schedules    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_memos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_book_credits     ENABLE ROW LEVEL SECURITY;

-- 멱등 RLS 헬퍼: 있으면 DROP → 재생성
-- (CREATE POLICY에는 IF NOT EXISTS가 없어서 DO 블록으로 처리)

DO $$ BEGIN

  -- ── profiles ──
  DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
  CREATE POLICY "profiles_select_own" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

  DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
  CREATE POLICY "profiles_insert_own" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

  DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
  CREATE POLICY "profiles_update_own" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

  DROP POLICY IF EXISTS "profiles_select_partner" ON public.profiles;
  CREATE POLICY "profiles_select_partner" ON public.profiles
    FOR SELECT USING (
      couple_id IN (
        SELECT couple_id FROM public.profiles WHERE id = auth.uid()
      )
    );

  -- ── couples ──
  DROP POLICY IF EXISTS "couples_select" ON public.couples;
  CREATE POLICY "couples_select" ON public.couples
    FOR SELECT USING (
      user1_id = auth.uid()
      OR user2_id = auth.uid()
      OR (user2_id IS NULL AND invite_code IS NOT NULL)
    );

  DROP POLICY IF EXISTS "couples_insert_own" ON public.couples;
  CREATE POLICY "couples_insert_own" ON public.couples
    FOR INSERT WITH CHECK (user1_id = auth.uid());

  DROP POLICY IF EXISTS "couples_update" ON public.couples;
  CREATE POLICY "couples_update" ON public.couples
    FOR UPDATE USING (
      user1_id = auth.uid()
      OR user2_id = auth.uid()
      OR (user2_id IS NULL AND invite_code IS NOT NULL)
    );

  DROP POLICY IF EXISTS "couples_delete_own" ON public.couples;
  CREATE POLICY "couples_delete_own" ON public.couples
    FOR DELETE USING (user1_id = auth.uid() AND user2_id IS NULL);

  -- ── walks ──
  DROP POLICY IF EXISTS "walks_select_own_couple" ON public.walks;
  CREATE POLICY "walks_select_own_couple" ON public.walks
    FOR SELECT USING (
      couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "walks_insert_own_couple" ON public.walks;
  CREATE POLICY "walks_insert_own_couple" ON public.walks
    FOR INSERT WITH CHECK (
      couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "walks_update_own_couple" ON public.walks;
  CREATE POLICY "walks_update_own_couple" ON public.walks
    FOR UPDATE USING (
      couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "walks_delete_own_couple" ON public.walks;
  CREATE POLICY "walks_delete_own_couple" ON public.walks
    FOR DELETE USING (
      couple_id IN (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  -- ── footprint_entries ──
  DROP POLICY IF EXISTS "entries_select_own_couple" ON public.footprint_entries;
  CREATE POLICY "entries_select_own_couple" ON public.footprint_entries
    FOR SELECT USING (
      walk_id IN (
        SELECT w.id FROM public.walks w
        JOIN public.profiles p ON p.couple_id = w.couple_id
        WHERE p.id = auth.uid()
      )
    );

  DROP POLICY IF EXISTS "entries_insert_own" ON public.footprint_entries;
  CREATE POLICY "entries_insert_own" ON public.footprint_entries
    FOR INSERT WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "entries_update_own" ON public.footprint_entries;
  CREATE POLICY "entries_update_own" ON public.footprint_entries
    FOR UPDATE USING (user_id = auth.uid());

  -- ── notifications ──
  DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
  CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (recipient_id = auth.uid());

  DROP POLICY IF EXISTS "notifications_insert_auth" ON public.notifications;
  CREATE POLICY "notifications_insert_auth" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

  DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
  CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (recipient_id = auth.uid());

  DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
  CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE USING (recipient_id = auth.uid());

  -- ── daily_steps ──
  DROP POLICY IF EXISTS "daily_steps_select" ON public.daily_steps;
  CREATE POLICY "daily_steps_select" ON public.daily_steps
    FOR SELECT USING (
      user_id = auth.uid()
      OR user_id IN (
        SELECT p.id FROM public.profiles p
        WHERE p.couple_id IS NOT NULL
          AND p.couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
          AND p.id != auth.uid()
      )
    );

  DROP POLICY IF EXISTS "daily_steps_insert" ON public.daily_steps;
  CREATE POLICY "daily_steps_insert" ON public.daily_steps
    FOR INSERT WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "daily_steps_update" ON public.daily_steps;
  CREATE POLICY "daily_steps_update" ON public.daily_steps
    FOR UPDATE USING (user_id = auth.uid());

  -- ── memory_stamps ──
  DROP POLICY IF EXISTS "memory_stamps_select" ON public.memory_stamps;
  CREATE POLICY "memory_stamps_select" ON public.memory_stamps
    FOR SELECT USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  -- ── monthly_reflections ──
  DROP POLICY IF EXISTS "monthly_reflections_select" ON public.monthly_reflections;
  CREATE POLICY "monthly_reflections_select" ON public.monthly_reflections
    FOR SELECT USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "monthly_reflections_insert" ON public.monthly_reflections;
  CREATE POLICY "monthly_reflections_insert" ON public.monthly_reflections
    FOR INSERT WITH CHECK (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "monthly_reflections_update" ON public.monthly_reflections;
  CREATE POLICY "monthly_reflections_update" ON public.monthly_reflections
    FOR UPDATE USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  -- ── reflection_answers ──
  DROP POLICY IF EXISTS "reflection_answers_select" ON public.reflection_answers;
  CREATE POLICY "reflection_answers_select" ON public.reflection_answers
    FOR SELECT USING (
      user_id = auth.uid()
      OR reflection_id IN (
        SELECT id FROM public.monthly_reflections
        WHERE couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
        AND is_revealed = TRUE
      )
    );

  DROP POLICY IF EXISTS "reflection_answers_insert" ON public.reflection_answers;
  CREATE POLICY "reflection_answers_insert" ON public.reflection_answers
    FOR INSERT WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "reflection_answers_update" ON public.reflection_answers;
  CREATE POLICY "reflection_answers_update" ON public.reflection_answers
    FOR UPDATE USING (user_id = auth.uid());

  -- ── couple_schedules ──
  DROP POLICY IF EXISTS "couple_schedules_select" ON public.couple_schedules;
  CREATE POLICY "couple_schedules_select" ON public.couple_schedules
    FOR SELECT USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "couple_schedules_insert" ON public.couple_schedules;
  CREATE POLICY "couple_schedules_insert" ON public.couple_schedules
    FOR INSERT WITH CHECK (
      owner_id = auth.uid()
      AND couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "couple_schedules_update" ON public.couple_schedules;
  CREATE POLICY "couple_schedules_update" ON public.couple_schedules
    FOR UPDATE USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

  DROP POLICY IF EXISTS "couple_schedules_delete" ON public.couple_schedules;
  CREATE POLICY "couple_schedules_delete" ON public.couple_schedules
    FOR DELETE USING (owner_id = auth.uid());

  -- ── couple_memos ──
  DROP POLICY IF EXISTS "couple_memos_select" ON public.couple_memos;
  CREATE POLICY "couple_memos_select" ON public.couple_memos
    FOR SELECT USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "couple_memos_insert" ON public.couple_memos;
  CREATE POLICY "couple_memos_insert" ON public.couple_memos
    FOR INSERT WITH CHECK (
      updated_by = auth.uid()
      AND couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  DROP POLICY IF EXISTS "couple_memos_update" ON public.couple_memos;
  CREATE POLICY "couple_memos_update" ON public.couple_memos
    FOR UPDATE USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      updated_by = auth.uid()
      AND couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  -- ── couple_book_credits ──
  DROP POLICY IF EXISTS "book_credits_select" ON public.couple_book_credits;
  CREATE POLICY "book_credits_select" ON public.couple_book_credits
    FOR SELECT USING (
      couple_id = (SELECT couple_id FROM public.profiles WHERE id = auth.uid())
    );

  -- INSERT/UPDATE는 RPC (add/redeem/consume) 전용.

END $$;

-- couple_schedules updated_at 트리거
CREATE OR REPLACE FUNCTION public.set_couple_schedules_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_couple_schedules_updated_at ON public.couple_schedules;
CREATE TRIGGER trg_couple_schedules_updated_at
  BEFORE UPDATE ON public.couple_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_couple_schedules_updated_at();

-- couple_memos updated_at 트리거
CREATE OR REPLACE FUNCTION public.set_couple_memos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_couple_memos_updated_at ON public.couple_memos;
CREATE TRIGGER trg_couple_memos_updated_at
  BEFORE UPDATE ON public.couple_memos
  FOR EACH ROW EXECUTE FUNCTION public.set_couple_memos_updated_at();


-- ────────────────────────────────────────────────────────────
-- 4. STORAGE
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('footprints', 'footprints', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  DROP POLICY IF EXISTS "footprints_upload"      ON storage.objects;
  DROP POLICY IF EXISTS "footprints_public_read"  ON storage.objects;
  DROP POLICY IF EXISTS "footprints_delete_own"   ON storage.objects;

  CREATE POLICY "footprints_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'footprints' AND auth.role() = 'authenticated');

  CREATE POLICY "footprints_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'footprints');

  CREATE POLICY "footprints_delete_own" ON storage.objects
    FOR DELETE USING (bucket_id = 'footprints' AND auth.role() = 'authenticated');
END $$;


-- ────────────────────────────────────────────────────────────
-- 5. TRIGGERS
-- ────────────────────────────────────────────────────────────

-- updated_at 자동 갱신
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 회원가입 시 프로필 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, phone)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'nickname',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      '사용자'
    ),
    COALESCE(new.raw_user_meta_data->>'phone', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ────────────────────────────────────────────────────────────
-- 6. RPC FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- 6-1. 상대방 걸음수 조회
CREATE OR REPLACE FUNCTION public.get_partner_steps(
  p_partner_id UUID, p_date DATE
)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_my_couple_id uuid;
  v_partner_couple_id uuid;
  v_steps integer;
BEGIN
  SELECT couple_id INTO v_my_couple_id FROM public.profiles WHERE id = auth.uid();
  SELECT couple_id INTO v_partner_couple_id FROM public.profiles WHERE id = p_partner_id;
  IF v_my_couple_id IS NULL OR v_partner_couple_id IS NULL OR v_my_couple_id != v_partner_couple_id THEN
    RETURN 0;
  END IF;
  SELECT steps INTO v_steps FROM public.daily_steps WHERE user_id = p_partner_id AND date = p_date;
  RETURN COALESCE(v_steps, 0);
END;
$$;

-- 6-2. 스탬프 획득
CREATE OR REPLACE FUNCTION public.claim_memory_stamp(
  p_date DATE, p_count INTEGER DEFAULT 30
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id uuid;
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  SELECT id INTO v_existing_id FROM public.memory_stamps
  WHERE couple_id = v_couple_id AND date = p_date;
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_claimed');
  END IF;
  INSERT INTO public.memory_stamps (couple_id, date, count)
  VALUES (v_couple_id, p_date, p_count)
  RETURNING id INTO v_new_id;
  RETURN jsonb_build_object('success', true, 'stamp_id', v_new_id, 'count', p_count);
END;
$$;

-- 6-3. 총 스탬프 수
CREATE OR REPLACE FUNCTION public.get_total_stamps()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id uuid; v_total integer;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN RETURN 0; END IF;
  SELECT COALESCE(SUM(count), 0) INTO v_total FROM public.memory_stamps WHERE couple_id = v_couple_id;
  RETURN v_total;
END;
$$;

-- 6-4. 이달의 회고 get-or-create
CREATE OR REPLACE FUNCTION public.get_or_create_reflection(
  p_year INTEGER, p_month INTEGER, p_question_ids INTEGER[]
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id uuid;
  v_reflection_id uuid;
  v_question_ids integer[];
  v_is_revealed boolean;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_couple');
  END IF;
  SELECT id, question_ids, is_revealed
  INTO v_reflection_id, v_question_ids, v_is_revealed
  FROM public.monthly_reflections
  WHERE couple_id = v_couple_id AND year = p_year AND month = p_month;
  IF v_reflection_id IS NULL THEN
    INSERT INTO public.monthly_reflections (couple_id, year, month, question_ids)
    VALUES (v_couple_id, p_year, p_month, p_question_ids)
    RETURNING id, question_ids, is_revealed
    INTO v_reflection_id, v_question_ids, v_is_revealed;
  END IF;
  RETURN jsonb_build_object(
    'id', v_reflection_id,
    'question_ids', v_question_ids,
    'is_revealed', v_is_revealed
  );
END;
$$;

-- 6-5. 회고 답변 저장
CREATE OR REPLACE FUNCTION public.save_reflection_answers(
  p_reflection_id UUID, p_answers JSONB
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id uuid; v_reflection_couple uuid;
  v_question_ids integer[]; v_partner_id uuid;
  v_partner_count integer; v_answer_record jsonb;
  v_was_revealed boolean; v_now_revealed boolean := FALSE;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  SELECT couple_id, question_ids, is_revealed
  INTO v_reflection_couple, v_question_ids, v_was_revealed
  FROM public.monthly_reflections WHERE id = p_reflection_id;
  IF v_reflection_couple IS NULL OR v_reflection_couple != v_couple_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;
  FOR v_answer_record IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.reflection_answers (reflection_id, user_id, question_id, answer, updated_at)
    VALUES (
      p_reflection_id, auth.uid(),
      (v_answer_record->>'question_id')::integer,
      v_answer_record->>'answer', now()
    )
    ON CONFLICT (reflection_id, user_id, question_id)
    DO UPDATE SET answer = EXCLUDED.answer, updated_at = now();
  END LOOP;
  SELECT CASE WHEN user1_id = auth.uid() THEN user2_id WHEN user2_id = auth.uid() THEN user1_id END
  INTO v_partner_id FROM public.couples WHERE id = v_couple_id;
  IF v_partner_id IS NOT NULL AND NOT v_was_revealed THEN
    SELECT COUNT(*) INTO v_partner_count FROM public.reflection_answers
    WHERE reflection_id = p_reflection_id AND user_id = v_partner_id AND answer != '';
    IF v_partner_count >= array_length(v_question_ids, 1) THEN
      UPDATE public.monthly_reflections SET is_revealed = TRUE, revealed_at = now()
      WHERE id = p_reflection_id;
      v_now_revealed := TRUE;
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'success', true,
    'revealed', v_now_revealed OR v_was_revealed,
    'just_revealed', v_now_revealed
  );
END;
$$;

-- 6-6. 회고 진행 상태
CREATE OR REPLACE FUNCTION public.get_reflection_progress(p_reflection_id UUID)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id uuid; v_reflection_couple uuid;
  v_total integer; v_partner_id uuid;
  v_my_count integer := 0; v_partner_count integer := 0;
  v_is_revealed boolean;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('error', 'no_couple');
  END IF;
  SELECT couple_id, COALESCE(array_length(question_ids, 1), 0), is_revealed
  INTO v_reflection_couple, v_total, v_is_revealed
  FROM public.monthly_reflections WHERE id = p_reflection_id;
  IF v_reflection_couple IS NULL OR v_reflection_couple <> v_couple_id THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  SELECT CASE WHEN user1_id = auth.uid() THEN user2_id WHEN user2_id = auth.uid() THEN user1_id END
  INTO v_partner_id FROM public.couples WHERE id = v_couple_id;
  SELECT COUNT(*) INTO v_my_count FROM public.reflection_answers
  WHERE reflection_id = p_reflection_id AND user_id = auth.uid() AND COALESCE(trim(answer), '') <> '';
  IF v_partner_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_partner_count FROM public.reflection_answers
    WHERE reflection_id = p_reflection_id AND user_id = v_partner_id AND COALESCE(trim(answer), '') <> '';
  END IF;
  RETURN jsonb_build_object(
    'total', v_total, 'my_answered', v_my_count,
    'partner_answered', v_partner_count,
    'has_partner', v_partner_id IS NOT NULL,
    'is_revealed', v_is_revealed
  );
END;
$$;

-- 6-8. 프리미엄 구매 마킹
CREATE OR REPLACE FUNCTION public.mark_premium_purchased(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_couple_id UUID;
BEGIN
  UPDATE public.profiles
  SET has_premium = true,
      premium_purchased_at = COALESCE(premium_purchased_at, now()),
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid() RETURNING couple_id INTO v_couple_id;
  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples SET has_premium = true, premium_purchaser_id = auth.uid()
    WHERE id = v_couple_id;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6-8b. 여행 무드 테마팩 구매 마킹 (기록 업그레이드와 별도 non-consumable)
CREATE OR REPLACE FUNCTION public.mark_theme_pack_purchased(p_revenuecat_user_id TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_couple_id UUID;
BEGIN
  UPDATE public.profiles
  SET has_theme_pack = true,
      theme_pack_purchased_at = COALESCE(theme_pack_purchased_at, now()),
      revenuecat_user_id = p_revenuecat_user_id
  WHERE id = auth.uid() RETURNING couple_id INTO v_couple_id;
  IF v_couple_id IS NOT NULL THEN
    UPDATE public.couples SET has_theme_pack = true, theme_pack_purchaser_id = auth.uid()
    WHERE id = v_couple_id;
  END IF;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─── 회고북 크레딧 ─────────────────────────────────────

-- 6-10. 회고북 크레딧 조회 (없으면 0으로 간주)
CREATE OR REPLACE FUNCTION public.get_book_credits()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
  v_credits INTEGER := 0;
  v_redeemed INTEGER := 0;
  v_year INTEGER;
  v_last_year INTEGER;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('credits', 0, 'redeemed_this_year', 0);
  END IF;
  SELECT credits_remaining, stamps_redeemed_year, last_redemption_year
  INTO v_credits, v_redeemed, v_last_year
  FROM public.couple_book_credits WHERE couple_id = v_couple_id;
  v_year := EXTRACT(YEAR FROM now())::INTEGER;
  -- 해가 바뀌면 자동으로 0으로 리셋 (stale row)
  IF v_last_year IS DISTINCT FROM v_year THEN
    v_redeemed := 0;
  END IF;
  RETURN jsonb_build_object(
    'credits', COALESCE(v_credits, 0),
    'redeemed_this_year', COALESCE(v_redeemed, 0)
  );
END;
$$;

-- 6-11. 결제 성공 시 크레딧 추가 (클라이언트에서 RC 결제 완료 후 호출)
--       count: 단권=1, 3권팩=3
CREATE OR REPLACE FUNCTION public.add_book_credits(p_count INTEGER)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
  v_year INTEGER;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  IF p_count < 1 OR p_count > 10 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_count');
  END IF;
  v_year := EXTRACT(YEAR FROM now())::INTEGER;
  INSERT INTO public.couple_book_credits (couple_id, credits_remaining, last_redemption_year)
  VALUES (v_couple_id, p_count, v_year)
  ON CONFLICT (couple_id) DO UPDATE SET
    credits_remaining = public.couple_book_credits.credits_remaining + p_count,
    updated_at = now();
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6-12. 스탬프로 회고북 크레딧 교환 (1,000 스탬프 = 1권, 연 2권 한도)
CREATE OR REPLACE FUNCTION public.redeem_stamps_for_book()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
  v_total_stamps INTEGER;
  v_redeemed INTEGER := 0;
  v_year INTEGER;
  v_last_year INTEGER;
  v_annual_cap CONSTANT INTEGER := 2;
  v_cost_per_book CONSTANT INTEGER := 1000;
  v_already_consumed_stamps INTEGER;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  v_year := EXTRACT(YEAR FROM now())::INTEGER;
  SELECT stamps_redeemed_year, last_redemption_year
  INTO v_redeemed, v_last_year
  FROM public.couple_book_credits WHERE couple_id = v_couple_id;
  -- 연 변경 시 카운터 리셋
  IF v_last_year IS DISTINCT FROM v_year THEN
    v_redeemed := 0;
  END IF;
  IF v_redeemed >= v_annual_cap THEN
    RETURN jsonb_build_object('success', false, 'reason', 'annual_cap_reached');
  END IF;
  -- 가용 스탬프 확인 (이미 교환한 만큼은 차감된 것으로 간주)
  SELECT COALESCE(SUM(count), 0) INTO v_total_stamps
    FROM public.memory_stamps WHERE couple_id = v_couple_id;
  -- 이미 교환에 쓴 스탬프: 같은 해 교환 횟수 × cost
  -- (모든 연도 합산 아닌 누적 기준 — 단순화: 교환 시점 기준 가능여부만 체크)
  v_already_consumed_stamps := 0; -- 실질적으로 스탬프는 감소시키지 않고, 교환 횟수만 cap
  -- 대신: "현재 스탬프 >= (교환 예정 cost)" + 연 cap 체크
  IF v_total_stamps < v_cost_per_book * (v_redeemed + 1) THEN
    RETURN jsonb_build_object(
      'success', false, 'reason', 'insufficient_stamps',
      'required', v_cost_per_book * (v_redeemed + 1),
      'current', v_total_stamps
    );
  END IF;
  -- 크레딧 추가 + 카운터 증가
  INSERT INTO public.couple_book_credits (
    couple_id, credits_remaining, stamps_redeemed_year, last_redemption_year
  )
  VALUES (v_couple_id, 1, 1, v_year)
  ON CONFLICT (couple_id) DO UPDATE SET
    credits_remaining = public.couple_book_credits.credits_remaining + 1,
    stamps_redeemed_year = (
      CASE WHEN public.couple_book_credits.last_redemption_year IS DISTINCT FROM v_year
           THEN 1
           ELSE public.couple_book_credits.stamps_redeemed_year + 1 END
    ),
    last_redemption_year = v_year,
    updated_at = now();
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6-13. 회고북 뽑기 시 크레딧 소비
CREATE OR REPLACE FUNCTION public.consume_book_credit()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_couple_id UUID;
  v_credits INTEGER := 0;
BEGIN
  SELECT couple_id INTO v_couple_id FROM public.profiles WHERE id = auth.uid();
  IF v_couple_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_couple');
  END IF;
  SELECT credits_remaining INTO v_credits
    FROM public.couple_book_credits WHERE couple_id = v_couple_id;
  IF COALESCE(v_credits, 0) < 1 THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_credits');
  END IF;
  UPDATE public.couple_book_credits
    SET credits_remaining = credits_remaining - 1, updated_at = now()
    WHERE couple_id = v_couple_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- 6-9. 프리미엄 자격 확인
CREATE OR REPLACE FUNCTION public.is_entitled()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
DECLARE
  v_my_premium BOOLEAN; v_couple_premium BOOLEAN;
BEGIN
  SELECT has_premium INTO v_my_premium
  FROM public.profiles WHERE id = auth.uid();
  IF v_my_premium THEN RETURN true; END IF;
  SELECT c.has_premium INTO v_couple_premium FROM public.couples c
  JOIN public.profiles p ON p.couple_id = c.id WHERE p.id = auth.uid() LIMIT 1;
  IF COALESCE(v_couple_premium, false) THEN RETURN true; END IF;
  RETURN false;
END;
$$;


-- 계정 삭제 (커플 데이터 보존형 소프트 삭제)
--   하드 삭제 시 FK CASCADE로 커플/공유 기록이 연쇄 삭제되므로, 한 명이 떠나도
--   남은 상대가 둘의 추억을 계속 볼 수 있도록 소프트 삭제로 구현한다.
--   자세한 근거는 supabase/account_deletion.sql 주석 참고.
CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- (1) 프로필 소프트 삭제 + PII 제거. 닉네임·캐릭터·사진은 공유 기록의
  --     일부라 남기고, couple_id도 유지한다(남은 상대의 조회 권한 보존).
  UPDATE public.profiles
  SET deleted_at         = COALESCE(deleted_at, now()),
      phone              = '',
      push_token         = NULL,
      revenuecat_user_id = NULL
  WHERE id = v_uid;

  -- (2) 개인 전용(비공유) 데이터만 삭제.
  DELETE FROM public.daily_steps   WHERE user_id = v_uid;
  DELETE FROM public.notifications WHERE recipient_id = v_uid;

  -- (3) 로그인 영구 차단 + auth PII 제거.
  DELETE FROM auth.identities WHERE user_id = v_uid;
  UPDATE auth.users
  SET email              = 'deleted+' || v_uid::text || '@deleted.walktoo.app',
      phone              = NULL,
      raw_user_meta_data = '{}'::jsonb,
      banned_until       = now() + interval '100 years'
  WHERE id = v_uid;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 7. GRANTS
-- ────────────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION public.mark_premium_purchased(TEXT)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_theme_pack_purchased(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_book_credits()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_book_credits(INTEGER)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_stamps_for_book()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_book_credit()          TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_entitled()                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_reflection_progress(UUID)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_my_account()            TO authenticated;

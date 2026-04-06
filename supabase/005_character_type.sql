-- 캐릭터 타입 추가 (boy / girl 중 선택)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS character_type text NOT NULL DEFAULT 'boy';

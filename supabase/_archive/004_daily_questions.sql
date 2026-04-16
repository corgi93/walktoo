-- 오늘의 질문 기능: footprint_entries에 질문/답변 컬럼 추가
-- diary_question_id: 다이어리 질문 인덱스 (0~14)
-- couple_question_id: 커플 질문 인덱스 (0~59)

ALTER TABLE public.footprint_entries
  ADD COLUMN IF NOT EXISTS diary_question_id integer,
  ADD COLUMN IF NOT EXISTS diary_answer text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS couple_question_id integer,
  ADD COLUMN IF NOT EXISTS couple_answer text NOT NULL DEFAULT '';

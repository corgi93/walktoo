-- ─── 회고 시드 데이터: 2025.10 ~ 2026.03 ──────────────
--
-- 사용법:
-- 1. Supabase SQL Editor에서 실행
-- 2. 또는: npx supabase db execute < scripts/seed-reflections.sql
--
-- 주의: 이미 해당 년/월에 회고가 있으면 skip (conflict 무시)
-- couple_id는 현재 존재하는 첫 번째 커플을 자동으로 사용합니다.

DO $$
DECLARE
  v_couple_id uuid;
  v_user_a    uuid;
  v_user_b    uuid;
  v_ref_id    uuid;
  v_months    int[][] := ARRAY[
    [2025, 10],
    [2025, 11],
    [2025, 12],
    [2026,  1],
    [2026,  2],
    [2026,  3]
  ];
  v_questions int[][] := ARRAY[
    [101, 108, 115],  -- 2025.10
    [102, 109, 116],  -- 2025.11
    [103, 110, 117],  -- 2025.12
    [104, 111, 118],  -- 2026.01
    [105, 112, 119],  -- 2026.02
    [106, 113, 120]   -- 2026.03
  ];
  v_answers_a text[][] := ARRAY[
    ['같이 한강 걸었던 날이 최고였어', '더 자주 만나고 싶었는데 바빴어', '매주 토요일 산책 같이 하자'],
    ['네가 웃을 때가 가장 좋아', '미안, 약속 잊은 날이 있었어', '서로 하루 한 줄씩 써보자'],
    ['올해 우리 한마디로 따뜻', '연말에 더 같이 있고 싶었어', '새해엔 같이 여행 가자'],
    ['추운 날 손잡고 걸었던 거', '좀 더 표현할걸', '같이 요리 도전해보자'],
    ['발렌타인에 편지 줘서 고마워', '바빠서 전화 못한 날 미안', '주말에 카페 투어 하자'],
    ['벚꽃길 산책이 진짜 예뻤어', '더 챙겨줄걸 그랬어', '같이 사진 많이 찍자']
  ];
  v_answers_b text[][] := ARRAY[
    ['단풍 구경 갔던 날!', '사실 좀 서운했던 날이 있었어', '같이 요리해보고 싶어'],
    ['카페에서 같이 책 읽었던 오후', '바쁘다고 소홀했던 것 같아', '매일 잘자 인사 꼭 하기'],
    ['크리스마스 데이트 최고', '연말 모임에 더 같이 가고 싶었어', '새해 첫날 같이 일출 보기'],
    ['눈 오던 날 같이 걸은 거', '전화할 때 더 잘 들어줄걸', '주말 브런치 루틴 만들자'],
    ['초콜릿 만들어준 거 감동이었어', '조금 더 시간을 내줬으면 했어', '봄에 피크닉 가자'],
    ['네가 꽃 사준 날', '표현이 부족했던 것 같아 미안', '매달 산책 기록 남기자']
  ];
  v_year    int;
  v_month   int;
  v_qs      int[];
  v_idx     int;
BEGIN
  -- 첫 번째 커플과 유저 가져오기
  SELECT id INTO v_couple_id FROM couples LIMIT 1;
  IF v_couple_id IS NULL THEN
    RAISE EXCEPTION 'No couple found. Create a couple first.';
  END IF;

  SELECT user_a, user_b INTO v_user_a, v_user_b
  FROM couples WHERE id = v_couple_id;

  FOR v_idx IN 1..6 LOOP
    v_year  := v_months[v_idx][1];
    v_month := v_months[v_idx][2];
    v_qs    := v_questions[v_idx];

    -- 이미 존재하면 skip
    IF EXISTS (
      SELECT 1 FROM monthly_reflections
      WHERE couple_id = v_couple_id AND year = v_year AND month = v_month
    ) THEN
      RAISE NOTICE 'Skipping %.% — already exists', v_year, v_month;
      CONTINUE;
    END IF;

    -- 회고 row 생성 (둘 다 쓴 상태 = revealed)
    INSERT INTO monthly_reflections (couple_id, year, month, question_ids, is_revealed)
    VALUES (v_couple_id, v_year, v_month, v_qs, true)
    RETURNING id INTO v_ref_id;

    -- user_a 답변 3개
    INSERT INTO reflection_answers (reflection_id, user_id, question_id, answer)
    VALUES
      (v_ref_id, v_user_a, v_qs[1], v_answers_a[v_idx][1]),
      (v_ref_id, v_user_a, v_qs[2], v_answers_a[v_idx][2]),
      (v_ref_id, v_user_a, v_qs[3], v_answers_a[v_idx][3]);

    -- user_b 답변 3개
    INSERT INTO reflection_answers (reflection_id, user_id, question_id, answer)
    VALUES
      (v_ref_id, v_user_b, v_qs[1], v_answers_b[v_idx][1]),
      (v_ref_id, v_user_b, v_qs[2], v_answers_b[v_idx][2]),
      (v_ref_id, v_user_b, v_qs[3], v_answers_b[v_idx][3]);

    RAISE NOTICE 'Created reflection for %.%', v_year, v_month;
  END LOOP;
END $$;

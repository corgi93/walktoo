// ─── 오늘의 질문 시스템 ─────────────────────────────────
//
// 📝 다이어리 질문: 산책 기록 시 자유 메모 대신 매일 바뀌는 주제 (15개)
// 💌 커플 질문: 카테고리별 속마음 질문 (60개, 6카테고리 x 10개)
//
// 질문 선택: D+Day 기반 로테이션 (커플이 같은 날 같은 질문)

// ─── Types ──────────────────────────────────────────────

export type QuestionCategory =
  | 'thrill'    // 💕 설렘
  | 'heart'     // 🌙 속마음
  | 'memory'    // 📸 추억
  | 'future'    // 🔮 미래
  | 'daily'     // ☀️ 일상
  | 'secret';   // 🔥 은밀한

export interface Question {
  id: number;
  category: QuestionCategory;
  emoji: string;
  categoryLabel: string;
  content: string;
}

export interface DiaryQuestion {
  id: number;
  content: string;
}

// ─── 카테고리 메타 ──────────────────────────────────────

export const CATEGORY_META: Record<QuestionCategory, { emoji: string; label: string }> = {
  thrill: { emoji: '💕', label: '설렘' },
  heart:  { emoji: '🌙', label: '속마음' },
  memory: { emoji: '📸', label: '추억' },
  future: { emoji: '🔮', label: '미래' },
  daily:  { emoji: '☀️', label: '일상' },
  secret: { emoji: '🔥', label: '은밀한' },
};

// ─── 📝 다이어리 질문 (15개) ────────────────────────────

export const DIARY_QUESTIONS: DiaryQuestion[] = [
  { id: 0, content: '오늘 산책하면서 가장 좋았던 순간은?' },
  { id: 1, content: '오늘 걸으면서 무슨 생각을 했어?' },
  { id: 2, content: '오늘 연인이랑 나눈 대화 중에 기억나는 한마디' },
  { id: 3, content: '오늘 본 풍경 중에 가장 예뻤던 건' },
  { id: 4, content: '오늘의 기분을 날씨로 표현한다면?' },
  { id: 5, content: '오늘 하루를 한 단어로 말해봐' },
  { id: 6, content: '오늘 연인한테 고마웠던 한 가지 :)' },
  { id: 7, content: '오늘 같이 먹은 것 중에 제일 맛있었던 건?' },
  { id: 8, content: '오늘 찍은 사진 중에 제일 마음에 드는 한 장은?' },
  { id: 9, content: '오늘 연인이 제일 예뻤던 / 멋졌던 순간!' },
  { id: 10, content: '오늘 산책길에서 발견한 소소한 것 하나' },
  { id: 11, content: '내일 또 같이 걷는다면 어디로 가고 싶어?' },
  { id: 12, content: '오늘 하루를 색깔로 표현한다면 무슨 색이야?' },
  { id: 13, content: '오늘 가장 웃겼던 순간을 적어봐!' },
  { id: 14, content: '오늘의 우리한테 한마디 남긴다면' },
];

// ─── 💌 커플 질문 (60개) ────────────────────────────────

export const COUPLE_QUESTIONS: Question[] = [
  // 💕 설렘 (0~9)
  { id: 0,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '처음 봤을 때, 연인은 어떤 느낌이었는지 말해줘' },
  { id: 1,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: "'아, 이 사람이다' 싶었던 순간이 분명 있었을 거야" },
  { id: 2,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '마음을 전하던 날, 머릿속에 스쳐간 생각이 뭐였어?' },
  { id: 3,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '지금도 괜히 두근거리는 순간이 있다면 :)' },
  { id: 4,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '연인의 어떤 표정에 제일 마음이 흔들려?' },
  { id: 5,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '아마 본인은 모를 거야. 내가 좋아하는 연인의 ___' },
  { id: 6,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '처음 손이 닿았던 그 순간, 아직 기억나지?' },
  { id: 7,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '나도 모르게 반해버린 행동이 딱 하나 있다면!' },
  { id: 8,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '무심코 던진 한마디였는데, 심장이 쿵 했던 적 있어' },
  { id: 9,  category: 'thrill', emoji: '💕', categoryLabel: '설렘', content: '지금 이 자리에서, 한 줄로 마음을 전해봐 :)' },

  // 🌙 속마음 (10~19)
  { id: 10, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '그때는 말 못했는데, 사실 조금 서운했던 게 있어' },
  { id: 11, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '내가 이럴 때, 네가 이렇게 해주면 참 좋겠다' },
  { id: 12, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '요즘 머릿속을 가장 많이 차지하고 있는 생각은 뭐야?' },
  { id: 13, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '연인이 있어서 진짜 다행이었던 순간을 하나 말해줘' },
  { id: 14, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '나는 이런 식으로 사랑받을 때 가장 따뜻해져 :)' },
  { id: 15, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '우리 사이에서 꼭 지키고 싶은 한 가지가 있다면' },
  { id: 16, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '혼자일 때 문득 연인 생각이 나는 순간이 있어' },
  { id: 17, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '나는 연인한테 어떤 사람이고 싶어?' },
  { id: 18, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '이건 좀 약한 부분인데, 알아줬으면 하는 게 있어 :)' },
  { id: 19, category: 'heart', emoji: '🌙', categoryLabel: '속마음', content: '오늘, 연인한테 꼭 하고 싶은 말이 하나 있어' },

  // 📸 추억 (20~29)
  { id: 20, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '우리 처음 같이 나갔던 날, 뭐가 제일 기억에 남아?' },
  { id: 21, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '같이 찍은 사진 중에 가장 아끼는 한 장을 골라봐!' },
  { id: 22, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '여행에서 가장 좋았던 딱 한 장면을 꼽는다면' },
  { id: 23, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '같이 먹었던 것 중에 아직도 생각나는 그 맛이 있지?' },
  { id: 24, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '둘이서 제일 많이 웃었던 날, 무슨 일이었어?' },
  { id: 25, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '내가 힘들었을 때, 연인이 해줬던 것 중 잊히지 않는 건' },
  { id: 26, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '싸우고 나서 다시 웃게 된 날, 어떤 기억이 남아있어?' },
  { id: 27, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '계절마다 떠오르는 우리만의 장소가 있다면 :)' },
  { id: 28, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '내가 해준 것 중에 가장 좋았던 거, 알려줘!' },
  { id: 29, category: 'memory', emoji: '📸', categoryLabel: '추억', content: '1년 뒤 오늘, 우리는 어떤 추억을 쌓고 있을까' },

  // 🔮 미래 (30~39)
  { id: 30, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '10년 뒤의 우리는 어떤 모습으로 있을까?' },
  { id: 31, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '언젠가 꼭 같이 서보고 싶은 곳이 있어' },
  { id: 32, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '둘이서 한 번쯤 도전해보고 싶은 게 있다면!' },
  { id: 33, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '나중에 같이 살 때, 이건 꼭 있었으면 좋겠다' },
  { id: 34, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '우리만의 기념일 루틴을 하나 만들어보자 :)' },
  { id: 35, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '한참 뒤에도, 같이 이걸 하면서 살고 싶어' },
  { id: 36, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '언젠가 연인한테 꼭 해주고 싶은 게 하나 있는데' },
  { id: 37, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '같이 키우고 싶은 존재가 있어?' },
  { id: 38, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '5년 안에 우리가 꼭 해냈으면 하는 한 가지!' },
  { id: 39, category: 'future', emoji: '🔮', categoryLabel: '미래', content: '많이 늙어서도 변하지 않을 우리만의 한 가지는' },

  // ☀️ 일상 (40~49)
  { id: 40, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '오늘 하루에서 기분이 제일 좋았던 순간을 알려줘' },
  { id: 41, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '요즘 연인이 제일 빠져있는 거, 맞혀볼래?' },
  { id: 42, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '오늘 고마웠던 아주 사소한 것 하나만 말해줘 :)' },
  { id: 43, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '이번 주, 같이 하고 싶은 거 있어?' },
  { id: 44, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '연인은 ___할 때 유독 빛나는 사람이야!' },
  { id: 45, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '자는 모습이나 무의식 습관 중에 귀여운 거 하나!' },
  { id: 46, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '내가 만들어주고 싶은 한 끼 메뉴가 있다면' },
  { id: 47, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '이 노래 들으면 연인이 떠올라. 어떤 노래인지 알려줘' },
  { id: 48, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '연인이랑 닮은 동물이 있다면 뭐야? :)' },
  { id: 49, category: 'daily', emoji: '☀️', categoryLabel: '일상', content: '지금 이 순간, 제일 하고 싶은 거 딱 하나만' },

  // 🔥 은밀한 (50~59)
  { id: 50, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '연인한테 가장 설렜던 가까운 순간이 있어' },
  { id: 51, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '어떤 모습일 때 제일 끌리는지 솔직하게 말해봐' },
  { id: 52, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '둘만 부르는 이름을 하나 지어본다면!' },
  { id: 53, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '연인이 입었던 옷 중에 아직도 잊히지 않는 건' },
  { id: 54, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '연인 향기 하면 떠오르는 게 있지?' },
  { id: 55, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '몰래 준비해보고 싶은 깜짝 이벤트가 있다면 :)' },
  { id: 56, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '같이 맞추고 싶은 게 하나 있어' },
  { id: 57, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '연인 목소리가 제일 좋은 순간은 언제야' },
  { id: 58, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '둘만 있을 때 가장 좋아하는 분위기를 말해줘' },
  { id: 59, category: 'secret', emoji: '🔥', categoryLabel: '은밀한', content: '지금 연인한테 해주고 싶은 거, 딱 하나만' },
];

// ─── 날짜별 질문 선택 헬퍼 ──────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

/**
 * 커플의 시작일과 기록 날짜로 오늘의 질문 2개를 결정.
 * 같은 날짜 → 같은 질문 (커플 동일 보장)
 */
export function getDailyQuestions(
  coupleStartDate: string | undefined,
  date: string,
): { diaryQuestion: DiaryQuestion; coupleQuestion: Question } {
  const dDay = coupleStartDate ? daysBetween(coupleStartDate, date) : 0;

  return {
    diaryQuestion: DIARY_QUESTIONS[dDay % DIARY_QUESTIONS.length],
    coupleQuestion: COUPLE_QUESTIONS[dDay % COUPLE_QUESTIONS.length],
  };
}

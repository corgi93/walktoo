/**
 * 다이어리 손글씨 노트용 짧은 한국어 시·문구 큐레이트.
 *
 * 상업 앱 배포 안전성을 위해 두 부류만 사용:
 *  1. 사후 70년 경과 — 한국 퍼블릭 도메인 시인 (김소월·윤동주·한용운·정지용·김영랑)
 *  2. 자체 창작한 오리지널 문구 (저작권 자체 보유, '무명' 표기)
 *
 * 생존 작가 / 보호기간 중인 작가의 시는 인용하지 않음.
 * 외국 시 한국어 번역본은 번역자 저작권이 별도로 살아있을 수 있어 제외.
 */

export interface DailyQuote {
  /** 본문 — 1~2줄 짧게 */
  text: string;
  /** 작가명 — 자체 창작 문구는 omit */
  author?: string;
  /** 작품명 (옵션) */
  work?: string;
}

export const COUPLE_QUOTES: readonly DailyQuote[] = [
  // ─── 한국 퍼블릭 도메인 시 (사후 70년 경과) ─────────
  {
    text: '나 보기가 역겨워\n가실 때에는 말없이 고이 보내드리오리다.',
    author: '김소월',
    work: '진달래꽃',
  },
  {
    text: '그립다\n말을 할까\n하니 그리워.',
    author: '김소월',
    work: '가는 길',
  },
  {
    text: '별 하나에 사랑과\n별 하나에 쓸쓸함과',
    author: '윤동주',
    work: '별 헤는 밤',
  },
  {
    text: '죽는 날까지 하늘을 우러러\n한 점 부끄럼이 없기를.',
    author: '윤동주',
    work: '서시',
  },
  {
    text: '님은 갔지만 나는 님을 보내지 아니하였습니다.',
    author: '한용운',
    work: '님의 침묵',
  },
  {
    text: '타고 남은 재가\n다시 기름이 됩니다.',
    author: '한용운',
    work: '알 수 없어요',
  },
  {
    text: '그곳이 차마 꿈엔들 잊힐 리야.',
    author: '정지용',
    work: '향수',
  },
  {
    text: '나는 아직 기다리고 있을 테요\n찬란한 슬픔의 봄을.',
    author: '김영랑',
    work: '모란이 피기까지는',
  },

  // ─── 오리지널 문구 (자체 창작 / 저작권 자체 보유) ─────
  { text: '다 아는 길도\n너랑 가면 처음 보는 길이 된다.' },
  { text: '헤어지고 돌아오는 길에\n이미 다음이 그리웠다.' },
  { text: '너랑 있을 땐 시간이\n자꾸 짧은 척을 한다.' },
  { text: '돌아갈 곳이 사람일 수도 있다는 걸\n너를 만나고 알았다.' },
  { text: '좋아한다는 말보다\n내일도 같이 갈래, 가 더 어려웠다.' },
  { text: '평일 저녁의 너는\n주말의 어떤 풍경보다 좋다.' },
  { text: '우리 둘만 아는 농담 하나로\n오후가 다 풀렸다.' },
  { text: '같이 늙어가자, 라는 말이\n내가 들은 가장 큰 사랑이었다.' },
  { text: '길게 설명 안 해도\n너는 늘 알아들었다.' },
  { text: '손이 차다는 한마디에\n네 손이 먼저 왔다.' },
  { text: '사랑하는 일은 결국\n같은 사람을 매일 새로 좋아하는 일.' },
  { text: '네가 보낸 카톡을 다시 읽다가\n또 혼자 웃었다.' },
  { text: '너 없을 때 좋았던 것들도\n너 있으니 더 좋아졌다.' },
  { text: '나란히 걷는 보폭이 맞을 때\n사랑이라는 말이 비로소 짧아졌다.' },
];

/**
 * 날짜 문자열 ('YYYY-MM-DD' 또는 임의 키)을 시드로 deterministic 인덱스 반환.
 * 같은 날엔 같은 명언, 다른 날엔 다른 명언. 부팅마다 안 바뀜.
 */
export function pickDailyQuote(seedKey: string | undefined): DailyQuote {
  const key = seedKey || new Date().toISOString().slice(0, 10);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  const idx = h % COUPLE_QUOTES.length;
  return COUPLE_QUOTES[idx];
}

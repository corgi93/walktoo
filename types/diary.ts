// ─── Footprint Entry (각 사람의 기록) ───────────────────

export interface FootprintEntry {
  userId: string;
  nickname: string;
  memo: string;
  photos: string[];
  writtenAt: string;
}

// ─── Walk Diary (커플 발자취) ────────────────────────────

export interface WalkDiary {
  id: string;
  coupleId: string;
  date: string;
  locationName: string;
  steps: number;
  /** 내 기록 */
  myEntry?: FootprintEntry;
  /** 상대방 기록 */
  partnerEntry?: FootprintEntry;
  /** 둘 다 작성 완료 시 true */
  isRevealed: boolean;
  createdAt: string;
}

// ─── Input ──────────────────────────────────────────────

export interface CreateWalkDiaryInput {
  date: string;
  locationName: string;
  memo: string;
  photos: string[];
  steps: number;
}

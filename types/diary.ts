// ─── Footprint Entry (각 사람의 기록) ───────────────────

export interface FootprintEntry {
  id: string;
  userId: string;
  nickname: string;
  memo: string;
  photos: string[];
  writtenAt: string;
  /** 다이어리 질문 인덱스 (0~14) */
  diaryQuestionId?: number;
  /** 다이어리 질문 답변 */
  diaryAnswer?: string;
  /** 커플 질문 인덱스 (0~59) */
  coupleQuestionId?: number;
  /** 커플 질문 답변 */
  coupleAnswer?: string;
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
  /** 다이어리 질문 */
  diaryQuestionId: number;
  diaryAnswer: string;
  /** 커플 질문 */
  coupleQuestionId: number;
  coupleAnswer: string;
}

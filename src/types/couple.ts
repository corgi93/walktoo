// ─── Couple ─────────────────────────────────────────────

export interface CoupleProfile {
  id: string;
  user1: CouplePartner;
  user2: CouplePartner;
  startDate: string;
  firstMetDate?: string;
  totalWalks: number;
  currentStreak: number;
}

export interface CouplePartner {
  id: string;
  nickname: string;
  profileImageUrl?: string;
  characterType: string;
  /** 탈퇴(계정 삭제)한 상대. 함께한 기록은 남지만 새 활동은 없다. */
  deletedAt?: string;
}

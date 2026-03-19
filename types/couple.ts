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
}

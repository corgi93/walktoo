// ─── Couple ─────────────────────────────────────────────

export interface CoupleProfile {
  id: string;
  user1: CouplePartner;
  user2: CouplePartner;
  startDate: string;
  totalWalks: number;
  currentStreak: number;
}

export interface CouplePartner {
  id: number;
  nickname: string;
  profileImageUrl?: string;
}

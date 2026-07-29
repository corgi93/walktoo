export interface UserResponse {
  id: string;
  nickname: string;
  phone: string;
  profileImageUrl?: string;
  birthday?: string;
  coupleId?: string;
  isProfileComplete: boolean;
  partnerNickname?: string;
  totalWalks: number;
  totalSteps: number;
  characterType: string;
  /** 계정 삭제(소프트) 시각. 값이 있으면 탈퇴한 계정. */
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

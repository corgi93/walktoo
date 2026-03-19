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
  createdAt: string;
  updatedAt: string;
}

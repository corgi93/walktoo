export interface UserResponse {
  id: string;
  nickname: string;
  phone: string;
  profileImageUrl?: string;
  coupleId?: string;
  partnerNickname?: string;
  totalWalks: number;
  totalSteps: number;
  createdAt: string;
  updatedAt: string;
}

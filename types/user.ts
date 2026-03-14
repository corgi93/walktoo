export interface UserResponse {
  id: number;
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

export interface CreateUserInput {
  nickname: string;
  phone: string;
  password: string;
}

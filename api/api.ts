import {
  AuthTokens,
  UserResponse,
  CreateUserInput,
  WalkDiary,
  CreateWalkDiaryInput,
  CoupleProfile,
} from '@/types';

import { client } from './client';

const api = {
  auth: {
    login: async (credentials: { phone: string; password: string }) => {
      return await client.post<AuthTokens>('/auth/login', credentials);
    },

    refreshToken: async (refreshToken: string): Promise<AuthTokens> => {
      return await client.post<AuthTokens>('/auth/refresh', { refreshToken });
    },

    logout: async () => {
      return await client.post('/auth/logout');
    },
  },

  user: {
    getMe: async (): Promise<UserResponse> => {
      return await client.get<UserResponse>('/users/me');
    },

    signup: async (userData: CreateUserInput): Promise<UserResponse> => {
      return await client.post<UserResponse>('/users/signup', userData);
    },

    updateUser: async (
      data: Partial<UserResponse>,
    ): Promise<UserResponse> => {
      return await client.patch<UserResponse>('/users/me', data);
    },
  },

  couple: {
    getProfile: async (): Promise<CoupleProfile> => {
      return await client.get<CoupleProfile>('/couple/profile');
    },
  },

  diary: {
    getList: async (page: number): Promise<WalkDiary[]> => {
      return await client.get<WalkDiary[]>(`/diary?page=${page}`);
    },

    getDetail: async (id: string): Promise<WalkDiary> => {
      return await client.get<WalkDiary>(`/diary/${id}`);
    },

    create: async (data: CreateWalkDiaryInput): Promise<WalkDiary> => {
      return await client.post<WalkDiary>('/diary', data);
    },
  },
};

export default api;

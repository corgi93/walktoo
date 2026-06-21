import * as SecureStore from 'expo-secure-store';

// ─── Secure Storage Utility ─────────────────────────────
// Supabase Auth는 server/client.ts의 ExpoSecureStoreAdapter를 통해
// 자동으로 세션/토큰을 관리합니다.
// 이 모듈은 앱 자체적으로 필요한 보안 저장소 유틸리티입니다.

export const secureStorage = {
  /** 값 저장 */
  save: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error(`Error saving ${key}`, error);
    }
  },

  /** 값 조회 */
  get: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error getting ${key}`, error);
      return null;
    }
  },

  /** 값 삭제 */
  remove: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error(`Error removing ${key}`, error);
    }
  },
};

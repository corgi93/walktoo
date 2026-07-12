import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

import {
  DEFAULT_DIARY_THEME_ID,
  DIARY_THEMES,
  type DiaryTheme,
  type DiaryThemeId,
  getDiaryTheme,
} from '@/styles/diaryThemes';

const STORAGE_KEY = 'walktoo.diaryTheme';

function isDiaryThemeId(value: string | null): value is DiaryThemeId {
  return value !== null && value in DIARY_THEMES;
}

/**
 * 다이어리 테마 선택/저장 훅.
 *
 * - 첫 로드 전엔 default 반환 → 깜빡임 방지
 * - 저장은 AsyncStorage 로컬 (디바이스마다 다름)
 */
export function useDiaryTheme(): {
  theme: DiaryTheme;
  themeId: DiaryThemeId;
  setTheme: (id: DiaryThemeId) => void;
  isReady: boolean;
} {
  const [themeId, setThemeId] = useState<DiaryThemeId>(DEFAULT_DIARY_THEME_ID);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (isDiaryThemeId(stored)) setThemeId(stored);
        setIsReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((id: DiaryThemeId) => {
    setThemeId(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {
      // persist 실패해도 세션 내에선 동작 — 다음 부팅 때 default로 돌아감
    });
  }, []);

  return {
    theme: getDiaryTheme(themeId),
    themeId,
    setTheme,
    isReady,
  };
}

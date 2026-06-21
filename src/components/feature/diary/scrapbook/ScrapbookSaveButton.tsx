import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ScrapbookSaveButtonProps {
  theme: DiaryTheme;
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
}

/**
 * 다꾸 저장 버튼 — 살짝 회전 + 큰 솔리드 그림자.
 * 디자인의 "✎ 나의 기록 남기기" 버튼.
 */
export function ScrapbookSaveButton({
  theme: t,
  label,
  onPress,
  loading,
  loadingLabel,
  disabled,
}: ScrapbookSaveButtonProps) {
  const isMinimal = t.id === 'grid_minimal';
  const isDark = t.isDark;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        {
          backgroundColor: t.accent,
          shadowColor: t.ink,
          transform: isMinimal ? [] : [{ rotate: '-0.6deg' }],
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text
            style={[
              styles.label,
              {
                fontFamily: t.titleFont,
                fontWeight: t.titleWeight,
                color: '#FFFFFF',
                fontStyle:
                  t.titleMode === 'italic' || t.titleMode === 'dark'
                    ? 'italic'
                    : 'normal',
                textTransform:
                  t.titleMode === 'dark' ? 'uppercase' : 'none',
                letterSpacing:
                  t.titleMode === 'pixel'
                    ? 1
                    : t.titleMode === 'dark'
                      ? 2
                      : 0,
              },
            ]}
          >
            {loadingLabel ?? label}
          </Text>
        </View>
      ) : (
        <Text
          style={[
            styles.label,
            {
              fontFamily: t.titleFont,
              fontWeight: t.titleWeight,
              color: '#FFFFFF',
              fontStyle:
                t.titleMode === 'italic' || t.titleMode === 'dark'
                  ? 'italic'
                  : 'normal',
              textTransform: t.titleMode === 'dark' ? 'uppercase' : 'none',
              letterSpacing:
                t.titleMode === 'pixel'
                  ? 1
                  : t.titleMode === 'dark'
                    ? 2
                    : 0,
              textShadowColor: isDark ? t.accentDeep : 'transparent',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 0,
            },
          ]}
        >
          ✎ {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  label: {
    fontSize: 16,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

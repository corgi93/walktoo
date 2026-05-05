import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { ScrapbookByTag } from './ScrapbookByTag';
import { Sticker } from './Sticker';

interface ScrapbookLockedEntryProps {
  theme: DiaryTheme;
  partnerName: string;
  title: string;
  description: string;
  /** 잠긴 emoji — 보통 🔒 or 💌 */
  iconEmoji: string;
  /** 톡톡 보내기 버튼 노출 여부 */
  nudgeLabel?: string;
  onNudge?: () => void;
  nudgeDisabled?: boolean;
}

/**
 * 연인 기록이 안 잠겨있을 때의 placeholder.
 * - 점선 dashed 테두리 + 살짝 회전
 * - 큰 원형 잠금 아이콘 (theme.tints[1])
 * - by-tag (연인 닉네임)
 * - "톡톡 보내기" 옵션 버튼
 */
export function ScrapbookLockedEntry({
  theme: t,
  partnerName,
  title,
  description,
  iconEmoji,
  nudgeLabel,
  onNudge,
  nudgeDisabled,
}: ScrapbookLockedEntryProps) {
  const isMinimal = t.id === 'grid_minimal';

  return (
    <View
      style={[
        styles.wrap,
        {
          transform: isMinimal ? [] : [{ rotate: '-0.7deg' }],
        },
      ]}
    >
      <View
        style={[
          styles.box,
          {
            backgroundColor: t.paper,
            borderColor: t.inkSoft,
          },
        ]}
      >
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <ScrapbookByTag theme={t} prefix="by." name={partnerName} colorKey="accent" />
        </View>

        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: t.tints[1],
              borderColor: t.ink,
            },
          ]}
        >
          <Text style={styles.iconEmoji}>{iconEmoji}</Text>
        </View>

        <Text
          style={[
            styles.title,
            {
              color: t.ink,
              fontFamily: t.handFont,
              fontWeight: t.handWeight,
            },
          ]}
        >
          {title}
        </Text>
        <Text
          style={[
            styles.desc,
            {
              color: t.inkSoft,
              fontFamily: t.bodyFont,
              fontWeight: t.bodyWeight,
            },
          ]}
        >
          {description}
        </Text>

        {nudgeLabel && onNudge && (
          <Pressable
            onPress={onNudge}
            disabled={nudgeDisabled}
            style={[
              styles.nudgeBtn,
              {
                backgroundColor: t.tints[0],
                borderColor: t.accent,
                opacity: nudgeDisabled ? 0.6 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.nudgeText,
                {
                  color: t.accent,
                  fontFamily: t.handFont,
                  fontWeight: '700',
                },
              ]}
            >
              👆 {nudgeLabel}
            </Text>
          </Pressable>
        )}
      </View>

      {!isMinimal && (
        <Sticker
          kind={t.stickers[0] ?? 'star'}
          size={22}
          color={t.accent}
          style={{ position: 'absolute', top: -8, right: -6, zIndex: 5 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  box: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    textAlign: 'center',
  },
  desc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  nudgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderRadius: 4,
  },
  nudgeText: {
    fontSize: 13,
  },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';

interface MarkerDetailSheetProps {
  walk: WalkDiary | null;
  bottomInset: number;
  onClose: () => void;
  onOpenDetail: (walk: WalkDiary) => void;
}

const SHEET_HEIGHT = 200;

/**
 * 지도 마커 클릭 시 화면 하단에서 슬라이드 업되는 시트.
 * - walk가 set 되면 슬라이드 인, null이면 슬라이드 아웃
 * - 다른 마커 클릭 시 walk만 swap → content 부드럽게 교체 (재오픈 X)
 */
export function MarkerDetailSheet({
  walk,
  bottomInset,
  onClose,
  onOpenDetail,
}: MarkerDetailSheetProps) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT + 80)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [displayWalk, setDisplayWalk] = useState<WalkDiary | null>(walk);

  useEffect(() => {
    if (walk) {
      setDisplayWalk(walk);
    }
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: walk ? 0 : SHEET_HEIGHT + bottomInset + 40,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
        mass: 0.6,
      }),
      Animated.timing(backdropOpacity, {
        toValue: walk ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!walk) setDisplayWalk(null);
    });
  }, [walk, bottomInset, translateY, backdropOpacity]);

  if (!displayWalk) return null;

  const thumbnail =
    displayWalk.myEntry?.photos?.[0] ?? displayWalk.partnerEntry?.photos?.[0];
  const kindLabel = displayWalk.kind === 'together' ? '우리의 하루' : '각자의 하루';
  const dateLabel = formatDate(displayWalk.date);

  return (
    <>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents={walk ? 'auto' : 'none'}
      >
        <Pressable style={styles.backdropPress} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: bottomInset + SPACING.lg,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.handle} />

        <View style={styles.row}>
          {thumbnail ? (
            <Image
              source={{ uri: thumbnail }}
              style={styles.thumb}
              resizeMode="cover"
              resizeMethod="resize"
              fadeDuration={0}
            />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]}>
              <Icon name="map-pin" size={22} color={theme.colors.gray400} />
            </View>
          )}
          <View style={styles.info}>
            <View style={styles.kindRow}>
              <Icon
                name={displayWalk.kind === 'together' ? 'heart' : 'sun'}
                size={11}
                color={theme.colors.primary}
              />
              <Text
                variant="caption"
                style={styles.kindLabel}
                color="textSecondary"
              >
                {kindLabel} · {dateLabel}
              </Text>
            </View>
            <Text
              variant="headingSmall"
              style={styles.place}
              numberOfLines={1}
            >
              {displayWalk.locationName || '기록'}
            </Text>
          </View>

          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Icon name="x" size={16} color={theme.colors.gray500} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => onOpenDetail(displayWalk)}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.ctaPressed,
          ]}
        >
          <Text variant="bodyMedium" style={styles.ctaText}>
            자세히 보기
          </Text>
          <Icon name="chevron-right" size={16} color={theme.colors.white} />
        </Pressable>
      </Animated.View>
    </>
  );
}

function formatDate(iso: string): string {
  // iso 예: '2026-05-19'
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [, m, d] = parts;
  return `${parseInt(m, 10)}월 ${parseInt(d, 10)}일`;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(28, 28, 30, 0.22)',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.gray300,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: theme.colors.gray100,
  },
  thumbEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray200,
    borderStyle: 'dashed',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  kindRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kindLabel: {
    fontWeight: '600',
  },
  place: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray100,
  },
  cta: {
    marginTop: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
  },
  ctaPressed: {
    backgroundColor: theme.colors.primaryDark,
  },
  ctaText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});

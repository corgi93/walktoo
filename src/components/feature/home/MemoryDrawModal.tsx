import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal as RNModal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Row, Text } from '@/components/base';
import { COUPLE_QUESTIONS, DIARY_QUESTIONS } from '@/constants/questions';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { getWalkLocationSummary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

// 롤링 총 길이 ≈ 1.1s (원래 2.5s에서 50%+ 단축, 더 스냅하게)
const ROLL_INTERVAL_MS = 60;
const ROLL_TICKS = 18;

interface MemoryDrawModalProps {
  open: boolean;
  onClose: () => void;
}

export function MemoryDrawModal({ open, onClose }: MemoryDrawModalProps) {
  const router = useRouter();
  const { t } = useTranslation(['home', 'common']);

  const { data, isLoading } = useDiaryListQuery();
  const walks = useMemo<WalkDiary[]>(
    () => (data?.pages.flat() ?? []).filter((w) => w.kind === 'together'),
    [data],
  );
  const total = walks.length;

  const [idx, setIdx] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRolling(false);
  }, []);

  const startRoll = useCallback(() => {
    if (total === 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRolling(true);
    let n = 0;
    intervalRef.current = setInterval(() => {
      n++;
      setIdx(Math.floor(Math.random() * total));
      if (n >= ROLL_TICKS) stopRoll();
    }, ROLL_INTERVAL_MS);
  }, [total, stopRoll]);

  // 모달 열 때마다 새로 뽑기
  useEffect(() => {
    if (!open) return stopRoll;
    if (total > 0) startRoll();
    return stopRoll;
  }, [open, total, startRoll, stopRoll]);

  const current = idx !== null ? walks[idx] : undefined;

  const handleOpenDetail = () => {
    if (!current || rolling) return;
    onClose();
    router.push({
      pathname: '/diary-detail',
      params: {
        id: current.id,
        date: current.date,
        locationName: current.locationName,
        kind: current.kind,
        isRevealed: String(current.isRevealed),
        myEntry: current.myEntry ? JSON.stringify(current.myEntry) : '',
        partnerEntry: current.partnerEntry
          ? JSON.stringify(current.partnerEntry)
          : '',
      },
    });
  };

  return (
    <RNModal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
        <View style={styles.stampBadge}>
          <Text variant="caption" color="white" style={styles.stampText}>
            {t('home:memory-draw.card-stamp', {
              num: String((idx ?? 0) + 1).padStart(3, '0'),
            })}
          </Text>
        </View>

        {isLoading && total === 0 ? (
          <LoadingState />
        ) : total === 0 ? (
          <EmptyState
            onCreate={() => {
              onClose();
              router.push('/footprint-create');
            }}
          />
        ) : current ? (
          <Pressable onPress={handleOpenDetail} disabled={rolling || !current}>
            <MemoryCard walk={current} rolling={rolling} />
          </Pressable>
        ) : null}

        {total > 0 && (
          <Row style={styles.actions}>
            <Pressable
              style={styles.closeAction}
              onPress={onClose}
              disabled={rolling}
            >
              <Text variant="bodyMedium" color="textSecondary">
                {t('common:actions.close')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.againAction, rolling && styles.againActionDisabled]}
              onPress={startRoll}
              disabled={rolling}
            >
              <Text variant="bodyMedium" color="white" style={styles.againText}>
                {rolling
                  ? t('home:memory-draw.rolling')
                  : t('home:memory-draw.again')}
              </Text>
            </Pressable>
          </Row>
        )}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// ─── Memory Card ────────────────────────────────────────

function MemoryCard({
  walk,
  rolling,
}: {
  walk: WalkDiary;
  rolling: boolean;
}) {
  const { t } = useTranslation(['home', 'common']);

  const formattedDate = formatDate(parseLocalDate(walk.date), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const place = getWalkLocationSummary(walk);
  const photo = pickPhoto(walk);
  const teaser = pickTeaser(walk);

  return (
    <View>
      <View style={[styles.photoFrame, rolling && styles.photoFrameRolling]}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.photoEmpty}>
            <Icon name="camera" size={28} color={theme.colors.gray400} />
            <Text variant="caption" color="textMuted" style={{ marginTop: 4 }}>
              {t('home:memory-draw.no-photo')}
            </Text>
          </View>
        )}
        <View style={styles.dateChip}>
          <Icon name="calendar" size={11} color={theme.colors.primary} />
          <Text variant="caption" color="primary" style={styles.dateChipText}>
            {walk.date.replace(/-/g, '.')}
          </Text>
        </View>
        {!rolling && (
          <View style={styles.openHint}>
            <Text variant="caption" color="white" style={styles.openHintText}>
              {t('home:memory-draw.open')} ›
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Row style={styles.placeRow}>
          <Icon name="map-pin" size={14} color={theme.colors.primary} />
          <Text
            variant="headingSmall"
            style={styles.placeText}
            numberOfLines={1}
          >
            {place || t('common:labels.each-day')}
          </Text>
        </Row>
        <Text variant="caption" color="textMuted" style={styles.dateLine}>
          {formattedDate}
        </Text>

        <View style={styles.teaser}>
          <Text
            variant="caption"
            color="primary"
            style={styles.qLine}
            numberOfLines={1}
          >
            {teaser?.question
              ? `${t('home:memory-draw.q-prefix')} ${teaser.question}`
              : ' '}
          </Text>
          <Text
            variant="bodyMedium"
            color={teaser ? 'text' : 'textMuted'}
            style={styles.teaserText}
            numberOfLines={3}
          >
            {teaser?.answer ?? t('home:memory-draw.no-teaser')}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Helpers ────────────────────────────────────────────

function pickPhoto(walk: WalkDiary): string | undefined {
  return walk.myEntry?.photos?.[0] ?? walk.partnerEntry?.photos?.[0];
}

function pickTeaser(
  walk: WalkDiary,
): { question?: string; answer: string } | null {
  const e = walk.myEntry ?? walk.partnerEntry;
  if (!e) return null;
  if (e.diaryAnswer?.trim()) {
    const q =
      e.diaryQuestionId != null
        ? DIARY_QUESTIONS[e.diaryQuestionId]?.content
        : undefined;
    return { question: q, answer: e.diaryAnswer.trim() };
  }
  if (e.coupleAnswer?.trim()) {
    const q =
      e.coupleQuestionId != null
        ? COUPLE_QUESTIONS[e.coupleQuestionId]?.content
        : undefined;
    return { question: q, answer: e.coupleAnswer.trim() };
  }
  if (e.memo?.trim()) return { answer: e.memo.trim() };
  return null;
}

// ─── States ─────────────────────────────────────────────

function LoadingState() {
  return (
    <View style={styles.stateBox}>
      <ActivityIndicator color={theme.colors.primary} />
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useTranslation('home');
  return (
    <View style={styles.stateBox}>
      <View style={styles.emptyIcon}>
        <Icon name="footprint" size={28} color={theme.colors.primary} />
      </View>
      <Text variant="headingSmall" align="center" mt="md">
        {t('memory-draw.empty-title')}
      </Text>
      <Text
        variant="bodySmall"
        color="textMuted"
        align="center"
        mt="xs"
        style={{ lineHeight: 18 }}
      >
        {t('memory-draw.empty-hint')}
      </Text>
      <Pressable style={styles.emptyCta} onPress={onCreate}>
        <Text variant="bodyMedium" color="white">
          {t('memory-draw.empty-cta')}
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 46, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  sheet: {
    width: '100%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: SPACING.md,
    paddingTop: SPACING.lg,
    ...theme.pixel.borderThin,
    ...theme.shadows.medium,
    position: 'relative',
  },
  stampBadge: {
    position: 'absolute',
    top: -10,
    left: SPACING.lg,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    zIndex: 2,
  },
  stampText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Card
  photoFrame: {
    aspectRatio: 4 / 3,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  photoFrameRolling: {
    opacity: 0.6,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChip: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  dateChipText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  openHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(44, 44, 46, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  openHintText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
  },

  cardBody: {
    marginTop: SPACING.md,
    minHeight: 132,
  },
  placeRow: {
    alignItems: 'center',
    gap: 6,
  },
  placeText: {
    flex: 1,
    fontWeight: '700',
  },
  dateLine: {
    marginTop: 2,
    marginLeft: 20,
  },
  teaser: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray100,
    minHeight: 80,
  },
  qLine: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 11,
    lineHeight: 14,
    minHeight: 14,
  },
  teaserText: {
    lineHeight: 20,
    minHeight: 60,
  },

  // Actions
  actions: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  closeAction: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.gray100,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  againAction: {
    flex: 1.6,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  againActionDisabled: {
    opacity: 0.7,
  },
  againText: {
    fontWeight: '700',
  },

  // States
  stateBox: {
    paddingVertical: SPACING.xxxl,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCta: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
});

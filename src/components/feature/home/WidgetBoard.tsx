import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelProgressBar, Text } from '@/components/base';
import { usePopup } from '@/components/composite/popup/PopupProvider';
import { STAMP, STEP_GOAL } from '@/constants/game-config';
import { useSendNudgeMutation } from '@/hooks/services/nudge/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useDialogStore } from '@/stores/dialogStore';
import type { WalkDiary } from '@/types';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { formatDday, formatSteps } from '@/utils/date';
import { isVideoUri } from '@/utils/media';

import { HomeMapWidget } from './HomeMapWidget';
import { BOY_FRAMES, GIRL_FRAMES, WalkingSprite } from './WalkIllustration';

type CharacterType = 'boy' | 'girl';

const FRAMES_MAP: Record<CharacterType, typeof BOY_FRAMES> = {
  boy: BOY_FRAMES,
  girl: GIRL_FRAMES,
};

// ─── WidgetBoard ────────────────────────────────────────

interface WidgetBoardProps {
  firstMetDate?: string;
  isDiaryLoading?: boolean;
  todayWalk?: WalkDiary;
  walks: readonly WalkDiary[];
  myName: string;
  partnerName: string;
  myCharacter?: CharacterType;
  partnerCharacter?: CharacterType;
  mySteps: number;
  partnerSteps: number;
  hasTodayStamp: boolean;
  isClaimingStamp: boolean;
  onDdayPress: () => void;
  onClaimStamp: () => void;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
}

export function WidgetBoard({
  firstMetDate,
  isDiaryLoading = false,
  todayWalk,
  walks,
  myName,
  partnerName,
  myCharacter = 'boy',
  partnerCharacter = 'girl',
  mySteps,
  partnerSteps,
  hasTodayStamp,
  isClaimingStamp,
  onDdayPress,
  onClaimStamp,
  onMapInteractionStart,
  onMapInteractionEnd,
}: WidgetBoardProps) {
  const router = useRouter();
  const { t } = useTranslation(['home', 'common']);
  const popup = usePopup();
  const dialog = useDialogStore();
  const { me, couple, partnerId } = usePartnerDerivation();
  const sendNudge = useSendNudgeMutation();

  const myEntry = todayWalk?.myEntry;
  const partnerEntry = todayWalk?.partnerEntry;

  const diaryDetailParams = todayWalk
    ? {
        id: todayWalk.id,
        date: todayWalk.date,
        locationName: todayWalk.locationName,
        kind: todayWalk.kind,
        isRevealed: String(todayWalk.isRevealed),
        myEntry: todayWalk.myEntry ? JSON.stringify(todayWalk.myEntry) : '',
        partnerEntry: todayWalk.partnerEntry
          ? JSON.stringify(todayWalk.partnerEntry)
          : '',
      }
    : null;

  // 둘 다 작성된 경우만 풀 다이어리 페이지로. 한쪽만(each) 작성된 상태에서는
  // 가벼운 미디어 뷰어로 — 영상은 재생, 사진은 핀치줌 확대.
  const openMediaViewer = (entry?: { photos: string[]; memo?: string }) => {
    const uri = entry?.photos?.[0];
    if (!uri) return;
    router.push({
      pathname: '/media-viewer',
      params: { uri, caption: entry?.memo ?? '' },
    });
  };

  const handleOpenToday = () => {
    if (!myEntry) {
      router.push('/quick-capture');
      return;
    }
    if (partnerEntry && diaryDetailParams) {
      router.push({ pathname: '/diary-detail', params: diaryDetailParams });
      return;
    }
    openMediaViewer(myEntry);
  };

  // 상대 카드: 상대가 올렸으면 보기, 없으면 콕 찌르기
  const handleOpenPartner = () => {
    if (partnerEntry) {
      if (!myEntry) {
        router.push('/quick-capture');
      } else if (diaryDetailParams) {
        router.push({ pathname: '/diary-detail', params: diaryDetailParams });
      }
      return;
    }

    popup.confirm({
      title: t('home:nudge.title', { name: partnerName }),
      content: t('home:nudge.description'),
      confirmText: sendNudge.isPending ? '...' : t('home:nudge.confirm'),
      cancelText: t('common:actions.cancel'),
      onConfirm: async () => {
        if (!me?.id || !partnerId || !couple?.id) return;
        const result = await sendNudge.mutateAsync({
          recipientId: partnerId,
          coupleId: couple.id,
          senderName: me.nickname ?? partnerName,
        });
        if (!result.success) {
          dialog.alert('', t('home:nudge.already-sent'));
        }
      },
    });
  };

  return (
    <View style={styles.board}>
      {/* Header ─ D+ 인라인 텍스트 라인 */}
      <DdayLine
        myName={myName}
        partnerName={partnerName}
        firstMetDate={firstMetDate}
        onPress={onDdayPress}
      />

      {/* 걸음은 매일 돌아오는 이유, 지도는 기록이 쌓이는 이유다. */}
      <StepsWidget
        myName={myName}
        partnerName={partnerName}
        myCharacter={myCharacter}
        partnerCharacter={partnerCharacter}
        mySteps={mySteps}
        partnerSteps={partnerSteps}
        hasTodayStamp={hasTodayStamp}
        isClaimingStamp={isClaimingStamp}
        onClaimStamp={onClaimStamp}
      />

      <HomeMapWidget
        walks={walks}
        isLoading={isDiaryLoading}
        onMapInteractionStart={onMapInteractionStart}
        onMapInteractionEnd={onMapInteractionEnd}
      />

      <TodaySectionHeader hasMyEntry={isDiaryLoading || !!myEntry} />

      {/* 오늘의 두 장면 — 각자의 오늘 루프 */}
      <View style={styles.row}>
        <TodayPolaroidWidget
          name={myName}
          entry={myEntry}
          isLoading={isDiaryLoading}
          kind={todayWalk?.kind}
          isMine
          onPress={handleOpenToday}
        />
        <TodayPolaroidWidget
          name={partnerName}
          entry={partnerEntry}
          isLoading={isDiaryLoading}
          kind={todayWalk?.kind}
          isMine={false}
          isRevealed={todayWalk?.isRevealed ?? false}
          onPress={handleOpenPartner}
        />
      </View>

      {/* 투로그 모아보기 — 과거 each 기록이 있을 때만 노출 */}
      <EachMomentsBrowseLink walks={walks} />
    </View>
  );
}

// ─── 오늘의 가벼운 기록 ──────────────────────────────────

function TodaySectionHeader({ hasMyEntry }: { hasMyEntry: boolean }) {
  const router = useRouter();
  const { t } = useTranslation('home');

  return (
    <View style={styles.todayHeader}>
      <View>
        <Text variant="headingSmall">{t('today.section-title')}</Text>
        <Text variant="caption" color="textMuted" mt="xxs">
          {t('today.section-description')}
        </Text>
      </View>
      {!hasMyEntry && (
        <Pressable
          onPress={() => router.push('/quick-capture')}
          style={({ pressed }) => [
            styles.todayAddButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('cta.today-moment')}
        >
          <Icon name="camera" size={15} color={theme.colors.primary} />
          <Text variant="caption" color="primary">
            {t('today.add-short')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── 투로그 모아보기 링크 ───────────────────────────────
//
// 과거 kind='each' + 미디어 있는 walks가 있을 때만 노출.
// 신규 유저가 진입하자마자 빈 상태로 갔다가 돌아오는 경험을 피하기 위함.

function EachMomentsBrowseLink({ walks }: { walks: readonly WalkDiary[] }) {
  const router = useRouter();

  const eachMomentCount = React.useMemo(() => {
    let count = 0;
    for (const w of walks) {
      if (w.kind !== 'each') continue;
      const myHas = (w.myEntry?.photos?.length ?? 0) > 0;
      const partnerHas = (w.partnerEntry?.photos?.length ?? 0) > 0;
      if (myHas || partnerHas) count += 1;
    }
    return count;
  }, [walks]);

  if (eachMomentCount === 0) return null;

  return (
    <Pressable
      onPress={() => router.push('/each-moments')}
      style={({ pressed }) => [styles.browseLink, pressed && { opacity: 0.85 }]}
      accessibilityRole="button"
      accessibilityLabel="투로그 모아보기"
    >
      <View style={styles.browseLinkLeft}>
        <View style={styles.browseLinkIcon}>
          <Icon name="sun" size={14} color={theme.colors.primary} />
        </View>
        <View style={styles.browseLinkText}>
          <Text variant="bodyMedium" style={styles.browseLinkTitle}>
            지난 투로그
          </Text>
          <Text variant="caption" color="textMuted">
            가볍게 주고받은 둘의 하루 {eachMomentCount}개
          </Text>
        </View>
      </View>
      <Icon name="chevron-right" size={18} color={theme.colors.gray400} />
    </Pressable>
  );
}

// ─── D+ 헤더 (텍스트 라인) ───────────────────────────────

function DdayLine({
  myName,
  partnerName,
  firstMetDate,
  onPress,
}: {
  myName: string;
  partnerName: string;
  firstMetDate?: string;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');
  return (
    <Pressable onPress={onPress} style={styles.ddayLine}>
      {firstMetDate ? (
        <Text variant="bodySmall" color="textMuted">
          <Text variant="bodySmall" color="primary">
            {myName}
          </Text>{' '}
          <Icon name="heart" size={11} color={theme.colors.primaryDark} />{' '}
          <Text variant="bodySmall" color="primary">
            {partnerName}
          </Text>
          <Text variant="bodySmall" color="textMuted">
            {' '}
            {t('dday.met-text')}{' '}
          </Text>
          <Text variant="bodySmall" color="primary">
            {formatDday(firstMetDate)}
          </Text>
        </Text>
      ) : (
        <Text variant="bodySmall" color="textMuted">
          {t('dday.set-prompt')}
        </Text>
      )}
    </Pressable>
  );
}

// ─── 오늘의 폴라로이드 위젯 ──────────────────────────────

function TodayPolaroidWidget({
  name,
  entry,
  isLoading = false,
  kind,
  isMine,
  isRevealed = true,
  onPress,
}: {
  name: string;
  entry?: {
    photos: string[];
    memo: string;
    diaryAnswer?: string;
  };
  isLoading?: boolean;
  kind?: 'together' | 'each';
  isMine: boolean;
  isRevealed?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation(['home', 'diary']);
  const router = useRouter();
  const blurred = !isMine && !!entry && !isRevealed;
  const photo = blurred ? undefined : entry?.photos?.[0];
  const isVideo = isVideoUri(photo);

  // kindBadge(해/하트) 탭 = 풀스크린 media-viewer로 바로 진입.
  // blurred(상대 미공개)나 사진 없으면 무시.
  const handleKindBadgePress = () => {
    if (blurred || !photo) return;
    router.push({
      pathname: '/media-viewer',
      params: { uri: photo, caption: entry?.memo ?? '' },
    });
  };

  // 1차 탭 = 인라인 재생, 2차 탭 = onPress(풀스크린).
  // blurred(상대 미공개)면 인라인 재생 스킵 — onPress가 nudge/풀스크린 분기.
  const canInlinePlay = isVideo && !!photo && !blurred;
  const [isPlaying, setIsPlaying] = useState(false);

  const videoSource = canInlinePlay ? (photo as string) : null;
  const player = useVideoPlayer(videoSource, (p) => {
    if (!videoSource) return;
    p.loop = true;
    p.muted = false;
    // 시작은 일시정지 — 첫 프레임이 썸네일 역할
  });

  const handlePress = () => {
    if (canInlinePlay && !isPlaying) {
      player.play();
      setIsPlaying(true);
      return;
    }
    onPress();
  };

  return (
    <Pressable style={[styles.widget, styles.polaroid]} onPress={handlePress}>
      {/* 클립 장식 */}
      <View style={styles.polaroidClip} />

      <View style={styles.polaroidPhoto}>
        {photo && !isVideo ? (
          <Image
            source={{ uri: photo }}
            style={[styles.polaroidImg, blurred && { opacity: 0.25 }]}
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : photo && isVideo ? (
          <View style={[styles.videoThumb, blurred && { opacity: 0.25 }]}>
            {canInlinePlay && (
              <VideoView
                player={player}
                style={styles.videoThumbInner}
                contentFit="cover"
                nativeControls={false}
              />
            )}
            {!isPlaying && (
              <View style={styles.videoPlayBadge}>
                <Icon name="play" size={18} color={theme.colors.white} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.polaroidEmpty}>
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.gray400} />
            ) : (
              <Icon
                name={isMine ? 'camera' : 'heart'}
                size={22}
                color={theme.colors.gray400}
              />
            )}
          </View>
        )}
        {kind && entry && (
          <Pressable
            onPress={handleKindBadgePress}
            hitSlop={10}
            disabled={!!blurred || !photo}
            style={({ pressed }) => [
              styles.kindBadge,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Icon
              name={kind === 'together' ? 'heart' : 'sun'}
              size={10}
              color={theme.colors.primary}
            />
          </Pressable>
        )}
      </View>

      <View style={styles.polaroidCaption}>
        <Text
          variant="caption"
          color={entry ? 'text' : 'textMuted'}
          numberOfLines={1}
          style={styles.polaroidName}
        >
          {name}
        </Text>
        <Text
          variant="caption"
          color="textMuted"
          numberOfLines={1}
          style={{ fontSize: 9 }}
        >
          {isLoading
            ? t('home:today.loading')
            : entry
              ? blurred
                ? t('home:today.waiting-reveal')
                : t('home:today.done')
              : isMine
                ? t('home:today.empty-mine')
                : t('home:today.empty-partner')}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── 걸음 + 오늘의 미션 (통합 위젯) ──────────────────────

function StepsWidget({
  myName,
  partnerName,
  myCharacter,
  partnerCharacter,
  mySteps,
  partnerSteps,
  hasTodayStamp,
  isClaimingStamp,
  onClaimStamp,
}: {
  myName: string;
  partnerName: string;
  myCharacter: CharacterType;
  partnerCharacter: CharacterType;
  mySteps: number;
  partnerSteps: number;
  hasTodayStamp: boolean;
  isClaimingStamp: boolean;
  onClaimStamp: () => void;
}) {
  const { t } = useTranslation('home');
  const goal = STEP_GOAL.DAILY_COUPLE_MISSION;
  const total = mySteps + partnerSteps;
  const progress = Math.min(total / goal, 1);
  const isCompleted = total >= goal;
  const remaining = Math.max(goal - total, 0);

  return (
    <View style={[styles.widget, styles.steps]}>
      <View style={stepsStyles.summaryRow}>
        <View style={stepsStyles.summaryText}>
          <Text variant="caption" color="textSecondary">
            {t('unified-mission.combined-title')}
          </Text>
          <View style={stepsStyles.totalRow}>
            <Text variant="headingLarge" color="primary">
              {formatSteps(total)}
            </Text>
            <Text variant="bodySmall" color="textMuted" ml="xs">
              {t('unified-mission.steps-unit')}
            </Text>
          </View>
        </View>
        <View style={stepsStyles.centerStage}>
          <WalkingSprite frames={FRAMES_MAP[myCharacter]} size={30} delay={0} />
          <View style={stepsStyles.heartBadge}>
            <Icon name="heart" size={12} color={theme.colors.white} />
          </View>
          <WalkingSprite
            frames={FRAMES_MAP[partnerCharacter]}
            size={30}
            delay={150}
          />
        </View>
      </View>

      <PixelProgressBar
        progress={progress}
        segments={16}
        fillColor={theme.colors.primary}
        style={stepsStyles.progressBar}
      />

      <View style={stepsStyles.detailRow}>
        <Text
          variant="caption"
          color="textSecondary"
          numberOfLines={1}
          style={stepsStyles.names}
        >
          {myName} {formatSteps(mySteps)} · {partnerName}{' '}
          {formatSteps(partnerSteps)}
        </Text>
        <Text variant="caption" color={isCompleted ? 'secondary' : 'textMuted'}>
          {isCompleted
            ? t('unified-mission.completed')
            : t('unified-mission.remaining', { count: formatSteps(remaining) })}
        </Text>
      </View>

      {/* Claim 버튼 (완료 시만) */}
      {isCompleted && (
        <Pressable
          onPress={onClaimStamp}
          disabled={hasTodayStamp || isClaimingStamp}
          style={[
            stepsStyles.claimBtn,
            hasTodayStamp && stepsStyles.claimBtnDone,
          ]}
        >
          <Icon
            name="star"
            size={12}
            color={hasTodayStamp ? theme.colors.textMuted : theme.colors.white}
          />
          <Text
            variant="caption"
            color={hasTodayStamp ? 'textMuted' : 'white'}
            style={{ marginLeft: 4, fontWeight: '600' }}
          >
            {hasTodayStamp
              ? t('unified-mission.claim-done')
              : t('unified-mission.claim-button', {
                  count: STAMP.DAILY_REWARD,
                })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const stepsStyles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryText: {
    flex: 1,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerStage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  heartBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  names: {
    flex: 1,
  },
  progressBar: {
    marginTop: SPACING.sm,
  },

  // Claim 버튼
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  claimBtnDone: {
    backgroundColor: theme.colors.gray100,
  },
});

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  board: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  ddayLine: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  todayAddButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },

  // 투로그 모아보기 — 슬림 1-라인 CTA
  browseLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  browseLinkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  browseLinkIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseLinkText: {
    flex: 1,
    gap: 1,
  },
  browseLinkTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  widget: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: SPACING.sm,
    minHeight: 76,
    shadowColor: theme.colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },

  // Polaroid Widget
  polaroid: {
    padding: SPACING.xs,
    paddingTop: SPACING.sm,
    backgroundColor: theme.colors.surface,
    aspectRatio: 0.92,
  },
  polaroidClip: {
    position: 'absolute',
    top: -4,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 7,
    backgroundColor: theme.colors.gray400,
    borderRadius: 2,
    zIndex: 1,
  },
  polaroidPhoto: {
    flex: 1,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray100,
    marginBottom: 3,
  },
  polaroidImg: {
    width: '100%',
    height: '100%',
  },
  videoThumb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.gray600,
    overflow: 'hidden',
  },
  videoThumbInner: {
    ...StyleSheet.absoluteFillObject,
  },
  videoPlayBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  polaroidEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidCaption: {
    gap: 1,
  },
  polaroidName: {
    fontWeight: '600',
    fontSize: 11,
  },
  kindBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  // Steps Widget — 페이지 bg(cream)와 확실히 대비되도록 white
  steps: {
    backgroundColor: theme.colors.surface,
    padding: SPACING.md,
  },
});

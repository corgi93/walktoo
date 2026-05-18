import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelProgressBar, Text } from '@/components/base';
import type { IconName } from '@/components/base/Icon';
import { usePopup } from '@/components/composite/popup/PopupProvider';
import { STAMP, STEP_GOAL, stepsToCalories } from '@/constants/game-config';
import { useSendNudgeMutation } from '@/hooks/services/nudge/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useDialogStore } from '@/stores/dialogStore';
import type { WalkDiary } from '@/types';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { formatDday, formatSteps } from '@/utils/date';
import { isVideoUri } from '@/utils/media';

import { HomeMapWidget } from './HomeMapWidget';
import { MemoryDrawWidget } from './MemoryDrawWidget';
import { BOY_FRAMES, GIRL_FRAMES, WalkingSprite } from './WalkIllustration';

type CharacterType = 'boy' | 'girl';

const FRAMES_MAP: Record<CharacterType, typeof BOY_FRAMES> = {
  boy: BOY_FRAMES,
  girl: GIRL_FRAMES,
};

// ─── WidgetBoard ────────────────────────────────────────

interface WidgetBoardProps {
  firstMetDate?: string;
  todayWalk?: WalkDiary;
  recentWalks: readonly WalkDiary[];
  myName: string;
  partnerName: string;
  myCharacter?: CharacterType;
  partnerCharacter?: CharacterType;
  mySteps: number;
  partnerSteps: number;
  reflectionProgress: {
    total: number;
    myAnswered: number;
    partnerAnswered: number;
    isRevealed: boolean;
  } | null;
  totalStamps: number;
  hasTodayStamp: boolean;
  isClaimingStamp: boolean;
  onDdayPress: () => void;
  onClaimStamp: () => void;
  onMapInteractionStart?: () => void;
  onMapInteractionEnd?: () => void;
}

export function WidgetBoard({
  firstMetDate,
  todayWalk,
  recentWalks,
  myName,
  partnerName,
  myCharacter = 'boy',
  partnerCharacter = 'girl',
  mySteps,
  partnerSteps,
  reflectionProgress,
  totalStamps,
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
      if (myEntry && diaryDetailParams) {
        router.push({ pathname: '/diary-detail', params: diaryDetailParams });
      } else {
        openMediaViewer(partnerEntry);
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

      {/* Row 1 ─ 발걸음 + 오늘의 미션 (맨 위) */}
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

      {/* Row 2 ─ 각자 사진 (오늘의 나 · 상대의 오늘) */}
      <View style={styles.row}>
        <TodayPolaroidWidget
          name={myName}
          entry={myEntry}
          kind={todayWalk?.kind}
          isMine
          onPress={handleOpenToday}
        />
        <TodayPolaroidWidget
          name={partnerName}
          entry={partnerEntry}
          kind={todayWalk?.kind}
          isMine={false}
          isRevealed={todayWalk?.isRevealed ?? false}
          onPress={handleOpenPartner}
        />
      </View>

      {/* Row 3 ─ 우리 지도 */}
      <HomeMapWidget
        walks={recentWalks}
        onMapInteractionStart={onMapInteractionStart}
        onMapInteractionEnd={onMapInteractionEnd}
      />

      {/* 추억 뽑기 ─ 가챠 hero 카드 */}
      <MemoryDrawWidget />

      {/* Row 4 ─ 이달의 우리 · 추억의 발자국 */}
      <View style={styles.row}>
        <ReflectionMiniWidget
          progress={reflectionProgress}
          onPress={() => router.push('/reflection')}
        />
        <FootprintTimelineWidget
          totalStamps={totalStamps}
          onPress={() => router.push('/reflection-timeline')}
        />
      </View>
    </View>
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
          </Text>
          {' '}
          <Icon name="heart" size={11} color={theme.colors.primaryDark} />
          {' '}
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
  kind?: 'together' | 'each';
  isMine: boolean;
  isRevealed?: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation(['home', 'diary']);
  const router = useRouter();
  const photo = entry?.photos?.[0];
  const blurred = !isMine && entry && !isRevealed;
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
            <Icon
              name={isMine ? 'camera' : 'heart'}
              size={22}
              color={theme.colors.gray400}
            />
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
          {entry
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
  const percent = Math.min(Math.round(progress * 100), 100);
  const isCompleted = total >= goal;

  return (
    <View style={[styles.widget, styles.steps]}>
      {/* 상단 ─ 3-column: [나 텍스트] [🧍♥🧍 stage] [상대 텍스트] */}
      <View style={stepsStyles.stageRow}>
        <PersonStat
          name={myName}
          steps={mySteps}
          color={theme.colors.primary}
        />
        <View style={stepsStyles.centerStage}>
          <WalkingSprite
            frames={FRAMES_MAP[myCharacter]}
            size={30}
            delay={0}
          />
          <View style={stepsStyles.heartBadge}>
            <Icon name="heart" size={12} color={theme.colors.white} />
          </View>
          <WalkingSprite
            frames={FRAMES_MAP[partnerCharacter]}
            size={30}
            delay={150}
          />
        </View>
        <PersonStat
          name={partnerName}
          steps={partnerSteps}
          color={theme.colors.secondary}
        />
      </View>

      {/* 하단 ─ 오늘의 미션 strip */}
      <View style={stepsStyles.missionDivider} />

      <View style={stepsStyles.missionHeader}>
        <View style={stepsStyles.missionHeaderLeft}>
          <Icon name="target" size={12} color={theme.colors.secondary} />
          <Text variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>
            {t('unified-mission.title')}
          </Text>
        </View>
        <Text variant="caption" color="textMuted">
          {percent}%
        </Text>
      </View>

      <PixelProgressBar
        progress={progress}
        segments={16}
        fillColor={theme.colors.primary}
        style={stepsStyles.progressBar}
      />

      <View style={stepsStyles.missionFooter}>
        <Text variant="caption" color="primary" style={stepsStyles.footerSteps}>
          {formatSteps(total)}
        </Text>
        <Text variant="caption" color="textMuted" style={{ marginLeft: 3 }}>
          / {goal.toLocaleString()}
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
              : t('unified-mission.claim-button', { count: STAMP.DAILY_REWARD })}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function PersonStat({
  name,
  steps,
  color,
}: {
  name: string;
  steps: number;
  color: string;
}) {
  const kcal = stepsToCalories(steps);

  return (
    <View style={stepsStyles.personStat}>
      <Text
        variant="caption"
        color="textSecondary"
        numberOfLines={1}
        style={stepsStyles.personName}
      >
        {name}
      </Text>
      <Text variant="headingMedium" style={[stepsStyles.personSteps, { color }]}>
        {formatSteps(steps)}
      </Text>
      <View style={stepsStyles.personFooter}>
        <Text variant="caption" color="textMuted" style={stepsStyles.unit}>
          걸음
        </Text>
        <Text variant="caption" color="textMuted" style={stepsStyles.dot}>
          ·
        </Text>
        <Icon name="fire" size={10} color={theme.colors.accent} />
        <Text variant="caption" color="textSecondary" style={stepsStyles.kcal}>
          {kcal}kcal
        </Text>
      </View>
    </View>
  );
}

const stepsStyles = StyleSheet.create({
  // 상단 3-column stage: [나 stat] [🧍♥🧍] [상대 stat]
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  personStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
  },
  personName: {
    fontWeight: '600',
    textAlign: 'center',
  },
  personSteps: {
    marginTop: 2,
    textAlign: 'center',
  },
  personFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  unit: {
    fontSize: 10,
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 10,
    opacity: 0.5,
  },
  kcal: {
    marginLeft: 3,
    fontSize: 10,
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

  // 미션 strip
  missionDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.4,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  missionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    marginTop: 6,
  },
  missionFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  footerSteps: {
    fontWeight: '700',
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

// ─── 이달의 우리 (회고) ──────────────────────────────────

function ReflectionMiniWidget({
  progress,
  onPress,
}: {
  progress: {
    total: number;
    myAnswered: number;
    partnerAnswered: number;
    isRevealed: boolean;
  } | null;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');
  const myPct =
    progress && progress.total > 0
      ? Math.round((progress.myAnswered / progress.total) * 100)
      : 0;

  return (
    <Pressable style={[styles.widget, styles.reflection]} onPress={onPress}>
      <MiniIconBadge name="book-open" />
      <Text variant="bodySmall" color="text" style={{ fontWeight: '600' }}>
        {t('reflection.title')}
      </Text>
      <Text variant="caption" color="textMuted" style={{ fontSize: 10 }}>
        {progress?.isRevealed
          ? t('reflection.revealed-hint')
          : t('reflection.progress-hint', { pct: myPct })}
      </Text>
    </Pressable>
  );
}

// ─── 공용 아이콘 배지 (미니 위젯용) ──────────────────────

function MiniIconBadge({ name }: { name: IconName }) {
  return (
    <View style={styles.iconBadge}>
      <Icon name={name} size={18} color={theme.colors.primary} />
    </View>
  );
}

// ─── 추억의 발자국 타임라인 ──────────────────────────────

function FootprintTimelineWidget({
  totalStamps,
  onPress,
}: {
  totalStamps: number;
  onPress: () => void;
}) {
  const { t } = useTranslation('home');

  return (
    <Pressable style={[styles.widget, styles.timeline]} onPress={onPress}>
      <MiniIconBadge name="footprint" />
      <Text variant="bodySmall" color="text" style={{ fontWeight: '600' }}>
        {t('timeline.title')}
      </Text>
      <Text variant="caption" color="primary" style={{ fontSize: 10 }}>
        {t('timeline.stamp-count', { count: totalStamps })}
      </Text>
    </Pressable>
  );
}

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

  // Mini widgets — 톤 통일 (전부 primarySurface 파스텔 핑크, y2k 계열)
  reflection: {
    gap: 4,
    backgroundColor: theme.colors.primarySurface,
  },
  timeline: {
    gap: 4,
    backgroundColor: theme.colors.primarySurface,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.primaryLight,
    marginBottom: 2,
  },
});

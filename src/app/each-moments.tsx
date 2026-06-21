import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/base';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useNudgeMutation } from '@/hooks/services/notification/mutation';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';
import { isVideoUri } from '@/utils/media';

// ─── Types ──────────────────────────────────────────────

interface DayGroup {
  date: string;
  walkId: string;
  myEntry: WalkDiary['myEntry'] | null;
  partnerEntry: WalkDiary['partnerEntry'] | null;
}

// ─── Screen ─────────────────────────────────────────────
//
// 각자의 모먼트 둘러보기.
//
// - 세로 페이징 (한 페이지 = 하루)
// - 한 페이지 내부에서는 둘 다 있으면 좌우 분할, 한 명만 있으면 중앙 단일 카드
// - 한 명만 있을 때 비어있는 쪽은 "톡톡" CTA로 대체
// - 카드 탭 → 풀스크린 media-viewer
// - 영상은 카드에서 muted loop preview (배터리 부담 최소화 위해 cover 비율)

export default function EachMomentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{ date?: string }>();
  const initialDate = params.date;

  const { myName, partnerName, partnerId, couple } = usePartnerDerivation();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useDiaryListQuery();

  // 각자(kind='each') + 미디어 1개 이상 있는 walks만 모아 날짜별 그룹화.
  const dayGroups = useMemo<DayGroup[]>(() => {
    const walks = data?.pages.flat() ?? [];
    return walks
      .filter((w) => w.kind === 'each')
      .filter(
        (w) =>
          (w.myEntry?.photos?.length ?? 0) > 0 ||
          (w.partnerEntry?.photos?.length ?? 0) > 0,
      )
      .map<DayGroup>((w) => ({
        date: w.date,
        walkId: w.id,
        myEntry: w.myEntry ?? null,
        partnerEntry: w.partnerEntry ?? null,
      }));
    // 서버에서 이미 date desc 정렬되어 온다고 가정
  }, [data]);

  const initialIndex = useMemo(() => {
    if (!initialDate) return 0;
    const idx = dayGroups.findIndex((g) => g.date === initialDate);
    return idx >= 0 ? idx : 0;
  }, [initialDate, dayGroups]);

  const close = useCallback(() => router.back(), [router]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (dayGroups.length === 0) {
    return (
      <View style={styles.root}>
        <Pressable
          onPress={close}
          style={[styles.closeBtn, { top: insets.top + SPACING.md }]}
          hitSlop={8}
        >
          <Icon name="x" size={22} color={theme.colors.white} />
        </Pressable>
        <View style={styles.emptyState}>
          <Icon name="camera" size={44} color={theme.colors.gray500} />
          <Text variant="bodyMedium" color="white" mt="md">
            아직 각자의 모먼트가 없어요
          </Text>
          <Text variant="caption" color="textMuted" mt="xs" align="center">
            홈에서 오늘 한 컷을 남기면 여기에 쌓여요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        data={dayGroups}
        keyExtractor={(item) => `${item.date}-${item.walkId}`}
        renderItem={({ item }) => (
          <DayPage
            group={item}
            myName={myName}
            partnerName={partnerName}
            pageWidth={width}
            pageHeight={height}
            insets={insets}
            partnerId={partnerId}
            coupleId={couple?.id}
          />
        )}
        pagingEnabled
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(_, idx) => ({
          length: height,
          offset: height * idx,
          index: idx,
        })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        decelerationRate="fast"
      />

      <Pressable
        onPress={close}
        style={[styles.closeBtn, { top: insets.top + SPACING.md }]}
        hitSlop={8}
      >
        <Icon name="x" size={22} color={theme.colors.white} />
      </Pressable>
    </View>
  );
}

// ─── DayPage ────────────────────────────────────────────

function DayPage({
  group,
  myName,
  partnerName,
  pageWidth,
  pageHeight,
  insets,
  partnerId,
  coupleId,
}: {
  group: DayGroup;
  myName: string;
  partnerName: string;
  pageWidth: number;
  pageHeight: number;
  insets: { top: number; bottom: number };
  partnerId?: string;
  coupleId?: string;
}) {
  const router = useRouter();
  const nudge = useNudgeMutation();
  const toast = useToast();
  const nudgedRef = useRef(false);

  const myUri = group.myEntry?.photos?.[0];
  const partnerUri = group.partnerEntry?.photos?.[0];
  const hasMine = !!myUri;
  const hasPartner = !!partnerUri;
  const bothPresent = hasMine && hasPartner;

  const formattedDate = formatDate(parseLocalDate(group.date), {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  const handleTapMine = () => {
    if (!myUri) return;
    router.push({
      pathname: '/media-viewer',
      params: { uri: myUri, caption: group.myEntry?.memo ?? '' },
    });
  };

  const handleTapPartner = () => {
    if (!partnerUri) return;
    router.push({
      pathname: '/media-viewer',
      params: { uri: partnerUri, caption: group.partnerEntry?.memo ?? '' },
    });
  };

  const handleNudge = () => {
    if (!partnerId || !coupleId || nudgedRef.current) return;
    nudge.mutate(
      { recipientId: partnerId, coupleId, walkId: group.walkId },
      {
        onSuccess: () => {
          nudgedRef.current = true;
          toast.success('톡톡을 보냈어요');
        },
        onError: () => toast.error('잠시 후 다시 시도해주세요'),
      },
    );
  };

  return (
    <View style={[styles.page, { width: pageWidth, height: pageHeight }]}>
      {/* Header */}
      <View
        style={[
          styles.pageHeader,
          { paddingTop: insets.top + SPACING.xxxl },
        ]}
      >
        <Text style={styles.dateLabel}>{formattedDate}</Text>
      </View>

      {/* Body */}
      <View style={styles.pageBody}>
        {bothPresent ? (
          <View style={styles.dualRow}>
            <DualCard
              entry={group.myEntry!}
              authorName={myName}
              uri={myUri!}
              onPress={handleTapMine}
            />
            <DualCard
              entry={group.partnerEntry!}
              authorName={partnerName}
              uri={partnerUri!}
              onPress={handleTapPartner}
            />
          </View>
        ) : (
          <SoloCard
            entry={(hasMine ? group.myEntry : group.partnerEntry)!}
            authorName={hasMine ? myName : partnerName}
            uri={(hasMine ? myUri : partnerUri)!}
            onPress={hasMine ? handleTapMine : handleTapPartner}
            isMine={hasMine}
            otherName={hasMine ? partnerName : myName}
            canNudge={hasMine && !!partnerId && !!coupleId}
            onNudge={handleNudge}
            nudgePending={nudge.isPending}
            nudged={nudgedRef.current}
          />
        )}
      </View>

      {/* 페이지 푸터 — 스와이프 힌트 */}
      <View
        style={[
          styles.pageFooter,
          { paddingBottom: insets.bottom + SPACING.lg },
        ]}
      >
        <Text style={styles.swipeHint}>위/아래로 넘기기</Text>
      </View>
    </View>
  );
}

// ─── DualCard ───────────────────────────────────────────

function DualCard({
  entry,
  authorName,
  uri,
  onPress,
}: {
  entry: NonNullable<WalkDiary['myEntry']>;
  authorName: string;
  uri: string;
  onPress: () => void;
}) {
  const isVideo = isVideoUri(uri);
  const player = useVideoPlayer(isVideo ? uri : '', (p) => {
    if (!isVideo) return;
    p.muted = true;
    p.loop = true;
    p.play();
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dualCard,
        pressed && styles.cardPressed,
      ]}
    >
      {isVideo ? (
        <VideoView
          player={player}
          style={styles.cardMedia}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          allowsFullscreen={false}
        />
      ) : (
        <Image source={{ uri }} style={styles.cardMedia} />
      )}

      {isVideo && (
        <View style={styles.videoBadge}>
          <Icon name="play" size={11} color={theme.colors.white} />
        </View>
      )}

      <View style={styles.cardScrim} />
      <View style={styles.cardMeta}>
        <Text style={styles.cardAuthor} numberOfLines={1}>
          {authorName}
        </Text>
        {!!entry.memo && (
          <Text style={styles.cardMemo} numberOfLines={2}>
            {entry.memo}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

// ─── SoloCard ───────────────────────────────────────────

function SoloCard({
  entry,
  authorName,
  uri,
  onPress,
  isMine,
  otherName,
  canNudge,
  onNudge,
  nudgePending,
  nudged,
}: {
  entry: NonNullable<WalkDiary['myEntry']>;
  authorName: string;
  uri: string;
  onPress: () => void;
  isMine: boolean;
  otherName: string;
  canNudge: boolean;
  onNudge: () => void;
  nudgePending: boolean;
  nudged: boolean;
}) {
  const isVideo = isVideoUri(uri);
  const player = useVideoPlayer(isVideo ? uri : '', (p) => {
    if (!isVideo) return;
    p.muted = true;
    p.loop = true;
    p.play();
  });

  return (
    <View style={styles.soloWrap}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.soloCard,
          pressed && styles.cardPressed,
        ]}
      >
        {isVideo ? (
          <VideoView
            player={player}
            style={styles.cardMedia}
            contentFit="cover"
            nativeControls={false}
            allowsPictureInPicture={false}
            allowsFullscreen={false}
          />
        ) : (
          <Image source={{ uri }} style={styles.cardMedia} />
        )}

        {isVideo && (
          <View style={styles.videoBadge}>
            <Icon name="play" size={11} color={theme.colors.white} />
          </View>
        )}

        <View style={styles.cardScrim} />
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor} numberOfLines={1}>
            {authorName}
          </Text>
          {!!entry.memo && (
            <Text style={styles.cardMemo} numberOfLines={2}>
              {entry.memo}
            </Text>
          )}
        </View>
      </Pressable>

      {/* 비어있는 쪽 자리 — 톡톡 CTA */}
      <View style={styles.emptyHintRow}>
        <Text style={styles.emptyHintText}>
          {isMine
            ? `${otherName}은(는) 아직 안 남겼어요`
            : `${otherName}이(가) 아직 안 남겼어요`}
        </Text>
        {canNudge && (
          <Pressable
            onPress={onNudge}
            disabled={nudgePending || nudged}
            style={[
              styles.nudgeBtn,
              (nudgePending || nudged) && styles.nudgeBtnDisabled,
            ]}
            hitSlop={6}
          >
            <Text style={styles.nudgeText}>
              {nudged
                ? '✓ 보냄'
                : nudgePending
                  ? '보내는 중…'
                  : '👆 톡톡'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0E0E0F',
  },
  closeBtn: {
    position: 'absolute',
    right: SPACING.lg,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  page: {
    flexDirection: 'column',
  },
  pageHeader: {
    paddingHorizontal: SPACING.xxl,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  dateLabel: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'NeoDunggeunmo',
    letterSpacing: 0.3,
  },
  pageBody: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
  },
  pageFooter: {
    alignItems: 'center',
    paddingTop: SPACING.md,
  },
  swipeHint: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 11,
    fontFamily: 'NeoDunggeunmo',
    letterSpacing: 0.4,
  },
  dualRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  dualCard: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1a1a1c',
  },
  soloWrap: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  soloCard: {
    width: '85%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1c',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  cardMedia: {
    ...StyleSheet.absoluteFillObject,
  },
  cardScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardMeta: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    gap: 2,
  },
  cardAuthor: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  cardMemo: {
    color: theme.colors.white,
    opacity: 0.88,
    fontSize: 12,
  },
  videoBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
  },
  emptyHintText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
  },
  nudgeBtn: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  nudgeBtnDisabled: {
    opacity: 0.55,
  },
  nudgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});

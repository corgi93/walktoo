import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useMemo } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types';
import { isVideoUri } from '@/utils/media';

interface EachMomentsWidgetProps {
  /** 홈에서 사용하는 최근 walks — 안에서 kind='each' + 미디어 있는 것만 필터링 */
  recentWalks: readonly WalkDiary[];
  myName: string;
  partnerName: string;
}

interface MomentCard {
  uri: string;
  date: string;
  authorName: string;
  isMine: boolean;
  isVideo: boolean;
  locationName: string;
  memo: string;
}

const CARD_WIDTH = 130;
const CARD_HEIGHT = 168; // 4:5 ratio for polaroid feel
const MAX_CARDS = 10;

/**
 * 홈 — 각자의 한 컷 위젯.
 * 최근 kind='each' 미디어를 큐레이션해서 가로 스크롤 갤러리로 보여줌.
 *
 * 디자인 의도:
 *  - 둘 다 큰 부담 없이 '오늘'을 남기는 곳 → 한 장 한 장 시그니처처럼 보이게
 *  - 직사각형 폴라로이드 비율 4:5, 끝 둥글게, 하단 그라데이션 위에 메타데이터
 *  - 가로 스크롤 → 화면 점유 적게, 누적된 일상이 한눈에
 */
export function EachMomentsWidget({
  recentWalks,
  myName,
  partnerName,
}: EachMomentsWidgetProps) {
  const router = useRouter();

  const cards = useMemo<MomentCard[]>(() => {
    const result: MomentCard[] = [];
    for (const walk of recentWalks) {
      if (walk.kind !== 'each') continue;
      const mine = walk.myEntry;
      const partner = walk.partnerEntry;
      if (mine?.photos?.[0]) {
        const uri = mine.photos[0];
        result.push({
          uri,
          date: walk.date,
          authorName: myName,
          isMine: true,
          isVideo: isVideoUri(uri),
          locationName: mine.locationName || walk.locationName || '',
          memo: mine.memo || '',
        });
      }
      if (partner?.photos?.[0]) {
        const uri = partner.photos[0];
        result.push({
          uri,
          date: walk.date,
          authorName: partnerName,
          isMine: false,
          isVideo: isVideoUri(uri),
          locationName: partner.locationName || walk.locationName || '',
          memo: partner.memo || '',
        });
      }
    }
    // 최신 우선 — recentWalks는 이미 최신순이라 가정
    return result.slice(0, MAX_CARDS);
  }, [recentWalks, myName, partnerName]);

  const handleOpen = (card: MomentCard) => {
    router.push({
      pathname: '/media-viewer',
      params: { uri: card.uri, caption: card.memo },
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="sun" size={14} color={theme.colors.primary} />
          <Text variant="bodyMedium" style={styles.headerTitle}>
            각자의 한 컷
          </Text>
        </View>
        {cards.length > 0 && (
          <Text variant="caption" color="textMuted">
            최근 {cards.length}
          </Text>
        )}
      </View>

      {cards.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
          snapToInterval={CARD_WIDTH + SPACING.xs}
          snapToAlignment="start"
        >
          {cards.map((card, idx) => (
            <MomentCardView
              key={`${card.uri}-${idx}`}
              card={card}
              onPress={() => handleOpen(card)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ─── Card ───────────────────────────────────────────────

function MomentCardView({
  card,
  onPress,
}: {
  card: MomentCard;
  onPress: () => void;
}) {
  const player = useVideoPlayer(card.isVideo ? card.uri : '', (p) => {
    if (card.isVideo) {
      p.muted = true;
      p.loop = true;
      // 자동재생은 비용 + 배터리 부담 → 영상은 첫 프레임만 노출 (poster 효과)
    }
  });

  const dateLabel = formatShortDate(card.date);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      {card.isVideo ? (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
          allowsPictureInPicture={false}
          allowsFullscreen={false}
        />
      ) : (
        <Image source={{ uri: card.uri }} style={styles.media} />
      )}

      {/* 비디오 아이콘 뱃지 */}
      {card.isVideo && (
        <View style={styles.videoBadge}>
          <Icon name="play" size={10} color={theme.colors.white} />
        </View>
      )}

      {/* 하단 그라데이션 + 메타 — 단순 어두운 오버레이 (RN linear gradient 없이) */}
      <View style={styles.metaScrim} />
      <View style={styles.meta}>
        <Text style={styles.metaDate} numberOfLines={1}>
          {dateLabel}
        </Text>
        <Text style={styles.metaAuthor} numberOfLines={1}>
          by. {card.authorName}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Empty State ────────────────────────────────────────

function EmptyState() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/quick-capture')}
      style={({ pressed }) => [
        styles.empty,
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={styles.emptyIcon}>
        <Icon name="camera" size={18} color={theme.colors.primary} />
      </View>
      <View style={styles.emptyTextWrap}>
        <Text variant="bodySmall" style={styles.emptyTitle}>
          오늘의 한 컷을 남겨봐요
        </Text>
        <Text variant="caption" color="textMuted">
          사진 한 장, 짧은 영상이 쌓이면 우리만의 갤러리가 돼요
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={theme.colors.gray400} />
    </Pressable>
  );
}

// ─── Helpers ────────────────────────────────────────────

function formatShortDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [, m, d] = parts;
  return `${parseInt(m, 10)}.${parseInt(d, 10)}`;
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xxs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  scrollContent: {
    paddingRight: SPACING.lg,
    gap: SPACING.xs,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    transform: [{ scale: 0.97 }],
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  videoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  meta: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    gap: 1,
  },
  metaDate: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    opacity: 0.92,
  },
  metaAuthor: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: '600',
    opacity: 0.78,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceWarm,
    borderWidth: 1,
    borderColor: theme.colors.gray200,
  },
  emptyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextWrap: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    color: theme.colors.text,
    fontWeight: '700',
  },
});

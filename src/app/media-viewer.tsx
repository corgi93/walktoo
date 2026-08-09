import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { isVideoUri } from '@/utils/media';

const MAX_LOOPS = 3;

// 사진은 pinch zoom, 영상은 첫 프레임(썸네일) + 중앙 재생 버튼.
// 재생 시 최대 3회 루프 후 자동 정지.
export default function MediaViewerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const params = useLocalSearchParams<{
    uri?: string;
    caption?: string;
  }>();

  const uri = params.uri ?? '';
  const caption = params.caption ?? '';
  const kind = isVideoUri(uri) ? 'video' : 'image';

  const [isPlaying, setIsPlaying] = useState(false);
  const loopCountRef = useRef(0);

  const player = useVideoPlayer(kind === 'video' ? uri : null, (p) => {
    if (kind !== 'video') return;
    p.loop = false;
    p.muted = false;
    // 시작은 일시정지 — 첫 프레임이 썸네일 역할.
  });

  // playToEnd: 3회까지 자동 루프 후 정지.
  useEffect(() => {
    if (kind !== 'video') return;
    const sub = player.addListener('playToEnd', () => {
      loopCountRef.current += 1;
      if (loopCountRef.current < MAX_LOOPS) {
        player.currentTime = 0;
        player.play();
      } else {
        loopCountRef.current = 0;
        player.pause();
        player.currentTime = 0;
        setIsPlaying(false);
      }
    });
    return () => sub.remove();
  }, [kind, player]);

  const close = () => router.back();

  const handleTogglePlay = () => {
    if (kind !== 'video') return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      loopCountRef.current = 0;
      player.currentTime = 0;
      player.play();
      setIsPlaying(true);
    }
  };

  const photoSize = useMemo(() => ({ width, height }), [width, height]);

  if (!uri) {
    return (
      <View style={styles.root}>
        <Pressable
          onPress={close}
          style={[styles.closeBtn, { top: insets.top + SPACING.md }]}
        >
          <Icon name="x" size={26} color={theme.colors.white} />
        </Pressable>
        <View style={styles.emptyState}>
          <Text variant="bodyMedium" color="white">
            미디어를 불러올 수 없어요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {kind === 'video' ? (
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleTogglePlay}
        >
          <VideoView
            player={player}
            style={StyleSheet.absoluteFillObject}
            contentFit="contain"
            nativeControls={false}
          />
          {!isPlaying && (
            <View style={styles.playOverlay} pointerEvents="none">
              <View style={styles.playButton}>
                <Icon name="play" size={42} color={theme.colors.white} />
              </View>
            </View>
          )}
        </Pressable>
      ) : (
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          pinchGestureEnabled
          centerContent
          contentContainerStyle={styles.scrollContent}
          style={StyleSheet.absoluteFillObject}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={{ uri }}
            style={photoSize}
            resizeMode="contain"
            resizeMethod="resize"
            fadeDuration={0}
          />
        </ScrollView>
      )}

      <Pressable
        onPress={close}
        style={[styles.closeBtn, { top: insets.top + SPACING.md }]}
      >
        <Icon name="x" size={26} color={theme.colors.white} />
      </Pressable>

      {!!caption && (
        <View
          pointerEvents="none"
          style={[styles.captionWrap, { bottom: insets.bottom + SPACING.xl }]}
        >
          <Text
            variant="bodyMedium"
            color="white"
            style={styles.caption}
            numberOfLines={3}
          >
            {caption}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: SPACING.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    zIndex: 5,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  captionWrap: {
    position: 'absolute',
    left: SPACING.xl,
    right: SPACING.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  caption: {
    textAlign: 'center',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

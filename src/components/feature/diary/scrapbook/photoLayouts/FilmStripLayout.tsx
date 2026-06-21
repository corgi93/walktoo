import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/base';

import { ImageSticker } from '../ImageSticker';
import { ImageTape } from '../ImageTape';

import { PLACEHOLDER_CAPTIONS } from './captions';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { PhotoLayoutProps } from './types';
import { useStageScale } from './useStageScale';

type FilmStripLayoutProps = PhotoLayoutProps;

const REF_W = 320;
const STRIP_W = 150;
const FRAME_H = 96;
const GAP = 4;
const PERF_W = 10;

/**
 * 빈티지 필름 레이아웃.
 * 가운데 세로 필름 스트립 (스프로켓 홀 + 4 프레임) + 양쪽 타자기 캡션 + 코너 데코.
 */
export function FilmStripLayout({
  theme: t,
  photos,
  captions,
  editable = false,
  onAddPhoto,
  onRemovePhoto,
}: FilmStripLayoutProps) {
  const fallback = PLACEHOLDER_CAPTIONS[t.id] ?? PLACEHOLDER_CAPTIONS.vintage_film;
  const stickers = t.imgStickers;
  const tapes = t.imgTapes;
  const { scale, stageWidth, onLayout } = useStageScale(REF_W);

  const stripFullW = (STRIP_W + PERF_W * 2) * scale;
  const frameH = FRAME_H * scale;
  const gap = GAP * scale;
  const stripPadV = 12 * scale;
  // strip total height = padTop + 4 frames + 3 gaps + padBottom
  const stripH = stripPadV * 2 + frameH * 4 + gap * 3;
  const stripTop = 16;
  const stageHeight = stripH + stripTop + 32; // top/bottom margin, account for rotation

  // strip이 가운데 정렬 — 양쪽 캡션이 사이드에 들어갈 공간 계산
  const sideWidth = (stageWidth - stripFullW) / 2;
  const captionMaxWidth = Math.max(40, sideWidth - 8);

  return (
    <View
      onLayout={onLayout}
      style={[styles.stage, { height: stageHeight }]}
    >
      {/* 필름 스트립 본체 — 가로 정중앙 */}
      <View
        style={[
          styles.strip,
          {
            width: stripFullW,
            marginLeft: -stripFullW / 2,
            paddingHorizontal: PERF_W * scale,
            paddingVertical: stripPadV,
            top: stripTop,
          },
        ]}
      >
        {/* 윗면 스프로켓 */}
        <View style={[styles.sprocketRow, { top: 4 * scale }]}>
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`top-${i}`}
              style={[
                styles.sprocket,
                {
                  width: 5 * scale,
                  height: 3 * scale,
                  backgroundColor: t.bg,
                },
              ]}
            />
          ))}
        </View>

        {/* 4 프레임 */}
        {[0, 1, 2, 3].map((i) => {
          const photo = photos[i];
          const isEmpty = !photo;
          const Wrapper = editable && isEmpty ? Pressable : View;
          return (
            <Wrapper
              key={`frame-${i}`}
              {...(editable && isEmpty
                ? { onPress: () => onAddPhoto?.(i) }
                : {})}
              style={[
                styles.frame,
                {
                  width: STRIP_W * scale,
                  height: frameH,
                  backgroundColor: t.tints[i] || t.tints[0],
                  marginBottom: i < 3 ? gap : 0,
                },
              ]}
            >
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={styles.frameImage}
                  resizeMode="cover"
                />
              ) : editable ? (
                <View style={styles.frameAddSlot}>
                  <Icon name="plus" size={20} color={t.accent} />
                  <Text
                    style={[
                      styles.frameAddLabel,
                      { color: t.accent, fontFamily: t.monoFont },
                    ]}
                  >
                    TAP
                  </Text>
                </View>
              ) : (
                <PhotoPlaceholder theme={t} index={i} size={10} />
              )}
              <Text
                style={[
                  styles.frameStamp,
                  {
                    fontFamily: t.monoFont,
                    color: t.ink,
                    fontSize: 8 * scale,
                  },
                ]}
              >
                04·21·26 · {String(i + 1).padStart(2, '0')}
              </Text>
              {editable && photo && (
                <Pressable
                  onPress={() => onRemovePhoto?.(i)}
                  hitSlop={6}
                  style={[
                    styles.frameRemove,
                    { backgroundColor: t.accentDeep },
                  ]}
                >
                  <Icon name="x" size={11} color="#FFFFFF" />
                </Pressable>
              )}
            </Wrapper>
          );
        })}

        {/* 아랫면 스프로켓 */}
        <View
          style={[
            styles.sprocketRow,
            { top: 'auto', bottom: 4 * scale },
          ]}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <View
              key={`bot-${i}`}
              style={[
                styles.sprocket,
                {
                  width: 5 * scale,
                  height: 3 * scale,
                  backgroundColor: t.bg,
                },
              ]}
            />
          ))}
        </View>
      </View>

      {/* 양쪽 타자기 캡션 — sideWidth가 좁으면 작게 */}
      {captionMaxWidth >= 50 &&
        [0, 1, 2, 3].map((i) => {
          const isLeft = i % 2 === 0;
          const cap = captions?.[i] ?? fallback[i];
          const top = stripTop + stripPadV + i * (frameH + gap) + 8 * scale;
          return (
            <View
              key={`cap-${i}`}
              style={[
                styles.captionWrap,
                {
                  top,
                  [isLeft ? 'left' : 'right']: 4,
                  maxWidth: captionMaxWidth,
                  transform: [{ rotate: `${isLeft ? -2 : 2}deg` }],
                  alignItems: isLeft ? 'flex-end' : 'flex-start',
                },
              ]}
            >
              <Text
                style={[
                  styles.frameLabel,
                  { color: t.accent, fontFamily: t.bodyFont },
                ]}
                numberOfLines={1}
              >
                — FRAME 0{i + 1} —
              </Text>
              <Text
                style={[
                  styles.caption,
                  {
                    color: t.ink,
                    fontFamily: t.bodyFont,
                    fontWeight: t.bodyWeight,
                    textAlign: isLeft ? 'right' : 'left',
                  },
                ]}
                numberOfLines={1}
              >
                {cap}
              </Text>
            </View>
          );
        })}

      {/* 코너 데코 */}
      {stickers[0] && (
        <ImageSticker
          id={stickers[0]}
          size={36 * scale}
          rotate={-10}
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 8 }}
        />
      )}
      {stickers[2] && (
        <ImageSticker
          id={stickers[2]}
          size={32 * scale}
          rotate={12}
          style={{ position: 'absolute', top: 8, right: 4, zIndex: 8 }}
        />
      )}
      {stickers[7] && (
        <ImageSticker
          id={stickers[7]}
          size={32 * scale}
          rotate={-6}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 4,
            zIndex: 8,
          }}
        />
      )}
      {tapes[2] && (
        <ImageTape
          id={tapes[2]}
          width={64 * scale}
          rotate={6}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 4,
            zIndex: 8,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    position: 'relative',
    width: '100%',
    marginTop: 12,
  },
  strip: {
    position: 'absolute',
    backgroundColor: '#1a1410',
    transform: [{ rotate: '-2deg' }],
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    zIndex: 4,
    left: '50%',
  },
  sprocketRow: {
    position: 'absolute',
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sprocket: {
    borderRadius: 1,
  },
  frame: {
    position: 'relative',
    overflow: 'hidden',
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },
  frameStamp: {
    position: 'absolute',
    bottom: 4,
    right: 6,
    opacity: 0.6,
  },
  frameAddSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  frameAddLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  frameRemove: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 6,
  },
  captionWrap: {
    position: 'absolute',
    zIndex: 5,
  },
  frameLabel: {
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  caption: {
    fontSize: 12,
    letterSpacing: -0.2,
  },
});

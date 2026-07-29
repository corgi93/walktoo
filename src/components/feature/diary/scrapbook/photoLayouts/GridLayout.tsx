import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/base';

import { ImageSticker } from '../ImageSticker';

import { PLACEHOLDER_CAPTIONS } from './captions';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { PhotoLayoutProps } from './types';
import { useStageScale } from './useStageScale';

type GridLayoutProps = PhotoLayoutProps;

const REF_W = 320;
const GAP = 10;

/**
 * 2x2 균등 그리드 — pixel_retro / grid_minimal 공용.
 * 셀 폭은 컨테이너 폭에 따라 동적 — 항상 2열 보장.
 */
export function GridLayout({
  theme: t,
  photos,
  captions,
  editable = false,
  onAddPhoto,
  onRemovePhoto,
}: GridLayoutProps) {
  const fallback = PLACEHOLDER_CAPTIONS[t.id] ?? PLACEHOLDER_CAPTIONS.grid_minimal;
  const isPixel = t.id === 'pixel_retro';
  const stickers = t.imgStickers;
  const { scale, stageWidth, onLayout } = useStageScale(REF_W);

  // 셀 폭을 stage width에서 동적 계산 — 항상 2열
  // pixel은 두꺼운 보더+그림자가 있어 시각적으로 더 큰 폴라로이드 룩이 어울림
  const cellW = (stageWidth - GAP) / 2;
  const cellH = cellW * (isPixel ? 1.28 : 1.12);
  const photoH = cellH - (isPixel ? 34 : 36) * scale;
  const stageHeight = cellH * 2 + GAP + (isPixel ? 24 : 16);

  return (
    <View
      onLayout={onLayout}
      style={[styles.stage, { height: stageHeight }]}
    >
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => {
          const photo = photos[i];
          const cap = captions?.[i] ?? fallback[i];
          return (
            <View
              key={`cell-${i}`}
              style={[
                styles.cell,
                {
                  width: cellW,
                  height: cellH,
                  marginRight: i % 2 === 0 ? GAP : 0,
                  marginBottom: i < 2 ? GAP : 0,
                  backgroundColor: t.paper,
                  borderColor: isPixel ? t.ink : t.line,
                  borderWidth: isPixel ? 3 : 1,
                  padding: (isPixel ? 5 : 8) * scale,
                  shadowColor: isPixel ? t.ink : 'rgba(46,38,34,0.06)',
                  shadowOffset: isPixel
                    ? { width: 4, height: 4 }
                    : { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: isPixel ? 0 : 2,
                  elevation: isPixel ? 4 : 1,
                },
              ]}
            >
              {editable && !photo ? (
                <Pressable
                  onPress={() => onAddPhoto?.(i)}
                  style={[
                    styles.photoArea,
                    {
                      height: photoH,
                      backgroundColor: t.tints[i % t.tints.length],
                      borderColor: isPixel ? t.ink : 'transparent',
                      borderWidth: isPixel ? 2 : 0,
                    },
                  ]}
                >
                  <View style={styles.cellAddSlot}>
                    <Icon name="plus" size={22} color={t.accent} />
                    <Text
                      style={[
                        styles.cellAddLabel,
                        { color: t.accent, fontFamily: t.monoFont },
                      ]}
                    >
                      TAP
                    </Text>
                  </View>
                </Pressable>
              ) : (
                <View
                  style={[
                    styles.photoArea,
                    {
                      height: photoH,
                      backgroundColor: t.tints[i % t.tints.length],
                      borderColor: isPixel ? t.ink : 'transparent',
                      borderWidth: isPixel ? 2 : 0,
                    },
                  ]}
                >
                  {photo ? (
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoImage}
                      resizeMode="cover"
                      resizeMethod="resize"
                      fadeDuration={0}
                    />
                  ) : (
                    <PhotoPlaceholder theme={t} index={i} size={10} />
                  )}
                  {editable && photo && (
                    <Pressable
                      onPress={() => onRemovePhoto?.(i)}
                      hitSlop={6}
                      style={[
                        styles.cellRemove,
                        { backgroundColor: t.accentDeep },
                      ]}
                    >
                      <Icon name="x" size={11} color="#FFFFFF" />
                    </Pressable>
                  )}
                </View>
              )}
              <View
                style={[
                  styles.cellFooter,
                  { marginTop: (isPixel ? 6 : 8) * scale },
                ]}
              >
                <Text
                  style={[
                    styles.cellCaption,
                    {
                      color: t.ink,
                      fontFamily: t.bodyFont,
                      fontWeight: isPixel ? '600' : t.bodyWeight,
                      fontSize: isPixel ? 11 : 12,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {cap}
                </Text>
                <Text
                  style={[
                    styles.cellNum,
                    {
                      color: t.inkSoft,
                      fontFamily: t.monoFont,
                      fontSize: isPixel ? 9 : 10,
                    },
                  ]}
                >
                  0{i + 1}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* 미니멀 액센트 */}
      {!isPixel && stickers[0] && (
        <ImageSticker
          id={stickers[0]}
          size={28 * scale}
          shadow={false}
          style={{ position: 'absolute', top: -6, right: 6, zIndex: 9 }}
        />
      )}
      {!isPixel && stickers[3] && (
        <ImageSticker
          id={stickers[3]}
          size={24 * scale}
          shadow={false}
          style={{ position: 'absolute', bottom: -4, left: 10, zIndex: 9 }}
        />
      )}
      {isPixel && stickers[1] && (
        <ImageSticker
          id={stickers[1]}
          size={32 * scale}
          style={{ position: 'absolute', top: -8, left: 6, zIndex: 9 }}
        />
      )}
      {isPixel && stickers[3] && (
        <ImageSticker
          id={stickers[3]}
          size={28 * scale}
          style={{ position: 'absolute', bottom: -6, right: 10, zIndex: 9 }}
        />
      )}
      {isPixel && stickers[5] && (
        <ImageSticker
          id={stickers[5]}
          size={26 * scale}
          style={{
            position: 'absolute',
            top: cellH + GAP / 2 - 12,
            left: -4,
            zIndex: 9,
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
    marginTop: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    position: 'relative',
  },
  photoArea: {
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  cellAddSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cellAddLabel: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  cellRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 6,
  },
  cellFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  cellCaption: {
    flex: 1,
    marginRight: 4,
  },
  cellNum: {
    flexShrink: 0,
  },
});

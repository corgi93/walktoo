import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ImageSticker } from '../ImageSticker';
import { TapedPolaroidV2 } from '../TapedPolaroidV2';

import { PLACEHOLDER_CAPTIONS } from './captions';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { PhotoLayoutProps } from './types';
import { useStageScale } from './useStageScale';

interface CollageLayoutProps extends PhotoLayoutProps {
  /** 날짜 stamp ("04·21·26") */
  stampDate?: string;
}

const REF_W = 320;
const PHOTO_W = 144;
const PHOTO_H = 168; // 1:1.16 폴라로이드 비율, 사진 영역 우선
const REF_H = PHOTO_H * 2 + 28; // 2x2 + 위·아래 마진

/**
 * Y2K 콜라주 레이아웃.
 * 4 슬롯 동일 비율(1:1.18 폴라로이드) 2x2 배치, rotation만으로 감성.
 * 슬롯 위치 격자 + 회전 -3/4/2/-5도로 살짝 어긋나게.
 */
export function CollageLayout({
  theme: t,
  photos,
  captions,
  stampDate = '04·21·26',
  editable = false,
  onAddPhoto,
  onRemovePhoto,
}: CollageLayoutProps) {
  const fallback = PLACEHOLDER_CAPTIONS[t.id] ?? PLACEHOLDER_CAPTIONS.y2k_pastel;
  const tapes = t.imgTapes;
  const stickers = t.imgStickers;
  const { scale, onLayout } = useStageScale(REF_W);

  // 4슬롯 같은 폴라로이드 비율, 2x2 grid + 회전으로 콜라주 느낌
  const xLeft = 3;
  const xRight = REF_W - PHOTO_W - 3;
  const yTop = 6;
  const yBottom = PHOTO_H + 18;
  const slots: readonly {
    x: number;
    y: number;
    rot: number;
    tapeIdx: number;
    tRot: number;
    capIdx: number;
  }[] = [
    { x: xLeft, y: yTop, rot: -3, tapeIdx: 0, tRot: -12, capIdx: 0 },
    { x: xRight, y: yTop + 5, rot: 4, tapeIdx: 1, tRot: 11, capIdx: 1 },
    { x: xLeft + 6, y: yBottom, rot: 2, tapeIdx: 2, tRot: -8, capIdx: 2 },
    { x: xRight - 6, y: yBottom + 3, rot: -5, tapeIdx: 3, tRot: 10, capIdx: 3 },
  ];

  return (
    <View
      onLayout={onLayout}
      style={[styles.stage, { height: REF_H * scale }]}
    >
      {slots.map((s, i) => {
        const photo = photos[i];
        const tapeId = tapes[s.tapeIdx % tapes.length];
        const cap = captions?.[i] ?? fallback[s.capIdx];
        return (
          <TapedPolaroidV2
            key={`y2k-${i}`}
            theme={t}
            width={PHOTO_W * scale}
            height={PHOTO_H * scale}
            rotate={s.rot}
            tint={t.tints[i % t.tints.length]}
            photoUri={photo}
            caption={photo ? cap : undefined}
            stampDate={stampDate}
            seed={`y2k${i}`}
            tapes={
              photo || !editable
                ? [
                    {
                      id: tapeId,
                      width: PHOTO_W * 0.5 * scale,
                      rotate: s.tRot,
                    },
                  ]
                : []
            }
            style={{
              position: 'absolute',
              top: s.y * scale,
              left: s.x * scale,
              zIndex: 3 + i,
            }}
            editable={editable}
            onAddPress={() => onAddPhoto?.(i)}
            onRemovePress={() => onRemovePhoto?.(i)}
          >
            <PhotoPlaceholder theme={t} index={i} />
          </TapedPolaroidV2>
        );
      })}

      {/* 데코 스티커 — 가운데 빈 공간 + 모서리 */}
      {stickers[3] && (
        <ImageSticker
          id={stickers[3]}
          size={32 * scale}
          rotate={-8}
          style={{
            position: 'absolute',
            top: (yBottom - 12) * scale,
            left: (REF_W / 2 - 16) * scale,
            zIndex: 9,
          }}
        />
      )}
      {stickers[11] && (
        <ImageSticker
          id={stickers[11]}
          size={24 * scale}
          rotate={-15}
          style={{
            position: 'absolute',
            top: (yTop + 28) * scale,
            left: (REF_W / 2 - 6) * scale,
            zIndex: 9,
          }}
        />
      )}
      {stickers[7] && (
        <ImageSticker
          id={stickers[7]}
          size={26 * scale}
          rotate={-6}
          style={{
            position: 'absolute',
            bottom: -4,
            left: (REF_W / 2 - 14) * scale,
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
    marginTop: 12,
  },
});

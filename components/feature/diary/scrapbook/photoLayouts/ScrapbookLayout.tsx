import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ImageSticker } from '../ImageSticker';
import { TapedPolaroidV2 } from '../TapedPolaroidV2';

import { PLACEHOLDER_CAPTIONS } from './captions';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { PhotoLayoutProps } from './types';
import { useStageScale } from './useStageScale';

interface ScrapbookLayoutProps extends PhotoLayoutProps {
  ticketTitle?: string;
  ticketLabel?: string;
  ticketDate?: string;
}

const REF_W = 320;
// 디자인에 맞춰 사진을 더 크게 + row 간 간격 타이트하게
// photo 150x172 (1:1.147 폴라로이드 비율, 사진 영역 우선)
const PHOTO_W = 150;
const PHOTO_H = 172;
const TOP_Y = 12;
const TICKET_Y = TOP_Y + PHOTO_H + 8; // 사진 바로 아래
const TICKET_H = 38;
const BOTTOM_Y = TICKET_Y + TICKET_H + 8; // 티켓 바로 아래
const REF_H = BOTTOM_Y + PHOTO_H + 36; // 하단 컴퍼스 + 마진

/**
 * 다크 아카데미아 — 빈티지 앨범 스프레드.
 * 위 2 photos + 가운데 ADMIT ONE 티켓 + 아래 2 photos.
 *
 * 디자인 fidelity: 사진 142x164로 크게, 위·아래 row 간격 타이트하게.
 */
export function ScrapbookLayout({
  theme: t,
  photos,
  captions,
  ticketTitle = 'cinéma de paris',
  ticketLabel = '· ADMIT ONE ·',
  ticketDate = '04·21·26 · 19:30',
  editable = false,
  onAddPhoto,
  onRemovePhoto,
}: ScrapbookLayoutProps) {
  const fallback = PLACEHOLDER_CAPTIONS[t.id] ?? PLACEHOLDER_CAPTIONS.dark_academia;
  const tapes = t.imgTapes;
  const stickers = t.imgStickers;
  const { scale, onLayout } = useStageScale(REF_W);

  return (
    <View
      onLayout={onLayout}
      style={[styles.stage, { height: REF_H * scale }]}
    >
      {/* aged paper background */}
      <View
        style={[
          styles.pageBg,
          {
            backgroundColor: t.tints[0],
            borderColor: `${t.line}60`,
          },
        ]}
      />

      {/* photo 1 — top-left */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={-3}
        tint={t.tints[1]}
        photoUri={photos[0]}
        caption={photos[0] ? captions?.[0] ?? fallback[0] : undefined}
        stampDate="04·21·26"
        seed="s0"
        tapes={
          (photos[0] || !editable) && tapes[0]
            ? [{ id: tapes[0], width: 64 * scale, rotate: -10 }]
            : []
        }
        style={{
          position: 'absolute',
          top: TOP_Y * scale,
          left: 2 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(0)}
        onRemovePress={() => onRemovePhoto?.(0)}
      >
        <PhotoPlaceholder theme={t} index={0} />
      </TapedPolaroidV2>

      {/* photo 2 — top-right */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={3}
        tint={t.tints[2]}
        photoUri={photos[1]}
        caption={photos[1] ? captions?.[1] ?? fallback[1] : undefined}
        stampDate="04·21·26"
        seed="s1"
        tapes={
          (photos[1] || !editable) && tapes[1]
            ? [{ id: tapes[1], width: 62 * scale, rotate: 8 }]
            : []
        }
        style={{
          position: 'absolute',
          top: (TOP_Y + 4) * scale,
          right: 2 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(1)}
        onRemovePress={() => onRemovePhoto?.(1)}
      >
        <PhotoPlaceholder theme={t} index={1} size={10} />
      </TapedPolaroidV2>

      {/* center ticket strip */}
      <View
        style={[
          styles.ticket,
          {
            top: TICKET_Y * scale,
            backgroundColor: t.paper,
            borderColor: t.line,
          },
        ]}
      >
        <Text
          style={[
            styles.ticketLabel,
            { color: t.accent, fontFamily: t.titleFont },
          ]}
          numberOfLines={1}
        >
          {ticketLabel}
        </Text>
        <Text
          style={[
            styles.ticketTitle,
            {
              color: t.ink,
              fontFamily: t.handFont,
              fontWeight: t.handWeight,
            },
          ]}
          numberOfLines={1}
        >
          {ticketTitle}
        </Text>
        <Text
          style={[
            styles.ticketDate,
            { color: t.inkSoft, fontFamily: t.titleFont },
          ]}
          numberOfLines={1}
        >
          {ticketDate}
        </Text>
      </View>

      {/* photo 3 — bottom-left */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={2}
        tint={t.tints[3]}
        photoUri={photos[2]}
        caption={photos[2] ? captions?.[2] ?? fallback[2] : undefined}
        stampDate="04·21·26"
        seed="s2"
        tapes={
          (photos[2] || !editable) && tapes[2]
            ? [{ id: tapes[2], width: 64 * scale, rotate: 6 }]
            : []
        }
        style={{
          position: 'absolute',
          top: BOTTOM_Y * scale,
          left: 2 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(2)}
        onRemovePress={() => onRemovePhoto?.(2)}
      >
        <PhotoPlaceholder theme={t} index={2} />
      </TapedPolaroidV2>

      {/* photo 4 — bottom-right */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={-3}
        tint={t.tints[4] || t.tints[2]}
        photoUri={photos[3]}
        caption={photos[3] ? captions?.[3] ?? fallback[3] : undefined}
        stampDate="04·21·26"
        seed="s3"
        tapes={
          (photos[3] || !editable) && tapes[3]
            ? [{ id: tapes[3], width: 62 * scale, rotate: -8 }]
            : []
        }
        style={{
          position: 'absolute',
          top: (BOTTOM_Y + 2) * scale,
          right: 2 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(3)}
        onRemovePress={() => onRemovePhoto?.(3)}
      >
        <PhotoPlaceholder theme={t} index={3} size={10} />
      </TapedPolaroidV2>

      {/* 코너 데코 — 사진 사이 좁은 빈 공간 (가운데 위·아래 row) */}
      {stickers[0] && (
        <ImageSticker
          id={stickers[0]}
          size={26 * scale}
          rotate={-8}
          style={{
            position: 'absolute',
            top: (TOP_Y + PHOTO_H / 2 - 12) * scale,
            left: (REF_W / 2 - 13) * scale,
            zIndex: 7,
          }}
        />
      )}
      {stickers[2] && (
        <ImageSticker
          id={stickers[2]}
          size={30 * scale}
          rotate={6}
          style={{
            position: 'absolute',
            top: (BOTTOM_Y + PHOTO_H / 2 - 14) * scale,
            left: (REF_W / 2 - 15) * scale,
            zIndex: 7,
          }}
        />
      )}
      {stickers[1] && (
        <ImageSticker
          id={stickers[1]}
          size={26 * scale}
          rotate={-12}
          style={{
            position: 'absolute',
            bottom: 4,
            left: (REF_W / 2 - 13) * scale,
            zIndex: 7,
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
  pageBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    right: 4,
    borderWidth: 1,
  },
  ticket: {
    position: 'absolute',
    left: 24,
    right: 24,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    transform: [{ rotate: '-1deg' }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: 'rgba(46,38,34,0.25)',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    zIndex: 5,
  },
  ticketLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontStyle: 'italic',
    flexShrink: 0,
  },
  ticketTitle: {
    fontSize: 14,
    flexShrink: 1,
  },
  ticketDate: {
    fontSize: 8,
    letterSpacing: 1,
    flexShrink: 0,
  },
});

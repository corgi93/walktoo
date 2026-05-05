import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ImageSticker } from '../ImageSticker';
import { TapedPolaroidV2 } from '../TapedPolaroidV2';

import { PLACEHOLDER_CAPTIONS } from './captions';
import { pickDailyQuote } from './dailyQuotes';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import type { PhotoLayoutProps } from './types';
import { useStageScale } from './useStageScale';

interface JournalSpreadLayoutProps extends PhotoLayoutProps {
  /** 명언 시드 — 보통 산책 날짜 ('YYYY-MM-DD'). 같은 날엔 같은 시 표시 */
  quoteSeed?: string;
}

const REF_W = 320;
// 4개 사진 모두 동일한 polaroid 비율(1:1.18, 세로>가로) — 사이즈 통일
const PHOTO_W = 146;
const PHOTO_H = 172;
const TOP_Y = 8;
const ROW_GAP = 10;
const BOTTOM_Y = TOP_Y + PHOTO_H + ROW_GAP; // 190
const NOTE_TOP = BOTTOM_Y + PHOTO_H + 14; // 376
const REF_H = NOTE_TOP + 122; // 498 — 노트 영역 + 작은 마진

/**
 * 드리미 클라우드 — 저널 스프레드.
 * 4개 사진 모두 동일한 폴라로이드 비율(1:1.18, 세로>가로) 2x2 배치 + 손글씨 노트.
 * 사진 사이 빈 공간에 데코 스티커. REF_W=320 기준 좌표를 동적 스케일.
 */
export function JournalSpreadLayout({
  theme: t,
  photos,
  captions,
  quoteSeed,
  editable = false,
  onAddPhoto,
  onRemovePhoto,
}: JournalSpreadLayoutProps) {
  const fallback = PLACEHOLDER_CAPTIONS[t.id] ?? PLACEHOLDER_CAPTIONS.dreamy_cloud;
  const tapes = t.imgTapes;
  const stickers = t.imgStickers;
  const { scale, onLayout } = useStageScale(REF_W);
  const quote = pickDailyQuote(quoteSeed);

  return (
    <View
      onLayout={onLayout}
      style={[styles.stage, { height: REF_H * scale }]}
    >
      {/* slot 0: top-left polaroid */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={-3}
        tint={t.tints[0]}
        photoUri={photos[0]}
        caption={photos[0] ? captions?.[0] ?? fallback[0] : undefined}
        stampDate="04·21·26"
        seed="j0"
        tapes={
          (photos[0] || !editable) && tapes[0]
            ? [{ id: tapes[0], width: 70 * scale, rotate: -10 }]
            : []
        }
        style={{
          position: 'absolute',
          top: TOP_Y * scale,
          left: 8 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(0)}
        onRemovePress={() => onRemovePhoto?.(0)}
      >
        <PhotoPlaceholder theme={t} index={0} />
      </TapedPolaroidV2>

      {/* slot 1: top-right polaroid */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={4}
        tint={t.tints[1]}
        photoUri={photos[1]}
        caption={photos[1] ? captions?.[1] ?? fallback[1] : undefined}
        stampDate="04·21·26"
        seed="j1"
        tapes={
          (photos[1] || !editable) && tapes[1]
            ? [{ id: tapes[1], width: 70 * scale, rotate: 10 }]
            : []
        }
        style={{
          position: 'absolute',
          top: (TOP_Y + 4) * scale,
          right: 8 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(1)}
        onRemovePress={() => onRemovePhoto?.(1)}
      >
        <PhotoPlaceholder theme={t} index={1} />
      </TapedPolaroidV2>

      {/* slot 2: bottom-left polaroid */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={2}
        tint={t.tints[2]}
        photoUri={photos[2]}
        caption={photos[2] ? captions?.[2] ?? fallback[2] : undefined}
        stampDate="04·21·26"
        seed="j2"
        tapes={
          (photos[2] || !editable) && tapes[2]
            ? [{ id: tapes[2], width: 70 * scale, rotate: -8 }]
            : []
        }
        style={{
          position: 'absolute',
          top: BOTTOM_Y * scale,
          left: 8 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(2)}
        onRemovePress={() => onRemovePhoto?.(2)}
      >
        <PhotoPlaceholder theme={t} index={2} />
      </TapedPolaroidV2>

      {/* slot 3: bottom-right polaroid */}
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W * scale}
        height={PHOTO_H * scale}
        rotate={-5}
        tint={t.tints[3]}
        photoUri={photos[3]}
        caption={photos[3] ? captions?.[3] ?? fallback[3] : undefined}
        stampDate="04·21·26"
        seed="j3"
        tapes={
          (photos[3] || !editable) && tapes[3]
            ? [{ id: tapes[3], width: 70 * scale, rotate: 8 }]
            : []
        }
        style={{
          position: 'absolute',
          top: (BOTTOM_Y + 2) * scale,
          right: 8 * scale,
          zIndex: 4,
        }}
        editable={editable}
        onAddPress={() => onAddPhoto?.(3)}
        onRemovePress={() => onRemovePhoto?.(3)}
      >
        <PhotoPlaceholder theme={t} index={3} />
      </TapedPolaroidV2>

      {/* 손글씨 노트 영역 — 큐레이트한 한국어 시·문구 (날짜별 결정론적 선택) */}
      <View
        style={[
          styles.note,
          {
            backgroundColor: t.paper,
            borderColor: t.line,
            top: NOTE_TOP * scale,
          },
        ]}
      >
        <Text
          style={[
            styles.noteHeader,
            {
              color: t.accent,
              fontFamily: t.handFont,
              fontWeight: t.handWeight,
            },
          ]}
        >
          — a soft note —
        </Text>
        <Text
          style={[
            styles.noteBody,
            {
              color: t.ink,
              fontFamily: t.handFont,
              fontWeight: t.handWeight,
            },
          ]}
        >
          {quote.text}
        </Text>
        {quote.author && (
          <View style={styles.noteMetaRow}>
            <Text
              style={[
                styles.noteAttribution,
                { color: t.inkSoft, fontFamily: t.bodyFont },
              ]}
              numberOfLines={1}
            >
              — {quote.author}
              {quote.work ? ` · 〈${quote.work}〉` : ''}
            </Text>
          </View>
        )}
      </View>

      {/* 데코 — 사진 사이 빈 공간만 (사진 위 X) */}
      {stickers[2] && (
        <ImageSticker
          id={stickers[2]}
          size={26 * scale}
          rotate={14}
          style={{
            position: 'absolute',
            top: (TOP_Y + PHOTO_H / 2 - 13) * scale,
            left: (REF_W / 2 - 13) * scale,
            zIndex: 7,
          }}
        />
      )}
      {stickers[0] && (
        <ImageSticker
          id={stickers[0]}
          size={28 * scale}
          rotate={-10}
          style={{
            position: 'absolute',
            top: (BOTTOM_Y + PHOTO_H / 2 - 14) * scale,
            left: (REF_W / 2 - 14) * scale,
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
  note: {
    position: 'absolute',
    left: 4,
    right: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    transform: [{ rotate: '-1deg' }],
    shadowColor: 'rgba(46,38,34,0.15)',
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
    zIndex: 3,
  },
  noteHeader: {
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteBody: {
    fontSize: 16,
    lineHeight: 22,
  },
  noteMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  noteAttribution: {
    fontSize: 11,
    fontStyle: 'italic',
    flex: 1,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { TapedPolaroidV2 } from './TapedPolaroidV2';
import { PhotoPlaceholder } from './photoLayouts/PhotoPlaceholder';

interface EachPhotoStripProps {
  theme: DiaryTheme;
  /** 내 사진 (최대 2장) */
  myPhotos?: string[];
  /** 상대 사진 (최대 2장) — 편집 모드에선 표시 X */
  partnerPhotos?: string[];
  /** 편집 모드 — 내 사진만 + 추가/제거 가능 */
  editable?: boolean;
  onAddMyPhoto?: () => void;
  onRemoveMyPhoto?: (index: number) => void;
  myCaption?: string;
  partnerCaption?: string;
  stampDate?: string;
}

const PHOTO_W = 130;
const PHOTO_H = 156;

/**
 * '각자의 하루' (each kind) 전용 — 가벼운 사진 스트립.
 *
 * - 편집 모드: 내 사진 2슬롯 (나란히)
 * - 읽기 모드: 나 | 연인 2열, 각 최대 2장
 */
export function EachPhotoStrip({
  theme: t,
  myPhotos = [],
  partnerPhotos = [],
  editable = false,
  onAddMyPhoto,
  onRemoveMyPhoto,
  myCaption,
  partnerCaption,
  stampDate,
}: EachPhotoStripProps) {
  const tapes = t.imgTapes;

  if (editable) {
    return (
      <View style={styles.row}>
        {[0, 1].map((i) => (
          <TapedPolaroidV2
            key={i}
            theme={t}
            width={PHOTO_W}
            height={PHOTO_H}
            rotate={i === 0 ? -2 : 2}
            tint={t.tints[i]}
            photoUri={myPhotos[i]}
            caption={myPhotos[i] && i === 0 ? myCaption : undefined}
            stampDate={i === 0 ? stampDate : undefined}
            seed={`me-each-edit-${i}`}
            tapes={
              myPhotos[i] && tapes[i]
                ? [{ id: tapes[i], width: 56, rotate: i === 0 ? -10 : 10 }]
                : []
            }
            editable
            onAddPress={i === 0 || myPhotos[0] ? onAddMyPhoto : undefined}
            onRemovePress={myPhotos[i] ? () => onRemoveMyPhoto?.(i) : undefined}
          >
            <PhotoPlaceholder theme={t} index={i} />
          </TapedPolaroidV2>
        ))}
      </View>
    );
  }

  // 읽기 모드 — 나 | 연인 2열
  const mySlots = [myPhotos[0], myPhotos[1]] as (string | undefined)[];
  const partnerSlots = [partnerPhotos[0], partnerPhotos[1]] as (string | undefined)[];

  return (
    <View style={styles.grid}>
      <View style={styles.col}>
        {mySlots.map((photo, i) => (
          <TapedPolaroidV2
            key={i}
            theme={t}
            width={PHOTO_W}
            height={PHOTO_H}
            rotate={i === 0 ? -3 : 1}
            tint={t.tints[i]}
            photoUri={photo}
            caption={photo && i === 0 ? myCaption : undefined}
            stampDate={i === 0 ? stampDate : undefined}
            seed={`me-each-read-${i}`}
            tapes={photo && tapes[i] ? [{ id: tapes[i], width: 56, rotate: i === 0 ? -10 : 8 }] : []}
          >
            <PhotoPlaceholder theme={t} index={i} />
          </TapedPolaroidV2>
        ))}
      </View>

      <View style={styles.col}>
        {partnerSlots.map((photo, i) => (
          <TapedPolaroidV2
            key={i}
            theme={t}
            width={PHOTO_W}
            height={PHOTO_H}
            rotate={i === 0 ? 4 : -1}
            tint={t.tints[i + 2] ?? t.tints[i]}
            photoUri={photo}
            caption={photo && i === 0 ? partnerCaption : undefined}
            stampDate={i === 0 ? stampDate : undefined}
            seed={`partner-each-read-${i}`}
            tapes={photo && tapes[i + 2] ? [{ id: tapes[i + 2], width: 56, rotate: i === 0 ? 10 : -8 }] : []}
          >
            <PhotoPlaceholder theme={t} index={i + 2} />
          </TapedPolaroidV2>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 8,
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 8,
  },
  col: {
    flex: 1,
    gap: 10,
    alignItems: 'center',
  },
});

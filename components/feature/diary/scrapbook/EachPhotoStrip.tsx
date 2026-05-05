import React from 'react';
import { StyleSheet, View } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

import { TapedPolaroidV2 } from './TapedPolaroidV2';
import { PhotoPlaceholder } from './photoLayouts/PhotoPlaceholder';

interface EachPhotoStripProps {
  theme: DiaryTheme;
  /** 내 사진 (1장) */
  myPhoto?: string;
  /** 상대 사진 (1장) — 편집 모드에선 표시 X */
  partnerPhoto?: string;
  /** 편집 모드 — 내 사진만 + 추가/제거 가능 */
  editable?: boolean;
  onAddMyPhoto?: () => void;
  onRemoveMyPhoto?: () => void;
  /** 내 사진 캡션 (옵션) */
  myCaption?: string;
  partnerCaption?: string;
  stampDate?: string;
}

const PHOTO_W = 140;
const PHOTO_H = 168;

/**
 * '오늘의 나' (each kind) 전용 — 가벼운 사진 스트립.
 *
 * - 편집 모드: 내 사진 1슬롯만 (centered)
 * - 읽기 모드: 내 + 상대 사진 2장 row (둘 다 없으면 placeholder)
 *
 * '우리의 하루'(together)의 PhotoPage는 4슬롯 다꾸 콜라주 — 이건 1~2장 가벼운 일상.
 */
export function EachPhotoStrip({
  theme: t,
  myPhoto,
  partnerPhoto,
  editable = false,
  onAddMyPhoto,
  onRemoveMyPhoto,
  myCaption,
  partnerCaption,
  stampDate,
}: EachPhotoStripProps) {
  const tapes = t.imgTapes;

  if (editable) {
    // 편집 모드 — 내 사진 1장만, 가운데 정렬
    return (
      <View style={[styles.row, styles.center]}>
        <TapedPolaroidV2
          theme={t}
          width={PHOTO_W}
          height={PHOTO_H}
          rotate={-2}
          tint={t.tints[0]}
          photoUri={myPhoto}
          caption={myPhoto ? myCaption : undefined}
          stampDate={stampDate}
          seed="me-each-edit"
          tapes={
            (myPhoto || !editable) && tapes[0]
              ? [{ id: tapes[0], width: 64, rotate: -10 }]
              : []
          }
          editable={editable}
          onAddPress={onAddMyPhoto}
          onRemovePress={onRemoveMyPhoto}
        >
          <PhotoPlaceholder theme={t} index={0} />
        </TapedPolaroidV2>
      </View>
    );
  }

  // 읽기 모드 — mine + partner 2장 row
  return (
    <View style={styles.row}>
      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W}
        height={PHOTO_H}
        rotate={-3}
        tint={t.tints[0]}
        photoUri={myPhoto}
        caption={myPhoto ? myCaption : undefined}
        stampDate={stampDate}
        seed="me-each-read"
        tapes={tapes[0] ? [{ id: tapes[0], width: 64, rotate: -10 }] : []}
      >
        <PhotoPlaceholder theme={t} index={0} />
      </TapedPolaroidV2>

      <TapedPolaroidV2
        theme={t}
        width={PHOTO_W}
        height={PHOTO_H}
        rotate={4}
        tint={t.tints[1]}
        photoUri={partnerPhoto}
        caption={partnerPhoto ? partnerCaption : undefined}
        stampDate={stampDate}
        seed="partner-each-read"
        tapes={tapes[1] ? [{ id: tapes[1], width: 64, rotate: 10 }] : []}
      >
        <PhotoPlaceholder theme={t} index={1} />
      </TapedPolaroidV2>
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
  center: {
    justifyContent: 'center',
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { getFilter } from '@/lib/photobooth/filters';
import { type TemplateConfig } from '@/lib/photobooth/templates';
import { theme } from '@/styles/theme';

import PhotoSlot from './PhotoSlot';

interface TemplateFrameProps {
  template: TemplateConfig;
  photos: string[];
  filterId: string;
  frameColor: string;
  /** 프레임 하단 텍스트 색상 */
  textColor: string;
  /** 캔버스 전체 너비 (px) */
  canvasWidth: number;
  dateLabel: string;
  /** 빈 슬롯 탭 시 사진 추가 */
  onAddPhoto?: (slotIndex: number) => void;
}

const TemplateFrame: React.FC<TemplateFrameProps> = ({
  template,
  photos,
  filterId,
  frameColor,
  textColor,
  canvasWidth,
  dateLabel,
  onAddPhoto,
}) => {
  const filter = getFilter(filterId);
  const canvasHeight = canvasWidth / template.aspectRatio;

  const framePad = canvasWidth * template.framePadding;
  const bottomH = canvasHeight * template.bottomStripRatio;

  // 사진 영역 크기
  const photoAreaW = canvasWidth - framePad * 2;
  const photoAreaH = canvasHeight - framePad * 2 - bottomH;

  return (
    <View
      style={[
        styles.frame,
        {
          width: canvasWidth,
          height: canvasHeight,
          backgroundColor: frameColor,
          padding: framePad,
          borderColor: frameColor === '#FFFFFF' ? theme.colors.gray200 : 'transparent',
          borderWidth: frameColor === '#FFFFFF' ? 1 : 0,
        },
      ]}
    >
      {/* 사진 슬롯 영역 */}
      <View style={{ width: photoAreaW, height: photoAreaH, position: 'relative' }}>
        {template.layout.map((slot, i) => {
          const uri = photos[i] ?? null;
          const slotW = photoAreaW * slot.width;
          const slotH = photoAreaH * slot.height;
          const slotX = photoAreaW * slot.x;
          const slotY = photoAreaH * slot.y;

          return (
            <View
              key={i}
              style={{
                position: 'absolute',
                left: slotX,
                top: slotY,
                width: slotW,
                height: slotH,
              }}
            >
              <PhotoSlot
                uri={uri}
                overlayColor={filter.overlayColor}
                width={slotW}
                height={slotH}
                onAddPhoto={onAddPhoto ? () => onAddPhoto(i) : undefined}
              />
            </View>
          );
        })}
      </View>

      {/* 하단 스탬프 영역 */}
      <View style={[styles.bottomStrip, { height: bottomH }]}>
        <Text
          variant="caption"
          style={[styles.dateText, { color: textColor }]}
        >
          {dateLabel}
        </Text>
        <Text
          variant="caption"
          style={[styles.logoText, { color: textColor, opacity: 0.5 }]}
        >
          PairWalk
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  bottomStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  dateText: {
    fontSize: 10,
  },
  logoText: {
    fontSize: 9,
  },
});

export default TemplateFrame;

import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/base';
import { theme } from '@/styles/theme';

interface PhotoSlotProps {
  uri: string | null;
  /** 필터 오버레이 색상 (null이면 오버레이 없음) */
  overlayColor: string | null;
  width: number;
  height: number;
  /** 빈 슬롯 탭 시 사진 추가 */
  onAddPhoto?: () => void;
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ uri, overlayColor, width, height, onAddPhoto }) => {
  if (!uri) {
    return (
      <Pressable
        onPress={onAddPhoto}
        style={[
          styles.empty,
          { width, height, borderRadius: theme.radius.sm },
        ]}
      >
        <Icon name="image-plus" size={Math.min(width, height) * 0.25} color="#C8C4BE" />
      </Pressable>
    );
  }

  return (
    <View style={{ width, height, borderRadius: theme.radius.sm, overflow: 'hidden' }}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      {overlayColor && <View style={[styles.overlay, { backgroundColor: overlayColor }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8C4BE',
    backgroundColor: '#F0EDE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PhotoSlot;

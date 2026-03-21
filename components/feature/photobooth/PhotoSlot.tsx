import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { theme } from '@/styles/theme';

interface PhotoSlotProps {
  uri: string | null;
  /** 필터 오버레이 색상 (null이면 오버레이 없음) */
  overlayColor: string | null;
  width: number;
  height: number;
}

const PhotoSlot: React.FC<PhotoSlotProps> = ({ uri, overlayColor, width, height }) => {
  if (!uri) {
    return (
      <View
        style={[
          styles.empty,
          { width, height, borderRadius: theme.radius.sm },
        ]}
      />
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

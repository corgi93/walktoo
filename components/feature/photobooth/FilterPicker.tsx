import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { FILTERS } from '@/lib/photobooth/filters';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface FilterPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
  /** 미리보기용 사진 URI (첫 번째 사진) */
  previewUri: string | null;
}

const THUMB_SIZE = 52;

const FilterPicker: React.FC<FilterPickerProps> = ({
  selectedId,
  onSelect,
  previewUri,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FILTERS.map((f) => {
        const isSelected = f.id === selectedId;
        return (
          <Pressable
            key={f.id}
            style={styles.item}
            onPress={() => onSelect(f.id)}
          >
            <View
              style={[
                styles.thumbWrap,
                isSelected && styles.thumbSelected,
              ]}
            >
              {previewUri ? (
                <View style={styles.thumbInner}>
                  <Image
                    source={{ uri: previewUri }}
                    style={styles.thumbImage}
                    resizeMode="cover"
                  />
                  {f.overlayColor && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: f.overlayColor, borderRadius: THUMB_SIZE / 2 },
                      ]}
                    />
                  )}
                  {f.id === 'bw' && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: THUMB_SIZE / 2 },
                      ]}
                    />
                  )}
                </View>
              ) : (
                <View style={[styles.thumbInner, styles.thumbPlaceholder]}>
                  {f.overlayColor && (
                    <View
                      style={[
                        StyleSheet.absoluteFill,
                        { backgroundColor: f.overlayColor, borderRadius: THUMB_SIZE / 2 },
                      ]}
                    />
                  )}
                </View>
              )}
            </View>
            <Text
              variant="caption"
              color={isSelected ? 'primary' : 'textMuted'}
              style={styles.label}
            >
              {f.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.xxl,
  },
  item: {
    alignItems: 'center',
  },
  thumbWrap: {
    width: THUMB_SIZE + 4,
    height: THUMB_SIZE + 4,
    borderRadius: (THUMB_SIZE + 4) / 2,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbSelected: {
    borderColor: theme.colors.primary,
  },
  thumbInner: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    overflow: 'hidden',
  },
  thumbPlaceholder: {
    backgroundColor: theme.colors.gray100,
  },
  thumbImage: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
  },
  label: {
    marginTop: SPACING.xs,
  },
});

export default FilterPicker;

import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/base';
import { FRAME_COLORS } from '@/lib/photobooth/filters';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface FrameColorPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const DOT_SIZE = 28;

const FrameColorPicker: React.FC<FrameColorPickerProps> = ({
  selectedId,
  onSelect,
}) => {
  return (
    <View style={styles.row}>
      {FRAME_COLORS.map((fc) => {
        const isSelected = fc.id === selectedId;
        return (
          <Pressable key={fc.id} onPress={() => onSelect(fc.id)} hitSlop={6}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: fc.color,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.gray300,
                  borderWidth: isSelected ? 2.5 : 1,
                },
              ]}
            >
              {isSelected && (
                <Icon
                  name="check"
                  size={12}
                  color={fc.isLight ? theme.colors.primary : theme.colors.white}
                />
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    justifyContent: 'center',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FrameColorPicker;

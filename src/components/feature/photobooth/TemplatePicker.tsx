import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { TEMPLATES } from '@/lib/photobooth/templates';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface TemplatePickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/** 템플릿 미니 아이콘: 슬롯 레이아웃을 작은 사각형으로 시각화 */
const MiniLayout: React.FC<{ templateId: string; isSelected: boolean }> = ({
  templateId,
  isSelected,
}) => {
  const tpl = TEMPLATES.find((t) => t.id === templateId)!;
  const boxW = 36;
  const boxH = Math.min(boxW / tpl.aspectRatio, 48);
  const innerW = boxW - 4; // padding 2 each side
  const innerH = boxH - 4;
  const borderColor = isSelected ? theme.colors.primary : theme.colors.gray300;

  return (
    <View
      style={{
        width: boxW,
        height: boxH,
        borderWidth: 1.5,
        borderColor,
        borderRadius: 3,
        padding: 2,
        position: 'relative',
      }}
    >
      {tpl.layout.map((slot, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 2 + innerW * slot.x,
            top: 2 + innerH * slot.y,
            width: innerW * slot.width,
            height: innerH * slot.height,
            backgroundColor: isSelected
              ? theme.colors.primaryLight
              : theme.colors.gray100,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
};

const TemplatePicker: React.FC<TemplatePickerProps> = ({ selectedId, onSelect }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {TEMPLATES.map((tpl) => {
        const isSelected = tpl.id === selectedId;
        return (
          <Pressable
            key={tpl.id}
            style={[styles.item, isSelected && styles.itemSelected]}
            onPress={() => onSelect(tpl.id)}
          >
            <MiniLayout templateId={tpl.id} isSelected={isSelected} />
            <Text
              variant="caption"
              color={isSelected ? 'primary' : 'textMuted'}
              style={styles.label}
            >
              {tpl.name}
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
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: theme.radius.md,
  },
  itemSelected: {
    backgroundColor: theme.colors.primarySurface,
  },
  label: {
    marginTop: SPACING.xs,
  },
});

export default TemplatePicker;

import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import type { ColorType } from '@/styles/theme';
import { LAYOUT, SPACING, type TypographyVariant } from '@/styles/type';

import Row from './Row';
import Text from './Text';

interface TabScreenHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padded?: boolean;
  titleVariant?: TypographyVariant;
  titleColor?: ColorType;
  style?: StyleProp<ViewStyle>;
}

export default function TabScreenHeader({
  title,
  subtitle,
  actions,
  padded = true,
  titleVariant = 'headingLarge',
  titleColor = 'primary',
  style,
}: TabScreenHeaderProps) {
  return (
    <View style={[padded && styles.padded, styles.header, style]}>
      <View>
        <Text variant={titleVariant} color={titleColor}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" color="textMuted" mt="xxs">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actions ? <Row style={styles.actions}>{actions}</Row> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  padded: {
    paddingHorizontal: LAYOUT.screenPx,
  },
  header: {
    gap: SPACING.sm,
    paddingVertical: LAYOUT.headerPy,
  },
  actions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
});

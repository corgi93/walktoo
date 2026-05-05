import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

import { MemoryDrawModal } from './MemoryDrawModal';

export function MemoryDrawWidget() {
  const { t } = useTranslation('home');
  const [open, setOpen] = useState(false);
  const { data } = useDiaryListQuery();
  const totalMemories = data?.pages.reduce((sum, p) => sum + p.length, 0) ?? 0;

  return (
    <>
      <Pressable style={styles.container} onPress={() => setOpen(true)}>
        <View style={styles.gachaBox}>
          <View style={styles.gachaTop} />
          <View style={styles.gachaWindow}>
            <Icon name="heart" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.gachaSlot} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="headingSmall" color="text" style={styles.title}>
              {t('memory-draw.title')}
            </Text>
            <View style={styles.newBadge}>
              <Text variant="caption" color="white" style={styles.newBadgeText}>
                NEW
              </Text>
            </View>
          </View>
          <Text
            variant="caption"
            color="textSecondary"
            style={styles.subtitle}
            numberOfLines={1}
          >
            {t('memory-draw.subtitle')}
          </Text>
          <View style={styles.ctaRow}>
            <View style={styles.ctaPill}>
              <Text variant="caption" color="primary" style={styles.ctaText}>
                ▶ {t('memory-draw.cta')}
              </Text>
            </View>
            <Text
              variant="caption"
              color="textMuted"
              style={styles.countText}
              numberOfLines={1}
            >
              {t('memory-draw.count', { count: totalMemories })}
            </Text>
          </View>
        </View>

        <Icon name="chevron-right" size={18} color={theme.colors.gray400} />
      </Pressable>

      <MemoryDrawModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

const GACHA_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.md,
    ...theme.shadows.card,
  },
  gachaBox: {
    width: GACHA_SIZE,
    height: GACHA_SIZE,
    backgroundColor: theme.colors.goldLight,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  gachaTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: theme.colors.gold,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  gachaWindow: {
    position: 'absolute',
    top: 12,
    left: 8,
    right: 8,
    bottom: 12,
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gachaSlot: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 4,
    backgroundColor: theme.colors.border,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: theme.radius.xs,
  },
  newBadgeText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 11,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  ctaPill: {
    backgroundColor: theme.colors.primarySurface,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  ctaText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  countText: {
    fontSize: 10,
    flexShrink: 1,
  },
});

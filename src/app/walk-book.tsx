import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Button, Icon, PixelCard, Row, Text } from '@/components/base';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { theme } from '@/styles/theme';
import { LAYOUT, SPACING } from '@/styles/type';
import type { WalkDiary } from '@/types/diary';
import { getWalkLocationSummary } from '@/types/diary';
import { formatDate, parseLocalDate } from '@/utils/date';

const PREVIEW_LIMIT = 4;

export default function WalkBookScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation(['premium', 'common']);
  const { data, isLoading } = useDiaryListQuery();

  const walks = useMemo(
    () => data?.pages[0]?.slice(0, PREVIEW_LIMIT) ?? [],
    [data],
  );

  const handleCreateRecord = () => {
    router.push('/footprint-create');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Row px="xxl" style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </Pressable>
        <Text variant="headingMedium">{t('premium:walk-book.screen-title')}</Text>
        <View style={styles.headerSpacer} />
      </Row>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + LAYOUT.bottomSafe },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PixelCard style={styles.hero} bg={theme.colors.primarySurface}>
          <View style={styles.heroIcon}>
            <Icon name="book-open" size={24} color={theme.colors.primary} />
          </View>
          <Text variant="headingLarge" color="primary" mt="md">
            {t('premium:walk-book.title')}
          </Text>
          <Text variant="bodySmall" color="textSecondary" mt="sm">
            {t('premium:walk-book.screen-description')}
          </Text>
        </PixelCard>

        {/* 생성 기능 준비 중 고지 — 결제 사용자가 생성 버튼을 찾다 이탈하지 않게 */}
        <View style={styles.comingSoon}>
          <Icon name="clock" size={15} color={theme.colors.secondary} />
          <Text
            variant="caption"
            color="textSecondary"
            ml="sm"
            style={{ flex: 1, lineHeight: 16 }}
          >
            {t('premium:walk-book.coming-soon')}
          </Text>
        </View>

        <View style={styles.scope}>
          <ScopeItem icon="calendar" label={t('premium:walk-book.scope-period')} />
          <ScopeItem icon="map-pin" label={t('premium:walk-book.scope-cover')} />
          <ScopeItem icon="file-text" label={t('premium:walk-book.scope-export')} />
        </View>

        <View>
          <Row style={styles.sectionHeader}>
            <Text variant="headingSmall">
              {t('premium:walk-book.preview-title')}
            </Text>
            <Text variant="caption" color="textMuted">
              {t('premium:walk-book.preview-count', { count: walks.length })}
            </Text>
          </Row>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : walks.length === 0 ? (
            <PixelCard style={styles.empty} bg={theme.colors.surfaceWarm}>
              <Icon name="footprint" size={28} color={theme.colors.gray400} />
              <Text variant="bodySmall" color="textSecondary" mt="md" align="center">
                {t('premium:walk-book.preview-empty')}
              </Text>
              <Button onPress={handleCreateRecord} mt="lg">
                {t('premium:walk-book.create-record')}
              </Button>
            </PixelCard>
          ) : (
            <View style={styles.previewList}>
              {walks.map((walk) => (
                <WalkPreview key={walk.id} walk={walk} />
              ))}
            </View>
          )}
        </View>

        {walks.length > 0 && (
          <Button onPress={() => router.push('/diary-list')} size="large">
            {t('premium:walk-book.records-cta')}
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

function ScopeItem({
  icon,
  label,
}: {
  icon: 'calendar' | 'map-pin' | 'file-text';
  label: string;
}) {
  return (
    <View style={styles.scopeItem}>
      <Icon name={icon} size={16} color={theme.colors.secondary} />
      <Text variant="caption" color="text" ml="xs">
        {label}
      </Text>
    </View>
  );
}

function WalkPreview({ walk }: { walk: WalkDiary }) {
  const photo = walk.myEntry?.photos[0] ?? walk.partnerEntry?.photos[0];
  const place = getWalkLocationSummary(walk);
  const date = formatDate(parseLocalDate(walk.date), {
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewPhoto}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.previewImage}
            resizeMethod="resize"
            fadeDuration={0}
          />
        ) : (
          <Icon name="camera" size={20} color={theme.colors.gray400} />
        )}
      </View>
      <View style={styles.previewBody}>
        <Text variant="bodySmall" weight="700" numberOfLines={1}>
          {place || '산책 기록'}
        </Text>
        <Text variant="caption" color="textMuted" mt="xxs">
          {date}
        </Text>
      </View>
      <View style={styles.previewBadge}>
        <Icon
          name={walk.isRevealed ? 'unlock' : 'lock'}
          size={13}
          color={walk.isRevealed ? theme.colors.primary : theme.colors.gray500}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: LAYOUT.headerPy,
  },
  headerSpacer: {
    width: 30,
  },
  scroll: {
    gap: SPACING.lg,
    paddingHorizontal: LAYOUT.screenPx,
  },
  hero: {
    padding: SPACING.xl,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  comingSoon: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.secondaryLight,
    backgroundColor: theme.colors.surfaceWarm,
  },
  scope: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.radius.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  sectionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  loading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  previewList: {
    gap: SPACING.sm,
  },
  previewCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surface,
  },
  previewPhoto: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceWarm,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewBody: {
    flex: 1,
    minWidth: 0,
  },
  previewBadge: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primarySurface,
  },
});

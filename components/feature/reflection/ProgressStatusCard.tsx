import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, PixelCard, Row, Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

interface ProgressStatusCardProps {
  myName: string;
  myAnswered: number;
  partnerAnswered: number;
  total: number;
  isRevealed: boolean;
  partnerName: string;
  hasPartner: boolean;
}

/**
 * "둘 다 써야 둘 다 볼 수 있어요" 카드.
 *
 * - 두 줄(나/상대방)에 각자 진행도 표시
 * - 상대방의 답변 "내용"은 공개 전까지 숨기고, "썼는지 여부"만 드러냄
 * - 공개 상태면 전체 연두 톤으로 셀리브레이션
 */
export function ProgressStatusCard({
  myName,
  myAnswered,
  partnerAnswered,
  total,
  isRevealed,
  partnerName,
  hasPartner,
}: ProgressStatusCardProps) {
  const { t } = useTranslation('reflection');

  const myComplete = total > 0 && myAnswered >= total;
  const partnerComplete = total > 0 && partnerAnswered >= total;

  const bg = isRevealed
    ? theme.colors.primarySurface
    : theme.colors.surfaceWarm;

  const headline = isRevealed
    ? t('progress.headline-revealed')
    : myComplete && !partnerComplete && hasPartner
      ? t('progress.headline-waiting', { name: partnerName })
      : !myComplete && partnerComplete
        ? t('progress.headline-my-turn')
        : t('progress.headline-default');

  return (
    <PixelCard bg={bg} style={styles.card}>
      <Row style={styles.headerRow}>
        <Icon
          name={isRevealed ? 'heart' : 'lock'}
          size={14}
          color={isRevealed ? theme.colors.primary : theme.colors.gray500}
        />
        <Text variant="caption" color="textSecondary" ml="xxs">
          {t('progress.label')}
        </Text>
      </Row>
      <Text
        variant="bodyMedium"
        color={isRevealed ? 'primary' : 'text'}
        mt="xs"
      >
        {headline}
      </Text>

      <View style={styles.rows}>
        <PersonStatusRow
          label={myName}
          done={myAnswered}
          total={total}
          complete={myComplete}
        />
        <PersonStatusRow
          label={partnerName}
          done={partnerAnswered}
          total={total}
          complete={partnerComplete}
          hidden={!isRevealed}
          empty={!hasPartner}
        />
      </View>
    </PixelCard>
  );
}

// ─── Sub: PersonStatusRow ───────────────────────────────

function PersonStatusRow({
  label,
  done,
  total,
  complete,
  hidden,
  empty,
}: {
  label: string;
  done: number;
  total: number;
  complete: boolean;
  /** true면 카운트 대신 ✓/⋯ 만 표시 (공개 전 상대방의 내용 숨김) */
  hidden?: boolean;
  empty?: boolean;
}) {
  const { t } = useTranslation('reflection');

  const accent = complete
    ? theme.colors.primary
    : empty
      ? theme.colors.gray400
      : theme.colors.gray500;

  const progressText = empty
    ? t('progress.no-partner')
    : hidden
      ? complete
        ? t('progress.partner-ready')
        : t('progress.partner-writing')
      : t('progress.count', { done, total });

  return (
    <Row style={styles.personRow}>
      <Row style={styles.personLabelRow}>
        <View
          style={[
            styles.statusDot,
            {
              backgroundColor: complete ? accent : 'transparent',
              borderColor: accent,
            },
          ]}
        >
          {complete && <Icon name="check" size={8} color={theme.colors.white} />}
        </View>
        <Text
          variant="bodySmall"
          color={complete ? 'text' : 'textSecondary'}
          ml="xs"
          numberOfLines={1}
        >
          {label}
        </Text>
      </Row>
      <Text variant="caption" style={{ color: accent, fontWeight: '600' }}>
        {progressText}
      </Text>
    </Row>
  );
}

const styles = StyleSheet.create({
  card: {
    // PixelCard 기본 padding 유지
  },
  headerRow: {
    alignItems: 'center',
  },
  rows: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  personRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  personLabelRow: {
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, Icon, PixelBadge, PixelCard, PixelProgressBar, Row, Text } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import PixelCharacter from '@/components/feature/PixelCharacter';
import { useGetCoupleQuery, useCoupleStatsQuery } from '@/hooks/services/couple/query';
import { useGetMeQuery } from '@/hooks/services/user/query';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDday, formatSteps } from '@/utils';

// ─── Helpers ────────────────────────────────────────────

const calcCalories = (steps: number): number =>
  Math.round(steps * 0.04);

const calcLevel = (totalWalks: number): number => {
  if (totalWalks >= 100) return 10;
  if (totalWalks >= 50) return 7;
  if (totalWalks >= 30) return 5;
  if (totalWalks >= 15) return 3;
  if (totalWalks >= 5) return 2;
  return 1;
};

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // 실제 데이터
  const { data: me } = useGetMeQuery();
  const { data: couple } = useGetCoupleQuery();
  const { data: stats } = useCoupleStatsQuery();

  const hasCoupleId = !!me?.coupleId;

  // 커플 정보에서 나/상대방 구분
  const isUser1 = couple?.user1?.id === me?.id;
  const myName = me?.nickname ?? '나';
  const partnerName = isUser1
    ? (couple?.user2?.nickname ?? '상대방')
    : (couple?.user1?.nickname ?? '상대방');

  // 통계
  const totalWalks = stats?.totalWalks ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  const level = calcLevel(totalWalks);

  // 오늘의 걸음 (TODO: 만보기 API 연동)
  const mySteps = me?.totalSteps ?? 0;
  const partnerSteps = 0; // TODO: 실시간 상대방 걸음수
  const dailyGoal = 10000;

  const myProgress = Math.min(mySteps / dailyGoal, 1);
  const partnerProgress = Math.min(partnerSteps / dailyGoal, 1);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 상단 바 ── */}
      <Row px="xxl" style={styles.topBar}>
        <Text variant="headingLarge" color="primary">
          walkToo
        </Text>
        <Row style={styles.topBarRight}>
          {hasCoupleId && (
            <PixelBadge iconName="zap" label={`${currentStreak}일`} size="small" />
          )}
          <Pressable hitSlop={8}>
            <Icon name="bell" size={20} color={theme.colors.text} />
          </Pressable>
        </Row>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 커플 D+Day ── */}
        {hasCoupleId && couple?.startDate && (
          <Box px="xxl" style={styles.section}>
            <Row style={styles.ddayRow}>
              <PixelBadge
                iconName="heart"
                iconColor={theme.colors.primary}
                label={`${myName}과 ${partnerName}이 만난 지 ${formatDday(couple.startDate)}`}
                size="small"
                bg={theme.colors.primarySurface}
              />
            </Row>
          </Box>
        )}

        {/* ── 오늘의 걸음 카드 ── */}
        <Box px="xxl" style={styles.section}>
          {hasCoupleId ? (
            /* ─── 커플 모드: 나 | ♥ | 상대방 ─── */
            <Row style={styles.stepsRow}>
              <PixelCard style={styles.stepCard} bg={theme.colors.primarySurface}>
                <Text variant="caption" color="textSecondary">
                  {myName}
                </Text>
                <Text variant="displaySmall" color="primary" mt="xs">
                  {formatSteps(mySteps)}
                </Text>
                <Text variant="caption" color="textMuted">
                  걸음
                </Text>
                <PixelProgressBar
                  progress={myProgress}
                  segments={8}
                  fillColor={theme.colors.primary}
                  style={styles.stepProgress}
                />
                <Row style={styles.calorieBadge}>
                  <Icon name="fire" size={12} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary" ml="xxs">
                    {calcCalories(mySteps)} kcal
                  </Text>
                </Row>
              </PixelCard>

              <View style={styles.vsDivider}>
                <Icon name="heart" size={18} color={theme.colors.primary} />
              </View>

              <PixelCard style={styles.stepCard}>
                <Text variant="caption" color="textSecondary">
                  {partnerName}
                </Text>
                <Text variant="displaySmall" color="primary" mt="xs">
                  {formatSteps(partnerSteps)}
                </Text>
                <Text variant="caption" color="textMuted">
                  걸음
                </Text>
                <PixelProgressBar
                  progress={partnerProgress}
                  segments={8}
                  fillColor={theme.colors.accent}
                  style={styles.stepProgress}
                />
                <Row style={styles.calorieBadge}>
                  <Icon name="fire" size={12} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary" ml="xxs">
                    {calcCalories(partnerSteps)} kcal
                  </Text>
                </Row>
              </PixelCard>
            </Row>
          ) : (
            /* ─── 솔로 모드: 컴팩트 만보기 ─── */
            <PixelCard style={styles.soloStepCard} bg={theme.colors.primarySurface}>
              <Row style={styles.soloStepTop}>
                <View>
                  <Text variant="caption" color="textSecondary">
                    오늘의 걸음
                  </Text>
                  <Row style={styles.soloStepNum}>
                    <Text variant="displaySmall" color="primary">
                      {formatSteps(mySteps)}
                    </Text>
                    <Text variant="caption" color="textMuted" ml="xs">
                      / {dailyGoal.toLocaleString()}
                    </Text>
                  </Row>
                </View>
                <Row style={styles.miniStatRow}>
                  <View style={styles.miniStat}>
                    <Icon name="fire" size={11} color={theme.colors.accent} />
                    <Text variant="caption" color="textSecondary" ml="xxs">
                      {calcCalories(mySteps)}
                    </Text>
                  </View>
                  <View style={styles.miniStat}>
                    <Icon name="activity" size={11} color={theme.colors.secondary} />
                    <Text variant="caption" color="textSecondary" ml="xxs">
                      {(mySteps * 0.0007).toFixed(1)}km
                    </Text>
                  </View>
                </Row>
              </Row>
              <PixelProgressBar
                progress={myProgress}
                segments={12}
                fillColor={theme.colors.primary}
                style={styles.soloProgress}
              />
            </PixelCard>
          )}
        </Box>

        {/* ── 솔로 모드: 커플 연결 (초대코드 만들기/입력하기) ── */}
        {!hasCoupleId && (
          <Box style={styles.section}>
            <NoCoupleCard />
          </Box>
        )}

        {/* ── 커플 연결 시 — 미션 카드 ── */}
        {hasCoupleId && (
          <Box px="xxl" style={styles.section}>
            <PixelCard style={styles.missionCard}>
              <Row style={styles.missionHeader}>
                <Row style={styles.missionTitle}>
                  <Icon name="target" size={22} color={theme.colors.secondary} />
                  <View>
                    <Text variant="headingSmall">오늘의 미션</Text>
                    <Text variant="caption" color="textMuted" mt="xxs">
                      함께 6,000보 걷기
                    </Text>
                  </View>
                </Row>
                <Text variant="label" color="primary">
                  {formatSteps(mySteps + partnerSteps)} / 6,000
                </Text>
              </Row>
              <PixelProgressBar
                progress={Math.min((mySteps + partnerSteps) / 6000, 1)}
                segments={12}
                fillColor={theme.colors.secondary}
                style={styles.missionProgress}
              />
            </PixelCard>
          </Box>
        )}

        {/* ── 캐릭터 영역 ── */}
        <View style={styles.characterArea}>
          <PixelCard style={styles.characterFrame} bg={theme.colors.surfaceWarm}>
            <PixelCharacter type="male" pixelSize={5} />
          </PixelCard>

          {hasCoupleId ? (
            <Text variant="bodySmall" color="textMuted" mt="md">
              우리의 걸음이 쌓이고 있어요
            </Text>
          ) : (
            <View style={styles.characterMsg}>
              <Text variant="bodySmall" color="textSecondary" mt="md" style={{ textAlign: 'center' }}>
                아직 내 사람이 없어요
              </Text>
              <Text variant="caption" color="primary" mt="xxs">
                연결하면 둘만의 산책이 시작돼요
              </Text>
            </View>
          )}

          <Row style={styles.badgeRow}>
            <PixelBadge iconName="star" label={`${totalWalks}회`} size="small" bg={theme.colors.goldLight} />
            <PixelBadge iconName="footprint" label={`Lv.${level}`} size="small" bg={theme.colors.primarySurface} />
          </Row>
        </View>
      </ScrollView>

      {/* ── 하단 CTA — 커플 연결 시에만 ── */}
      {hasCoupleId && (
        <Box px="xxl" style={styles.bottomCta}>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.push('/footprint-create')}
          >
            오늘의 산책 기록하기
          </Button>
        </Box>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
//
// 모든 간격은 LAYOUT 토큰 기반.
// 인라인 SPACING 하드코딩 금지 — styles 에서 LAYOUT 참조.

const styles = StyleSheet.create({
  /* ── 전체 ── */
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: LAYOUT.sectionGap,
  },

  /* ── 상단 바 ── */
  topBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: LAYOUT.headerPy,
  },
  topBarRight: {
    gap: LAYOUT.itemGap,
    alignItems: 'center',
  },

  /* ── 공통 섹션 간격 ── */
  section: {
    marginTop: LAYOUT.sectionGap,
  },

  /* ── D+Day ── */
  ddayRow: {
    alignItems: 'center',
  },

  /* ── 커플 걸음 카드 ── */
  stepsRow: {
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    padding: LAYOUT.cardPx,
  },
  stepProgress: {
    marginTop: LAYOUT.itemGap,
  },
  vsDivider: {
    width: 36,
    alignItems: 'center',
  },
  calorieBadge: {
    alignItems: 'center',
    marginTop: LAYOUT.itemGap,
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: LAYOUT.itemGap,
    paddingVertical: 2,
    borderRadius: 4,
  },

  /* ── 솔로 걸음 카드 ── */
  soloStepCard: {
    padding: LAYOUT.cardPx,
  },
  soloStepTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soloStepNum: {
    alignItems: 'baseline',
    marginTop: 2,
  },
  soloProgress: {
    marginTop: LAYOUT.itemGap,
  },
  miniStatRow: {
    gap: LAYOUT.itemGap,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    paddingHorizontal: LAYOUT.itemGap,
    paddingVertical: 2,
    borderRadius: 4,
  },

  /* ── 미션 카드 ── */
  missionCard: {
    padding: LAYOUT.cardPx,
  },
  missionHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    alignItems: 'center',
    gap: LAYOUT.itemGap,
  },
  missionProgress: {
    marginTop: LAYOUT.itemGapMd,
  },

  /* ── 캐릭터 ── */
  characterArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: LAYOUT.sectionGapLg,
  },
  characterFrame: {
    width: 110,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    padding: LAYOUT.itemGap,
  },
  characterMsg: {
    alignItems: 'center',
  },
  badgeRow: {
    marginTop: LAYOUT.itemGap,
    gap: 4,
  },

  /* ── 하단 CTA ── */
  bottomCta: {
    paddingBottom: LAYOUT.bottomSafe,
  },
});

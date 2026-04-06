import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, Icon, PixelBadge, PixelCard, PixelProgressBar, Row, Text } from '@/components/base';
import { QUERY_KEYS } from '@/constants/keys';
import { NoCoupleCard } from '@/components/feature/couple';
import { WalkIllustration } from '@/components/feature/home/WalkIllustration';
import { useUpdateFirstMetDateMutation } from '@/hooks/services/couple/mutation';
import { useGetCoupleQuery, useCoupleStatsQuery } from '@/hooks/services/couple/query';
import { useUnreadCountQuery } from '@/hooks/services/notification/query';
import { useGetMeQuery, useCouplePolling } from '@/hooks/services/user/query';
import { useRefresh } from '@/hooks/useRefresh';
import { usePedometer } from '@/hooks/usePedometer';
import { usePartnerStepsQuery } from '@/hooks/services/steps/query';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { formatDday, formatSteps } from '@/utils';

// ─── Helpers ────────────────────────────────────────────

const calcCalories = (steps: number): number =>
  Math.round(steps * 0.04);

// calcLevel 제거됨 — 추후 필요 시 재추가

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const updateFirstMetDate = useUpdateFirstMetDateMutation();
  const { refreshing, onRefresh } = useRefresh([
    QUERY_KEYS.steps.partner,
    QUERY_KEYS.steps.today,
  ]);

  // 실제 데이터
  const { data: me } = useGetMeQuery();
  const { data: couple } = useGetCoupleQuery();
  const { data: stats } = useCoupleStatsQuery();
  const { data: unreadCount = 0 } = useUnreadCountQuery();

  // coupleId가 있어도 user2가 없으면 아직 미연결 (초대코드만 만든 상태)
  const hasCoupleId = !!me?.coupleId;
  const isCoupleConnected = hasCoupleId && !!couple?.user2?.id;

  // 초대 대기 중이면 5초마다 폴링 (상대방 연결 감지)
  useCouplePolling(me?.coupleId, isCoupleConnected);

  // 커플 정보에서 나/상대방 구분
  const isUser1 = couple?.user1?.id === me?.id;
  const myName = me?.nickname ?? '나';
  const partnerName = isUser1
    ? (couple?.user2?.nickname ?? '상대방')
    : (couple?.user1?.nickname ?? '상대방');

  // 통계
  const totalWalks = stats?.totalWalks ?? 0;
  const currentStreak = stats?.currentStreak ?? 0;
  // 오늘의 걸음 (만보기 연동)
  const { steps: pedometerSteps } = usePedometer();
  const mySteps = pedometerSteps;

  // 캐릭터 타입
  const myCharacter = (me?.characterType ?? 'boy') as 'boy' | 'girl';
  const partnerCharacter = (isUser1
    ? couple?.user2?.characterType
    : couple?.user1?.characterType) as 'boy' | 'girl' | undefined ?? 'boy';

  // 상대방 걸음수 (30초마다 자동 갱신)
  const partnerId = isUser1 ? couple?.user2?.id : couple?.user1?.id;
  const { data: partnerStepsData } = usePartnerStepsQuery(partnerId);
  const partnerSteps = partnerStepsData ?? 0;
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
          {isCoupleConnected && (
            <PixelBadge iconName="zap" label={`${currentStreak}일`} size="small" />
          )}
          <Pressable hitSlop={8} onPress={() => router.push('/notifications')}>
            <View>
              <Icon name="bell" size={20} color={theme.colors.text} />
              {unreadCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </Pressable>
        </Row>
      </Row>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {/* ── 커플 D+Day ── */}
        {isCoupleConnected && (
          <Box px="xxl" style={styles.section}>
            <Pressable onPress={() => setShowDatePicker(true)}>
              <Text variant="bodySmall" color="textMuted" style={styles.ddayRow}>
                {couple?.firstMetDate ? (
                  <>
                    <Text variant="bodySmall" color="primary">{myName}</Text>
                    <Text variant="bodySmall" color="textMuted"> </Text>
                    <Icon name="heart" size={11} color={theme.colors.primaryDark} />
                    <Text variant="bodySmall" color="textMuted"> </Text>
                    <Text variant="bodySmall" color="primary">{partnerName}</Text>
                    <Text variant="bodySmall" color="textMuted"> 만난 지 </Text>
                    <Text variant="bodySmall" color="primary">{formatDday(couple.firstMetDate)}</Text>
                  </>
                ) : '처음 만난 날을 설정해주세요'}
              </Text>
            </Pressable>
          </Box>
        )}

        {/* ── 처음 만난 날 선택 모달 ── */}
        {showDatePicker && couple && (
          <FirstMetDatePicker
            coupleId={couple.id}
            currentDate={couple.firstMetDate}
            onSave={(date) => {
              updateFirstMetDate.mutate({ coupleId: couple.id, date });
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        {/* ── 오늘의 걸음 카드 ── */}
        <Box px="xxl" style={styles.section}>
          {isCoupleConnected ? (
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
                <Icon name="heart" size={18} color={theme.colors.primaryDark} />
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
                <View style={styles.miniStat}>
                  <Icon name="fire" size={11} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary" ml="xxs">
                    {calcCalories(mySteps)} kcal
                  </Text>
                </View>
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
        {!isCoupleConnected && (
          <Box style={styles.section}>
            <NoCoupleCard />
          </Box>
        )}

        {/* ── 커플 연결 시 — 미션 카드 ── */}
        {isCoupleConnected && (
          <Box px="xxl" style={styles.section}>
            <PixelCard style={styles.missionCard}>
              <Row style={styles.missionHeader}>
                <Row style={styles.missionTitle}>
                  <Icon name="target" size={22} color={theme.colors.secondary} />
                  <View>
                    <Text variant="headingSmall">오늘의 미션</Text>
                    <Text variant="caption" color="textMuted" mt="xxs">
                      함께 20,000보 걷기
                    </Text>
                  </View>
                </Row>
                <Text variant="label" color="primary">
                  {formatSteps(mySteps + partnerSteps)} / 20,000
                </Text>
              </Row>
              <PixelProgressBar
                progress={Math.min((mySteps + partnerSteps) / 20000, 1)}
                segments={12}
                fillColor={theme.colors.secondary}
                style={styles.missionProgress}
              />
            </PixelCard>
          </Box>
        )}

        {/* ── 일러스트 영역 ── */}
        <View style={styles.illustrationArea}>
          <WalkIllustration
            mode={isCoupleConnected ? 'couple' : 'solo'}
            myName={myName}
            partnerName={partnerName}
            myCharacter={myCharacter}
            partnerCharacter={partnerCharacter as 'boy' | 'girl'}
          />

          {isCoupleConnected && (
            <View style={styles.coupleMessage}>
              <Text variant="bodySmall" color="textMuted" style={{ textAlign: 'center' }}>
                우리의 걸음이 쌓이고 있어요
              </Text>
              <Row style={styles.badgeRow}>
                <PixelBadge iconName="star" label={`${totalWalks}회 산책`} size="small" bg={theme.colors.goldLight} />
              </Row>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── 하단 CTA — 커플 연결 시에만 ── */}
      {isCoupleConnected && (
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

// ─── FirstMetDatePicker ─────────────────────────────────

const PICKER_YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
const PICKER_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const pad2 = (n: number) => String(n).padStart(2, '0');

function FirstMetDatePicker({
  coupleId,
  currentDate,
  onSave,
  onClose,
}: {
  coupleId: string;
  currentDate?: string;
  onSave: (date: string) => void;
  onClose: () => void;
}) {
  const parsed = currentDate ? new Date(currentDate) : null;
  const [year, setYear] = React.useState<number | null>(parsed?.getFullYear() ?? null);
  const [month, setMonth] = React.useState<number | null>(parsed ? parsed.getMonth() + 1 : null);
  const [day, setDay] = React.useState<number | null>(parsed?.getDate() ?? null);
  const [step, setStep] = React.useState<'year' | 'month' | 'day'>('year');

  const daysInMonth = year && month ? new Date(year, month, 0).getDate() : 31;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleSave = () => {
    if (year && month && day) {
      onSave(`${year}-${pad2(month)}-${pad2(day)}`);
    }
  };

  return (
    <Pressable style={styles.dateOverlay} onPress={onClose}>
      <Pressable style={styles.dateModal} onPress={(e) => e.stopPropagation()}>
        <Text variant="headingSmall" mb="md">
          처음 만난 날이 언제인가요?
        </Text>

        {year && month && day && (
          <Text variant="bodyLarge" color="primary" mb="sm" style={{ textAlign: 'center' }}>
            {year}.{pad2(month)}.{pad2(day)}
          </Text>
        )}

        {step === 'year' && (
          <FlatList
            data={PICKER_YEARS}
            numColumns={4}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.dateItem, year === item && styles.dateItemSelected]}
                onPress={() => { setYear(item); setStep('month'); }}
              >
                <Text variant="bodySmall" color={year === item ? 'white' : 'text'}>
                  {item}년
                </Text>
              </Pressable>
            )}
          />
        )}
        {step === 'month' && (
          <FlatList
            data={PICKER_MONTHS}
            numColumns={4}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.dateItem, month === item && styles.dateItemSelected]}
                onPress={() => { setMonth(item); setDay(null); setStep('day'); }}
              >
                <Text variant="bodySmall" color={month === item ? 'white' : 'text'}>
                  {item}월
                </Text>
              </Pressable>
            )}
          />
        )}
        {step === 'day' && (
          <FlatList
            data={days}
            numColumns={7}
            keyExtractor={(item) => String(item)}
            style={{ maxHeight: 200 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.dateItem, day === item && styles.dateItemSelected]}
                onPress={() => { setDay(item); }}
              >
                <Text variant="bodySmall" color={day === item ? 'white' : 'text'}>
                  {item}
                </Text>
              </Pressable>
            )}
          />
        )}

        <Row style={{ justifyContent: 'flex-end', marginTop: 16, gap: 12 }}>
          <Pressable onPress={onClose}>
            <Text variant="bodySmall" color="textSecondary">취소</Text>
          </Pressable>
          {year && month && day && (
            <Pressable
              style={styles.dateSaveBtn}
              onPress={handleSave}
            >
              <Text variant="bodySmall" color="white">저장</Text>
            </Pressable>
          )}
        </Row>
      </Pressable>
    </Pressable>
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
    textAlign: 'left',
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

  /* ── 일러스트 ── */
  illustrationArea: {
    alignItems: 'center',
    paddingVertical: LAYOUT.sectionGap,
  },
  coupleMessage: {
    alignItems: 'center',
    marginTop: LAYOUT.itemGap,
  },
  badgeRow: {
    marginTop: LAYOUT.itemGap,
    gap: 4,
  },

  /* ── 하단 CTA ── */
  bottomCta: {
    paddingBottom: LAYOUT.bottomSafe,
  },

  /* ── 날짜 선택 모달 ── */
  dateOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  dateModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    width: '85%',
    ...theme.pixel.borderThin,
    ...theme.shadows.card,
  },
  dateItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
  },
  dateItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  dateSaveBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    ...theme.pixel.borderThin,
  },
  bellBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: theme.colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
});

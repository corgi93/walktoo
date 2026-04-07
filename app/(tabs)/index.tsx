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
import { useTodayStampQuery, useTotalStampsQuery } from '@/hooks/services/stamps/query';
import { useClaimStampMutation } from '@/hooks/services/stamps/mutation';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useNotificationListQuery } from '@/hooks/services/notification/query';
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
    QUERY_KEYS.stamps.today,
    QUERY_KEYS.stamps.total,
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

  // 추억의 발자국 (스탬프)
  const toast = useToast();
  const { data: totalStamps = 0 } = useTotalStampsQuery(isCoupleConnected);
  const { data: hasTodayStamp = false } = useTodayStampQuery(
    isCoupleConnected ? couple?.id : undefined,
  );
  const claimStamp = useClaimStampMutation();

  // 최근 산책 기록 (홈 위젯용)
  const { data: diaryData } = useDiaryListQuery();
  const recentDiaries = (diaryData?.pages.flatMap(page => page) ?? []).slice(0, 3);

  // 최근 알림 (홈 위젯용)
  const { data: notifData } = useNotificationListQuery();
  const recentNotifications = (notifData?.pages.flatMap(page => page) ?? []).slice(0, 3);

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

  // 오늘의 미션 달성 여부 (합산 20,000보)
  const MISSION_GOAL = 20000;
  const totalMissionSteps = mySteps + partnerSteps;
  const isMissionCompleted = totalMissionSteps >= MISSION_GOAL;

  // 스탬프 Claim 핸들러
  const handleClaimStamp = () => {
    if (claimStamp.isPending || hasTodayStamp) return;
    claimStamp.mutate(
      {
        count: 30,
        coupleId: couple?.id,
        myId: me?.id,
        partnerId,
        myName,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success('추억의 발자국 30개를 받았어요! 🐾');
          } else if (result.reason === 'already_claimed') {
            toast.info('오늘의 발자국은 이미 받았어요');
          } else {
            toast.error('발자국을 받지 못했어요');
          }
        },
        onError: () => {
          toast.error('발자국을 받지 못했어요');
        },
      },
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── 상단 바 ── */}
      <Row px="xxl" style={styles.topBar}>
        <Text variant="headingLarge" color="primary">
          walkToo
        </Text>
        <Row style={styles.topBarRight}>
          {isCoupleConnected && (
            <PixelBadge
              iconName="footprint"
              label={`${totalStamps.toLocaleString()}`}
              size="small"
              bg={theme.colors.primarySurface}
              iconColor={theme.colors.primaryDark}
            />
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
          <Box px="xxl" style={styles.sectionTight}>
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
        <Box px="xxl" style={styles.sectionTight}>
          {isCoupleConnected ? (
            /* ─── 커플 모드: 나 | ♥ | 상대방 (컴팩트) ─── */
            <Row style={styles.stepsRow}>
              <PixelCard style={styles.stepCard} bg={theme.colors.primarySurface}>
                <Text variant="caption" color="textSecondary">
                  {myName}
                </Text>
                <Text variant="displaySmall" color="primary" mt="xxs">
                  {formatSteps(mySteps)}
                </Text>
                <Text variant="caption" color="textMuted">
                  걸음
                </Text>
                <View style={styles.kcalChip}>
                  <Icon name="fire" size={10} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary" style={styles.kcalText}>
                    {calcCalories(mySteps)} kcal
                  </Text>
                </View>
              </PixelCard>

              <View style={styles.vsDivider}>
                <Icon name="heart" size={16} color={theme.colors.primaryDark} />
              </View>

              <PixelCard style={styles.stepCard}>
                <Text variant="caption" color="textSecondary">
                  {partnerName}
                </Text>
                <Text variant="displaySmall" color="primary" mt="xxs">
                  {formatSteps(partnerSteps)}
                </Text>
                <Text variant="caption" color="textMuted">
                  걸음
                </Text>
                <View style={styles.kcalChip}>
                  <Icon name="fire" size={10} color={theme.colors.accent} />
                  <Text variant="caption" color="textSecondary" style={styles.kcalText}>
                    {calcCalories(partnerSteps)} kcal
                  </Text>
                </View>
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

        {/* ── 커플 연결 시 — 미션 카드 (컴팩트) ── */}
        {isCoupleConnected && (
          <Box px="xxl" style={styles.sectionTight}>
            <PixelCard style={styles.missionCard}>
              <Row style={styles.missionRow}>
                <Row style={styles.missionTitle}>
                  <Icon name="target" size={18} color={theme.colors.secondary} />
                  <Text variant="label" color="textSecondary" ml="xs">
                    오늘의 미션
                  </Text>
                </Row>
                <Text variant="caption" color="textMuted">
                  {Math.min(Math.round((totalMissionSteps / MISSION_GOAL) * 100), 100)}%
                </Text>
              </Row>
              <Row style={styles.missionNumberRow}>
                <Text variant="headingLarge" color="primary">
                  {formatSteps(totalMissionSteps)}
                </Text>
                <Text variant="bodySmall" color="textMuted" ml="xs">
                  / {formatSteps(MISSION_GOAL)}
                </Text>
              </Row>

              {/* ── 발자국 획득 버튼 ── */}
              {isMissionCompleted && (
                <Pressable
                  style={[
                    styles.stampClaimButton,
                    hasTodayStamp && styles.stampClaimButtonDone,
                  ]}
                  onPress={handleClaimStamp}
                  disabled={hasTodayStamp || claimStamp.isPending}
                >
                  <Icon
                    name="footprint"
                    size={14}
                    color={hasTodayStamp ? theme.colors.textMuted : theme.colors.white}
                  />
                  <Text
                    variant="bodySmall"
                    color={hasTodayStamp ? 'textMuted' : 'white'}
                    ml="xs"
                  >
                    {hasTodayStamp
                      ? '오늘의 발자국 수집 완료'
                      : '추억의 발자국 받기 (+30)'}
                  </Text>
                </Pressable>
              )}
            </PixelCard>
          </Box>
        )}

        {/* ── 일러스트 영역 (컴팩트) ── */}
        <View style={styles.illustrationArea}>
          <WalkIllustration
            mode={isCoupleConnected ? 'couple' : 'solo'}
            myName={myName}
            partnerName={partnerName}
            myCharacter={myCharacter}
            partnerCharacter={partnerCharacter as 'boy' | 'girl'}
          />
        </View>

        {/* ── 최근 산책 기록 위젯 ── */}
        {isCoupleConnected && recentDiaries.length > 0 && (
          <Box px="xxl" style={styles.sectionWide}>
            <Row style={styles.widgetHeader}>
              <Row style={styles.widgetTitle}>
                <Icon name="footprint" size={18} color={theme.colors.primary} />
                <Text variant="headingSmall" ml="xs">
                  최근 산책
                </Text>
              </Row>
              <Pressable onPress={() => router.push('/diary-list')} hitSlop={8}>
                <Row>
                  <Text variant="caption" color="textMuted">
                    전체 보기
                  </Text>
                  <Icon name="chevron-right" size={14} color={theme.colors.gray500} />
                </Row>
              </Pressable>
            </Row>

            <View style={styles.recentWalksRow}>
              {recentDiaries.map((diary) => {
                const d = new Date(diary.date);
                const month = d.getMonth() + 1;
                const day = d.getDate();
                return (
                  <Pressable
                    key={diary.id}
                    style={styles.recentWalkCard}
                    onPress={() => {
                      router.push({
                        pathname: '/diary-detail',
                        params: {
                          id: diary.id,
                          date: diary.date,
                          locationName: diary.locationName,
                          isRevealed: String(diary.isRevealed),
                          myEntry: diary.myEntry ? JSON.stringify(diary.myEntry) : '',
                          partnerEntry: diary.partnerEntry ? JSON.stringify(diary.partnerEntry) : '',
                        },
                      });
                    }}
                  >
                    <View style={styles.recentWalkDate}>
                      <Text variant="caption" color="textMuted">
                        {month}.{day}
                      </Text>
                    </View>
                    <Text
                      variant="label"
                      color="text"
                      numberOfLines={1}
                      style={styles.recentWalkLocation}
                    >
                      {diary.locationName}
                    </Text>
                    <Row style={styles.recentWalkStatus}>
                      <Icon
                        name={diary.isRevealed ? 'unlock' : 'lock'}
                        size={10}
                        color={diary.isRevealed ? theme.colors.primary : theme.colors.gray500}
                      />
                      <Text
                        variant="caption"
                        color={diary.isRevealed ? 'primary' : 'textMuted'}
                        ml="xxs"
                      >
                        {diary.isRevealed ? '공개됨' : '대기중'}
                      </Text>
                    </Row>
                  </Pressable>
                );
              })}
            </View>
          </Box>
        )}

        {/* ── 최근 알림 위젯 ── */}
        {isCoupleConnected && recentNotifications.length > 0 && (
          <Box px="xxl" style={styles.section}>
            <Row style={styles.widgetHeader}>
              <Row style={styles.widgetTitle}>
                <Icon name="bell" size={18} color={theme.colors.primary} />
                <Text variant="headingSmall" ml="xs">
                  최근 알림
                </Text>
              </Row>
              <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
                <Row>
                  <Text variant="caption" color="textMuted">
                    전체 보기
                  </Text>
                  <Icon name="chevron-right" size={14} color={theme.colors.gray500} />
                </Row>
              </Pressable>
            </Row>

            <PixelCard style={styles.notifCard}>
              {recentNotifications.map((notif, idx) => (
                <Pressable
                  key={notif.id}
                  style={[
                    styles.notifItem,
                    idx < recentNotifications.length - 1 && styles.notifItemBorder,
                  ]}
                  onPress={() => router.push('/notifications')}
                >
                  <View
                    style={[
                      styles.notifDot,
                      !notif.isRead && styles.notifDotUnread,
                    ]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text variant="label" color="text" numberOfLines={1}>
                      {notif.title}
                    </Text>
                    <Text variant="caption" color="textMuted" numberOfLines={1} mt="xxs">
                      {notif.body}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </PixelCard>
          </Box>
        )}
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

  /* ── 섹션 간격 ── */
  section: {
    marginTop: LAYOUT.sectionGap,      // 16 — 기본
  },
  sectionTight: {
    marginTop: LAYOUT.sectionGapSm,    // 8 — 관련 높은 그룹
  },
  sectionWide: {
    marginTop: LAYOUT.sectionGapXl,    // 24 — 맥락 전환
  },

  /* ── D+Day ── */
  ddayRow: {
    textAlign: 'left',
  },

  /* ── 커플 걸음 카드 (컴팩트) ── */
  stepsRow: {
    alignItems: 'center',
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: 12,
  },
  kcalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: theme.colors.gray100,
  },
  kcalText: {
    marginLeft: 3,
  },
  vsDivider: {
    width: 28,
    alignItems: 'center',
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

  /* ── 미션 카드 (컴팩트) ── */
  missionCard: {
    paddingHorizontal: LAYOUT.cardPx,
    paddingVertical: 14,
  },
  missionRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  missionTitle: {
    alignItems: 'center',
  },
  missionNumberRow: {
    alignItems: 'baseline',
    marginTop: 4,
  },
  stampClaimButton: {
    marginTop: LAYOUT.itemGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.primary,
    ...theme.pixel.borderThin,
  },
  stampClaimButtonDone: {
    backgroundColor: theme.colors.gray100,
  },

  /* ── 일러스트 (컴팩트) ── */
  illustrationArea: {
    alignItems: 'center',
    marginTop: LAYOUT.sectionGap,    // 16 — 미션과 자연스럽게 연결
  },

  /* ── 하단 CTA ── */
  bottomCta: {
    paddingBottom: LAYOUT.bottomSafe,
  },

  /* ── 위젯 공통 ── */
  widgetHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: LAYOUT.itemGap,
  },
  widgetTitle: {
    alignItems: 'center',
  },

  /* ── 최근 산책 위젯 ── */
  recentWalksRow: {
    flexDirection: 'row',
    gap: LAYOUT.itemGap,
  },
  recentWalkCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: LAYOUT.itemGap,
    ...theme.pixel.borderThin,
    minHeight: 90,
  },
  recentWalkDate: {
    marginBottom: 4,
  },
  recentWalkLocation: {
    marginBottom: 6,
  },
  recentWalkStatus: {
    alignItems: 'center',
    marginTop: 'auto',
  },

  /* ── 최근 알림 위젯 ── */
  notifCard: {
    padding: 0,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: LAYOUT.itemGap,
    paddingHorizontal: LAYOUT.cardPx,
    gap: LAYOUT.itemGap,
  },
  notifItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.gray300,
  },
  notifDotUnread: {
    backgroundColor: theme.colors.primary,
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

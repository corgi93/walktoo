import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Box, Button } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  DdaySection,
  FirstMetDatePicker,
  HomeTopBar,
  MissionCard,
  RecentNotificationsWidget,
  RecentWalksWidget,
  StepsSection,
  WalkIllustration,
} from '@/components/feature/home';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { STAMP, STEP_GOAL } from '@/constants/game-config';
import { QUERY_KEYS } from '@/constants/keys';
import { useUpdateFirstMetDateMutation } from '@/hooks/services/couple/mutation';
import { useCoupleStatsQuery } from '@/hooks/services/couple/query';
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useNotificationListQuery, useUnreadCountQuery } from '@/hooks/services/notification/query';
import { useClaimStampMutation } from '@/hooks/services/stamps/mutation';
import { useTodayStampQuery, useTotalStampsQuery } from '@/hooks/services/stamps/query';
import { usePartnerStepsQuery } from '@/hooks/services/steps/query';
import { useCouplePolling } from '@/hooks/services/user/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { usePedometer } from '@/hooks/usePedometer';
import { useRefresh } from '@/hooks/useRefresh';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation(['home']);

  // 데이터 ────────────────────────────────────────────────
  const {
    me,
    couple,
    isCoupleConnected,
    myName,
    partnerName,
    partnerId,
    myCharacter,
    partnerCharacter,
  } = usePartnerDerivation();

  useCouplePolling(me?.coupleId, isCoupleConnected);

  const { data: stats } = useCoupleStatsQuery();
  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const { data: totalStamps = 0 } = useTotalStampsQuery(isCoupleConnected);
  const { data: hasTodayStamp = false } = useTodayStampQuery(
    isCoupleConnected ? couple?.id : undefined,
  );
  const { data: diaryData } = useDiaryListQuery();
  const { data: notifData } = useNotificationListQuery();

  const recentDiaries = (diaryData?.pages.flatMap((page) => page) ?? []).slice(0, 3);
  const recentNotifications = (notifData?.pages.flatMap((page) => page) ?? []).slice(0, 3);

  // 걸음수 ────────────────────────────────────────────────
  const { steps: pedometerSteps } = usePedometer();
  const mySteps = pedometerSteps;
  const { data: partnerStepsData } = usePartnerStepsQuery(partnerId);
  const partnerSteps = partnerStepsData ?? 0;

  const totalMissionSteps = mySteps + partnerSteps;
  const isMissionCompleted = totalMissionSteps >= STEP_GOAL.DAILY_COUPLE_MISSION;

  // 새로고침 ──────────────────────────────────────────────
  const { refreshing, onRefresh } = useRefresh([
    QUERY_KEYS.steps.partner,
    QUERY_KEYS.steps.today,
    QUERY_KEYS.stamps.today,
    QUERY_KEYS.stamps.total,
  ]);

  // 처음 만난 날 모달 ─────────────────────────────────────
  const [showDatePicker, setShowDatePicker] = useState(false);
  const updateFirstMetDate = useUpdateFirstMetDateMutation();

  // 스탬프 Claim ──────────────────────────────────────────
  const claimStamp = useClaimStampMutation();
  const handleClaimStamp = () => {
    if (claimStamp.isPending || hasTodayStamp) return;
    claimStamp.mutate(
      {
        count: STAMP.DAILY_REWARD,
        coupleId: couple?.id,
        myId: me?.id,
        partnerId,
        myName,
      },
      {
        onSuccess: (result) => {
          if (result.success) {
            toast.success(
              t('home:stamp.claim-success', { count: result.count ?? STAMP.DAILY_REWARD }),
            );
          } else if (result.reason === 'already_claimed') {
            toast.info(t('home:stamp.claim-already'));
          } else {
            toast.error(t('home:stamp.claim-failed'));
          }
        },
        onError: () => toast.error(t('home:stamp.claim-failed')),
      },
    );
  };

  // 미사용 (추후 통계 카드에서 활용 예정)
  void stats;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <HomeTopBar
        isCoupleConnected={isCoupleConnected}
        totalStamps={totalStamps}
        unreadCount={unreadCount}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {isCoupleConnected && (
          <DdaySection
            myName={myName}
            partnerName={partnerName}
            firstMetDate={couple?.firstMetDate}
            onPress={() => setShowDatePicker(true)}
          />
        )}

        {showDatePicker && couple && (
          <FirstMetDatePicker
            currentDate={couple.firstMetDate}
            onSave={(date) => {
              updateFirstMetDate.mutate({ coupleId: couple.id, date });
              setShowDatePicker(false);
            }}
            onClose={() => setShowDatePicker(false)}
          />
        )}

        <StepsSection
          isCoupleConnected={isCoupleConnected}
          myName={myName}
          partnerName={partnerName}
          mySteps={mySteps}
          partnerSteps={partnerSteps}
        />

        {!isCoupleConnected && (
          <Box style={styles.section}>
            <NoCoupleCard />
          </Box>
        )}

        {isCoupleConnected && (
          <MissionCard
            totalSteps={totalMissionSteps}
            isMissionCompleted={isMissionCompleted}
            hasTodayStamp={hasTodayStamp}
            isClaiming={claimStamp.isPending}
            onClaim={handleClaimStamp}
          />
        )}

        <View style={styles.illustrationArea}>
          <WalkIllustration
            mode={isCoupleConnected ? 'couple' : 'solo'}
            myName={myName}
            partnerName={partnerName}
            myCharacter={myCharacter}
            partnerCharacter={partnerCharacter}
          />
        </View>

        {isCoupleConnected && <RecentWalksWidget diaries={recentDiaries} />}
        {isCoupleConnected && (
          <RecentNotificationsWidget notifications={recentNotifications} />
        )}
      </ScrollView>

      {isCoupleConnected && (
        <Box px="xxl" style={styles.bottomCta}>
          <Button
            variant="primary"
            size="large"
            onPress={() => router.push('/footprint-create')}
          >
            {t('home:cta.create-walk')}
          </Button>
        </Box>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: LAYOUT.sectionGap,
  },
  section: {
    marginTop: LAYOUT.sectionGap,
  },
  illustrationArea: {
    alignItems: 'center',
    marginTop: LAYOUT.sectionGap,
  },
  bottomCta: {
    paddingBottom: LAYOUT.bottomSafe,
  },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { Box } from '@/components/base';
import { NoCoupleCard } from '@/components/feature/couple';
import {
  FirstMetDatePicker,
  HomeTopBar,
  WidgetBoard,
} from '@/components/feature/home';
import { useToast } from '@/components/composite/toast/ToastProvider';
import { STAMP } from '@/constants/game-config';
import { QUERY_KEYS } from '@/constants/keys';
import { useUpdateFirstMetDateMutation } from '@/hooks/services/couple/mutation';
import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useUnreadCountQuery } from '@/hooks/services/notification/query';
import {
  useCurrentReflectionQuery,
  useReflectionProgressQuery,
} from '@/hooks/services/reflections/query';
import { useClaimStampMutation } from '@/hooks/services/stamps/mutation';
import { useTodayStampQuery, useTotalStampsQuery } from '@/hooks/services/stamps/query';
import { usePartnerStepsQuery } from '@/hooks/services/steps/query';
import { useCouplePolling } from '@/hooks/services/user/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { usePedometer } from '@/hooks/usePedometer';
import { useRefresh } from '@/hooks/useRefresh';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { getCurrentYearMonth, getLocalToday } from '@/utils/date';

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
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

  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const { data: totalStamps = 0 } = useTotalStampsQuery(isCoupleConnected);
  const { data: hasTodayStamp = false } = useTodayStampQuery(
    isCoupleConnected ? couple?.id : undefined,
  );

  // 이달의 회고 진행도 ───────────────────────────────────
  const { data: currentReflection } = useCurrentReflectionQuery(
    isCoupleConnected ? couple?.id : undefined,
  );
  const { data: reflectionProgress } = useReflectionProgressQuery(
    currentReflection?.id,
  );

  // 오늘의 산책 (current month에서 today 필터) ────────────
  const { year, month } = getCurrentYearMonth();
  const today = getLocalToday();
  const { data: monthWalks } = useDiaryByMonthQuery(year, month);
  const todayWalk = useMemo(() => {
    const todayWalks = monthWalks?.filter((w) => w.date === today);
    return todayWalks?.find((w) => w.kind === 'each') ?? todayWalks?.[0];
  }, [monthWalks, today]);

  // 홈 지도 조작 중에는 상위 ScrollView가 드래그를 가져가지 않게 잠근다.
  const [isMapInteracting, setIsMapInteracting] = useState(false);
  const mapInteractionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lockMapScroll = useCallback(() => {
    if (mapInteractionTimer.current) {
      clearTimeout(mapInteractionTimer.current);
      mapInteractionTimer.current = null;
    }
    setIsMapInteracting(true);
  }, []);

  const unlockMapScroll = useCallback(() => {
    if (mapInteractionTimer.current) {
      clearTimeout(mapInteractionTimer.current);
    }
    mapInteractionTimer.current = setTimeout(() => {
      setIsMapInteracting(false);
      mapInteractionTimer.current = null;
    }, 300);
  }, []);

  useEffect(
    () => () => {
      if (mapInteractionTimer.current) {
        clearTimeout(mapInteractionTimer.current);
      }
    },
    [],
  );

  // 걸음수 ────────────────────────────────────────────────
  const { steps: mySteps } = usePedometer();
  const { data: partnerStepsData } = usePartnerStepsQuery(partnerId);
  const partnerSteps = partnerStepsData ?? 0;

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
              t('home:stamp.claim-success', {
                count: result.count ?? STAMP.DAILY_REWARD,
              }),
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
        scrollEnabled={!isMapInteracting}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {!isCoupleConnected && (
          <Box px="xxl" style={styles.noCoupleWrap}>
            <NoCoupleCard />
          </Box>
        )}

        {isCoupleConnected && (
          <WidgetBoard
            firstMetDate={couple?.firstMetDate}
            todayWalk={todayWalk}
            recentWalks={monthWalks ?? []}
            myName={myName}
            partnerName={partnerName}
            myCharacter={myCharacter}
            partnerCharacter={partnerCharacter}
            mySteps={mySteps}
            partnerSteps={partnerSteps}
            reflectionProgress={
              reflectionProgress
                ? {
                    total: reflectionProgress.total,
                    myAnswered: reflectionProgress.myAnswered,
                    partnerAnswered: reflectionProgress.partnerAnswered,
                    isRevealed: reflectionProgress.isRevealed,
                  }
                : null
            }
            totalStamps={totalStamps}
            hasTodayStamp={hasTodayStamp}
            isClaimingStamp={claimStamp.isPending}
            onDdayPress={() => setShowDatePicker(true)}
            onClaimStamp={handleClaimStamp}
            onMapInteractionStart={lockMapScroll}
            onMapInteractionEnd={unlockMapScroll}
          />
        )}
      </ScrollView>

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
    paddingTop: 12,
    paddingBottom: LAYOUT.bottomSafe,
  },
  noCoupleWrap: {
    marginTop: 16,
  },
});

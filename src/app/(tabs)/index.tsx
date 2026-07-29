import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';

import { Box, Icon, PixelCard, Row, Text } from '@/components/base';
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
import { useDiaryListQuery } from '@/hooks/services/diary/query';
import { useUnreadCountQuery } from '@/hooks/services/notification/query';
import { useClaimStampMutation } from '@/hooks/services/stamps/mutation';
import { useTodayStampQuery } from '@/hooks/services/stamps/query';
import { usePartnerStepsQuery } from '@/hooks/services/steps/query';
import { useCouplePolling } from '@/hooks/services/user/query';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { usePedometer } from '@/hooks/usePedometer';
import { usePermission } from '@/hooks/usePermission';
import { useRefresh } from '@/hooks/useRefresh';
import { theme } from '@/styles/theme';
import { LAYOUT } from '@/styles/type';
import { getLocalToday } from '@/utils/date';
import { openAppSettings } from '@/utils/permissions';

// ─── Component ──────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { t } = useTranslation(['home', 'couple']);

  // 데이터 ────────────────────────────────────────────────
  const {
    me,
    couple,
    isCoupleConnected,
    isPartnerDeleted,
    myName,
    partnerName,
    partnerId,
    myCharacter,
    partnerCharacter,
  } = usePartnerDerivation();

  useCouplePolling(me?.coupleId, isCoupleConnected);

  // 알림 권한 — 거부/차단 시 커플에게 공개·톡톡 알림이 조용히 안 오므로 배너로 안내
  const { isDenied: notifDenied, isBlocked: notifBlocked } =
    usePermission('notifications');
  const [notifBannerDismissed, setNotifBannerDismissed] = useState(false);
  const showNotifBanner =
    isCoupleConnected &&
    (notifDenied || notifBlocked) &&
    !notifBannerDismissed;

  const { data: unreadCount = 0 } = useUnreadCountQuery();
  const { data: hasTodayStamp = false } = useTodayStampQuery(
    isCoupleConnected ? couple?.id : undefined,
  );

  const today = getLocalToday();

  // 홈 지도/각자 모먼트/오늘 사진첩은 월 제한 없이 전체 기록을 사용한다.
  const {
    data: walkPages,
    fetchNextPage: fetchNextWalkPage,
    hasNextPage: hasNextWalkPage,
    isFetchingNextPage: isFetchingNextWalkPage,
  } = useDiaryListQuery();
  const allWalks = useMemo(
    () => walkPages?.pages.flatMap((page) => page) ?? [],
    [walkPages],
  );
  const todayWalk = useMemo(
    () => allWalks.find((w) => w.date === today && w.kind === 'each'),
    [allWalks, today],
  );

  useEffect(() => {
    if (!isCoupleConnected) return;
    if (!hasNextWalkPage || isFetchingNextWalkPage) return;
    fetchNextWalkPage();
  }, [
    allWalks.length,
    fetchNextWalkPage,
    hasNextWalkPage,
    isCoupleConnected,
    isFetchingNextWalkPage,
  ]);

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
    QUERY_KEYS.diary.list,
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

        {showNotifBanner && (
          <Box px="xxl" style={styles.notifBannerWrap}>
            <Pressable onPress={openAppSettings}>
              <PixelCard bg={theme.colors.primarySurface}>
                <Row style={styles.notifBannerRow}>
                  <Icon name="bell-off" size={18} color={theme.colors.primary} />
                  <View style={styles.notifBannerText}>
                    <Text variant="bodyMedium" color="primary">
                      {t('home:notif-permission.title')}
                    </Text>
                    <Text variant="caption" color="textSecondary" mt="xxs">
                      {t('home:notif-permission.subtitle')}
                    </Text>
                    <Text variant="caption" color="primary" mt="xs">
                      {t('home:notif-permission.action')} ›
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setNotifBannerDismissed(true)}
                    hitSlop={10}
                  >
                    <Icon name="x" size={16} color={theme.colors.textMuted} />
                  </Pressable>
                </Row>
              </PixelCard>
            </Pressable>
          </Box>
        )}

        {isCoupleConnected && isPartnerDeleted && (
          <Box px="xxl" style={styles.partnerDeletedWrap}>
            <PixelCard bg={theme.colors.surfaceWarm}>
              <Row style={styles.partnerDeletedRow}>
                <Icon name="heart" size={18} color={theme.colors.textMuted} />
                <View style={styles.partnerDeletedText}>
                  <Text variant="bodyMedium">
                    {t('couple:partner-deleted.home-title', { name: partnerName })}
                  </Text>
                  <Text variant="caption" color="textSecondary" mt="xxs">
                    {t('couple:partner-deleted.home-subtitle')}
                  </Text>
                </View>
              </Row>
            </PixelCard>
          </Box>
        )}

        {isCoupleConnected && (
          <WidgetBoard
            firstMetDate={couple?.firstMetDate}
            todayWalk={todayWalk}
            walks={allWalks}
            myName={myName}
            partnerName={partnerName}
            myCharacter={myCharacter}
            partnerCharacter={partnerCharacter}
            mySteps={mySteps}
            partnerSteps={partnerSteps}
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
  notifBannerWrap: {
    marginTop: 12,
    marginBottom: 4,
  },
  notifBannerRow: {
    alignItems: 'center',
    gap: 12,
  },
  notifBannerText: {
    flex: 1,
  },
  partnerDeletedWrap: {
    marginTop: 12,
    marginBottom: 4,
  },
  partnerDeletedRow: {
    alignItems: 'center',
    gap: 12,
  },
  partnerDeletedText: {
    flex: 1,
  },
});

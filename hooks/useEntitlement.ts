/**
 * useEntitlement
 *
 * 기록 업그레이드 entitlement 종합 훅. 호출부에서는 이 훅의 boolean만 사용하면 됨.
 *
 * 우선순위:
 * 1. 본인 has_premium = true (1회성 업그레이드)
 * 2. 커플 has_premium = true (커플 공유)
 * Self-healing:
 * - RevenueCat에 entitlement 있는데 Supabase에는 반영 안 됨 → 자동으로
 *   markPremiumPurchased RPC 호출해 sync.
 * - 결제 직후 클라가 죽거나 네트워크 에러 시 다음 mount에서 복구.
 */

import { useEffect, useRef } from 'react';

import { useEntitlementQuery } from '@/hooks/services/entitlements/query';
import { useMarkPremiumPurchasedMutation } from '@/hooks/services/entitlements/mutation';
import {
  getCustomerInfo,
  getRevenueCatAppUserId,
  hasActiveEntitlement,
  isRevenueCatReady,
} from '@/lib/revenuecat';

export interface EntitlementValue {
  isLoading: boolean;
  hasPremium: boolean;
  coupleHasPremium: boolean;
  /** 종합 결과 — UI에서 사용할 메인 boolean */
  isEntitled: boolean;
  /** 기록 업그레이드 없는 free 상태 */
  isFree: boolean;
}

export function useEntitlement(): EntitlementValue {
  const { data: status, isLoading } = useEntitlementQuery();
  const markPurchased = useMarkPremiumPurchasedMutation();

  const hasPremium = status?.hasPremium ?? false;
  const coupleHasPremium = status?.coupleHasPremium ?? false;
  const isEntitled = status?.isEntitled ?? false;

  // ─── Self-healing ──────────────────────────────────────
  // RevenueCat에는 entitlement 있는데 Supabase에는 has_premium=false인 경우
  // → 자동 sync (한 번만 시도)
  const healAttemptedRef = useRef(false);
  // markPurchased는 useMutation 반환값이라 렌더마다 새 참조 → ref로 보관
  const markPurchasedRef = useRef(markPurchased);
  useEffect(() => { markPurchasedRef.current = markPurchased; });

  useEffect(() => {
    if (healAttemptedRef.current) return;
    if (isLoading) return;
    if (!isRevenueCatReady()) return;
    if (hasPremium) return; // 이미 동기화됨

    healAttemptedRef.current = true;
    (async () => {
      try {
        const info = await getCustomerInfo();
        if (info && hasActiveEntitlement(info)) {
          const appUserId = await getRevenueCatAppUserId();
          if (appUserId) {
            await markPurchasedRef.current.mutateAsync(appUserId);
          }
        }
      } catch (e) {
        console.warn('[useEntitlement] heal failed:', e);
      }
    })();
  }, [isLoading, hasPremium]);

  return {
    isLoading,
    hasPremium,
    coupleHasPremium,
    isEntitled,
    isFree: !isEntitled,
  };
}

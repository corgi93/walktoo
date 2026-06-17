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
import {
  useMarkPremiumPurchasedMutation,
  useMarkThemePackPurchasedMutation,
} from '@/hooks/services/entitlements/mutation';
import {
  getCustomerInfo,
  getRevenueCatAppUserId,
  hasActiveEntitlement,
  hasActiveThemePackEntitlement,
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
  /** 여행 무드 테마팩 — 본인 또는 커플 보유 시 true */
  isThemePackEntitled: boolean;
}

export function useEntitlement(): EntitlementValue {
  const { data: status, isLoading } = useEntitlementQuery();
  const markPurchased = useMarkPremiumPurchasedMutation();
  const markThemePack = useMarkThemePackPurchasedMutation();

  const hasPremium = status?.hasPremium ?? false;
  const coupleHasPremium = status?.coupleHasPremium ?? false;
  const isEntitled = status?.isEntitled ?? false;
  const hasThemePack = status?.hasThemePack ?? false;
  const isThemePackEntitled = status?.isThemePackEntitled ?? false;

  // ─── Self-healing ──────────────────────────────────────
  // RevenueCat에는 entitlement 있는데 Supabase에는 has_premium=false인 경우
  // → 자동 sync (한 번만 시도)
  const healAttemptedRef = useRef(false);
  // mutation들은 useMutation 반환값이라 렌더마다 새 참조 → ref로 보관
  const markPurchasedRef = useRef(markPurchased);
  const markThemePackRef = useRef(markThemePack);
  useEffect(() => {
    markPurchasedRef.current = markPurchased;
    markThemePackRef.current = markThemePack;
  });

  useEffect(() => {
    if (healAttemptedRef.current) return;
    if (isLoading) return;
    if (!isRevenueCatReady()) return;
    if (hasPremium && hasThemePack) return; // 이미 모두 동기화됨

    healAttemptedRef.current = true;
    (async () => {
      try {
        const info = await getCustomerInfo();
        if (!info) return;
        const appUserId = await getRevenueCatAppUserId();
        if (!appUserId) return;
        if (!hasPremium && hasActiveEntitlement(info)) {
          await markPurchasedRef.current.mutateAsync(appUserId);
        }
        if (!hasThemePack && hasActiveThemePackEntitlement(info)) {
          await markThemePackRef.current.mutateAsync(appUserId);
        }
      } catch (e) {
        console.warn('[useEntitlement] heal failed:', e);
      }
    })();
  }, [isLoading, hasPremium, hasThemePack]);

  return {
    isLoading,
    hasPremium,
    coupleHasPremium,
    isEntitled,
    isFree: !isEntitled,
    isThemePackEntitled,
  };
}

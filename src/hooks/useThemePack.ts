/**
 * useThemePack
 *
 * 여행 무드 테마팩의 구매 + "체험 후 결제" 저장 게이트를 한곳에 모은 훅.
 * ThemePicker(구매 카드)와 기록 작성/상세 화면(저장 시 게이트)이 함께 쓴다.
 *
 * 정책:
 * - 잠긴 테마도 자유롭게 "미리보기"로 적용해 사진/글까지 다 본다 (게이팅은 표시 X).
 * - 저장 시점에만, 미보유 + 잠긴 테마면 결제/무료저장 다이얼로그를 띄운다.
 * - 추억 저장 자체는 절대 막지 않는다 (무료 테마로 저장 경로 보장).
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PurchasesPackage } from 'react-native-purchases';

import { useToast } from '@/components/composite/toast/ToastProvider';
import { THEME_PACK, isThemePackThemeId } from '@/constants/premium';
import { useMarkThemePackPurchasedMutation } from '@/hooks/services/entitlements/mutation';
import { useEntitlement } from '@/hooks/useEntitlement';
import {
  getThemePackPackage,
  isRevenueCatReady,
  purchaseThemePack,
} from '@/lib/revenuecat';
import { useDialogStore } from '@/stores/dialogStore';
import { getDiaryTheme, type DiaryThemeId } from '@/styles/diaryThemes';

interface GuardOptions {
  /** 저장을 계속 진행 (결제 성공 또는 무료 테마로 저장 선택 시) */
  onProceed: () => void;
  /** 무료 테마로 저장 선택 시 — 전역 테마를 무료 테마로 되돌린다 */
  onRevertToFree: () => void;
}

export function useThemePack() {
  const { t } = useTranslation(['premium']);
  const toast = useToast();
  const dialog = useDialogStore();
  const { isThemePackEntitled } = useEntitlement();
  const markThemePack = useMarkThemePackPurchasedMutation();

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // 미보유 시에만 패키지(가격) 로드
  useEffect(() => {
    if (isThemePackEntitled) return;
    let cancelled = false;
    (async () => {
      const found = await getThemePackPackage();
      if (!cancelled) setPkg(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [isThemePackEntitled]);

  const priceLabel =
    pkg?.product.priceString ??
    `₩${THEME_PACK.PRICE_KRW.toLocaleString('ko-KR')}`;

  // 실제 결제 가능 여부. RevenueCat 미준비(키/상품 미등록)면 pkg가 로드되지 않는다.
  // 이 경우 구매 CTA를 활성 상태로 두지 않고, 저장은 무료 테마로 이어지게 한다.
  const canPurchase = !!pkg && isRevenueCatReady();

  /** 구매 실행. 성공 시 true. 취소/실패 시 false. */
  const purchase = useCallback(async (): Promise<boolean> => {
    if (isPurchasing) return false;
    if (!isRevenueCatReady() || !pkg) {
      toast.error(t('premium:result.sdk-unavailable'));
      return false;
    }
    setIsPurchasing(true);
    const outcome = await purchaseThemePack(pkg);
    if (outcome.userCancelled) {
      setIsPurchasing(false);
      return false;
    }
    if (!outcome.ok || !outcome.appUserId) {
      setIsPurchasing(false);
      toast.error(t('premium:result.failed'));
      return false;
    }
    const sync = await markThemePack.mutateAsync(outcome.appUserId);
    setIsPurchasing(false);
    if (sync.success) {
      toast.success(t('premium:theme-pack.purchased'));
      return true;
    }
    toast.error(t('premium:result.failed'));
    return false;
  }, [isPurchasing, pkg, markThemePack, t, toast]);

  /**
   * 저장 시점 테마 게이트.
   * - 보유 중이거나 무료 테마면 바로 onProceed
   * - 잠긴 테마면 결제/무료저장 다이얼로그. 백드롭 탭 = 편집 유지(저장 X)
   */
  const guardSaveWithTheme = useCallback(
    (themeId: DiaryThemeId, opts: GuardOptions) => {
      if (isThemePackEntitled || !isThemePackThemeId(themeId)) {
        opts.onProceed();
        return;
      }
      const name = getDiaryTheme(themeId).name;

      // 아직 구매 불가(RC 미준비) — 결제 dead-end로 저장을 잃지 않도록,
      // 무료 테마로 저장하는 단일 경로만 안내한다. 추억 저장은 절대 막지 않는다.
      if (!canPurchase) {
        dialog.showDialog({
          title: t('premium:theme-pack.soon-title'),
          message: t('premium:theme-pack.soon-message', { name }),
          buttons: [
            {
              label: t('premium:theme-pack.gate-free-save'),
              variant: 'primary',
              onPress: () => {
                opts.onRevertToFree();
                opts.onProceed();
              },
            },
          ],
        });
        return;
      }

      dialog.showDialog({
        title: t('premium:theme-pack.gate-title'),
        message: t('premium:theme-pack.gate-message', { name }),
        buttons: [
          {
            label: t('premium:theme-pack.gate-free-save'),
            variant: 'cancel',
            onPress: () => {
              opts.onRevertToFree();
              opts.onProceed();
            },
          },
          {
            label: t('premium:theme-pack.gate-buy', { price: priceLabel }),
            variant: 'primary',
            onPress: async () => {
              const ok = await purchase();
              if (ok) opts.onProceed();
            },
          },
        ],
      });
    },
    [isThemePackEntitled, canPurchase, dialog, t, priceLabel, purchase],
  );

  return {
    isThemePackEntitled,
    priceLabel,
    canPurchase,
    isPurchasing,
    purchase,
    guardSaveWithTheme,
  };
}

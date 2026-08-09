import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useEntitlement } from '@/hooks/useEntitlement';
import { useDialogStore } from '@/stores/dialogStore';
import { useNudgeStore } from '@/stores/nudgeStore';

/** reveal 넛지 재노출 쿨다운(7일) — 감정 피크에서만, 과하지 않게. */
const REVEAL_NUDGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * useRevealUpgradeNudge
 *
 * reveal(둘 다 완성 → 공개) 직후, free 사용자에게 커플 패스를
 * 부드럽게 한 번 제안한다. 결제를 막지 않고 "특별한 날만 더 풍성하게"만 권한다.
 *
 * bm-policy §6: 사용자가 이미 기록 의도를 가진 순간에만 노출한다.
 * - 이미 이용권 보유(본인/커플) 시 노출하지 않는다.
 * - 최근 7일 내 노출했으면 스킵한다 (나깅 방지).
 *
 * 반환한 함수를 addEntry(=상대 엔트리 추가 → reveal 트리거) 성공 콜백에서 호출한다.
 */
export function useRevealUpgradeNudge(): () => void {
  const router = useRouter();
  const { t } = useTranslation(['premium']);
  const dialog = useDialogStore();
  const { isEntitled } = useEntitlement();
  const { lastRevealNudgeAt, markRevealNudgeShown } = useNudgeStore();

  return useCallback(() => {
    if (isEntitled) return;
    const now = Date.now();
    if (
      lastRevealNudgeAt &&
      now - lastRevealNudgeAt < REVEAL_NUDGE_COOLDOWN_MS
    ) {
      return;
    }

    markRevealNudgeShown();
    dialog.showDialog({
      title: t('premium:reveal-nudge.title'),
      message: t('premium:reveal-nudge.message'),
      buttons: [
        { label: t('premium:reveal-nudge.later'), variant: 'cancel' },
        {
          label: t('premium:reveal-nudge.cta'),
          variant: 'primary',
          onPress: () => router.push('/paywall'),
        },
      ],
    });
  }, [isEntitled, lastRevealNudgeAt, markRevealNudgeShown, dialog, router, t]);
}

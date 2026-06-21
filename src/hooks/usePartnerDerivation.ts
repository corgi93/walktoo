/**
 * usePartnerDerivation
 *
 * 커플 정보에서 "나/상대방" 구분을 한 곳에서 처리하는 훅.
 * 기존에는 같은 패턴(`isUser1 ? user2 : user1`)이 3곳에 중복돼 있었음.
 *
 * 사용:
 *   const { isCoupleConnected, partnerName, myCharacter, ... } = usePartnerDerivation();
 */

import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';

import { useGetCoupleQuery } from '@/hooks/services/couple/query';
import { useGetMeQuery } from '@/hooks/services/user/query';

export type CharacterType = 'boy' | 'girl';

const normalizeCharacter = (raw: string | undefined): CharacterType =>
  raw === 'girl' ? 'girl' : 'boy';

export function usePartnerDerivation() {
  const { t } = useTranslation('common');
  const { data: me } = useGetMeQuery();
  const { data: couple } = useGetCoupleQuery();

  return useMemo(() => {
    const isUser1 = couple?.user1?.id === me?.id;
    const partner = isUser1 ? couple?.user2 : couple?.user1;
    const myUser = isUser1 ? couple?.user1 : couple?.user2;

    const hasCoupleId = !!me?.coupleId;
    const isCoupleConnected = hasCoupleId && !!couple?.user2?.id;

    return {
      me,
      couple,
      isUser1,
      partner,
      myUser,
      partnerId: partner?.id,
      myName: me?.nickname ?? t('labels.me'),
      partnerName: partner?.nickname ?? t('fallback.partner-nickname'),
      myCharacter: normalizeCharacter(me?.characterType),
      partnerCharacter: normalizeCharacter(partner?.characterType),
      hasCoupleId,
      isCoupleConnected,
    };
  }, [me, couple, t]);
}

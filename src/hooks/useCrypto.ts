import { useCallback, useMemo } from 'react';

import { deriveKey, encryptField, decryptField } from '@/lib/crypto/fieldEncryption';
import { usePartnerDerivation } from './usePartnerDerivation';

/**
 * Returns stable encrypt/decrypt callbacks scoped to the current couple's derived key.
 * Returns no-op pass-throughs if coupleId is unavailable (unauthenticated state).
 */
export function useFieldCrypto() {
  const { couple } = usePartnerDerivation();
  const coupleId = couple?.id;

  const key = useMemo(() => {
    if (!coupleId) return null;
    return deriveKey(coupleId);
  }, [coupleId]);

  const encrypt = useCallback(
    (plaintext: string) => {
      if (!key) return plaintext;
      return encryptField(plaintext, key);
    },
    [key],
  );

  const decrypt = useCallback(
    (value: string) => {
      if (!key) return value;
      return decryptField(value, key);
    },
    [key],
  );

  return { encrypt, decrypt };
}

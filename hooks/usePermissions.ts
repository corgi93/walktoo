import { useCallback, useEffect } from 'react';

import { usePermissionStore } from '@/stores/permissionStore';
import { PermissionType } from '@/types/permission';
import { checkAllPermissions } from '@/utils/permissions';

// ─── Hook ───────────────────────────────────────────

export const usePermissions = () => {
  const { permissions, setStatus, hasCompletedOnboarding } =
    usePermissionStore();

  const checkAll = useCallback(async () => {
    const results = await checkAllPermissions();
    (Object.keys(results) as PermissionType[]).forEach(type => {
      setStatus(type, results[type]);
    });
    return results;
  }, [setStatus]);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  const allRequiredGranted =
    permissions.location.status === 'granted' &&
    permissions.pedometer.status === 'granted';

  const anyBlocked = (Object.keys(permissions) as PermissionType[]).some(
    type => permissions[type].status === 'blocked',
  );

  return {
    permissions,
    hasCompletedOnboarding,
    allRequiredGranted,
    anyBlocked,
    checkAll,
  };
};

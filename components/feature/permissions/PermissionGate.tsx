import React from 'react';

import { usePermission } from '@/hooks/usePermission';
import { PermissionType } from '@/types/permission';

import { PermissionPrompt } from './PermissionPrompt';
import { PermissionSettingsGuide } from './PermissionSettingsGuide';

// ─── Types ──────────────────────────────────────────

interface PermissionGateProps {
  type: PermissionType;
  children: React.ReactNode;
  /** 권한 미허용 시 대체 UI (기본: PermissionPrompt 또는 SettingsGuide) */
  fallback?: React.ReactNode;
}

// ─── Component ──────────────────────────────────────

/**
 * 권한 상태에 따라 children을 조건부 렌더링하는 래퍼.
 * - granted → children
 * - blocked → PermissionSettingsGuide (설정 유도)
 * - undetermined / denied → PermissionPrompt (설명 후 요청)
 */
export const PermissionGate: React.FC<PermissionGateProps> = ({
  type,
  children,
  fallback,
}) => {
  const { isGranted, isBlocked, request } = usePermission(type);

  if (isGranted) return <>{children}</>;

  if (isBlocked) {
    return <>{fallback ?? <PermissionSettingsGuide type={type} />}</>;
  }

  return <>{fallback ?? <PermissionPrompt type={type} onAllow={request} />}</>;
};

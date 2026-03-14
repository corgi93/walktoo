import { PermissionConfig, PermissionType } from '@/types/permission';

// ─── Permission Registry ────────────────────────────

/**
 * 앱에서 사용하는 모든 권한의 메타데이터.
 * 새 권한 추가 시 여기에 항목 하나만 추가하면 됨.
 */
export const PERMISSION_CONFIGS: Record<PermissionType, PermissionConfig> = {
  pedometer: {
    type: 'pedometer',
    title: '걸음수 권한',
    description: '오늘의 걸음수를 측정하기 위해\n모션 데이터 접근이 필요해요.',
    icon: 'footsteps-outline',
    required: true,
  },
  location: {
    type: 'location',
    title: '위치 권한',
    description: '함께 걷는 경로를 기록하기 위해\n위치 접근이 필요해요.',
    icon: 'location-outline',
    required: true,
  },
  notifications: {
    type: 'notifications',
    title: '알림 권한',
    description: '챌린지 알림과 파트너 소식을\n놓치지 않도록 알림을 보내드려요.',
    icon: 'notifications-outline',
    required: false,
  },
};

/** 온보딩 권한 요청 순서 (필수 → 선택) */
export const PERMISSION_ORDER: PermissionType[] = [
  'pedometer',
  'location',
  'notifications',
];

/**
 * walkToo Icon System
 *
 * 토스/치지직 스타일의 클린 라인 아이콘.
 * Feather 아이콘 기반, 일부 MaterialCommunityIcons 보완.
 */

import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

import { theme } from '@/styles/theme';

// ─── Icon Name Map ──────────────────────────────────────

const ICON_MAP = {
  // Navigation
  home: { set: 'feather', name: 'home' },
  footprint: { set: 'material', name: 'shoe-print' },
  user: { set: 'feather', name: 'user' },

  // Actions
  bell: { set: 'feather', name: 'bell' },
  settings: { set: 'feather', name: 'settings' },
  edit: { set: 'feather', name: 'edit-2' },
  plus: { set: 'feather', name: 'plus' },
  x: { set: 'feather', name: 'x' },
  share: { set: 'feather', name: 'share-2' },
  key: { set: 'feather', name: 'key' },
  link: { set: 'feather', name: 'link-2' },
  'log-out': { set: 'feather', name: 'log-out' },
  camera: { set: 'feather', name: 'camera' },
  'image-plus': { set: 'feather', name: 'image' },
  search: { set: 'feather', name: 'search' },
  'chevron-right': { set: 'feather', name: 'chevron-right' },
  'chevron-down': { set: 'feather', name: 'chevron-down' },
  'arrow-left': { set: 'feather', name: 'arrow-left' },
  unlink: { set: 'material', name: 'link-variant-off' },

  // Status
  heart: { set: 'feather', name: 'heart' },
  zap: { set: 'feather', name: 'zap' },
  lock: { set: 'feather', name: 'lock' },
  unlock: { set: 'feather', name: 'unlock' },
  'bell-ring': { set: 'material', name: 'bell-ring' },
  'bell-off': { set: 'material', name: 'bell-off' },
  check: { set: 'feather', name: 'check' },
  'check-circle': { set: 'feather', name: 'check-circle' },
  clock: { set: 'feather', name: 'clock' },
  star: { set: 'feather', name: 'star' },
  award: { set: 'feather', name: 'award' },
  target: { set: 'feather', name: 'target' },
  'trending-up': { set: 'feather', name: 'trending-up' },

  // Content
  calendar: { set: 'feather', name: 'calendar' },
  'map-pin': { set: 'feather', name: 'map-pin' },
  'bar-chart': { set: 'feather', name: 'bar-chart-2' },
  list: { set: 'feather', name: 'list' },
  grid: { set: 'feather', name: 'grid' },
  'book-open': { set: 'feather', name: 'book-open' },
  mail: { set: 'feather', name: 'mail' },
  'message-circle': { set: 'feather', name: 'message-circle' },
  activity: { set: 'feather', name: 'activity' },
  'file-text': { set: 'feather', name: 'file-text' },

  // walkToo specific
  walk: { set: 'material', name: 'walk' },
  fire: { set: 'material', name: 'fire' },
  'shoe-sneaker': { set: 'material', name: 'shoe-sneaker' },

  // Social / Brand
  apple: { set: 'material', name: 'apple' },
  google: { set: 'material', name: 'google' },
} as const;

export type IconName = keyof typeof ICON_MAP;

// ─── Types ──────────────────────────────────────────────

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// ─── Component ──────────────────────────────────────────

const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = theme.colors.text,
}) => {
  const config = ICON_MAP[name];

  if (!config) {
    console.warn(`[Icon] Unknown icon name: "${name}"`);
    return null;
  }

  if (config.set === 'material') {
    return (
      <MaterialCommunityIcons
        name={config.name as keyof typeof MaterialCommunityIcons.glyphMap}
        size={size}
        color={color}
      />
    );
  }

  return (
    <Feather
      name={config.name as keyof typeof Feather.glyphMap}
      size={size}
      color={color}
    />
  );
};

export default Icon;

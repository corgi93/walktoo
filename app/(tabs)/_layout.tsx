import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon, IconName } from '@/components/base';
import { theme } from '@/styles/theme';
import { FONT_FAMILY } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function TabLayout() {
  const { t } = useTranslation('home');
  const insets = useSafeAreaInsets();

  // iOS home indicator / Android 3-button 영역이 라벨을 침범하지 않도록 최소 여백을 확보.
  const bottomPadding =
    Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          paddingTop: 4,
          // Android edgeToEdge에서 3-버튼 nav가 라벨 디센더를 침범하지
          // 않도록 시스템 inset 위에 최소 여백만 추가.
          paddingBottom: bottomPadding + 4,
          height: 50 + bottomPadding,
          borderTopWidth: 2,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.pixel,
          fontSize: 10,
          // 픽셀 폰트(NeoDunggeunmo)는 lineHeight를 fontSize의 1.8배 정도
          // 두어야 디센더가 잘리지 않는다. (1.6은 NeoDunggeunmo에서 빠듯)
          lineHeight: 18,
          // 음수 marginTop으로 아이콘-라벨 사이 간격을 좁힌다.
          // 라벨 line-box가 18px이라 -4 정도까진 안전.
          marginTop: -2,
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        tabBarItemStyle: {
          paddingVertical: 0,
        },
        tabBarIconStyle: {
          // 아이콘도 약간 아래로 내려 라벨과 더 가깝게.
          marginBottom: -2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tab.home'),
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: t('tab.records'),
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tab.profile'),
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }}
      />
    </Tabs>
  );
}

// ─── Tab Icon ────────────────────────────────────────────

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} size={16} color={color} />;
}

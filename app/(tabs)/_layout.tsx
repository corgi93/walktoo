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

  const bottomPadding =
    Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 4);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          paddingTop: 4,
          paddingBottom: bottomPadding,
          height: 44 + bottomPadding,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.pixel,
          fontSize: 9,
          lineHeight: 11,
          marginTop: 1,
        },
        tabBarIconStyle: {
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
  return <Icon name={name} size={18} color={color} />;
}

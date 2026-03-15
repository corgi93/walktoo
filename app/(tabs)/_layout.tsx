import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';
import { FONT_FAMILY } from '@/styles/type';

// ─── Component ──────────────────────────────────────────

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  const bottomPadding =
    Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          paddingBottom: bottomPadding,
          height: 60 + bottomPadding,
          borderTopWidth: 2,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray500,
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.pixel,
          fontSize: 11,
          lineHeight: 14,
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
          title: '홈',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '발자취',
          tabBarIcon: () => <TabIcon emoji="👣" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tabs>
  );
}

// ─── Tab Icon with Dot ──────────────────────────────────

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}


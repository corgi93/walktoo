import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
          backgroundColor: theme.colors.background,
          paddingBottom: bottomPadding,
          height: 56 + bottomPadding,
          borderTopWidth: 0,
          ...theme.shadows.small,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray400,
        tabBarLabelStyle: {
          fontFamily: FONT_FAMILY.pixel,
          fontSize: 11,
          lineHeight: 14,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '발자취',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'footsteps' : 'footsteps-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '마이',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}

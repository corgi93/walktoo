import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';

interface BasicPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  showHeader?: boolean;
  showBackButton?: boolean;
  contentPadding?: number;
}

export const BasicPageLayout: React.FC<BasicPageLayoutProps> = ({
  children,
  title,
  showHeader = false,
  showBackButton = true,
  contentPadding = 24,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    navigation.canGoBack() ? navigation.goBack() : router.replace('/');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />

      {showHeader && (
        <View style={styles.header}>
          {showBackButton ? (
            <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
            </Pressable>
          ) : (
            <View style={styles.backBtn} />
          )}
          {title && <Text variant="headingMedium">{title}</Text>}
          <View style={styles.backBtn} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.scroll, { padding: contentPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 40,
  },
});

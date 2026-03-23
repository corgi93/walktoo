import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { Text } from "@/components/base";
import { authService, couplesService } from "@/server";
import { usePermissionStore } from "@/stores/permissionStore";
import { theme } from "@/styles/theme";

export default function SplashAuthScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    const checkAuth = async () => {
      try {
        // Supabase 세션 확인 (SecureStore에서 자동 복원)
        const session = await authService.getSession();
        if (session) {
          // 프로필 완성 여부 확인
          const user = await authService.getCurrentUser();
          if (user) {
            const profile = await couplesService.getMyProfile(user.id);
            if (!profile.isProfileComplete) {
              router.replace("/profile-setup");
              return;
            }
          }
          const { hasCompletedOnboarding } = usePermissionStore.getState();
          router.replace(hasCompletedOnboarding ? "/(tabs)" : "/permissions");
        } else {
          router.replace("/login");
        }
      } catch {
        router.replace("/login");
      }
    };

    const timer = setTimeout(checkAuth, 1200);
    return () => clearTimeout(timer);
  }, [fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text variant="displayLarge" color="primary">
          walkToo
        </Text>
        <Text variant="bodyLarge" color="textSecondary" mt="md">
          우리 둘의 걸음, 하나의 이야기
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  content: {
    alignItems: "center",
  },
});

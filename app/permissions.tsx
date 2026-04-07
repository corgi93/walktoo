import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { Box, Row, Text } from "@/components/base";
import { PermissionPrompt } from "@/components/feature/permissions";
import { PERMISSION_ORDER } from "@/constants/permissions";
import { usePermission } from "@/hooks/usePermission";
import { usePermissionStore } from "@/stores/permissionStore";
import { theme } from "@/styles/theme";
import { SPACING } from "@/styles/type";
import { PermissionType } from "@/types/permission";

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <Row gap={8} style={{ justifyContent: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </Row>
  );
}

function PermissionStep({
  type,
  onComplete,
}: {
  type: PermissionType;
  onComplete: () => void;
}) {
  const { request } = usePermission(type);
  const [loading, setLoading] = useState(false);

  const handleAllow = useCallback(async () => {
    setLoading(true);
    await request();
    setLoading(false);
    onComplete();
  }, [request, onComplete]);

  return (
    <PermissionPrompt
      type={type}
      onAllow={handleAllow}
      onSkip={onComplete}
      loading={loading}
    />
  );
}

export default function PermissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('permission');
  const [currentIndex, setCurrentIndex] = useState(0);
  const { setOnboardingComplete } = usePermissionStore();

  const currentType = PERMISSION_ORDER[currentIndex];
  const total = PERMISSION_ORDER.length;

  const advance = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setOnboardingComplete();
      router.replace("/(tabs)");
    }
  }, [currentIndex, total, setOnboardingComplete, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      {/* Header */}
      <Box px="xxl" py="lg">
        <Text variant="headingLarge">{t('onboarding.title')}</Text>
        <Text variant="bodySmall" color="textSecondary" mt="xs">
          {t('onboarding.subtitle')}
        </Text>
      </Box>

      {/* Progress */}
      <Box style={{ marginTop: SPACING.sm }}>
        <ProgressDots total={total} current={currentIndex} />
      </Box>

      {/* Permission Card */}
      <Box px="xxl" style={{ marginTop: SPACING.xxxl }}>
        <PermissionStep
          key={currentType}
          type={currentType}
          onComplete={advance}
        />
      </Box>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
    width: 24,
  },
  dotInactive: {
    backgroundColor: theme.colors.gray200,
  },
});

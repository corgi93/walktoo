import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Component ──────────────────────────────────────────

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={{ fontSize: 48 }}>🗺️</Text>
        <Text variant="headingMedium" mt="lg">
          페이지를 찾을 수 없습니다
        </Text>
        <Link href="/" style={styles.link}>
          <Text variant="label" color="primary">
            홈으로 돌아가기 →
          </Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  link: {
    marginTop: 20,
    paddingVertical: 16,
  },
});

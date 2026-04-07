import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { theme } from '@/styles/theme';

// ─── Component ──────────────────────────────────────────

export default function NotFoundScreen() {
  const { t } = useTranslation('error');
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Icon name="search" size={48} color={theme.colors.gray400} />
        <Text variant="headingMedium" mt="lg">
          {t('not-found')}
        </Text>
        <Link href="/" style={styles.link}>
          <Text variant="label" color="primary">
            {t('go-home')} →
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

import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';

import { LoadingOverlay } from '@/components/base';
import { PopupProvider } from '@/components/composite/popup/PopupProvider';
import { ToastProvider } from '@/components/composite/toast/ToastProvider';
import { theme } from '@/styles/theme';

// ─── Config ─────────────────────────────────────────────

const queryClient = new QueryClient();

const WarmTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.text,
    primary: theme.colors.primary,
    border: theme.colors.gray200,
  },
};

SplashScreen.preventAutoHideAsync();

// ─── Root Layout ────────────────────────────────────────

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NeoDunggeunmo: require('../assets/fonts/NeoDunggeunmo.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" backgroundColor={theme.colors.background} />
      <ThemeProvider value={WarmTheme}>
        <ToastProvider>
          <PopupProvider>
            <Suspense fallback={<LoadingOverlay />}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="permissions" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="footprint-create"
                  options={{ presentation: 'modal' }}
                />
                <Stack.Screen name="+not-found" options={{ headerShown: true }} />
              </Stack>
            </Suspense>
          </PopupProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

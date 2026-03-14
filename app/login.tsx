import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Box, Button, Text } from '@/components/base';
import { theme } from '@/styles/theme';


export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  const handleLogin = () => {
    // TODO: implement login
    router.replace('/permissions');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <Box flex={1} center>
        <Text variant="displayLarge" color="primary">
          PairWalk
        </Text>
        <Text variant="bodyLarge" color="textSecondary" mt="md">
          같이 걷는 즐거움
        </Text>
      </Box>

      <Box px="xxl">
        <Button onPress={handleLogin} size="large">
          시작하기
        </Button>

        <Text
          variant="caption"
          color="textMuted"
          align="center"
          mt="lg"
        >
          시작하기를 누르면 서비스 이용약관에 동의합니다
        </Text>
      </Box>
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

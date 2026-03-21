import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';

/**
 * OAuth 콜백 라우트
 * Google/Apple OAuth 완료 후 이 화면으로 리다이렉트됨
 * 실제 세션 처리는 login.tsx의 WebBrowser.openAuthSessionAsync에서 하므로
 * 이 화면은 로딩만 보여주고 자동으로 넘어감
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // OAuth 흐름이 WebBrowser에서 처리되므로
    // 이 화면에 직접 도달하는 경우 홈으로 이동
    const timeout = setTimeout(() => {
      router.replace('/');
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#FF8B5C" />
    </View>
  );
}

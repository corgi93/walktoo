import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import {
  useCreateInviteMutation,
  useJoinCoupleMutation,
} from '@/hooks/services/couple/mutation';
import { theme } from '@/styles/theme';
import { FONT_FAMILY, SPACING } from '@/styles/type';

// ─── Types ──────────────────────────────────────────────

type Mode = 'idle' | 'invite' | 'join';

interface NoCoupleCardProps {
  /** compact 모드 — 홈 화면 등 작은 영역 */
  compact?: boolean;
}

// ─── Component ──────────────────────────────────────────

export function NoCoupleCard({ compact = false }: NoCoupleCardProps) {
  const [mode, setMode] = useState<Mode>('idle');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const createInvite = useCreateInviteMutation();
  const joinCouple = useJoinCoupleMutation();

  // ─── Handlers ─────────────────────────────────────────

  const handleCreateInvite = async () => {
    createInvite.mutate(undefined, {
      onSuccess: (data) => {
        const code = (data as { inviteCode?: string })?.inviteCode ?? '';
        setGeneratedCode(code);
        setMode('invite');
      },
      onError: (err) => {
        Alert.alert('오류', err.message || '초대코드 생성에 실패했어요');
      },
    });
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: `walkToo에서 같이 걸어볼래?\n초대코드: ${generatedCode}`,
      });
    } catch {
      // 공유 취소 시 무시
    }
  };

  const handleJoin = () => {
    const trimmed = joinCode.trim();
    if (!trimmed) {
      Alert.alert('', '초대코드를 입력해주세요!');
      return;
    }
    joinCouple.mutate(trimmed, {
      onSuccess: () => {
        Alert.alert('연결 완료!', '이제 둘만의 산책이 시작돼요');
        setMode('idle');
        setJoinCode('');
      },
      onError: (err) => {
        Alert.alert('연결 실패', err.message || '코드를 확인해주세요');
      },
    });
  };

  // ─── Compact (Home Screen inline) ─────────────────────

  if (compact) {
    return (
      <PixelCard style={styles.compactCard}>
        <View style={styles.questionMark}>
          <Icon name="mail" size={24} color={theme.colors.primary} />
        </View>
        <Text variant="bodySmall" color="textSecondary" mt="sm" style={{ textAlign: 'center' }}>
          내 사람을 기다리는 중...
        </Text>
        <Text variant="caption" color="textMuted" mt="xxs" style={{ textAlign: 'center' }}>
          초대코드를 보내보세요
        </Text>
      </PixelCard>
    );
  }

  // ─── Full Card ────────────────────────────────────────

  return (
    <View style={styles.container}>
      <Text variant="headingMedium" style={{ textAlign: 'center' }}>
        아직 둘이 아니에요
      </Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        mt="sm"
        style={{ textAlign: 'center', lineHeight: 20 }}
      >
        내 사람과 연결하면{'\n'}둘만의 산책이 시작돼요
      </Text>

      {/* ─── Idle Mode ─── */}
      {mode === 'idle' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <Button
            variant="primary"
            size="medium"
            onPress={handleCreateInvite}
            loading={createInvite.isPending}
          >
            초대코드 만들기
          </Button>
          <Button
            variant="secondary"
            size="medium"
            mt="sm"
            onPress={() => setMode('join')}
          >
            초대코드 입력하기
          </Button>
        </Box>
      )}

      {/* ─── Invite Mode (코드 생성됨) ─── */}
      {mode === 'invite' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <PixelCard style={styles.codeCard} bg={theme.colors.primarySurface}>
            <Text variant="caption" color="textSecondary">
              나의 초대코드
            </Text>
            <Text
              variant="displaySmall"
              color="primary"
              mt="sm"
              style={{ letterSpacing: 4 }}
            >
              {generatedCode || '...'}
            </Text>
            <Pressable
              style={styles.copyBtn}
              onPress={handleShareCode}
              hitSlop={8}
            >
              <Row style={{ alignItems: 'center', gap: SPACING.xs }}>
                <Icon name="share" size={14} color={theme.colors.primary} />
                <Text variant="caption" color="primary">
                  공유하기
                </Text>
              </Row>
            </Pressable>
          </PixelCard>

          <Text
            variant="caption"
            color="textMuted"
            mt="md"
            style={{ textAlign: 'center' }}
          >
            내 사람에게 이 코드를 보내주세요
          </Text>

          <Button
            variant="ghost"
            size="small"
            mt="md"
            onPress={() => setMode('idle')}
          >
            돌아가기
          </Button>
        </Box>
      )}

      {/* ─── Join Mode (코드 입력) ─── */}
      {mode === 'join' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.codeInput}
              placeholder="초대코드 입력"
              placeholderTextColor={theme.colors.gray400}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
              autoCorrect={false}
              cursorColor={theme.colors.primary}
              maxLength={8}
            />
          </View>

          <Button
            variant="primary"
            size="medium"
            mt="md"
            onPress={handleJoin}
            disabled={joinCouple.isPending || !joinCode.trim()}
          >
            {joinCouple.isPending ? (
              <Row style={{ alignItems: 'center', gap: SPACING.sm }}>
                <ActivityIndicator size="small" color={theme.colors.white} />
                <Text variant="bodyMedium" color="white">
                  연결 중...
                </Text>
              </Row>
            ) : (
              '커플 연결하기'
            )}
          </Button>

          <Button
            variant="ghost"
            size="small"
            mt="sm"
            onPress={() => {
              setMode('idle');
              setJoinCode('');
            }}
          >
            돌아가기
          </Button>
        </Box>
      )}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xl,
  },
  compactCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderStyle: 'dashed',
    borderColor: theme.colors.gray300,
    backgroundColor: theme.colors.surfaceWarm,
  },
  questionMark: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeCard: {
    alignItems: 'center',
    padding: SPACING.xl,
  },
  copyBtn: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  inputWrapper: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surfaceWarm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    // 픽셀 그림자
    shadowColor: theme.colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  codeInput: {
    fontSize: 18,
    fontFamily: FONT_FAMILY.pixel,
    color: theme.colors.text,
    textAlign: 'center',
    letterSpacing: 6,
    paddingVertical: SPACING.xs,
  },
});

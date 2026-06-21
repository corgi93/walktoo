import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, PixelCard, Row, Text } from '@/components/base';
import {
  useCreateInviteMutation,
  useJoinCoupleMutation,
} from '@/hooks/services/couple/mutation';
import { useDialogStore } from '@/stores/dialogStore';
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
  const { t } = useTranslation('couple');
  const [mode, setMode] = useState<Mode>('idle');
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');

  const createInvite = useCreateInviteMutation();
  const joinCouple = useJoinCoupleMutation();
  const dialog = useDialogStore();

  // ─── Handlers ─────────────────────────────────────────

  const handleCreateInvite = () => {
    createInvite.mutate(undefined, {
      onSuccess: (data) => {
        const code = (data as { inviteCode?: string })?.inviteCode ?? '';
        setGeneratedCode(code);
        setMode('invite');
      },
      onError: (err) => {
        dialog.alert(
          t('invite.create-failed-title'),
          err.message || t('invite.create-failed-message'),
        );
      },
    });
  };

  const handleShareCode = async () => {
    try {
      await Share.share({
        message: t('invite.share-message', { code: generatedCode }),
      });
    } catch {
      // 공유 취소 시 무시
    }
  };

  const handleJoin = () => {
    const trimmed = joinCode.trim().toUpperCase();
    if (!trimmed) {
      dialog.alert('', t('join.code-required'));
      return;
    }
    if (trimmed.length < 6) {
      dialog.alert('', t('join.code-too-short'));
      return;
    }
    joinCouple.mutate(trimmed, {
      onSuccess: () => {
        dialog.alert(t('join.success-title'), t('join.success-message'));
        setMode('idle');
        setJoinCode('');
      },
      onError: (err) => {
        // 백엔드 에러 메시지 패턴 분기 (한국어 식별자 그대로 — 서버 응답 코드).
        // 향후 백엔드에서 에러 코드(enum)로 내려주면 그걸 키로 분기하는 것이 정공법.
        const msg = err.message || '';
        if (msg.includes('유효하지 않은')) {
          dialog.alert(t('join.error-invalid-title'), t('join.error-invalid-message'));
        } else if (msg.includes('만료된')) {
          dialog.alert(t('join.error-expired-title'), t('join.error-expired-message'));
        } else if (msg.includes('본인의')) {
          dialog.alert('', t('join.error-self'));
        } else if (msg.includes('이미 연결된')) {
          dialog.alert('', t('join.error-already-paired'));
        } else {
          dialog.alert(t('join.error-fail-title'), t('join.error-fail-message'));
        }
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
          {t('no-couple.compact-title')}
        </Text>
        <Text variant="caption" color="textMuted" mt="xxs" style={{ textAlign: 'center' }}>
          {t('no-couple.compact-subtitle')}
        </Text>
      </PixelCard>
    );
  }

  // ─── Full Card ────────────────────────────────────────

  return (
    <View style={styles.container}>
      <View style={styles.headerIcon}>
        <Icon name="link" size={20} color={theme.colors.primary} />
      </View>

      <Text variant="headingMedium" mt="md" style={{ textAlign: 'center' }}>
        {t('no-couple.title')}
      </Text>
      <Text
        variant="bodySmall"
        color="textSecondary"
        mt="sm"
        style={{ textAlign: 'center', lineHeight: 20 }}
      >
        {t('no-couple.description')}
      </Text>

      {mode === 'idle' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <Button
            variant="primary"
            size="medium"
            onPress={handleCreateInvite}
            loading={createInvite.isPending}
          >
            {t('no-couple.create-code')}
          </Button>
          <Button
            variant="secondary"
            size="medium"
            mt="sm"
            onPress={() => setMode('join')}
          >
            {t('no-couple.enter-code')}
          </Button>
        </Box>
      )}

      {mode === 'invite' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <PixelCard style={styles.codeCard} bg={theme.colors.primarySurface}>
            <Text variant="caption" color="textSecondary">
              {t('invite.label')}
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
                  {t('invite.share')}
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
            {t('invite.share-prompt')}
          </Text>

          <Button
            variant="ghost"
            size="small"
            mt="md"
            onPress={() => setMode('idle')}
          >
            {t('no-couple.back')}
          </Button>
        </Box>
      )}

      {mode === 'join' && (
        <Box style={{ marginTop: SPACING.xxl, width: '100%' }}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.codeInput}
              placeholder={t('join.input-placeholder')}
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
                  {t('join.submitting')}
                </Text>
              </Row>
            ) : (
              t('join.submit')
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
            {t('no-couple.back')}
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
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primarySurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
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

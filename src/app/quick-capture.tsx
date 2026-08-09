import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
  type CameraType,
} from 'expo-camera';
import { useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { PREMIUM } from '@/constants/premium';
import { getDailyQuestions } from '@/constants/questions';
import {
  useAddEntryMutation,
  useCreateDiaryMutation,
} from '@/hooks/services/diary/mutation';
import { useDiaryByMonthQuery } from '@/hooks/services/diary/query';
import { useEntitlement } from '@/hooks/useEntitlement';
import { usePartnerDerivation } from '@/hooks/usePartnerDerivation';
import { useRevealUpgradeNudge } from '@/hooks/useRevealUpgradeNudge';
import { useDialogStore } from '@/stores/dialogStore';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import { getLocalToday, parseLocalDate } from '@/utils/date';
import {
  getLocalFileSize,
  MAX_SHORT_VIDEO_BYTES,
  optimizeImageForUpload,
} from '@/utils/media';

type Mode = 'picture' | 'video';

const formatBytes = (bytes: number | null): string => {
  if (!bytes && bytes !== 0) return '?';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
};

export default function QuickCaptureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('diary');
  const dialog = useDialogStore();

  const { couple, isCoupleConnected } = usePartnerDerivation();
  const { isEntitled } = useEntitlement();
  const createDiary = useCreateDiaryMutation();
  const addEntry = useAddEntryMutation();
  const maybeShowRevealNudge = useRevealUpgradeNudge();
  const [isSaving, setIsSaving] = useState(false);
  const videoMaxDuration = isEntitled
    ? PREMIUM.VIDEO_DURATION_PREMIUM_SECONDS
    : PREMIUM.VIDEO_DURATION_FREE_SECONDS;

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const cameraRef = useRef<CameraView | null>(null);
  const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(
    null,
  );
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const optimizedForRef = useRef<string | null>(null);

  const [mode, setMode] = useState<Mode>('picture');
  const [facing, setFacing] = useState<CameraType>('front');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [capturedKind, setCapturedKind] = useState<Mode>('picture');
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number>(videoMaxDuration);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 미리보기 영상 플레이어 — 녹화 직후 자동 루프 재생.
  const previewVideoSource =
    capturedUri && capturedKind === 'video' ? capturedUri : null;
  const previewPlayer = useVideoPlayer(previewVideoSource, (p) => {
    if (!previewVideoSource) return;
    p.loop = true;
    p.muted = false;
    p.play();
  });

  const date = getLocalToday();
  const { diaryQuestion, coupleQuestion } = useMemo(
    () => getDailyQuestions(couple?.firstMetDate, date),
    [couple?.firstMetDate, date],
  );

  // 오늘 '각자' walk가 이미 있으면(파트너가 먼저 남김) 새로 생성하지 않고 조인한다.
  const { year, month } = useMemo(() => {
    const d = parseLocalDate(date);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }, [date]);
  const { data: monthWalks, refetch: refetchMonth } = useDiaryByMonthQuery(
    year,
    month,
  );

  // ─── Permissions ─────────────────────────────────────
  useEffect(() => {
    if (!cameraPermission) return;
    if (!cameraPermission.granted && cameraPermission.canAskAgain) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    if (!micPermission) return;
    if (!micPermission.granted && micPermission.canAskAgain) {
      void requestMicPermission();
    }
  }, [micPermission, requestMicPermission]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isRecording) {
      setRemainingSec(videoMaxDuration);
    }
  }, [isRecording, videoMaxDuration]);

  // ─── Handlers ────────────────────────────────────────
  const handleClose = useCallback(() => {
    if (isRecording) {
      cameraRef.current?.stopRecording();
    }
    router.back();
  }, [isRecording, router]);

  const handleFlip = useCallback(() => {
    if (isRecording || isCapturing) return;
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  }, [isCapturing, isRecording]);

  const handleSwitchMode = useCallback(
    (next: Mode) => {
      if (isRecording || isCapturing) return;
      setMode(next);
    },
    [isCapturing, isRecording],
  );

  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || isRecording) return;
    setIsCapturing(true);
    try {
      // 저화질 0.75 — 어차피 업로드 직전에 1600px @ 0.78로 리사이즈됨.
      // 시작 파일을 작게 두면 캡처도 빠르고 후속 리사이즈도 가벼움.
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.75,
        skipProcessing: false,
      });
      if (result?.uri) {
        if (__DEV__) {
          const size = await getLocalFileSize(result.uri);
          console.log(
            `[quick-capture] 📸 photo captured: ${formatBytes(size)} (${result.width}x${result.height})`,
          );
        }
        setCapturedUri(result.uri);
        setCapturedKind('picture');
      }
    } catch (error) {
      console.warn('[quick-capture] takePicture failed', error);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, isRecording]);

  const handleStartRecord = useCallback(async () => {
    if (!cameraRef.current || isCapturing || isRecording) return;
    setIsRecording(true);
    setRemainingSec(videoMaxDuration);
    try {
      const promise = cameraRef.current.recordAsync({
        maxDuration: videoMaxDuration,
      });
      recordPromiseRef.current = promise;

      // 1초 단위 카운트다운 — UI 표시용. native maxDuration이 실제 종료를 담당.
      countdownRef.current = setInterval(() => {
        setRemainingSec((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Safety stop in case maxDuration on native side doesn't fire.
      stopTimerRef.current = setTimeout(() => {
        cameraRef.current?.stopRecording();
      }, (videoMaxDuration + 0.3) * 1000);

      const result = await promise;
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (result?.uri) {
        if (__DEV__) {
          const size = await getLocalFileSize(result.uri);
          console.log(
            `[quick-capture] 🎬 video recorded: ${formatBytes(size)}`,
          );
        }
        setCapturedUri(result.uri);
        setCapturedKind('video');
      }
    } catch (error) {
      console.warn('[quick-capture] record failed', error);
    } finally {
      recordPromiseRef.current = null;
      setIsRecording(false);
      setRemainingSec(videoMaxDuration);
    }
  }, [isCapturing, isRecording, videoMaxDuration]);

  const handleStopRecord = useCallback(() => {
    cameraRef.current?.stopRecording();
  }, []);

  const handleShutter = useCallback(() => {
    if (mode === 'picture') {
      void handleTakePicture();
    } else if (isRecording) {
      handleStopRecord();
    } else {
      void handleStartRecord();
    }
  }, [handleStartRecord, handleStopRecord, handleTakePicture, isRecording, mode]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
    optimizedForRef.current = null;
  }, []);

  // 미리보기 동안 백그라운드 리사이즈 — 저장 시 체감 지연 제거.
  // 이미 최적화한 URI는 ref로 가드해 재실행 방지.
  useEffect(() => {
    if (!capturedUri || capturedKind !== 'picture') return;
    if (optimizedForRef.current === capturedUri) return;
    optimizedForRef.current = capturedUri;
    let cancelled = false;
    (async () => {
      const start = Date.now();
      const optimized = await optimizeImageForUpload(capturedUri);
      if (cancelled || optimized === capturedUri) return;
      if (__DEV__) {
        const size = await getLocalFileSize(optimized);
        console.log(
          `[quick-capture] 🪶 optimized: ${formatBytes(size)} (${Date.now() - start}ms)`,
        );
      }
      optimizedForRef.current = optimized;
      setCapturedUri(optimized);
    })();
    return () => {
      cancelled = true;
    };
  }, [capturedUri, capturedKind]);

  const handleSave = useCallback(async () => {
    if (!capturedUri || isSaving) return;

    if (!isCoupleConnected) {
      dialog.alert('', t('quick.no-couple'));
      return;
    }

    // 이 지점 이후로는 await가 있으므로 가드를 먼저 세워 더블탭 이중 저장을 막는다.
    setIsSaving(true);
    try {
      // Video size guard — surface a friendly error before upload starts.
      if (capturedKind === 'video') {
        const size = await getLocalFileSize(capturedUri);
        if (size && size > MAX_SHORT_VIDEO_BYTES) {
          dialog.alert('', t('create.video-too-large'));
          return;
        }
      }

      // 저장 직전 최신 목록으로 오늘 '각자' walk 존재 여부를 판정한다.
      // (커플·날짜·kind당 walk 1개 모델 — 파트너가 먼저 남겼으면 조인해야 함)
      const refreshed = await refetchMonth();
      const walks = refreshed.data ?? monthWalks ?? [];
      const existingEach = walks.find(
        (w) => w.date === date && w.kind === 'each',
      );

      if (existingEach) {
        // 두 번째 파트너 — 새 walk 생성이 아니라 기존 walk에 내 엔트리를 조인.
        await addEntry.mutateAsync({
          walkId: existingEach.id,
          memo: '',
          photos: [capturedUri],
          locationName: '',
          diaryQuestionId: diaryQuestion.id,
          diaryAnswer: '',
          coupleQuestionId: coupleQuestion.id,
          coupleAnswer: '',
        });
        router.back();
        // 둘 다 완성 → reveal 순간. free 사용자에게 가볍게 커플 패스 제안.
        maybeShowRevealNudge();
      } else {
        await createDiary.mutateAsync({
          date,
          kind: 'each',
          locationName: '',
          memo: '',
          photos: [capturedUri],
          diaryQuestionId: diaryQuestion.id,
          diaryAnswer: '',
          coupleQuestionId: coupleQuestion.id,
          coupleAnswer: '',
        });
        router.back();
      }
    } catch {
      dialog.alert(t('quick.save-failed-title'), t('quick.save-failed'));
    } finally {
      setIsSaving(false);
    }
  }, [
    addEntry,
    capturedKind,
    capturedUri,
    coupleQuestion.id,
    createDiary,
    date,
    diaryQuestion.id,
    dialog,
    isCoupleConnected,
    isSaving,
    maybeShowRevealNudge,
    monthWalks,
    refetchMonth,
    router,
    t,
  ]);

  // ─── Render: permission gate ─────────────────────────
  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator color={theme.colors.white} />
      </View>
    );
  }

  if (!cameraPermission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <Pressable
          onPress={handleClose}
          style={[styles.topCloseBtn, { top: insets.top + SPACING.md }]}
        >
          <Icon name="x" size={26} color={theme.colors.white} />
        </Pressable>
        <View style={styles.permissionInner}>
          <Icon name="camera" size={48} color={theme.colors.white} />
          <Text variant="headingMedium" color="white" mt="lg">
            {t('quick.permission-title')}
          </Text>
          <Text
            variant="bodyMedium"
            color="gray300"
            mt="sm"
            style={styles.permissionMessage}
          >
            {t('quick.permission-message')}
          </Text>
          <Pressable
            onPress={() => {
              void requestCameraPermission();
              void requestMicPermission();
            }}
            style={styles.permissionCta}
          >
            <Text variant="bodyMedium" color="white">
              {t('quick.permission-cta')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Render: captured preview ────────────────────────
  if (capturedUri) {
    return (
      <View style={styles.root}>
        <View style={styles.previewMedia}>
          {capturedKind === 'picture' ? (
            <Image
              source={{ uri: capturedUri }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <VideoView
              player={previewPlayer}
              style={styles.previewImage}
              contentFit="cover"
              nativeControls={false}
            />
          )}
          {/* Top close — also cancels save */}
          <Pressable
            onPress={handleClose}
            style={[styles.topCloseBtn, { top: insets.top + SPACING.md }]}
            disabled={isSaving}
          >
            <Icon name="x" size={26} color={theme.colors.white} />
          </Pressable>
        </View>

        <View style={[styles.previewActions, { paddingBottom: insets.bottom + SPACING.xl }]}>
          <Pressable
            onPress={handleRetake}
            disabled={isSaving}
            style={[styles.previewBtn, styles.previewBtnGhost]}
          >
            <Icon name="rotate-ccw" size={18} color={theme.colors.white} />
            <Text variant="bodyMedium" color="white" style={styles.previewBtnLabel}>
              {t('quick.retake')}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.previewBtn, styles.previewBtnPrimary]}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <>
                <Icon name="check" size={18} color={theme.colors.white} />
                <Text variant="bodyMedium" color="white" style={styles.previewBtnLabel}>
                  {t('quick.save')}
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Render: live camera ─────────────────────────────
  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        mode={mode}
        mirror
        videoQuality="720p"
        onCameraReady={() => setIsCameraReady(true)}
      />

      {/* Top bar: mode toggle + close */}
      <View style={[styles.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={styles.modeToggle}>
          {(['picture', 'video'] as const).map((m) => {
            const active = mode === m;
            return (
              <Pressable
                key={m}
                onPress={() => handleSwitchMode(m)}
                style={[
                  styles.modeChip,
                  active && styles.modeChipActive,
                ]}
              >
                <Text
                  variant="bodyMedium"
                  color={active ? 'text' : 'white'}
                  style={styles.modeChipLabel}
                >
                  {t(m === 'picture' ? 'quick.mode-photo' : 'quick.mode-video')}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          onPress={handleClose}
          style={styles.closeBtn}
          disabled={isRecording}
        >
          <Icon name="x" size={26} color={theme.colors.white} />
        </Pressable>
      </View>

      {/* Recording indicator */}
      {isRecording && (
        <View style={[styles.recordBadge, { top: insets.top + SPACING.xxl + 32 }]}>
          <View style={styles.recordDot} />
          <Text variant="bodySmall" color="white">
            REC · {remainingSec}s
          </Text>
        </View>
      )}

      {/* Hint */}
      {!isRecording && (
        <View style={[styles.hintWrap, { bottom: insets.bottom + 180 }]}>
          <Text variant="bodySmall" color="white" style={styles.hint}>
            {t(mode === 'picture' ? 'quick.hint-photo' : 'quick.hint-video', {
              seconds: videoMaxDuration,
            })}
          </Text>
          {mode === 'video' && !isEntitled && (
            <Pressable
              onPress={() => router.push('/paywall')}
              style={styles.hintUpgrade}
            >
              <Text variant="caption" color="primary" style={styles.hintUpgradeText}>
                {t('quick.video-upgrade')}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Bottom bar: shutter + flip */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + SPACING.xl }]}>
        <View style={styles.bottomSide} />

        <Pressable
          onPress={handleShutter}
          disabled={!isCameraReady || isCapturing}
          style={({ pressed }) => [
            styles.shutterOuter,
            mode === 'video' && styles.shutterOuterVideo,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View
            style={[
              styles.shutterInner,
              mode === 'video' && styles.shutterInnerVideo,
              isRecording && styles.shutterInnerRecording,
            ]}
          />
        </Pressable>

        <View style={styles.bottomSide}>
          <Pressable
            onPress={handleFlip}
            disabled={isRecording}
            style={styles.flipBtn}
          >
            <Icon
              name="camera-flip"
              size={26}
              color={isRecording ? theme.colors.gray400 : theme.colors.white}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  permissionMessage: {
    textAlign: 'center',
  },
  permissionCta: {
    marginTop: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: theme.colors.primary,
    borderRadius: 999,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    padding: 4,
  },
  modeChip: {
    paddingVertical: 6,
    paddingHorizontal: SPACING.lg,
    borderRadius: 999,
  },
  modeChipActive: {
    backgroundColor: theme.colors.white,
  },
  modeChipLabel: {
    fontSize: 13,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 999,
  },
  topCloseBtn: {
    position: 'absolute',
    right: SPACING.lg,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 999,
    zIndex: 2,
  },
  recordBadge: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  hintWrap: {
    position: 'absolute',
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    alignItems: 'center',
  },
  hint: {
    fontSize: 12,
  },
  hintUpgrade: {
    marginTop: 6,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: 6,
  },
  hintUpgradeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  bottomSide: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuterVideo: {
    borderColor: theme.colors.primary,
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.white,
  },
  shutterInnerVideo: {
    backgroundColor: theme.colors.primary,
  },
  shutterInnerRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  flipBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
  },
  previewMedia: {
    flex: 1,
    backgroundColor: '#000',
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  previewActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    backgroundColor: '#000',
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
  },
  previewBtnGhost: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  previewBtnPrimary: {
    backgroundColor: theme.colors.primary,
  },
  previewBtnLabel: {
    fontSize: 14,
  },
});

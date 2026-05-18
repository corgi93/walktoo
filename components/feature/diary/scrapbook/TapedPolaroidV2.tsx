import React from 'react';
import {
  Image,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { Icon } from '@/components/base';
import type { DiaryTheme } from '@/styles/diaryThemes';
import { isVideoUri } from '@/utils/media';

import type { DiaryTapeId } from './assetRegistry';
import { ImageTape } from './ImageTape';
import { seeded } from './seeded';

interface TapeDeco {
  id: DiaryTapeId;
  /** 폭 (default: 폴라로이드 폭의 50%) */
  width?: number;
  /** 추가 회전 (deg) — base seeded rotate에 더해짐 */
  rotate?: number;
}

interface TapedPolaroidV2Props {
  /** 카드 폭 (px) */
  width: number;
  /** 카드 높이 (px) — 미지정 시 width * 1.18 */
  height?: number;
  /** 사진 uri (없으면 placeholder) */
  photoUri?: string;
  /** placeholder children — photoUri 없을 때 사진 영역에 표시 */
  children?: React.ReactNode;
  /** 사진 영역 배경 (placeholder 용) */
  tint: string;
  /** 손글씨 캡션 — 사진 아래 */
  caption?: string;
  /** 우상단 회전 stamp (예: "04·21·26") */
  stampDate?: string;
  /** 카드 회전 (deg) */
  rotate?: number;
  /** 위에 붙는 PNG 와시테이프 셋 */
  tapes?: readonly TapeDeco[];
  /** seed for deterministic decoration */
  seed?: string;
  /** 컨테이너 위치 등 외부 스타일 */
  style?: StyleProp<ViewStyle>;
  /** 테마 — 폰트/색상 */
  theme: DiaryTheme;
  /** 편집 모드 — 빈 슬롯은 + 누름, 채워진 슬롯은 우상단 X로 제거 */
  editable?: boolean;
  /** 빈 슬롯 누름 (editable=true에서 photoUri 없을 때) */
  onAddPress?: () => void;
  /** 채워진 슬롯의 X 누름 (editable=true에서 photoUri 있을 때) */
  onRemovePress?: () => void;
}

/**
 * 디자인 fidelity가 더 높은 폴라로이드 V2.
 * - PNG 와시테이프 1~2개 (옵션)
 * - 사진 영역 + 빈티지 wash 오버레이
 * - 손글씨 캡션 (살짝 회전)
 * - 우상단 회전 stamp 데이트 (옵션, 캡션과 공존)
 *
 * 데이터 무관 — `photoUri` 또는 `children` 중 하나로 컨텐츠 표시.
 */
export function TapedPolaroidV2({
  width,
  height,
  photoUri,
  children,
  tint,
  caption,
  stampDate,
  rotate,
  tapes = [],
  seed = 'p',
  style,
  theme: t,
  editable = false,
  onAddPress,
  onRemovePress,
}: TapedPolaroidV2Props) {
  const rot = rotate ?? seeded(seed, 6);
  const H = height ?? Math.round(width * 1.18);
  const isEmpty = !photoUri;
  const showAddButton = editable && isEmpty;
  const showRemoveButton = editable && !isEmpty;
  const isVideo = isVideoUri(photoUri);

  return (
    <View
      style={[
        {
          width,
          transform: [{ rotate: `${rot}deg` }],
        },
        styles.container,
        style,
      ]}
    >
      {/* paper */}
      <View
        style={[
          styles.paper,
          {
            paddingBottom: caption ? 28 : 14,
            borderColor: t.line,
          },
        ]}
      >
        {/* photo area */}
        <PhotoArea
          width={width - 16}
          height={H - (caption ? 36 : 22) - 16}
          tint={tint}
          photoUri={photoUri}
          isVideo={isVideo}
          theme={t}
          stampDate={stampDate}
          showAddButton={showAddButton}
          onAddPress={onAddPress}
        >
          {!photoUri && !showAddButton && children}
        </PhotoArea>

        {/* handwritten caption */}
        {caption && (
          <View
            style={[
              styles.captionWrap,
              {
                transform: [
                  { rotate: `${seeded(`${seed}cap`, 3)}deg` },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.captionText,
                {
                  color: t.ink,
                  fontFamily: t.handFont,
                  fontWeight: t.handWeight,
                },
              ]}
              numberOfLines={1}
            >
              {caption}
            </Text>
          </View>
        )}
      </View>

      {/* tapes overlapping the top edge */}
      {tapes.map((tape, i) => {
        const n = tapes.length;
        const tapeWidth = tape.width ?? width * 0.5;
        const x = n === 1 ? width / 2 : (width / (n + 1)) * (i + 1);
        const baseR = seeded(`${seed}tape${i}`, 30);
        return (
          <ImageTape
            key={`${seed}-tape-${i}`}
            id={tape.id}
            width={tapeWidth}
            rotate={baseR + (tape.rotate ?? 0)}
            style={{
              left: x - tapeWidth / 2,
              top: -6 + seeded(`${seed}tapeY${i}`, 4),
              zIndex: 5,
            }}
          />
        );
      })}

      {/* remove X (편집 모드, 사진 채워진 슬롯) */}
      {showRemoveButton && (
        <Pressable
          onPress={onRemovePress}
          hitSlop={6}
          style={[
            styles.removeBtn,
            { backgroundColor: t.accentDeep },
          ]}
        >
          <Icon name="x" size={12} color="#FFFFFF" />
        </Pressable>
      )}
    </View>
  );
}

// ─── Photo Area (with optional empty Pressable) ─────────

function PhotoArea({
  width,
  height,
  tint,
  photoUri,
  isVideo,
  theme: t,
  stampDate,
  showAddButton,
  onAddPress,
  children,
}: {
  width: number;
  height: number;
  tint: string;
  photoUri?: string;
  isVideo: boolean;
  theme: DiaryTheme;
  stampDate?: string;
  showAddButton: boolean;
  onAddPress?: () => void;
  children?: React.ReactNode;
}) {
  const photoStyle = [
    styles.photo,
    {
      backgroundColor: tint,
      width,
      height,
    },
  ];

  // 인라인 컴포넌트 정의는 매 렌더 재생성돼서 Pressable 핸들러가 죽음 → 직접 분기
  const inner = (
    <>
      {photoUri ? (
        isVideo ? (
          <View style={styles.videoPreview}>
            <View style={styles.playBadge}>
              <Icon name="play" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.videoLabel, { fontFamily: t.monoFont }]}>
              VIDEO
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: photoUri }}
            style={styles.photoImage}
            resizeMode="cover"
          />
        )
      ) : showAddButton ? (
        <View style={styles.addSlot}>
          <Icon name="plus" size={26} color={t.accent} />
          <Text
            style={[
              styles.addSlotLabel,
              { color: t.accent, fontFamily: t.monoFont },
            ]}
          >
            TAP
          </Text>
        </View>
      ) : (
        <View style={styles.placeholderWrap}>{children}</View>
      )}
      {/* warm wash — 빈티지/다크 테마이거나 placeholder일 때만. 실제 사진은 clean */}
      {(t.id === 'vintage_film' || t.id === 'dark_academia' || !photoUri) && (
        <View pointerEvents="none" style={styles.wash} />
      )}
      {/* scanlines — 빈티지/픽셀 테마 + placeholder만 (실제 사진 텍스처 가리지 않게) */}
      {(t.id === 'vintage_film' || t.id === 'pixel_retro') && !photoUri && (
        <View pointerEvents="none" style={styles.scanlines} />
      )}
      {/* corner stamp date — placeholder에만 표시 (실제 사진 업로드 시 사진 가리지 않게) */}
      {stampDate && !photoUri && !showAddButton && (
        <View
          style={[styles.cornerStamp, { transform: [{ rotate: '3deg' }] }]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.cornerStampText,
              { fontFamily: t.monoFont },
            ]}
          >
            {stampDate}
          </Text>
        </View>
      )}
    </>
  );

  if (showAddButton) {
    return (
      <Pressable style={photoStyle} onPress={onAddPress}>
        {inner}
      </Pressable>
    );
  }
  return <View style={photoStyle}>{inner}</View>;
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#2E2622',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 0,
    elevation: 3,
  },
  paper: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderWidth: 1,
    position: 'relative',
  },
  photo: {
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoPreview: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(46,38,34,0.82)',
  },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.55)',
  },
  videoLabel: {
    marginTop: 8,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  placeholderWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,220,180,0.18)',
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    shadowColor: 'rgba(46,38,34,0.35)',
    // Inset shadow doesn't exist in RN — emulate with darker top/bottom border
    borderColor: 'rgba(46,38,34,0.18)',
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  cornerStamp: {
    position: 'absolute',
    right: 6,
    top: 6,
    backgroundColor: 'rgba(46,38,34,0.55)',
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  cornerStampText: {
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  captionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    alignItems: 'center',
  },
  captionText: {
    fontSize: 14,
  },
  addSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addSlotLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  removeBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#2E2622',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 2,
  },
});

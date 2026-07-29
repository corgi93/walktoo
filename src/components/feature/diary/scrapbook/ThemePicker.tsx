import React from 'react';
import {
  ActivityIndicator,
  Modal as RNModal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { Icon, Text } from '@/components/base';
import { isThemePackThemeId } from '@/constants/premium';
import { useThemePack } from '@/hooks/useThemePack';
import {
  DIARY_THEME_LIST,
  type DiaryTheme,
  type DiaryThemeId,
} from '@/styles/diaryThemes';
import { theme as appTheme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

import { ImageSticker } from './ImageSticker';
import { ImageTape } from './ImageTape';
import { Sticker } from './Sticker';
import { WashiTape } from './WashiTape';

interface ThemePickerProps {
  open: boolean;
  currentId: DiaryThemeId;
  onPick: (id: DiaryThemeId) => void;
  onClose: () => void;
}

/**
 * 테마 고르기 — 바텀시트 모달.
 * 각 테마 미니 프리뷰 (paper + tape + tints + 액센트 dot) + 라벨.
 *
 * 여행 무드 테마팩(미보유) 테마도 자유롭게 선택해 미리보기할 수 있다.
 * 결제는 저장 시점에만 유도한다 (체험 후 결제). 잠금 배지는 "유료 테마"
 * 표시일 뿐 선택을 막지 않는다.
 */
export function ThemePicker({
  open,
  currentId,
  onPick,
  onClose,
}: ThemePickerProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation(['premium']);
  const { isThemePackEntitled, priceLabel, canPurchase, isPurchasing, purchase } =
    useThemePack();

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + SPACING.lg },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text variant="headingMedium" color="text">
              테마 고르기
            </Text>
            <Text variant="caption" color="textMuted" style={{ marginTop: 2 }}>
              여행지의 무드로 다이어리를 꾸며요
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
          >
            {DIARY_THEME_LIST.map((themeItem) => (
              <ThemeTile
                key={themeItem.id}
                theme={themeItem}
                selected={themeItem.id === currentId}
                locked={!isThemePackEntitled && isThemePackThemeId(themeItem.id)}
                onPress={() => onPick(themeItem.id)}
              />
            ))}
          </ScrollView>

          {!isThemePackEntitled && (
            <View style={styles.packCard}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="bodySmall" color="text" weight="700">
                  {t('premium:theme-pack.title')}
                </Text>
                <Text
                  variant="caption"
                  color="textSecondary"
                  style={{ marginTop: 2 }}
                >
                  {t('premium:theme-pack.description')}
                </Text>
                <Text
                  variant="caption"
                  color="textMuted"
                  style={{ marginTop: 2 }}
                >
                  {t('premium:theme-pack.preview-hint')}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.packBtn,
                  (isPurchasing || !canPurchase) && styles.packBtnDisabled,
                ]}
                onPress={canPurchase ? purchase : undefined}
                disabled={isPurchasing || !canPurchase}
              >
                {isPurchasing ? (
                  <ActivityIndicator
                    size="small"
                    color={appTheme.colors.white}
                  />
                ) : (
                  <Text variant="caption" color="white" weight="700">
                    {canPurchase
                      ? priceLabel
                      : t('premium:theme-pack.coming-soon')}
                  </Text>
                )}
              </Pressable>
            </View>
          )}

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text variant="bodyMedium" color="white" style={{ fontWeight: '700' }}>
              완료
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

// ─── Tile ───────────────────────────────────────────────

function ThemeTile({
  theme: t,
  selected,
  locked,
  onPress,
}: {
  theme: DiaryTheme;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const previewTape = t.imgTapes[0];
  const previewSticker = t.imgStickers[0];

  return (
    <Pressable
      style={[
        styles.tile,
        {
          backgroundColor: t.bg,
          borderColor: selected ? t.accent : t.line,
          borderWidth: selected ? 2.5 : 1.5,
        },
        locked && styles.tileLocked,
      ]}
      onPress={onPress}
    >
      {/* mini preview strip */}
      <View
        style={[
          styles.preview,
          { backgroundColor: t.paper, borderColor: t.line },
        ]}
      >
        {previewTape ? (
          <ImageTape
            id={previewTape}
            width={42}
            height={12}
            rotate={-10}
            opacity={0.98}
            style={{ top: -4, left: 6 }}
          />
        ) : (
          <WashiTape
            width={36}
            height={12}
            rotate={-10}
            color={t.tapes[0].color}
            pattern={t.tapes[0].pattern}
            patternColor={t.tapes[0].patternColor}
            style={{ top: -4, left: 8 }}
          />
        )}
        <View style={styles.swatchRow}>
          {t.tints.slice(0, 4).map((c, i) => (
            <View
              key={i}
              style={[
                styles.swatch,
                { backgroundColor: c, borderColor: t.line },
              ]}
            />
          ))}
        </View>
        <View
          style={[
            styles.accentDot,
            { backgroundColor: t.accent },
          ]}
        />
      </View>

      <Text
        style={[
          styles.tileName,
          {
            color: t.isDark ? t.paper : t.ink,
            fontFamily: t.titleFont,
            fontWeight: t.titleWeight,
            fontStyle:
              t.titleMode === 'italic' ||
              t.titleMode === 'serif' ||
              t.titleMode === 'dark'
                ? 'italic'
                : 'normal',
          },
          t.isDark && {
            backgroundColor: t.ink,
            paddingHorizontal: 6,
            paddingVertical: 2,
            alignSelf: 'flex-start',
          },
        ]}
      >
        {t.emoji} {t.name}
      </Text>
      <Text
        style={[
          styles.tileDesc,
          {
            color: t.isDark ? t.tints[1] : t.inkSoft,
            fontFamily: t.handFont,
          },
        ]}
      >
        {t.desc}
      </Text>

      {/* 잠긴(유료) 테마는 선택 여부와 무관하게 자물쇠 유지 — 선택은 테두리로 표시.
          무료 테마만 선택 시 체크 배지. */}
      {locked ? (
        <View style={styles.lockBadge}>
          <Icon name="lock" size={12} color={appTheme.colors.white} />
        </View>
      ) : selected ? (
        <View style={[styles.checkBadge, { backgroundColor: t.accent }]}>
          <Icon name="check" size={14} color={appTheme.colors.white} />
        </View>
      ) : null}

      {/* 데코 스티커 — 살짝 분위기 보여주기 */}
      {previewSticker ? (
        <ImageSticker
          id={previewSticker}
          size={22}
          rotate={-8}
          style={{ position: 'absolute', top: 6, left: 6 }}
        />
      ) : (
        <Sticker
          kind={t.stickers[0]}
          size={18}
          color={t.accent}
          style={{ position: 'absolute', top: 6, left: 6 }}
        />
      )}
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(44, 44, 46, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: appTheme.colors.surfaceWarm,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: appTheme.colors.gray300,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  header: {
    marginBottom: SPACING.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    paddingBottom: SPACING.md,
  },
  tile: {
    width: '48%',
    padding: SPACING.sm,
    borderRadius: 8,
    minHeight: 130,
    position: 'relative',
  },
  preview: {
    height: 56,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  swatchRow: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    gap: 3,
  },
  swatch: {
    width: 10,
    height: 10,
    borderWidth: 1,
  },
  accentDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  tileName: {
    fontSize: 13,
    lineHeight: 16,
  },
  tileDesc: {
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLocked: {
    opacity: 0.72,
  },
  lockBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appTheme.colors.text,
  },
  packCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.primarySurface,
  },
  packBtn: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    minWidth: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: appTheme.colors.primary,
    borderWidth: 1.5,
    borderColor: appTheme.colors.border,
  },
  packBtnDisabled: {
    opacity: 0.55,
  },
  doneBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: appTheme.colors.text,
    borderRadius: 8,
    alignItems: 'center',
  },
});

import React from 'react';
import { StyleProp, StyleSheet, TextInput, View, ViewStyle } from 'react-native';

import type { DiaryTheme } from '@/styles/diaryThemes';

interface ThemedHandwriteInputProps {
  theme: DiaryTheme;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  /** 멀티라인 — 기본 true */
  multiline?: boolean;
  /** 최소 줄 수 — minHeight 계산용 */
  minLines?: number;
  /** 최대 글자 수 */
  maxLength?: number;
}

/**
 * 손글씨 톤 textarea.
 * - y2k_pastel/pixel_retro/dreamy_cloud: 노트선(repeating 가로선) 배경
 * - vintage_film/grid_minimal/dark_academia: 깔끔
 *
 * 데이터: value/onChangeText props만. 기존 폼 state 그대로 연결.
 */
export function ThemedHandwriteInput({
  theme: t,
  value,
  onChangeText,
  placeholder,
  style,
  multiline = true,
  minLines = 3,
  maxLength,
}: ThemedHandwriteInputProps) {
  const lined =
    t.id === 'y2k_pastel' ||
    t.id === 'pixel_retro' ||
    t.id === 'dreamy_cloud';

  const lineHeight = 24;
  const minHeight = lineHeight * minLines + 8;

  return (
    <View
      style={[
        styles.wrap,
        {
          minHeight,
          borderColor: lined ? 'transparent' : t.line,
          borderWidth: t.id === 'grid_minimal' ? 1 : 0,
          backgroundColor: 'transparent',
        },
        style,
      ]}
    >
      {lined && <Lines color={t.line} lineHeight={lineHeight} count={minLines + 2} />}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.inkSoft}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical="top"
        style={[
          styles.input,
          {
            fontFamily: t.handFont,
            fontWeight: t.handWeight,
            color: t.ink,
            lineHeight,
          },
        ]}
      />
    </View>
  );
}

// ─── Lined Background ───────────────────────────────────

function Lines({
  color,
  lineHeight,
  count,
}: {
  color: string;
  lineHeight: number;
  count: number;
}) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lineHeight * (i + 1) - 1,
            height: 1,
            backgroundColor: color,
            opacity: 0.55,
          }}
        />
      ))}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 4,
    paddingTop: 2,
    paddingBottom: 4,
    position: 'relative',
  },
  input: {
    fontSize: 16,
    padding: 0,
    margin: 0,
  },
});

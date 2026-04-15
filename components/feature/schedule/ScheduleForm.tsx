import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

import { Box, Button, Icon, Row, Text } from '@/components/base';
import { SimpleDatePicker } from '@/components/base/SimpleDatePicker';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';
import type { CoupleSchedule, ScheduleCategory } from '@/types/schedule';
import { formatDate, parseLocalDate } from '@/utils/date';

import { ScheduleCategoryPicker } from './ScheduleCategoryPicker';

// ─── Types ──────────────────────────────────────────────

export interface ScheduleFormResult {
  title: string;
  date: string;
  category: ScheduleCategory;
  note: string;
}

interface ScheduleFormProps {
  /** 편집 모드일 때 초기값 + 삭제 버튼 노출 */
  initial?: CoupleSchedule;
  /** 새로 만들 때 기본 선택 날짜 (YYYY-MM-DD) */
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (result: ScheduleFormResult) => void;
  onDelete?: () => void;
  /** 저장 중 비활성화 */
  submitting?: boolean;
  /** 본인이 만든 일정인지 (수정/삭제 권한) */
  canEdit?: boolean;
}

// ─── Component ──────────────────────────────────────────

/**
 * 일정 생성/수정 폼 (중앙 모달).
 * Toss 스타일: 입력 → 카테고리 → 날짜 → 메모 (선택) → 저장.
 */
export function ScheduleForm({
  initial,
  defaultDate,
  onClose,
  onSubmit,
  onDelete,
  submitting = false,
  canEdit = true,
}: ScheduleFormProps) {
  const { t } = useTranslation('schedule');
  const isEdit = !!initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [category, setCategory] = useState<ScheduleCategory>(
    initial?.category ?? 'other',
  );
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const disabled = !canEdit;
  const canSubmit =
    canEdit && title.trim().length > 0 && date.length === 10 && !submitting;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      date,
      category,
      note: note.trim(),
    });
  };

  const prettyDate = date
    ? formatDate(parseLocalDate(date), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      })
    : t('form.pick-date');

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.kbd}
      >
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* 헤더 */}
          <Row style={styles.header}>
            <Text variant="headingSmall">
              {isEdit ? t('form.edit-title') : t('form.create-title')}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Icon name="x" size={20} color={theme.colors.gray500} />
            </Pressable>
          </Row>

          {!canEdit && (
            <Box style={styles.readonlyBanner}>
              <Text variant="caption" color="textSecondary">
                {t('form.readonly-notice')}
              </Text>
            </Box>
          )}

          {/* 제목 */}
          <View style={styles.field}>
            <Text variant="label" color="textSecondary" mb="xs">
              {t('form.label.title')}
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('form.placeholder.title')}
              placeholderTextColor={theme.colors.gray400}
              maxLength={60}
              editable={!disabled}
              style={styles.input}
            />
          </View>

          {/* 카테고리 */}
          <View style={styles.field}>
            <Text variant="label" color="textSecondary" mb="xs">
              {t('form.label.category')}
            </Text>
            <ScheduleCategoryPicker value={category} onChange={setCategory} />
          </View>

          {/* 날짜 */}
          <View style={styles.field}>
            <Text variant="label" color="textSecondary" mb="xs">
              {t('form.label.date')}
            </Text>
            <Pressable
              onPress={() => !disabled && setShowDatePicker(true)}
              style={[styles.dateButton, disabled && styles.dateButtonDisabled]}
            >
              <Icon
                name="calendar"
                size={16}
                color={
                  date ? theme.colors.primary : theme.colors.gray400
                }
              />
              <Text
                variant="bodySmall"
                ml="sm"
                style={{
                  color: date ? theme.colors.text : theme.colors.gray400,
                  flex: 1,
                }}
              >
                {prettyDate}
              </Text>
              <Icon
                name="chevron-right"
                size={14}
                color={theme.colors.gray400}
              />
            </Pressable>
          </View>

          {/* 메모 */}
          <View style={styles.field}>
            <Text variant="label" color="textSecondary" mb="xs">
              {t('form.label.note')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('form.placeholder.note')}
              placeholderTextColor={theme.colors.gray400}
              multiline
              maxLength={300}
              editable={!disabled}
              style={[styles.input, styles.noteInput]}
            />
          </View>

          {/* 액션 */}
          <Row style={styles.actions}>
            {isEdit && canEdit && onDelete && (
              <Pressable
                onPress={onDelete}
                hitSlop={8}
                disabled={submitting}
                style={styles.deleteButton}
              >
                <Icon name="x" size={14} color={theme.colors.error} />
                <Text
                  variant="bodySmall"
                  ml="xxs"
                  style={{ color: theme.colors.error }}
                >
                  {t('form.delete')}
                </Text>
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={styles.cancelButton}
            >
              <Text variant="bodySmall" color="textSecondary">
                {t('form.cancel')}
              </Text>
            </Pressable>
            {canEdit && (
              <Button
                onPress={handleSubmit}
                disabled={!canSubmit}
                loading={submitting}
                size="small"
                variant="primary"
                fullWidth={false}
              >
                {t('form.save')}
              </Button>
            )}
          </Row>
        </Pressable>
      </KeyboardAvoidingView>

      {showDatePicker && (
        <SimpleDatePicker
          currentDate={date || undefined}
          onSave={(d) => {
            setDate(d);
            setShowDatePicker(false);
          }}
          onClose={() => setShowDatePicker(false)}
          title={t('form.pick-date')}
        />
      )}
    </Pressable>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(44, 44, 46, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 80,
  },
  kbd: {
    width: '90%',
    maxWidth: 440,
  },
  modal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 20,
    width: '100%',
    ...theme.pixel.borderThin,
    ...theme.shadows.card,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  readonlyBanner: {
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.sm,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  field: {
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceWarm,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
  },
  dateButtonDisabled: {
    opacity: 0.5,
  },
  actions: {
    marginTop: SPACING.sm,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
});

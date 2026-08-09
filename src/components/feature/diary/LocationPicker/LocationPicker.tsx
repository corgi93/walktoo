import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Row, Text } from '@/components/base';
import { MapPickerView } from '@/components/feature/diary/LocationPicker/MapPickerView';
import { useKeyboardBottomInset } from '@/hooks/useKeyboardBottomInset';
import { useLocationSearch } from '@/hooks/useLocationSearch';
import {
  selectLocationProvider,
  type Coords,
  type PickedLocation,
  type Place,
} from '@/lib/location';
import { theme } from '@/styles/theme';
import { SPACING } from '@/styles/type';

const NAVER_MAP_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_MAP_CLIENT_ID;
const HAS_WEB_NAVER_MAP = !!NAVER_MAP_CLIENT_ID;

interface LocationPickerProps {
  open: boolean;
  /** 초기값 — 이미 입력된 텍스트가 있으면 검색창 prefill */
  initialQuery?: string;
  /** 사용자가 결과를 선택했을 때 — name + coords 같이 받음 */
  onPick: (location: PickedLocation) => void;
  /** 사용자가 그냥 텍스트로만 입력하고 싶을 때 (좌표 없이) */
  onPickPlainText?: (name: string) => void;
  onClose: () => void;
}

/**
 * 장소 선택 바텀시트.
 * - 검색어 입력 → 디바운스 → provider(naver/google) 검색
 * - 결과 리스트에서 선택 → onPick(name + coords + address)
 * - "검색 안 하고 직접 입력" 옵션도 제공 (onPickPlainText)
 *
 * 지도 미리보기 / 핀 드롭은 WebView 기반 네이버 지도에서 처리.
 */
export function LocationPicker({
  open,
  initialQuery = '',
  onPick,
  onPickPlainText,
  onClose,
}: LocationPickerProps) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(initialQuery);
  const [pendingPick, setPendingPick] = useState<PickedLocation | null>(null);
  const { results, isSearching, error, providerId } = useLocationSearch(query);
  const keyboardBottomInset = useKeyboardBottomInset(SPACING.lg);

  const handleSelectFromList = (p: Place) => {
    const picked: PickedLocation = {
      name: p.name,
      coords: p.coords,
      address: p.address,
      source: p.source,
    };
    if (HAS_WEB_NAVER_MAP) {
      setPendingPick(picked);
    } else {
      onPick(picked);
      onClose();
    }
  };

  const handleMapTap = async (coords: Coords) => {
    // 사용자가 지도에서 핀 직접 떨어뜨림 → reverse geocode로 주소 채우기
    const provider = selectLocationProvider();
    try {
      const place = await provider.reverseGeocode(coords);
      setPendingPick({
        name: place?.address || pendingPick?.name || '직접 선택한 위치',
        coords,
        address: place?.address,
        source: place?.source ?? provider.id,
      });
    } catch {
      // 역지오코딩 실패 시 좌표만 보존
      setPendingPick({
        name: pendingPick?.name || '직접 선택한 위치',
        coords,
        source: provider.id,
      });
    }
  };

  const handleConfirm = () => {
    if (!pendingPick) return;
    onPick(pendingPick);
    setPendingPick(null);
    onClose();
  };

  const handleCancelPending = () => setPendingPick(null);

  const handlePlainText = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (onPickPlainText) onPickPlainText(trimmed);
    else onPick({ name: trimmed });
    onClose();
  };

  return (
    <RNModal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={[
          styles.container,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <Row px="lg" style={styles.header}>
          <Pressable
            onPress={pendingPick ? handleCancelPending : onClose}
            hitSlop={8}
          >
            <Icon
              name={pendingPick ? 'arrow-left' : 'x'}
              size={22}
              color={theme.colors.text}
            />
          </Pressable>
          <Text variant="headingMedium" ml="md">
            {pendingPick ? '위치 확인' : '장소 선택'}
          </Text>
        </Row>

        {/* 지도 미리보기 단계 — 검색 결과 선택 후 / 핀 드롭 가능 */}
        {pendingPick && (
          <View style={styles.mapStage}>
            <MapPickerView
              coords={pendingPick.coords}
              onMapTap={handleMapTap}
              height={280}
            />
            <View style={styles.pendingInfo}>
              <Icon name="map-pin" size={16} color={theme.colors.primary} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text variant="bodyMedium" color="text" numberOfLines={1}>
                  {pendingPick.name}
                </Text>
                {pendingPick.address && (
                  <Text variant="caption" color="textMuted" numberOfLines={1}>
                    {pendingPick.address}
                  </Text>
                )}
                <Text
                  variant="caption"
                  color="textMuted"
                  style={{ marginTop: 2 }}
                >
                  지도를 누르면 위치를 직접 옮길 수 있어요
                </Text>
              </View>
            </View>
            <Pressable
              style={[
                styles.confirmBtn,
                { paddingBottom: SPACING.md + insets.bottom },
              ]}
              onPress={handleConfirm}
            >
              <Text variant="bodyMedium" color="white" style={{ fontWeight: '700' }}>
                이 위치로 저장
              </Text>
            </Pressable>
          </View>
        )}

        {/* 검색 단계 — pendingPick 없을 때만 노출 */}
        {!pendingPick && (
          <>

        {/* 검색창 */}
        <View style={styles.searchBoxWrap}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={theme.colors.gray500} />
            <TextInput
              style={styles.searchInput}
              placeholder="장소 검색 (예: 한강공원, 라디오비숍)"
              placeholderTextColor={theme.colors.gray400}
              value={query}
              onChangeText={setQuery}
              autoFocus
              cursorColor={theme.colors.primary}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={6}>
                <Icon name="x" size={14} color={theme.colors.gray500} />
              </Pressable>
            )}
          </View>
        </View>

        {/* attribution */}
        <Row px="lg" style={styles.attribution}>
          <Text variant="caption" color="textMuted">
            {providerId === 'naver' ? '· 네이버 지역검색' : '· Google Places'}
          </Text>
        </Row>

        {/* 결과 영역 */}
        {error ? (
          <View style={styles.errorBox}>
            <Text variant="bodySmall" color="error" align="center">
              {error}
            </Text>
            {query.trim().length > 0 && (
              <Pressable
                style={[styles.plainTextBtn, { marginTop: SPACING.md }]}
                onPress={handlePlainText}
              >
                <Text variant="bodySmall" color="primary">
                  「{query.trim()}」 그대로 사용
                </Text>
              </Pressable>
            )}
          </View>
        ) : isSearching ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(p) => p.id}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              query.trim().length === 0 ? (
                <EmptyHint />
              ) : (
                <NoResults onUseQuery={handlePlainText} query={query} />
              )
            }
            renderItem={({ item }) => (
              <PlaceRow place={item} onPress={() => handleSelectFromList(item)} />
            )}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: SPACING.lg + keyboardBottomInset },
            ]}
          />
        )}

        {/* 직접 입력 fallback (검색 결과가 있어도 노출) */}
        {results.length > 0 && query.trim().length > 0 && (
          <Pressable
            style={[
              styles.plainTextCta,
              {
                paddingBottom:
                  SPACING.md + insets.bottom + (keyboardBottomInset ? SPACING.lg : 0),
              },
            ]}
            onPress={handlePlainText}
          >
            <Icon name="edit" size={14} color={theme.colors.primary} />
            <Text variant="bodySmall" color="primary" ml="xs">
              「{query.trim()}」 그대로 사용
            </Text>
          </Pressable>
        )}
          </>
        )}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

// ─── Sub Components ─────────────────────────────────────

function PlaceRow({ place, onPress }: { place: Place; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon name="map-pin" size={16} color={theme.colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium" color="text" numberOfLines={1}>
          {place.name}
        </Text>
        <Text variant="caption" color="textMuted" numberOfLines={1}>
          {place.address}
        </Text>
        {place.category && (
          <Text variant="caption" color="primary" style={{ marginTop: 1 }}>
            {place.category}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function EmptyHint() {
  return (
    <View style={styles.hintBox}>
      <Text variant="bodySmall" color="textMuted" align="center">
        장소명, 도로명 주소, 지번을 입력해보세요
      </Text>
    </View>
  );
}

function NoResults({
  query,
  onUseQuery,
}: {
  query: string;
  onUseQuery: () => void;
}) {
  return (
    <View style={styles.hintBox}>
      <Text variant="bodySmall" color="textMuted" align="center" mb="md">
        검색 결과가 없어요
      </Text>
      <Pressable style={styles.plainTextBtn} onPress={onUseQuery}>
        <Text variant="bodySmall" color="primary">
          「{query.trim()}」 그대로 사용
        </Text>
      </Pressable>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  searchBoxWrap: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray100,
    borderRadius: theme.radius.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
  },
  attribution: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  errorBox: {
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  loadingBox: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray100,
    gap: SPACING.md,
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  hintBox: {
    paddingVertical: SPACING.xxxl,
    alignItems: 'center',
  },
  plainTextBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    backgroundColor: theme.colors.primarySurface,
  },
  plainTextCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: theme.colors.primarySurface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.primaryLight,
  },
  mapStage: {
    flex: 1,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    backgroundColor: theme.colors.primarySurface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  confirmBtn: {
    marginTop: 'auto',
    paddingVertical: SPACING.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

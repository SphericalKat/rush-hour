import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { fetchStations } from '../api/lines';
import type { Station } from '../api/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  visible: boolean;
  selected: Station | null;
  onSelect: (s: Station) => void;
  onClose: () => void;
}

export function StationPicker({ visible, selected, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setLoading(true);
      fetchStations()
        .then(setStations)
        .catch(() => {})
        .finally(() => setLoading(false));
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return stations;
    const q = query.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q),
    );
  }, [stations, query]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.38}
      />
    ),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Station }) => {
      const active = selected?.id === item.id;
      return (
        <Pressable
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: active
                ? colors.primaryMuted
                : pressed
                  ? colors.surfaceSecondary
                  : colors.surface,
              borderColor: active ? colors.primary : colors.border,
            },
          ]}
          hitSlop={2}
          onPress={() => {
            onSelect(item);
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Select station ${item.name}`}
          accessibilityState={{ selected: active }}
        >
          <View style={styles.rowContent}>
            <Text
              style={[
                styles.stationName,
                { color: active ? colors.primary : colors.text },
                active && { fontWeight: '700' },
              ]}
            >
              {item.name}
            </Text>
            {item.code ? (
              <View style={[styles.codePill, { backgroundColor: colors.surfaceSecondary }]}>
                <Text style={[styles.stationCode, { color: colors.textSecondary }]}>
                  {item.code}
                </Text>
              </View>
            ) : null}
          </View>
          <View
            style={[
              styles.checkContainer,
              {
                backgroundColor: active ? colors.primary : 'transparent',
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
          >
            {active ? (
              <Ionicons name="checkmark" size={14} color={colors.textOnPrimary} />
            ) : null}
          </View>
        </Pressable>
      );
    },
    [selected, colors, onSelect, onClose],
  );

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['84%']}
      enableDynamicSizing={false}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backgroundStyle={[
        styles.sheetBackground,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
      handleIndicatorStyle={[styles.handle, { backgroundColor: colors.separator }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Select Station
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={12} style={styles.cancelBtn}>
          <Text style={[styles.cancel, { color: colors.primary }]}>Cancel</Text>
        </Pressable>
      </View>

      {/* Search */}
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search" size={16} color={colors.textSecondary} />
        <BottomSheetTextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search stations"
          placeholderTextColor={colors.textTertiary}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 ? (
          <Pressable
            onPress={() => setQuery('')}
            hitSlop={8}
            style={[styles.clearBtn, { backgroundColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Clear search query"
          >
            <Ionicons name="close" size={12} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
          <Text style={[styles.loadingLabel, { color: colors.textSecondary }]}>
            Loading stations...
          </Text>
        </View>
      ) : (
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(s: Station) => String(s.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No stations match your search
            </Text>
          }
        />
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
  },
  handle: {
    width: 44,
    height: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  cancel: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchRow: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 6,
  },
  searchInput: {
    fontSize: 16,
    flex: 1,
    paddingVertical: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    marginTop: 40,
    alignItems: 'center',
    gap: 8,
  },
  loadingLabel: {
    fontSize: 14,
  },
  spinner: {
    marginTop: 0,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '500',
    flexShrink: 1,
  },
  codePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stationCode: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  checkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 56,
    fontSize: 15,
  },
});

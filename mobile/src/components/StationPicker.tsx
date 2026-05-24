import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useDeferredValue, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  type TextInput,
  Vibration,
  View,
} from 'react-native';
import { Text } from './Text';
import { useSQLiteContext } from 'expo-sqlite';
import { listStations } from '../db/queries';
import type { Station } from '../api/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  selected: Station | null;
  onSelect: (s: Station) => void;
  title?: string;
}

export interface StationPickerRef {
  present: () => void;
  dismiss: () => void;
}

interface StationRowProps {
  item: Station;
  active: boolean;
  onSelect: (s: Station) => void;
  onHaptic: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

const StationRow = React.memo(function StationRow({ item, active, onSelect, onHaptic, colors }: StationRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: active ? colors.primaryMuted : colors.surface,
          borderColor: active ? colors.primary : colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
      onPress={() => {
        onHaptic();
        onSelect(item);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Select station ${item.name}`}
      accessibilityState={{ selected: active }}
    >
      <View
        style={[
          styles.rowAccent,
          { backgroundColor: active ? colors.primary : 'transparent' },
        ]}
      />
      <View style={styles.rowMain}>
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
        {active ? (
          <View style={[styles.currentPill, { backgroundColor: colors.primary }]}>
            <Text style={[styles.currentPillLabel, { color: colors.textOnPrimary }]}>
              Current
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

const StationSkeletonRows = React.memo(function StationSkeletonRows({
  colors,
}: {
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={styles.skeletonList} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: 8 }, (_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonRow,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.skeletonAccent, { backgroundColor: colors.surfaceSecondary }]} />
          <View style={styles.skeletonMain}>
            <View style={styles.skeletonTextGroup}>
              <View
                style={[
                  styles.skeletonName,
                  { backgroundColor: colors.surfaceSecondary },
                  index % 3 === 1 && styles.skeletonNameShort,
                ]}
              />
              <View style={[styles.skeletonCode, { backgroundColor: colors.surfaceSecondary }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
});

export const StationPicker = React.forwardRef<StationPickerRef, Props>(function StationPicker(
  { selected, onSelect, title = 'Select Station' },
  ref,
) {
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [stations, setStations] = useState<Station[]>([]);
  const [listReady, setListReady] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const inputRef = useRef<TextInput>(null);
  const hapticsRef = useRef<{ selectionAsync?: () => Promise<void> } | null>(null);
  const snapPoints = useMemo(() => ['84%'], []);

  // Load stations once from local DB — fast enough to not need a loader
  useEffect(() => {
    listStations(db).then(setStations).catch(() => {});
  }, [db]);

  useImperativeHandle(
    ref,
    () => ({
      present: () => {
        bottomSheetRef.current?.present();
      },
      dismiss: () => {
        Keyboard.dismiss();
        bottomSheetRef.current?.close();
      },
    }),
    [],
  );

  const filtered = useMemo(() => {
    if (!deferredQuery.trim()) return stations;
    const q = deferredQuery.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code?.toLowerCase().includes(q),
    );
  }, [stations, deferredQuery]);

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
        <StationRow
          item={item}
          active={active}
          onSelect={(s) => {
            Keyboard.dismiss();
            onSelect(s);
            bottomSheetRef.current?.close();
          }}
          onHaptic={() => {
            try {
              if (!hapticsRef.current) {
                // Optional module in this project; fallback keeps interaction tactile.
                hapticsRef.current = require('expo-haptics');
              }
              hapticsRef.current?.selectionAsync?.();
            } catch {
              if (Platform.OS !== 'web') {
                Vibration.vibrate(8);
              }
            }
          }}
          colors={colors}
        />
      );
    },
    [selected, colors, onSelect],
  );

  const handleSheetChange = useCallback((index: number) => {
    if (index >= 0) {
      setListReady(true);
      return;
    }

    setQuery('');
    inputRef.current?.clear();
  }, []);

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      enableDismissOnClose={false}
      enablePanDownToClose
      onChange={handleSheetChange}
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
            {title}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            bottomSheetRef.current?.close();
          }}
          hitSlop={12}
          style={styles.cancelBtn}
        >
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
          ref={inputRef as React.RefObject<any>}
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
            onPress={() => { setQuery(''); inputRef.current?.clear(); }}
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
      {listReady ? (
        <BottomSheetFlatList
          data={filtered}
          keyExtractor={(s: Station) => String(s.id)}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={renderItem}
          removeClippedSubviews
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No stations match your search
            </Text>
          }
        />
      ) : (
        <StationSkeletonRows colors={colors} />
      )}
    </BottomSheetModal>
  );
});

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
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 8,
  },
  row: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  currentPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 56,
    fontSize: 15,
  },
  skeletonList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
    gap: 8,
  },
  skeletonRow: {
    position: 'relative',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  skeletonAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  skeletonMain: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  skeletonTextGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonName: {
    width: '58%',
    height: 16,
    borderRadius: 8,
  },
  skeletonNameShort: {
    width: '44%',
  },
  skeletonCode: {
    width: 42,
    height: 18,
    borderRadius: 9,
  },
});

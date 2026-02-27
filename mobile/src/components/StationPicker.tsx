import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchStations } from '../api/lines';
import type { Station } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { shadow } from '../theme';

interface Props {
  visible: boolean;
  selected: Station | null;
  onSelect: (s: Station) => void;
  onClose: () => void;
}

export function StationPicker({ visible, selected, onSelect, onClose }: Props) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setQuery('');
    fetchStations()
      .then(setStations)
      .catch(() => {})
      .finally(() => setLoading(false));
    // auto-focus after modal transition
    setTimeout(() => inputRef.current?.focus(), 300);
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Handle */}
        <View style={styles.handleRow}>
          <View
            style={[styles.handle, { backgroundColor: colors.separator }]}
          />
        </View>

        {/* Header */}
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.separator },
          ]}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Select Station
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.cancel, { color: colors.primary }]}>
              Cancel
            </Text>
          </Pressable>
        </View>

        {/* Search */}
        <View
          style={[
            styles.searchRow,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search stations…"
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* List */}
        {loading ? (
          <ActivityIndicator
            style={styles.spinner}
            color={colors.primary}
          />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(s) => String(s.id)}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ItemSeparatorComponent={() => (
              <View
                style={[
                  styles.separator,
                  { backgroundColor: colors.separator },
                ]}
              />
            )}
            renderItem={({ item }) => {
              const active = selected?.id === item.id;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? colors.surfaceSecondary : colors.surface },
                  ]}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.rowContent}>
                    <Text
                      style={[
                        styles.stationName,
                        { color: active ? colors.primary : colors.text },
                        active && { fontWeight: '600' },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.code ? (
                      <Text
                        style={[
                          styles.stationCode,
                          { color: colors.textTertiary },
                        ]}
                      >
                        {item.code}
                      </Text>
                    ) : null}
                  </View>
                  {active && (
                    <Text style={[styles.checkmark, { color: colors.primary }]}>
                      ✓
                    </Text>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text
                style={[styles.emptyText, { color: colors.textSecondary }]}
              >
                No stations found
              </Text>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancel: {
    fontSize: 17,
  },
  searchRow: {
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 4,
  },
  searchInput: {
    fontSize: 16,
  },
  spinner: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationName: {
    fontSize: 16,
    fontWeight: '400',
  },
  stationCode: {
    fontSize: 12,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});

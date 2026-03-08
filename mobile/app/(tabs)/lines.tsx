import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchLines } from '../../src/api/lines';
import type { Line } from '../../src/api/types';
import { LineChip } from '../../src/components/LineChip';
import { useTheme } from '../../src/hooks/useTheme';
import { shadow } from '../../src/theme';

const TYPE_LABEL: Record<string, string> = {
  suburban_rail: 'Suburban Rail',
  metro: 'Metro',
  bus: 'Bus',
};

export default function LinesScreen() {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLines()
      .then(setLines)
      .catch((e) => setError(e instanceof Error ? e.message : 'Error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.danger }]}>
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Custom large title header */}
      <View
        style={[
          styles.navHeader,
          {
            backgroundColor: colors.surface,
            paddingTop: insets.top,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.navTitle, { color: colors.text }]}>Lines</Text>
      </View>

      <FlatList
        data={lines}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 16 },
        ]}
        ItemSeparatorComponent={() => (
          <View
            style={[styles.separator, { backgroundColor: colors.separator }]}
          />
        )}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                ...shadow(1),
              },
            ]}
          >
            <View style={styles.cardRow}>
              <View style={styles.cardMain}>
                <Text style={[styles.lineName, { color: colors.text }]}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.lineType, { color: colors.textSecondary }]}
                >
                  {TYPE_LABEL[item.type] ?? item.type}
                </Text>
              </View>
              <LineChip shortName={item.short_name} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textSecondary }]}>
            No lines available
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: Platform.OS === 'android' ? 12 : 6,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMain: {
    flex: 1,
    gap: 3,
    marginRight: 12,
  },
  lineName: {
    fontSize: 16,
    fontWeight: '600',
  },
  lineType: {
    fontSize: 13,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  errorText: {
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
});

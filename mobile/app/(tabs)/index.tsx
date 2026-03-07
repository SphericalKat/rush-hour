import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Station } from '../../src/api/types';
import { DepartureCard } from '../../src/components/DepartureCard';
import { EmptyState } from '../../src/components/EmptyState';
import { StationPicker } from '../../src/components/StationPicker';
import { useDepartures } from '../../src/hooks/useDepartures';
import { useLiveTrains } from '../../src/hooks/useLiveTrains';
import { useTheme } from '../../src/hooks/useTheme';

export default function DeparturesScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [station, setStation] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [filterFast, setFilterFast] = useState(false);
  const [filterAC, setFilterAC] = useState(false);

  const { data, loading, error, refresh } = useDepartures(
    station?.id ?? null,
    destination?.id,
  );
  const liveTrains = useLiveTrains();
  const filteredData = data.filter(d => {
    if (filterFast && !d.is_fast) return false;
    if (filterAC && !d.is_ac) return false;
    return true;
  });

  const stationFieldText = station ? station.name : 'From';
  const destFieldText = destination ? destination.name : 'To (any)';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.headerBlock,
          {
            backgroundColor: colors.primary,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={styles.navTitle}>Rush Hour</Text>

        <View style={styles.stationRow}>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[
              styles.stationChip,
              station
                ? { backgroundColor: 'rgba(255,255,255,0.95)' }
                : { backgroundColor: 'rgba(255,255,255,0.2)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={station ? `Change station, current ${station.name}` : 'Select station'}
          >
            <Text
              style={[
                styles.stationLabel,
                { color: station ? colors.primary : 'rgba(255,255,255,0.8)' },
              ]}
              numberOfLines={1}
            >
              {stationFieldText}
            </Text>
          </Pressable>

          <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.5)" />

          <Pressable
            onPress={() => setDestPickerOpen(true)}
            style={[
              styles.stationChip,
              destination
                ? { backgroundColor: 'rgba(255,255,255,0.95)' }
                : { backgroundColor: 'rgba(255,255,255,0.2)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={destination ? `Change destination, current ${destination.name}` : 'Select destination'}
          >
            <Text
              style={[
                styles.stationLabel,
                { color: destination ? colors.primary : 'rgba(255,255,255,0.8)' },
              ]}
              numberOfLines={1}
            >
              {destFieldText}
            </Text>
          </Pressable>

          {destination ? (
            <Pressable
              onPress={() => setDestination(null)}
              style={styles.clearDest}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear destination filter"
            >
              <Ionicons name="close" size={14} color="rgba(255,255,255,0.8)" />
            </Pressable>
          ) : null}
        </View>

        {station && (
          <View style={styles.filterRow}>
            <Pressable
              onPress={() => setFilterFast(f => !f)}
              style={[
                styles.filterChip,
                filterFast
                  ? { backgroundColor: 'rgba(255,255,255,0.95)' }
                  : { backgroundColor: 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Text style={[styles.filterLabel, { color: filterFast ? colors.primary : 'rgba(255,255,255,0.8)' }]}>
                Fast
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterAC(f => !f)}
              style={[
                styles.filterChip,
                filterAC
                  ? { backgroundColor: 'rgba(255,255,255,0.95)' }
                  : { backgroundColor: 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Text style={[styles.filterLabel, { color: filterAC ? colors.primary : 'rgba(255,255,255,0.8)' }]}>
                AC
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Departure list */}
      {!station ? (
        <EmptyState
          icon="🚉"
          title="Pick a station"
          subtitle="Tap above to choose a station and see upcoming departures."
        />
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load departures"
          subtitle={error}
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(d) => `${d.number}-${d.departure}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.base },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={loading && data.length > 0}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: colors.textTertiary }]}>
                Departures
              </Text>
              {loading && data.length === 0 ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                  {`${filteredData.length} train${filteredData.length === 1 ? '' : 's'}`}
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="😴"
                title="No upcoming trains"
                subtitle="Try a different destination or check back later."
              />
            ) : null
          }
          renderItem={({ item }) => (
            <DepartureCard
              item={item}
              liveStatus={liveTrains[item.number]}
              onPress={() =>
                router.push({
                  pathname: '/train/[number]',
                  params: { number: item.number, station: station.name, origin: item.origin, destination: item.destination },
                })
              }
            />
          )}
        />
      )}

      <StationPicker
        visible={pickerOpen}
        selected={station}
        onSelect={setStation}
        onClose={() => setPickerOpen(false)}
      />
      <StationPicker
        visible={destPickerOpen}
        selected={destination}
        onSelect={setDestination}
        onClose={() => setDestPickerOpen(false)}
        title="Select Destination"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 10,
    color: '#FFFFFF',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stationChip: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  stationLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  clearDest: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  listContent: {
    paddingTop: 8,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  listTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  listMeta: {
    fontSize: 12,
  },
});

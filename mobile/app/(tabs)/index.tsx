import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Direction, Station } from '../../src/api/types';
import { DepartureCard } from '../../src/components/DepartureCard';
import { DirectionToggle } from '../../src/components/DirectionToggle';
import { EmptyState } from '../../src/components/EmptyState';
import { StationPicker } from '../../src/components/StationPicker';
import { useDepartures } from '../../src/hooks/useDepartures';
import { useTheme } from '../../src/hooks/useTheme';

export default function DeparturesScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [station, setStation] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [direction, setDirection] = useState<Direction>('down');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [destPickerOpen, setDestPickerOpen] = useState(false);

  const { data, loading, error, refresh } = useDepartures(
    station?.id ?? null,
    direction,
    90,
    destination?.id,
  );
  const stationFieldText = station ? station.name : 'Search stations';
  const stationFieldSubtext = station?.code ? `Code ${station.code}` : 'Tap to choose your departure station';
  const destFieldText = destination ? destination.name : 'Any destination';
  const destFieldSubtext = destination?.code ? `Code ${destination.code}` : 'Tap to filter by destination';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Custom header */}
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
        <Text style={[styles.navTitle, { color: colors.text }]}>
          Rush Hour
        </Text>
        <Text style={[styles.navSubtitle, { color: colors.textSecondary }]}>
          Live suburban departures
        </Text>
      </View>

      {/* Station picker button */}
      <View
        style={[
          styles.stationBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.stationPrompt, { color: colors.textSecondary }]}>
          From station
        </Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.stationButton,
            {
              backgroundColor: pressed
                ? colors.primaryMuted
                : colors.surfaceSecondary,
              borderColor: station ? colors.primary : colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={station ? `Change station, current ${station.name}` : 'Select station'}
        >
          <Ionicons
            name={station ? 'location' : 'search-outline'}
            size={18}
            color={station ? colors.primary : colors.textSecondary}
          />
          <View style={styles.stationTextGroup}>
            <Text
              style={[
                styles.stationLabel,
                { color: station ? colors.text : colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {stationFieldText}
            </Text>
            <Text
              style={[styles.stationSubtext, { color: colors.textTertiary }]}
              numberOfLines={1}
            >
              {stationFieldSubtext}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>

      {/* Destination picker button */}
      <View
        style={[
          styles.stationBar,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.stationPrompt, { color: colors.textSecondary }]}>
          To station
        </Text>
        <View style={styles.destRow}>
          <Pressable
            onPress={() => setDestPickerOpen(true)}
            style={({ pressed }) => [
              styles.stationButton,
              styles.destButton,
              {
                backgroundColor: pressed
                  ? colors.primaryMuted
                  : colors.surfaceSecondary,
                borderColor: destination ? colors.primary : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={destination ? `Change destination, current ${destination.name}` : 'Select destination'}
          >
            <Ionicons
              name={destination ? 'navigate' : 'search-outline'}
              size={18}
              color={destination ? colors.primary : colors.textSecondary}
            />
            <View style={styles.stationTextGroup}>
              <Text
                style={[
                  styles.stationLabel,
                  { color: destination ? colors.text : colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {destFieldText}
              </Text>
              <Text
                style={[styles.stationSubtext, { color: colors.textTertiary }]}
                numberOfLines={1}
              >
                {destFieldSubtext}
              </Text>
            </View>
            <Ionicons
              name="chevron-down"
              size={14}
              color={colors.textSecondary}
            />
          </Pressable>
          {destination ? (
            <Pressable
              onPress={() => setDestination(null)}
              style={[styles.clearDest, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear destination filter"
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Direction toggle */}
      <View
        style={[
          styles.toggleRow,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Text style={[styles.toggleLabel, { color: colors.textSecondary }]}>
          Direction
        </Text>
        <DirectionToggle value={direction} onChange={setDirection} />
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
          data={data}
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
              <Text style={[styles.listTitle, { color: colors.text }]}>
                Next departures
              </Text>
              <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                {loading && data.length === 0 ? 'Updating…' : `${data.length} train${data.length === 1 ? '' : 's'}`}
              </Text>
              {loading && data.length === 0 ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.spinner}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            !loading ? (
              <EmptyState
                icon="😴"
                title="No trains in the next 90 min"
                subtitle={`Try changing direction or check back later.`}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <DepartureCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/train/[number]',
                  params: { number: item.number, station: station.name },
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
  navSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  stationBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stationPrompt: {
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '500',
  },
  stationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  stationTextGroup: {
    flex: 1,
  },
  stationLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  stationSubtext: {
    fontSize: 12,
    marginTop: 1,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destButton: {
    flex: 1,
  },
  clearDest: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleRow: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingTop: 10,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  spinner: {
    marginTop: 20,
  },
});

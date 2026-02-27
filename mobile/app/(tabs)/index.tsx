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
  const [direction, setDirection] = useState<Direction>('down');
  const [pickerOpen, setPickerOpen] = useState(false);

  const { data, loading, error, refresh } = useDepartures(
    station?.id ?? null,
    direction,
  );

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
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [
            styles.stationButton,
            {
              backgroundColor: pressed
                ? colors.surfaceSecondary
                : colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select station"
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={station ? colors.primary : colors.textTertiary}
          />
          <Text
            style={[
              styles.stationLabel,
              { color: station ? colors.text : colors.textTertiary },
            ]}
            numberOfLines={1}
          >
            {station ? station.name : 'Select a station…'}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color={colors.textSecondary}
          />
        </Pressable>
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
            loading && data.length === 0 ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.spinner}
              />
            ) : null
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
  stationBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stationLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  toggleRow: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingTop: 12,
  },
  spinner: {
    marginTop: 40,
  },
});

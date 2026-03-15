import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Departure, DepartureWithArrival, Station } from '../../src/api/types';
import { DepartureCard } from '../../src/components/DepartureCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SavedRouteCard } from '../../src/components/SavedRouteCard';
import { StationPicker } from '../../src/components/StationPicker';
import { TransferRouteCard } from '../../src/components/TransferRouteCard';
import { UpdateBanner } from '../../src/components/UpdateBanner';
import { useAppUpdate } from '../../src/hooks/useAppUpdate';
import { useDepartures } from '../../src/hooks/useDepartures';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useLiveTrains } from '../../src/hooks/useLiveTrains';
import { useRouteHistory, usePendingRoute } from '../../src/hooks/useRouteHistory';
import { useTransferRoutes } from '../../src/hooks/useTransferRoutes';
import { useTheme } from '../../src/hooks/useTheme';

export default function DeparturesScreen() {
  const { colors, spacing, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  const router = useRouter();

  const [station, setStation] = useState<Station | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [filterFast, setFilterFast] = useState(false);
  const [filterAC, setFilterAC] = useState(false);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const { topRoutes, record: recordRoute, toggleFavorite: toggleRouteFav, addFavorite: addRouteFav, removeFavorite: removeRouteFav, isRouteFavorite } = useRouteHistory();
  const { pendingRoute, consumePendingRoute } = usePendingRoute();
  const { update, showBanner, dismiss } = useAppUpdate();

  // Pick up route selections from other tabs (e.g. favorites)
  React.useEffect(() => {
    if (pendingRoute) {
      setStation({ id: pendingRoute.sourceId, name: pendingRoute.sourceName, code: '' });
      setDestination({ id: pendingRoute.destId, name: pendingRoute.destName, code: '' });
      consumePendingRoute();
    }
  }, [pendingRoute]);

  const showFavoriteMenu = React.useCallback((item: Departure) => {
    const fav = isFavorite(item.number, item.line);
    const label = fav ? 'Remove from Favorites' : 'Add to Favorites';

    const action = () => toggleFavorite({
      number: item.number,
      line: item.line,
      origin: item.origin,
      destination: item.destination,
      is_fast: item.is_fast,
      is_ac: item.is_ac,
      departure: item.departure,
    });

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', label],
          cancelButtonIndex: 0,
          destructiveButtonIndex: fav ? 1 : undefined,
        },
        idx => { if (idx === 1) action(); },
      );
    } else {
      Alert.alert(
        `${item.number} ${item.origin} \u2192 ${item.destination}`,
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: label, style: fav ? 'destructive' : 'default', onPress: action },
        ],
      );
    }
  }, [isFavorite, toggleFavorite]);

  const { data, loading, error, refresh } = useDepartures(
    station?.id ?? null,
    destination?.id,
  );

  const liveTrains = useLiveTrains();

  const { data: transferRoutes, loading: transferLoading } = useTransferRoutes(
    station?.id ?? null,
    destination?.id ?? null,
  );

  // Transfer routes are already filtered to current time at the query level
  const visibleTransfers = transferRoutes;

  const filteredData = useMemo(() => data.filter(d => {
    if (filterFast && !d.is_fast) return false;
    if (filterAC && !d.is_ac) return false;
    return true;
  }), [data, filterFast, filterAC]);

  const [pastLimit, setPastLimit] = useState(5);
  const PAST_PAGE = 5;

  const { visibleData, hiddenPastCount } = React.useMemo(() => {
    if (filteredData.length === 0) return { visibleData: [], hiddenPastCount: 0 };
    const now = new Date();
    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const splitIdx = filteredData.findIndex(d => d.departure >= nowMinute);
    if (splitIdx <= 0) return { visibleData: filteredData, hiddenPastCount: 0 };

    const past = filteredData.slice(0, splitIdx);
    const upcoming = filteredData.slice(splitIdx);
    const visiblePast = past.slice(-pastLimit);

    return {
      visibleData: [...visiblePast, ...upcoming],
      hiddenPastCount: Math.max(0, past.length - pastLimit),
    };
  }, [filteredData, pastLimit]);

  // reset when station/filters change
  React.useEffect(() => {
    setPastLimit(5);
  }, [station, destination, filterFast, filterAC]);

  // Record route search when both stations are selected
  React.useEffect(() => {
    if (station && destination) {
      recordRoute(station.id, station.name, destination.id, destination.name);
    }
  }, [station?.id, destination?.id]);

  const handleSavedRoutePress = useCallback((route: { sourceId: number; sourceName: string; destId: number; destName: string }) => {
    setStation({ id: route.sourceId, name: route.sourceName, code: '' });
    setDestination({ id: route.destId, name: route.destName, code: '' });
  }, []);

  const showRouteFavoriteMenu = useCallback((route: { sourceId: number; sourceName: string; destId: number; destName: string }) => {
    const fav = isRouteFavorite(route.sourceId, route.destId);
    const label = fav ? 'Remove from Favorites' : 'Add to Favorites';
    const action = () => toggleRouteFav(route.sourceId, route.destId);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', label],
          cancelButtonIndex: 0,
          destructiveButtonIndex: fav ? 1 : undefined,
        },
        idx => { if (idx === 1) action(); },
      );
    } else {
      Alert.alert(
        `${route.sourceName} \u2192 ${route.destName}`,
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: label, style: fav ? 'destructive' : 'default', onPress: action },
        ],
      );
    }
  }, [isRouteFavorite, toggleRouteFav]);

  const handleTransferLegPress = useCallback((leg: DepartureWithArrival, stationName: string) => {
    if (!station) return;
    router.push({
      pathname: '/train/[number]',
      params: { number: leg.number, station: stationName, origin: leg.origin, destination: leg.destination, line: leg.line },
    });
  }, [station, router]);

  const stationFieldText = station ? station.name : 'From';
  const destFieldText = destination ? destination.name : 'To';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      {/* Header */}
      <View
        style={[
          styles.headerBlock,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        {showBanner && update && (
          <UpdateBanner update={update} onDismiss={dismiss} />
        )}
        <Text style={[styles.navTitle, { color: isDark ? colors.text : '#FFFFFF' }]}>Rush Hour</Text>

        <View style={styles.stationRow}>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[
              styles.stationChip,
              station
                ? { backgroundColor: isDark ? colors.surfaceSecondary : 'rgba(255,255,255,0.95)' }
                : { backgroundColor: isDark ? colors.surfaceSecondary + '80' : 'rgba(255,255,255,0.2)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={station ? `Change station, current ${station.name}` : 'Select station'}
          >
            <Text
              style={[
                styles.stationLabel,
                { color: station ? colors.primary : (isDark ? colors.textTertiary : 'rgba(255,255,255,0.8)') },
              ]}
              numberOfLines={1}
            >
              {stationFieldText}
            </Text>
          </Pressable>

          <Ionicons name="arrow-forward" size={14} color={isDark ? colors.textTertiary : 'rgba(255,255,255,0.5)'} />

          <Pressable
            onPress={() => setDestPickerOpen(true)}
            style={[
              styles.stationChip,
              destination
                ? { backgroundColor: isDark ? colors.surfaceSecondary : 'rgba(255,255,255,0.95)' }
                : { backgroundColor: isDark ? colors.surfaceSecondary + '80' : 'rgba(255,255,255,0.2)' },
            ]}
            accessibilityRole="button"
            accessibilityLabel={destination ? `Change destination, current ${destination.name}` : 'Select destination'}
          >
            <Text
              style={[
                styles.stationLabel,
                { color: destination ? colors.primary : (isDark ? colors.textTertiary : 'rgba(255,255,255,0.8)') },
              ]}
              numberOfLines={1}
            >
              {destFieldText}
            </Text>
          </Pressable>

          {station && destination ? (
            <Pressable
              onPress={() => {
                if (isRouteFavorite(station.id, destination.id)) {
                  removeRouteFav(station.id, destination.id);
                } else {
                  addRouteFav(station.id, station.name, destination.id, destination.name);
                }
              }}
              style={[styles.clearDest, { backgroundColor: isDark ? colors.surfaceSecondary : 'rgba(255,255,255,0.2)' }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isRouteFavorite(station.id, destination.id) ? 'Remove route from favorites' : 'Add route to favorites'}
            >
              <Ionicons
                name={isRouteFavorite(station.id, destination.id) ? 'heart' : 'heart-outline'}
                size={14}
                color={isRouteFavorite(station.id, destination.id)
                  ? colors.danger
                  : (isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)')}
              />
            </Pressable>
          ) : null}
          {station ? (
            <Pressable
              onPress={() => { setStation(null); setDestination(null); }}
              style={[styles.clearDest, { backgroundColor: isDark ? colors.surfaceSecondary : 'rgba(255,255,255,0.2)' }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={14} color={isDark ? colors.textSecondary : 'rgba(255,255,255,0.8)'} />
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
                  ? { backgroundColor: isDark ? colors.primaryMuted : 'rgba(255,255,255,0.95)' }
                  : { backgroundColor: isDark ? colors.surfaceSecondary + '80' : 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Text style={[styles.filterLabel, { color: filterFast ? colors.primary : (isDark ? colors.textTertiary : 'rgba(255,255,255,0.8)') }]}>
                Fast
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterAC(f => !f)}
              style={[
                styles.filterChip,
                filterAC
                  ? { backgroundColor: isDark ? colors.primaryMuted : 'rgba(255,255,255,0.95)' }
                  : { backgroundColor: isDark ? colors.surfaceSecondary + '80' : 'rgba(255,255,255,0.15)' },
              ]}
            >
              <Text style={[styles.filterLabel, { color: filterAC ? colors.primary : (isDark ? colors.textTertiary : 'rgba(255,255,255,0.8)') }]}>
                AC
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Departure list */}
      {!(station && destination) ? (
        topRoutes.length > 0 ? (
          <FlatList
            data={topRoutes}
            keyExtractor={r => `${r.sourceId}-${r.destId}`}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + spacing.base }]}
            ListHeaderComponent={
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: colors.textTertiary }]}>
                  Recents
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <SavedRouteCard
                route={item}
                onPress={() => handleSavedRoutePress(item)}
                onLongPress={() => showRouteFavoriteMenu(item)}
              />
            )}
          />
        ) : (
          <EmptyState
            icon="🚉"
            title="Pick a route"
            subtitle="Select both a start and destination station to see trains."
          />
        )
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Couldn't load departures"
          subtitle={error}
        />
      ) : (
        <FlatList
          data={visibleData}
          keyExtractor={(d) => `${d.number}-${d.line}-${d.departure}`}
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
            <>
              <View style={styles.listHeader}>
                <Text style={[styles.listTitle, { color: colors.textTertiary }]}>
                  Departures
                </Text>
                {loading && data.length === 0 ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                  {`${visibleData.length} train${visibleData.length === 1 ? '' : 's'}`}
                </Text>
              )}
            </View>
              {hiddenPastCount > 0 && (
                <Pressable
                  onPress={() => setPastLimit(l => l + PAST_PAGE)}
                  style={[styles.showEarlier, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                  <Text style={[styles.showEarlierText, { color: colors.textSecondary }]}>
                    {`Show ${Math.min(PAST_PAGE, hiddenPastCount)} earlier train${Math.min(PAST_PAGE, hiddenPastCount) === 1 ? '' : 's'}`}
                  </Text>
                </Pressable>
              )}
            </>
          }
          ListEmptyComponent={
            loading || transferLoading ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 32 }} />
            ) : visibleTransfers.length === 0 ? (
              <EmptyState
                icon="😴"
                title="No upcoming trains"
                subtitle="Try a different destination or check back later."
              />
            ) : null
          }
          ListFooterComponent={
            visibleTransfers.length > 0 ? (
              <View>
                <View style={styles.listHeader}>
                  <Text style={[styles.listTitle, { color: colors.textTertiary }]}>
                    With Transfer
                  </Text>
                  {transferLoading ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Text style={[styles.listMeta, { color: colors.textSecondary }]}>
                      {`${visibleTransfers.length} route${visibleTransfers.length === 1 ? '' : 's'}`}
                    </Text>
                  )}
                </View>
                {visibleTransfers.slice(0, 20).map((r, i) => (
                  <TransferRouteCard
                    key={`${r.leg1.number}-${r.transferStation}-${r.leg2.number}-${i}`}
                    route={r}
                    onPressLeg={handleTransferLegPress}
                    liveTrains={liveTrains}
                  />
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <DepartureCard
              item={item}
              liveStatus={liveTrains[item.number]}
              onPress={() =>
                router.push({
                  pathname: '/train/[number]',
                  params: { number: item.number, station: station.name, origin: item.origin, destination: item.destination, line: item.line },
                })
              }
              onLongPress={() => showFavoriteMenu(item)}
            />
          )}
          removeClippedSubviews
          maxToRenderPerBatch={15}
          windowSize={7}
          initialNumToRender={12}
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
  showEarlier: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 12,
    marginVertical: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  showEarlierText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

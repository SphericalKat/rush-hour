import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchTrainRoute } from '../../src/api/live';
import type { RouteStop } from '../../src/api/types';
import { StationTimeline } from '../../src/components/StationTimeline';
import { useLiveTrainInfo } from '../../src/hooks/useLiveTrainInfo';
import { useLocationSharing } from '../../src/hooks/useLocationSharing';
import { useTheme } from '../../src/hooks/useTheme';
import { useFavorites } from '../../src/hooks/useFavorites';
import { useTrainStatus } from '../../src/hooks/useTrainStatus';
import { shadow } from '../../src/theme';

function formatLiveAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
}

export default function TrainScreen() {
  const { number, origin, destination, line } = useLocalSearchParams<{
    number: string;
    origin?: string;
    destination?: string;
    line?: string;
  }>();
  const { colors, radius, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { status, loading } = useTrainStatus(number);
  const { position: livePosition, loading: liveLoading, secondsUntilRefresh } = useLiveTrainInfo(number);
  const { sharing, lastMsg, toggle: toggleSharing } = useLocationSharing(number);
  const { isFavorite, toggle: toggleFavorite } = useFavorites();
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(true);

  const fav = isFavorite(number, line ?? '');
  const heartScale = useRef(new Animated.Value(1)).current;

  const handleToggleFav = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 120, useNativeDriver: true }),
      Animated.timing(heartScale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    const actualStops = stops.filter(s => s.is_stop);
    toggleFavorite({
      number,
      line: line ?? '',
      origin: origin ?? actualStops[0]?.station ?? '',
      destination: destination ?? actualStops[actualStops.length - 1]?.station ?? '',
    });
  }, [number, line, origin, destination, stops, toggleFavorite, heartScale]);

  const routeTitle = React.useMemo(() => {
    if (origin && destination) return `${origin} - ${destination}`;
    const actualStops = stops.filter(s => s.is_stop);
    if (actualStops.length >= 2) return `${actualStops[0].station} - ${actualStops[actualStops.length - 1].station}`;
    return number;
  }, [origin, destination, stops, number]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: routeTitle,
      headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      headerTintColor: colors.text,
      headerStyle: { backgroundColor: colors.surface },
      headerRight: () => (
        <Pressable onPress={handleToggleFav} hitSlop={8} style={{ marginRight: 12 }}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={fav ? 'heart' : 'heart-outline'}
              size={22}
              color={fav ? colors.danger : colors.textSecondary}
            />
          </Animated.View>
        </Pressable>
      ),
    });
  }, [routeTitle, colors, navigation, fav, handleToggleFav, heartScale]);

  const loadStops = useCallback(async () => {
    try {
      const data = await fetchTrainRoute(number, line);
      setStops(data ?? []);
    } catch {
      // best-effort
    } finally {
      setStopsLoading(false);
    }
  }, [number, line]);

  useEffect(() => {
    loadStops();
  }, [loadStops]);

  const hasLive = livePosition != null && 'position' in livePosition;

  // Delay comes directly from the mobond API response (position.d),
  // same as m-indicator. Fall back to our crowdsourced status reports.
  const delayMinutes = React.useMemo(() => {
    if (hasLive) {
      const d = (livePosition as any).position?.d;
      if (typeof d === 'number') return d;
    }
    return status?.delay_minutes ?? 0;
  }, [hasLive, livePosition, status]);

  function Section({
    title,
    children,
    rightLabel,
  }: {
    title: string;
    children: React.ReactNode;
    rightLabel?: React.ReactNode;
  }) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text
            style={[styles.sectionTitle, { color: colors.textSecondary }]}
          >
            {title}
          </Text>
          {rightLabel}
        </View>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              borderColor: colors.border,
              ...shadow(1),
            },
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  return (
    <>
    <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        {
          paddingTop: insets.top + 60,
          paddingBottom: insets.bottom + 32,
        },
      ]}
    >
      {/* Share your location */}
      <Section title="SHARE LOCATION">
        <TouchableOpacity activeOpacity={0.7} onPress={toggleSharing}>
          <View style={styles.shareContainer}>
            <View style={styles.shareInfo}>
              <Ionicons
                name={sharing ? 'navigate' : 'navigate-outline'}
                size={20}
                color={sharing ? colors.success : colors.textSecondary}
              />
              <View style={styles.shareText}>
                <Text style={[styles.shareTitle, { color: colors.text }]}>
                  {sharing ? 'Sharing your location' : 'Help other commuters'}
                </Text>
                <Text style={[styles.shareSubtitle, { color: colors.textTertiary }]}>
                  {sharing && lastMsg
                    ? lastMsg
                    : 'Share your GPS to show this train\'s live position'}
                </Text>
              </View>
            </View>
            <View style={[styles.shareBtn, { backgroundColor: sharing ? colors.danger + '15' : colors.primary }]}>
              <Text style={[styles.shareBtnText, { color: sharing ? colors.danger : colors.textOnPrimary }]}>
                {sharing ? 'Stop' : 'Start'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Section>

      {/* Status */}
      <Section title="STATUS">
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.spinner}
          />
        ) : (
          <View style={styles.statusGrid}>
            <StatusTile
              label="Delay"
              value={
                delayMinutes > 0
                  ? `${delayMinutes} min late`
                  : delayMinutes < 0
                    ? `${Math.abs(delayMinutes)} min early`
                    : 'On time'
              }
              color={delayMinutes > 0 ? colors.danger : colors.success}
            />
            <View
              style={[styles.statusDivider, { backgroundColor: colors.border }]}
            />
            <StatusTile
              label="Reports"
              value={status ? String(status.reporter_count) : '--'}
              color={colors.text}
            />
            <View
              style={[styles.statusDivider, { backgroundColor: colors.border }]}
            />
            <StatusTile
              label="Sharing"
              value={
                hasLive && (livePosition as any).pc > 0
                  ? String((livePosition as any).pc)
                  : '--'
              }
              color={colors.text}
            />
          </View>
        )}
      </Section>

      {/* Route timeline */}
      <Section
        title="ROUTE"
        rightLabel={
          hasLive ? (
            <View style={styles.liveRow}>
              <View style={[styles.liveBadge, { backgroundColor: colors.success + '18' }]}>
                <View style={[styles.liveBadgeDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.liveBadgeText, { color: colors.success }]}>
                  LIVE
                </Text>
                <Text style={[styles.liveBadgeAge, { color: colors.success + 'AA' }]}>
                  {formatLiveAge((livePosition as any).t)}
                </Text>
              </View>
              <Text style={[styles.refreshCountdown, { color: colors.textTertiary }]}>
                {secondsUntilRefresh}s
              </Text>
            </View>
          ) : !liveLoading ? (
            <View style={styles.liveRow}>
              <Text style={[styles.noLiveText, { color: colors.textTertiary }]}>
                No live data
              </Text>
              <Text style={[styles.refreshCountdown, { color: colors.textTertiary }]}>
                {secondsUntilRefresh}s
              </Text>
            </View>
          ) : null
        }
      >
        {stopsLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.spinner}
          />
        ) : stops.length > 0 ? (
          <StationTimeline
            stops={stops}
            livePosition={livePosition}
            delayMinutes={delayMinutes}
          />
        ) : (
          <View style={styles.emptyStops}>
            <Text style={[styles.emptyStopsText, { color: colors.textTertiary }]}>
              Route information unavailable
            </Text>
          </View>
        )}
      </Section>

      {/* Footer note */}
      <View style={styles.liveNote}>
        <Ionicons
          name="radio-outline"
          size={12}
          color={colors.textTertiary}
        />
        <Text style={[styles.footerNote, { color: colors.textTertiary }]}>
          Live position from crowdsourced GPS data. Updates every 15s.
        </Text>
      </View>
    </ScrollView>
    </>
  );
}

function StatusTile({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.statusTile}>
      <Text style={[styles.tileValue, { color }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 4,
  },
  section: {
    marginTop: 20,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  spinner: {
    marginVertical: 20,
  },
  // Share location
  shareContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  shareInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareText: {
    flex: 1,
    gap: 2,
  },
  shareTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  shareSubtitle: {
    fontSize: 12,
  },
  shareBtn: {
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Status tiles
  statusGrid: {
    flexDirection: 'row',
    padding: 16,
  },
  statusTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tileValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  tileLabel: {
    fontSize: 12,
  },
  statusDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: 8,
  },
  // Live badge row
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshCountdown: {
    fontSize: 10,
    fontVariant: ['tabular-nums'],
    fontWeight: '500',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  liveBadgeAge: {
    fontSize: 10,
    fontWeight: '500',
  },
  noLiveText: {
    fontSize: 11,
  },
  emptyStops: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStopsText: {
    fontSize: 14,
  },
  // Footer
  liveNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 24,
  },
  footerNote: {
    fontSize: 12,
  },
});

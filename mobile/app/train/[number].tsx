import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchTrainStops } from '../../src/api/live';
import type { TrainStop } from '../../src/api/types';
import { StationTimeline } from '../../src/components/StationTimeline';
import { useLiveTrainInfo } from '../../src/hooks/useLiveTrainInfo';
import { useLocationSharing } from '../../src/hooks/useLocationSharing';
import { useTheme } from '../../src/hooks/useTheme';
import { useTrainStatus } from '../../src/hooks/useTrainStatus';
import { shadow } from '../../src/theme';

function formatLiveAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
}

export default function TrainScreen() {
  const { number, origin, destination } = useLocalSearchParams<{
    number: string;
    origin?: string;
    destination?: string;
  }>();
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const { status, loading } = useTrainStatus(number);
  const { position: livePosition, loading: liveLoading, secondsUntilRefresh } = useLiveTrainInfo(number);
  const { sharing, lastMsg, toggle: toggleSharing } = useLocationSharing(number);
  const [stops, setStops] = useState<TrainStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(true);

  const routeTitle = React.useMemo(() => {
    if (origin && destination) return `${origin} - ${destination}`;
    if (stops.length >= 2) return `${stops[0].station} - ${stops[stops.length - 1].station}`;
    return number;
  }, [origin, destination, stops, number]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: routeTitle,
      headerTitleStyle: { fontWeight: '700', fontSize: 17 },
      headerTintColor: colors.text,
      headerStyle: { backgroundColor: colors.surface },
    });
  }, [routeTitle, colors, navigation]);

  const loadStops = useCallback(async () => {
    try {
      const data = await fetchTrainStops(number);
      setStops(data ?? []);
    } catch {
      // best-effort
    } finally {
      setStopsLoading(false);
    }
  }, [number]);

  useEffect(() => {
    loadStops();
  }, [loadStops]);

  const hasLive = livePosition != null && 'position' in livePosition;

  // Estimate delay from live position: compare current time to scheduled
  // departure at the station the train is at/approaching.
  const estimatedDelay = React.useMemo(() => {
    if (!hasLive || stops.length === 0) return 0;
    const pos = (livePosition as any).position;
    const liveStation = pos?.s?.toUpperCase();
    if (!liveStation) return 0;
    const stop = stops.find(s => s.station.toUpperCase() === liveStation);
    if (!stop) return 0;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const scheduled = stop.departure % 1440;
    let diff = currentMinutes - scheduled;
    if (diff < -720) diff += 1440;
    if (diff > 720) diff -= 1440;
    return Math.max(0, diff);
  }, [hasLive, livePosition, stops]);

  // Use reported delay if available, otherwise estimated from live position
  const delayMinutes = (status?.delay_minutes ?? 0) > 0
    ? status!.delay_minutes
    : estimatedDelay;

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
              <Text style={[styles.shareBtnText, { color: sharing ? colors.danger : '#fff' }]}>
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
                  ? `+${delayMinutes} min`
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

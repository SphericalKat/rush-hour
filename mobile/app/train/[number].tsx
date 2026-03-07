import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchTrainStops } from '../../src/api/live';
import { submitCount, submitDelay } from '../../src/api/reports';
import type { CrowdLevel, TrainStop } from '../../src/api/types';
import { StationTimeline } from '../../src/components/StationTimeline';
import { useDeviceId } from '../../src/hooks/useDeviceId';
import { useLiveTrainInfo } from '../../src/hooks/useLiveTrainInfo';
import { useTheme } from '../../src/hooks/useTheme';
import { useTrainStatus } from '../../src/hooks/useTrainStatus';
import { shadow } from '../../src/theme';

function formatLiveAge(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  return `${minutes} min ago`;
}

const CROWD_LEVELS: { value: CrowdLevel; label: string; emoji: string }[] = [
  { value: 'low', label: 'Empty', emoji: '🙂' },
  { value: 'moderate', label: 'Moderate', emoji: '😐' },
  { value: 'crowded', label: 'Packed', emoji: '😰' },
];

export default function TrainScreen() {
  const { number, station } = useLocalSearchParams<{
    number: string;
    station?: string;
  }>();
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const deviceId = useDeviceId();

  const { status, loading, liveLevel } = useTrainStatus(number);
  const { position: livePosition, loading: liveLoading } = useLiveTrainInfo(number);
  const [stops, setStops] = useState<TrainStop[]>([]);
  const [stopsLoading, setStopsLoading] = useState(true);

  const [delayInput, setDelayInput] = useState('');
  const [submittingDelay, setSubmittingDelay] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<CrowdLevel | null>(null);
  const [submittingCount, setSubmittingCount] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: number,
      headerTitleStyle: { fontWeight: '700', fontSize: 20 },
      headerTintColor: colors.text,
      headerStyle: { backgroundColor: colors.surface },
    });
  }, [number, colors, navigation]);

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

  const handleDelaySubmit = async () => {
    const minutes = parseInt(delayInput, 10);
    if (isNaN(minutes) || minutes < 0) {
      Alert.alert('Invalid', 'Enter a delay in whole minutes (0+).');
      return;
    }
    if (!deviceId) return;
    setSubmittingDelay(true);
    try {
      await submitDelay(number, minutes, deviceId);
      setDelayInput('');
      Alert.alert('Thanks!', 'Delay reported.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Check your connection.');
    } finally {
      setSubmittingDelay(false);
    }
  };

  const handleCountSubmit = async (level: CrowdLevel) => {
    if (!deviceId || !station) return;
    setSelectedLevel(level);
    setSubmittingCount(true);
    try {
      await submitCount(number, station, level, deviceId);
      Alert.alert('Thanks!', 'Crowding level reported.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Check your connection.');
    } finally {
      setSubmittingCount(false);
    }
  };

  const hasLive = livePosition != null && 'position' in livePosition;

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
      keyboardShouldPersistTaps="handled"
    >
      {/* Train badge */}
      <View style={styles.heroBadge}>
        <Text style={[styles.heroNumber, { color: colors.text }]}>
          {number}
        </Text>
        {station ? (
          <Text style={[styles.heroStation, { color: colors.textSecondary }]}>
            {station}
          </Text>
        ) : null}
      </View>

      {/* Route timeline with live tracking overlay */}
      <Section
        title="ROUTE"
        rightLabel={
          hasLive ? (
            <View style={[styles.liveBadge, { backgroundColor: colors.success + '18' }]}>
              <View style={[styles.liveBadgeDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.liveBadgeText, { color: colors.success }]}>
                LIVE
              </Text>
              <Text style={[styles.liveBadgeAge, { color: colors.success + 'AA' }]}>
                {formatLiveAge((livePosition as any).t)}
              </Text>
            </View>
          ) : !liveLoading ? (
            <Text style={[styles.noLiveText, { color: colors.textTertiary }]}>
              No live data
            </Text>
          ) : null
        }
      >
        {stopsLoading ? (
          <ActivityIndicator
            color={colors.primary}
            style={styles.spinner}
          />
        ) : stops.length > 0 ? (
          <StationTimeline stops={stops} livePosition={livePosition} />
        ) : (
          <View style={styles.emptyStops}>
            <Text style={[styles.emptyStopsText, { color: colors.textTertiary }]}>
              Route information unavailable
            </Text>
          </View>
        )}
      </Section>

      {/* People sharing count */}
      {hasLive && (livePosition as any).pc > 0 && (
        <View style={[styles.peopleBanner, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg }]}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.peopleText, { color: colors.textSecondary }]}>
            {(livePosition as any).pc} {(livePosition as any).pc === 1 ? 'person' : 'people'} sharing live location
          </Text>
        </View>
      )}

      {/* Current status */}
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
                status && status.delay_minutes > 0
                  ? `+${status.delay_minutes} min`
                  : 'On time'
              }
              color={
                status && status.delay_minutes > 0
                  ? colors.danger
                  : colors.success
              }
            />
            <View
              style={[
                styles.statusDivider,
                { backgroundColor: colors.border },
              ]}
            />
            <StatusTile
              label="Reports"
              value={status ? String(status.reporter_count) : '—'}
              color={colors.text}
            />
            {liveLevel && (
              <>
                <View
                  style={[
                    styles.statusDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
                <StatusTile
                  label="Crowding"
                  value={liveLevel}
                  color={
                    liveLevel === 'crowded'
                      ? colors.danger
                      : liveLevel === 'moderate'
                      ? colors.warning
                      : colors.success
                  }
                />
              </>
            )}
          </View>
        )}
      </Section>

      {/* Report delay */}
      <Section title="REPORT DELAY">
        <View style={styles.delayRow}>
          <TextInput
            value={delayInput}
            onChangeText={setDelayInput}
            placeholder="Minutes late..."
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
            returnKeyType="done"
            style={[
              styles.delayInput,
              {
                color: colors.text,
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          />
          <Pressable
            onPress={handleDelaySubmit}
            disabled={submittingDelay || !delayInput}
            style={({ pressed }) => [
              styles.submitBtn,
              {
                backgroundColor:
                  !delayInput ? colors.surfaceSecondary : colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            {submittingDelay ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text
                style={[
                  styles.submitLabel,
                  { color: !delayInput ? colors.textTertiary : '#fff' },
                ]}
              >
                Report
              </Text>
            )}
          </Pressable>
        </View>
      </Section>

      {/* Report crowding */}
      {station ? (
        <Section title="CROWDING">
          <View style={styles.crowdRow}>
            {CROWD_LEVELS.map((opt) => {
              const active = selectedLevel === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => handleCountSubmit(opt.value)}
                  disabled={submittingCount}
                  style={({ pressed }) => [
                    styles.crowdBtn,
                    {
                      backgroundColor: active
                        ? colors.primaryMuted
                        : colors.surfaceSecondary,
                      borderColor: active
                        ? colors.primary
                        : colors.border,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={styles.crowdEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.crowdLabel,
                      {
                        color: active ? colors.primary : colors.textSecondary,
                        fontWeight: active ? '600' : '400',
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>
      ) : null}

      {/* Live update note */}
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
  heroBadge: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  heroNumber: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  heroStation: {
    fontSize: 16,
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
  // Live badge in section header
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
  // People sharing banner
  peopleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  peopleText: {
    fontSize: 13,
  },
  // Status tiles
  statusGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 0,
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
  // Report delay
  delayRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    alignItems: 'center',
  },
  delayInput: {
    flex: 1,
    fontSize: 16,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
  },
  submitBtn: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Crowding
  crowdRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  crowdBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 12,
    gap: 6,
  },
  crowdEmoji: {
    fontSize: 24,
  },
  crowdLabel: {
    fontSize: 12,
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

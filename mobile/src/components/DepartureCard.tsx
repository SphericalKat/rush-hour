import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { Ionicons } from '@expo/vector-icons';
import type { Departure } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { formatCountdown, minutesToHHMM, minutesUntil } from '../utils/time';
import { LineChip } from './LineChip';

interface Props {
  item: Departure;
  onPress: () => void;
  onLongPress?: () => void;
  delayMinutes?: number;
  liveStatus?: string;
  hideCountdown?: boolean;
}

const _RUNS_ON_LABELS: Record<string, string> = {
  not_sunday: 'No Sun',
  sunday_only: 'Sun only',
  weekdays_only: 'Mon–Fri',
  not_saturday: 'No Sat',
  not_fri_sat: 'No Fri/Sat',
  not_thu_fri: 'No Thu/Fri',
};

function trainBarColor(item: Departure, colors: ReturnType<typeof useTheme>['colors']) {
  if (item.is_ac) return colors.trainAC;
  if (item.is_fast) return colors.trainFast;
  return colors.trainSlow;
}

export function DepartureCard({ item, onPress, onLongPress, delayMinutes = 0, liveStatus, hideCountdown }: Props) {
  const { colors } = useTheme();

  const until = minutesUntil(item.departure);
  const isUrgent = until >= 0 && until <= 3;
  const isDue = until <= 0;
  const isDelayed = delayMinutes > 0;

  let countdownColor = colors.textSecondary;
  let countdownBg = 'transparent';
  if (isDue) {
    countdownColor = '#FFFFFF';
    countdownBg = colors.countdownDue;
  } else if (isUrgent) {
    countdownColor = '#FFFFFF';
    countdownBg = colors.countdownUrgent;
  }

  const barColor = trainBarColor(item, colors);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.number} to ${item.destination}, departs at ${minutesToHHMM(item.departure)}`}
      style={[
        styles.card,
        { backgroundColor: colors.surface },
      ]}
    >
      {/* Leading color bar */}
      <View style={[styles.bar, { backgroundColor: barColor }]} />

      <View style={styles.cardBody}>
        {/* Top row: time + platform + countdown */}
        <View style={styles.header}>
          {!hideCountdown && (
            <Text style={[styles.time, { color: colors.text }]}>
              {minutesToHHMM(item.departure)}
            </Text>
          )}
          {!hideCountdown && isDelayed && (
            <Text style={[styles.delay, { color: colors.danger }]}>
              +{delayMinutes}m
            </Text>
          )}
          {hideCountdown && (
            <Text style={[styles.time, { color: colors.text }]}>
              {item.number}
            </Text>
          )}
          <View style={{ flex: 1 }} />
          {item.platform ? (
            <View style={[styles.platformPill, { backgroundColor: colors.platformMuted }]}>
              <Text style={[styles.platformLabel, { color: colors.platform }]}>
                PF {item.platform}
              </Text>
            </View>
          ) : null}
          {!hideCountdown && (
            <View style={[styles.countdownPill, { backgroundColor: countdownBg }]}>
              <Text style={[styles.countdown, { color: countdownColor }]}>
                {isDue ? 'Due' : formatCountdown(until)}
              </Text>
            </View>
          )}
        </View>

        {/* Route */}
        <Text style={[styles.route, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.origin}
          <Text style={{ color: colors.textTertiary }}>{' \u2192 '}</Text>
          {item.destination}
        </Text>

        {/* Live tracking status */}
        {liveStatus ? (
          <View style={[styles.liveRow, { backgroundColor: colors.success + '14' }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success }]} numberOfLines={1}>
              {liveStatus}
            </Text>
          </View>
        ) : null}

        {/* Bottom row: meta + badges */}
        <View style={styles.meta}>
          <LineChip shortName={item.line} size="sm" />
          {!hideCountdown && (
            <Text style={[styles.trainNum, { color: colors.textTertiary }]}>
              {item.number}
            </Text>
          )}
          {item.is_fast && (
            <View style={[styles.badge, { backgroundColor: colors.trainFast + '18' }]}>
              <Text style={[styles.badgeLabel, { color: colors.trainFast }]}>Fast</Text>
            </View>
          )}
          {item.is_ac && (
            <View style={[styles.badge, { backgroundColor: colors.trainAC + '18' }]}>
              <Text style={[styles.badgeLabel, { color: colors.trainAC }]}>AC</Text>
            </View>
          )}
          {item.runs_on && item.runs_on !== 'daily' && (
            <View style={[styles.badge, { backgroundColor: colors.warning + '18' }]}>
              <Text style={[styles.badgeLabel, { color: colors.warning }]}>
                {_RUNS_ON_LABELS[item.runs_on] ?? item.runs_on}
              </Text>
            </View>
          )}
          {item.note ? (
            <View style={[styles.badge, { backgroundColor: colors.textTertiary + '18' }]}>
              <Text style={[styles.badgeLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.note}
              </Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 3,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  bar: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 10,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  delay: {
    fontSize: 11,
    fontWeight: '700',
  },
  platformPill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  platformLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  countdownPill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countdown: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  route: {
    fontSize: 13,
    fontWeight: '500',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  trainNum: {
    fontSize: 11,
    fontWeight: '500',
  },
  badge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Departure } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { formatCountdown, minutesToHHMM, minutesUntil } from '../utils/time';
import { LineChip } from './LineChip';

interface Props {
  item: Departure;
  onPress: () => void;
  delayMinutes?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function trainBarColor(item: Departure, colors: ReturnType<typeof useTheme>['colors']) {
  if (item.is_ac) return colors.trainAC;
  if (item.is_fast) return colors.trainFast;
  return colors.trainSlow;
}

export function DepartureCard({ item, onPress, delayMinutes = 0 }: Props) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

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
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
      accessibilityRole="button"
      accessibilityLabel={`${item.number} to ${item.destination}, departs at ${minutesToHHMM(item.departure)}`}
      style={[
        animatedStyle,
        styles.card,
        { backgroundColor: colors.surface },
      ]}
    >
      {/* Leading color bar */}
      <View style={[styles.bar, { backgroundColor: barColor }]} />

      <View style={styles.cardBody}>
        {/* Top row: time + platform + countdown */}
        <View style={styles.header}>
          <Text style={[styles.time, { color: colors.text }]}>
            {minutesToHHMM(item.departure)}
          </Text>
          {isDelayed && (
            <Text style={[styles.delay, { color: colors.danger }]}>
              +{delayMinutes}m
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
          <View style={[styles.countdownPill, { backgroundColor: countdownBg }]}>
            <Text style={[styles.countdown, { color: countdownColor }]}>
              {isDue ? 'Due' : formatCountdown(until)}
            </Text>
          </View>
        </View>

        {/* Route */}
        <Text style={[styles.route, { color: colors.textSecondary }]} numberOfLines={1}>
          {item.origin}
          <Text style={{ color: colors.textTertiary }}>{' \u2192 '}</Text>
          {item.destination}
        </Text>

        {/* Bottom row: meta + badges */}
        <View style={styles.meta}>
          <LineChip shortName={item.line} size="sm" />
          <Text style={[styles.trainNum, { color: colors.textTertiary }]}>
            {item.number}
          </Text>
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
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </View>
    </AnimatedPressable>
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

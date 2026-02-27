import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { Departure } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { shadow } from '../theme';
import { formatCountdown, minutesToHHMM, minutesUntil } from '../utils/time';
import { LineChip } from './LineChip';

interface Props {
  item: Departure;
  onPress: () => void;
  delayMinutes?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function DepartureCard({ item, onPress, delayMinutes = 0 }: Props) {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const until = minutesUntil(item.departure);
  const isUrgent = until >= 0 && until <= 3;
  const isDue = until <= 0;
  const isDelayed = delayMinutes > 0;

  let countdownColor = colors.textSecondary;
  if (isDue) countdownColor = colors.danger;
  else if (isUrgent) countdownColor = colors.warning;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 20 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 20 }); }}
      style={[
        animatedStyle,
        styles.card,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          ...shadow(2),
        },
      ]}
    >
      {/* Top row: time + countdown */}
      <View style={styles.header}>
        <View style={styles.timeGroup}>
          <Text style={[styles.time, { color: colors.text }]}>
            {minutesToHHMM(item.departure)}
          </Text>
          {isDelayed && (
            <Text style={[styles.delay, { color: colors.danger }]}>
              +{delayMinutes}m
            </Text>
          )}
        </View>
        <Text style={[styles.countdown, { color: countdownColor }]}>
          {isDue ? 'Due' : formatCountdown(until)}
        </Text>
      </View>

      {/* Bottom row: train info */}
      <View style={styles.info}>
        <Text style={[styles.trainNum, { color: colors.textSecondary }]}>
          {item.number}
          {item.code ? (
            <Text style={{ color: colors.text }}> · {item.code}</Text>
          ) : null}
        </Text>
        <View style={styles.badges}>
          <LineChip shortName={item.line} size="sm" />
          {item.is_ac && (
            <View style={[styles.acBadge, { backgroundColor: colors.ac + '20' }]}>
              <Text style={[styles.acLabel, { color: colors.ac }]}>AC</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  time: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  delay: {
    fontSize: 13,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 15,
    fontWeight: '500',
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trainNum: {
    fontSize: 14,
    fontWeight: '500',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  acBadge: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  acLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

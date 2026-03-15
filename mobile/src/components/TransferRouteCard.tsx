import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { LineChip } from './LineChip';
import { useTheme } from '../hooks/useTheme';
import { formatCountdown, minutesToHHMM, minutesUntil } from '../utils/time';
import type { DepartureWithArrival, TransferRoute } from '../api/types';

interface Props {
  route: TransferRoute;
  onPressLeg: (leg: DepartureWithArrival, stationName: string) => void;
  liveTrains: Record<string, string>;
}

function LegRow({
  leg,
  destination,
  showCountdown,
  liveStatus,
  onPress,
  colors,
}: {
  leg: DepartureWithArrival;
  destination: string;
  showCountdown: boolean;
  liveStatus?: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const until = minutesUntil(leg.departure);
  const isDue = until <= 0;
  const isUrgent = until >= 0 && until <= 3;

  let countdownColor = colors.textSecondary;
  let countdownBg = 'transparent';
  if (isDue) {
    countdownColor = '#FFFFFF';
    countdownBg = colors.countdownDue;
  } else if (isUrgent) {
    countdownColor = '#FFFFFF';
    countdownBg = colors.countdownUrgent;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.leg, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={`Train ${leg.number} to ${destination}`}
    >
      <View style={styles.legHeader}>
        <Text style={[styles.time, { color: colors.text }]}>
          {minutesToHHMM(leg.departure)}
        </Text>
        <Text style={[styles.legRoute, { color: colors.textSecondary }]} numberOfLines={1}>
          {leg.station}
          <Text style={{ color: colors.textTertiary }}>{' \u2192 '}</Text>
          {destination}
        </Text>
        <View style={{ flex: 1 }} />
        {leg.platform ? (
          <View style={[styles.platformPill, { backgroundColor: colors.platformMuted }]}>
            <Text style={[styles.platformLabel, { color: colors.platform }]}>
              PF {leg.platform}
            </Text>
          </View>
        ) : null}
        {showCountdown && (
          <View style={[styles.countdownPill, { backgroundColor: countdownBg }]}>
            <Text style={[styles.countdown, { color: countdownColor }]}>
              {isDue ? 'Due' : formatCountdown(until)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.legMeta}>
        <LineChip shortName={leg.line} size="sm" />
        <Text style={[styles.trainNum, { color: colors.textTertiary }]}>
          {leg.number}
        </Text>
        {leg.is_fast ? (
          <View style={[styles.badge, { backgroundColor: colors.trainFast + '18' }]}>
            <Text style={[styles.badgeLabel, { color: colors.trainFast }]}>Fast</Text>
          </View>
        ) : null}
        {leg.is_ac ? (
          <View style={[styles.badge, { backgroundColor: colors.trainAC + '18' }]}>
            <Text style={[styles.badgeLabel, { color: colors.trainAC }]}>AC</Text>
          </View>
        ) : null}
      </View>

      {liveStatus ? (
        <View style={[styles.liveRow, { backgroundColor: colors.success + '14' }]}>
          <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
          <Text style={[styles.liveText, { color: colors.success }]} numberOfLines={1}>
            {liveStatus}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export const TransferRouteCard = React.memo(function TransferRouteCard({
  route,
  onPressLeg,
  liveTrains,
}: Props) {
  const { colors } = useTheme();
  const { leg1, leg2, transferStation, waitMinutes, totalMinutes } = route;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardBody}>
        <LegRow
          leg={leg1}
          destination={transferStation}
          showCountdown
          liveStatus={liveTrains[leg1.number]}
          onPress={() => onPressLeg(leg1, leg1.station)}
          colors={colors}
        />

        {/* Transfer indicator */}
        <View style={[styles.transferRow, { borderColor: colors.textTertiary + '30' }]}>
          <Ionicons name="swap-vertical" size={14} color={colors.textTertiary} />
          <Text style={[styles.transferText, { color: colors.textTertiary }]}>
            Change at {transferStation}
          </Text>
          <Text style={[styles.waitText, { color: colors.textSecondary }]}>
            {waitMinutes} min wait
          </Text>
        </View>

        <LegRow
          leg={leg2}
          destination={leg2.destination || leg2.station}
          showCountdown={false}
          liveStatus={liveTrains[leg2.number]}
          onPress={() => onPressLeg(leg2, transferStation)}
          colors={colors}
        />

        {/* Summary footer */}
        <View style={[styles.footer, { borderTopColor: colors.textTertiary + '20' }]}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Arrive {minutesToHHMM(route.arrivalTime)}
          </Text>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            {formatCountdown(totalMinutes)} total
          </Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </View>
      </View>
    </View>
  );
}, (prev, next) =>
  prev.route === next.route &&
  prev.liveTrains === next.liveTrains,
);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 3,
    flexDirection: 'row',
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardBody: {
    flex: 1,
    paddingVertical: 8,
    gap: 2,
  },
  leg: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 3,
  },
  legHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.3,
  },
  legRoute: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
  platformPill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  platformLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  countdownPill: {
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  countdown: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  legMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trainNum: {
    fontSize: 10,
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
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 12,
  },
  transferText: {
    fontSize: 11,
    fontWeight: '600',
  },
  waitText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

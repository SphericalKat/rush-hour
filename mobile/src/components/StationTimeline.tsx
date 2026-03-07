import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LiveTrainPosition, TrainStop } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { minutesToHHMM } from '../utils/time';

interface Props {
  stops: TrainStop[];
  livePosition: LiveTrainPosition | null;
  delayMinutes?: number;
}

type StopState = 'passed' | 'current' | 'approaching' | 'upcoming';

function resolveStopStates(
  stops: TrainStop[],
  live: LiveTrainPosition | null,
): StopState[] {
  const states: StopState[] = stops.map(() => 'upcoming');
  if (!live || !('position' in live)) return states;

  const { position } = live;
  const liveStation = position.s?.toUpperCase();
  const statusType = position.st; // "0"=at, "1"=approaching/left, "2"=between, "3"=departed

  // Find the index of the station the live position refers to
  let liveIdx = -1;
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].station.toUpperCase() === liveStation) {
      liveIdx = i;
      break;
    }
  }

  // If the live message contains "Between X - Y", find the two stations
  const betweenMatch = position.msg?.match(/Between\s+(.+?)\s*-\s*(.+)/i);
  let betweenFromIdx = -1;
  let betweenToIdx = -1;
  if (betweenMatch) {
    const from = betweenMatch[1].trim().toUpperCase();
    const to = betweenMatch[2].trim().toUpperCase();
    for (let i = 0; i < stops.length; i++) {
      const name = stops[i].station.toUpperCase();
      if (name === from) betweenFromIdx = i;
      if (name === to) betweenToIdx = i;
    }
  }

  if (statusType === '2' && betweenFromIdx >= 0 && betweenToIdx >= 0) {
    const minIdx = Math.min(betweenFromIdx, betweenToIdx);
    const maxIdx = Math.max(betweenFromIdx, betweenToIdx);
    for (let i = 0; i <= minIdx; i++) states[i] = 'passed';
    states[maxIdx] = 'approaching';
  } else if (statusType === '0' && liveIdx >= 0) {
    for (let i = 0; i < liveIdx; i++) states[i] = 'passed';
    states[liveIdx] = 'current';
  } else if ((statusType === '1' || statusType === '3') && liveIdx >= 0) {
    for (let i = 0; i < liveIdx; i++) states[i] = 'passed';
    states[liveIdx] = statusType === '1' ? 'approaching' : 'passed';
    if (statusType === '3' && liveIdx + 1 < stops.length) {
      states[liveIdx + 1] = 'approaching';
    }
  } else if (liveIdx >= 0) {
    for (let i = 0; i < liveIdx; i++) states[i] = 'passed';
    states[liveIdx] = 'current';
  }

  return states;
}

// Estimate delay by comparing current time to the scheduled departure
// at the station the train is currently at/approaching.
function estimateDelay(
  stops: TrainStop[],
  states: StopState[],
): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (let i = 0; i < states.length; i++) {
    if (states[i] === 'current' || states[i] === 'approaching') {
      const scheduled = stops[i].departure % 1440;
      let diff = currentMinutes - scheduled;
      // Handle midnight wrap
      if (diff < -720) diff += 1440;
      if (diff > 720) diff -= 1440;
      return Math.max(0, diff);
    }
  }
  return 0;
}

export function StationTimeline({ stops, livePosition, delayMinutes }: Props) {
  const { colors } = useTheme();
  const states = resolveStopStates(stops, livePosition);
  const hasLive = livePosition != null && 'position' in livePosition;

  // Use provided delay, or estimate from live position
  const delay = delayMinutes ?? (hasLive ? estimateDelay(stops, states) : 0);
  const hasDelay = delay > 0;

  return (
    <View style={styles.container}>
      {stops.map((stop, i) => {
        const state = states[i];
        const isFirst = i === 0;
        const isLast = i === stops.length - 1;

        const dotColor =
          state === 'current' ? colors.success :
          state === 'approaching' ? colors.warning :
          state === 'passed' ? colors.primary :
          colors.border;

        const lineColor =
          state === 'passed' || state === 'current'
            ? colors.primary
            : colors.border;

        const nextState = i < stops.length - 1 ? states[i + 1] : null;
        const nextLineColor =
          nextState === 'passed' || nextState === 'current' || state === 'current'
            ? colors.primary
            : state === 'approaching' || nextState === 'approaching'
            ? colors.warning + '60'
            : colors.border;

        const textColor =
          state === 'passed' ? colors.textTertiary :
          state === 'current' || state === 'approaching' ? colors.text :
          colors.textSecondary;

        const isCurrent = state === 'current';
        const isApproaching = state === 'approaching';

        // Expected time for non-passed stops when delayed
        const isUpcoming = state !== 'passed';
        const expectedMinutes = stop.departure + delay;

        return (
          <View key={`${stop.station}-${i}`} style={styles.row}>
            {/* Scheduled time column */}
            <View style={styles.timeCol}>
              <Text
                style={[
                  styles.time,
                  {
                    color: isCurrent || isApproaching ? colors.text : colors.textTertiary,
                    fontWeight: isCurrent ? '700' : '400',
                    textDecorationLine: hasDelay && isUpcoming ? 'line-through' : 'none',
                  },
                ]}
              >
                {minutesToHHMM(stop.departure)}
              </Text>
            </View>

            {/* Timeline column: line + dot */}
            <View style={styles.dotCol}>
              {!isFirst && (
                <View style={[styles.lineSegment, { backgroundColor: lineColor }]} />
              )}
              <View
                style={[
                  isCurrent ? styles.dotOuter : styles.dotSmall,
                  {
                    backgroundColor: isCurrent ? dotColor + '20' : 'transparent',
                    borderColor: dotColor,
                  },
                ]}
              >
                {isCurrent && (
                  <View style={[styles.dotInner, { backgroundColor: dotColor }]} />
                )}
                {isApproaching && (
                  <View style={[styles.dotPulse, { backgroundColor: dotColor }]} />
                )}
              </View>
              {!isLast && (
                <View style={[styles.lineSegment, { backgroundColor: nextLineColor }]} />
              )}
            </View>

            {/* Station info column */}
            <View style={[styles.infoCol, { paddingVertical: isFirst || isLast ? 0 : 2 }]}>
              <View style={styles.stationRow}>
                <Text
                  style={[
                    styles.stationName,
                    {
                      color: textColor,
                      fontWeight: isCurrent || isApproaching ? '700' : isFirst || isLast ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {stop.station}
                </Text>
                {stop.platform ? (
                  <View style={[styles.pfBadge, { backgroundColor: colors.platformMuted }]}>
                    <Text style={[styles.pfText, { color: colors.platform }]}>
                      PF {stop.platform}
                    </Text>
                  </View>
                ) : null}
                {stop.side ? (
                  <View style={styles.sideRow}>
                    <Ionicons
                      name={stop.side === 'L' ? 'arrow-back' : 'arrow-forward'}
                      size={10}
                      color={colors.textTertiary}
                    />
                    <Text style={[styles.sideText, { color: colors.textTertiary }]}>
                      {stop.side === 'L' ? 'Left' : 'Right'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {hasLive && isCurrent && (
                <View style={[styles.statusBadge, { backgroundColor: colors.success + '18' }]}>
                  <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                  <Text style={[styles.statusText, { color: colors.success }]}>
                    Train is here
                  </Text>
                </View>
              )}
              {hasLive && isApproaching && (
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + '18' }]}>
                  <View style={[styles.statusDot, { backgroundColor: colors.warning }]} />
                  <Text style={[styles.statusText, { color: colors.warning }]}>
                    Approaching
                  </Text>
                </View>
              )}
            </View>

            {/* Expected time column — always shown */}
            <View style={styles.expectedCol}>
              <Text
                style={[
                  styles.expectedTime,
                  {
                    color: state === 'passed'
                      ? colors.textTertiary
                      : hasDelay
                        ? colors.danger
                        : isCurrent || isApproaching
                          ? colors.text
                          : colors.textSecondary,
                    fontWeight: isCurrent ? '700' : '400',
                  },
                ]}
              >
                {minutesToHHMM(hasDelay && isUpcoming ? expectedMinutes : stop.departure)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const DOT_SIZE = 14;
const DOT_OUTER = 22;
const LINE_WIDTH = 3;

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  timeCol: {
    width: 48,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  dotCol: {
    width: DOT_OUTER + 4,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  lineSegment: {
    flex: 1,
    width: LINE_WIDTH,
    borderRadius: LINE_WIDTH / 2,
  },
  dotSmall: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: LINE_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotOuter: {
    width: DOT_OUTER,
    height: DOT_OUTER,
    borderRadius: DOT_OUTER / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoCol: {
    flex: 1,
    paddingLeft: 8,
    justifyContent: 'center',
    gap: 3,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stationName: {
    fontSize: 14,
    flexShrink: 1,
  },
  pfBadge: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  pfText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sideText: {
    fontSize: 10,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  expectedCol: {
    width: 48,
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  expectedTime: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
});

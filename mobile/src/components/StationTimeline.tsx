import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from './Text';
import type { LiveTrainPosition, RouteStop } from '../api/types';
import { useTheme } from '../hooks/useTheme';
import { minutesToHHMM } from '../utils/time';

interface Props {
  stops: RouteStop[];
  livePosition: LiveTrainPosition | null;
  delayMinutes?: number;
}

type StopState = 'passed' | 'current' | 'approaching' | 'upcoming';

// Resolves each station in the route to a visual state based on live position data.
//
// The live position API returns two fields that drive the timeline:
//   - position.s:  the reference station name
//   - position.st: status code, "0" = at station, anything else = in transit
//
// When st is "0", the train is stopped at station s. Every station before s
// in the route is marked "passed", and s itself is marked "current".
//
// When st is NOT "0" (left, between, approaching), the train has already
// passed station s and is somewhere between s and the next station. In this
// case s and everything before it is "passed", and the station immediately
// after s is marked "approaching".
//
// The key insight: position.s always refers to the LAST station the train
// was at or passed, never the one it's heading toward. The backend sets s
// to the "from" station of the segment the GPS point projects onto.
function resolveStopStates(
  stops: RouteStop[],
  live: LiveTrainPosition | null,
): StopState[] {
  const states: StopState[] = stops.map(() => 'upcoming');
  if (!live || !('position' in live)) return states;

  const { position } = live;
  const liveStation = position.s?.toUpperCase();
  if (!liveStation) return states;

  // Find the index of the station the live position refers to
  let liveIdx = -1;
  for (let i = 0; i < stops.length; i++) {
    if (stops[i].station.toUpperCase() === liveStation) {
      liveIdx = i;
      break;
    }
  }
  if (liveIdx < 0) return states;

  if (position.st === '0') {
    // Train is at this station
    for (let i = 0; i < liveIdx; i++) states[i] = 'passed';
    states[liveIdx] = 'current';
  } else {
    // Train has passed station s. Mark it and everything before as passed,
    // and mark the next station as approaching
    for (let i = 0; i <= liveIdx; i++) states[i] = 'passed';
    if (liveIdx + 1 < stops.length) {
      states[liveIdx + 1] = 'approaching';
    }
  }

  return states;
}

export const StationTimeline = React.memo(function StationTimeline({ stops, livePosition, delayMinutes }: Props) {
  const { colors } = useTheme();
  const states = React.useMemo(
    () => resolveStopStates(stops, livePosition),
    [stops, livePosition],
  );
  const hasLive = livePosition != null && 'position' in livePosition;

  const delay = delayMinutes ?? 0;
  const hasDelay = delay !== 0;

  return (
    <View style={styles.container}>
      {stops.map((stop, i) => {
        const state = states[i];
        const isStop = stop.is_stop;
        const isFirst = i === 0;
        const isLast = i === stops.length - 1;

        const dotColor =
          state === 'current' ? colors.primary :
          state === 'approaching' ? colors.warning :
          state === 'passed' ? colors.primary :
          colors.border;

        // lineColor = segment ABOVE this dot (coming from the previous station)
        const lineColor =
          state === 'passed' || state === 'current'
            ? colors.primary
            : state === 'approaching'
              ? colors.warning + '60'
              : colors.border;

        // nextLineColor = segment BELOW this dot (going to the next station)
        const nextState = i < stops.length - 1 ? states[i + 1] : null;
        const nextLineColor =
          nextState === 'passed' || nextState === 'current'
            ? colors.primary
            : nextState === 'approaching'
              ? colors.warning + '60'
              : colors.border;

        const textColor =
          !isStop ? colors.textTertiary :
          state === 'passed' ? colors.textTertiary :
          state === 'current' || state === 'approaching' ? colors.text :
          colors.textSecondary;

        const isCurrent = state === 'current';
        const isApproaching = state === 'approaching';

        // Expected time for non-passed stops when delayed (only actual stops)
        const isUpcoming = state !== 'passed';
        const expectedMinutes = isStop && stop.departure ? stop.departure + delay : 0;

        // Pass-through stations get a compact row.
        // Use a single consistent line color through the whole row —
        // the "through" color is the more progressed of top/bottom.
        if (!isStop) {
          const throughColor =
            state === 'passed' || state === 'current'
              ? colors.primary
              : nextState === 'passed' || nextState === 'current'
                ? colors.primary
                : state === 'approaching'
                  ? colors.warning + '60'
                  : colors.border;

          return (
            <View key={`${stop.station}-${i}`} style={styles.passRow}>
              {/* Empty time column */}
              <View style={styles.timeCol} />

              {/* Timeline column: line + circled × */}
              <View style={styles.dotCol}>
                <View style={[styles.lineSegment, { backgroundColor: throughColor }]} />
                <View
                  style={[
                    styles.dotPassThrough,
                    {
                      borderColor: dotColor,
                      backgroundColor: dotColor + '18',
                    },
                  ]}
                >
                  <Text style={[styles.passThroughX, { color: dotColor }]}>
                    {'×'}
                  </Text>
                </View>
                {!isLast && (
                  <View style={[styles.lineSegment, { backgroundColor: throughColor }]} />
                )}
              </View>

              {/* Station name */}
              <View style={[styles.infoCol, { paddingVertical: 0 }]}>
                <Text
                  style={[styles.passThroughName, { color: textColor }]}
                  numberOfLines={1}
                >
                  {stop.station}
                </Text>
              </View>

              {/* Empty expected column */}
              <View style={styles.expectedCol} />
            </View>
          );
        }

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
                {stop.departure != null ? minutesToHHMM(stop.departure) : ''}
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

            {/* Expected time column (actual stops only) */}
            <View style={styles.expectedCol}>
              {stop.departure != null && (
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
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const DOT_SIZE = 14;
const DOT_OUTER = 22;
const PASS_DOT = 16;
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
  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
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
  dotPassThrough: {
    width: PASS_DOT,
    height: PASS_DOT,
    borderRadius: PASS_DOT / 2,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passThroughX: {
    fontSize: 8,
    fontWeight: '700',
    lineHeight: 10,
    textAlign: 'center',
  },
  passThroughName: {
    fontSize: 11,
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

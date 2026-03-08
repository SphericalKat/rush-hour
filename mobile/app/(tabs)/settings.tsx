import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchTimetableVersion } from '../../src/api/timetable';
import type { TimetableVersion } from '../../src/api/types';
import { useSettings } from '../../src/hooks/useSettings';
import { useTheme } from '../../src/hooks/useTheme';
import { shadow } from '../../src/theme';

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  children?: React.ReactNode;
}

function Row({ label, value, onPress, showChevron, destructive, children }: RowProps) {
  const { colors } = useTheme();
  const inner = (
    <View style={styles.row}>
      <Text
        style={[
          styles.rowLabel,
          {
            color: destructive ? colors.danger : colors.text,
          },
        ]}
      >
        {label}
      </Text>
      <View style={styles.rowRight}>
        {value ? (
          <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
            {value}
          </Text>
        ) : null}
        {children}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
          />
        )}
      </View>
    </View>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) =>
          pressed ? { opacity: 0.6 } : undefined
        }
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

export default function SettingsScreen() {
  const { colors, radius } = useTheme();
  const { settings, setDynamicColors } = useSettings();
  const insets = useSafeAreaInsets();
  const [version, setVersion] = useState<TimetableVersion | null>(null);
  const [checking, setChecking] = useState(false);

  const checkVersion = async () => {
    setChecking(true);
    try {
      const v = await fetchTimetableVersion();
      setVersion(v);
    } catch {
      // silently ignore if server is unreachable
    } finally {
      setChecking(false);
    }
  };

  function card(children: React.ReactNode) {
    return (
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
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.scroll,
        { paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.navHeader,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top,
          },
        ]}
      >
        <Text style={[styles.navTitle, { color: colors.text }]}>Settings</Text>
      </View>

      {/* Appearance section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        APPEARANCE
      </Text>
      {card(
        <Row label="Dynamic colors">
          <Switch
            value={settings.dynamicColors}
            onValueChange={setDynamicColors}
            trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
            thumbColor={settings.dynamicColors ? colors.textOnPrimary : colors.textTertiary}
          />
        </Row>,
      )}

      {/* Timetable section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        TIMETABLE
      </Text>
      {card(
        <>
          <Row
            label="Check for update"
            onPress={checkVersion}
            showChevron={!checking}
          >
            {checking && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </Row>
          {version && (
            <>
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.separator },
                ]}
              />
              <Row
                label="Hash"
                value={version.hash.slice(0, 12) + '…'}
              />
              <View
                style={[
                  styles.divider,
                  { backgroundColor: colors.separator },
                ]}
              />
              <Row
                label="Updated"
                value={new Date(version.updated_at).toLocaleDateString(
                  undefined,
                  { day: 'numeric', month: 'short', year: 'numeric' },
                )}
              />
            </>
          )}
        </>,
      )}

      {/* About section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        ABOUT
      </Text>
      {card(
        <>
          <Row
            label="Version"
            value={Constants.expoConfig?.version ?? '—'}
          />
          <View
            style={[styles.divider, { backgroundColor: colors.separator }]}
          />
          <Row
            label="Platform"
            value={`${Platform.OS} ${Platform.Version}`}
          />
        </>,
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    gap: 0,
  },
  navHeader: {
    paddingBottom: 8,
  },
  navTitle: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: Platform.OS === 'android' ? 12 : 6,
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16,
  },
});

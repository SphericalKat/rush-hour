import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReactNativeLegal } from 'react-native-legal';
import { fetchTimetableVersion } from '../../src/api/timetable';
import type { TimetableVersion } from '../../src/api/types';
import { useAppUpdate } from '../../src/hooks/useAppUpdate';
import { useSettings, DEFAULT_SERVER_URL, type ColorMode } from '../../src/hooks/useSettings';
import { useTheme } from '../../src/hooks/useTheme';
import { isGitHubDistribution } from '../../src/lib/updates';
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
  const { settings, setDynamicColors, setColorMode, setLiveDataEnabled, setServerUrl } = useSettings();
  const [serverUrlDraft, setServerUrlDraft] = useState(settings.serverUrl);
  const [serverSaved, setServerSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  useEffect(() => { setServerUrlDraft(settings.serverUrl); }, [settings.serverUrl]);
  useEffect(() => {
    return () => { if (savedTimerRef.current) clearTimeout(savedTimerRef.current); };
  }, []);

  const commitServerUrl = useCallback((url: string) => {
    setServerUrl(url);
    setServerSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setServerSaved(false), 2000);
  }, [setServerUrl]);
  const insets = useSafeAreaInsets();
  const [version, setVersion] = useState<TimetableVersion | null>(null);
  const [checking, setChecking] = useState(false);
  const { update, checkNow, checkingUpdate } = useAppUpdate();

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
        <>
          <Row label="Theme">
            <View style={[styles.segmented, { backgroundColor: colors.surfaceSecondary }]}>
              {(['auto', 'light', 'dark'] as ColorMode[]).map(mode => {
                const active = settings.colorMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => setColorMode(mode)}
                    style={[
                      styles.segmentedItem,
                      active && { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentedLabel,
                        { color: active ? colors.textOnPrimary : colors.textSecondary },
                      ]}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Row>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <Row label="Dynamic colors">
            <Switch
              value={settings.dynamicColors}
              onValueChange={setDynamicColors}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={settings.dynamicColors ? colors.textOnPrimary : colors.textTertiary}
            />
          </Row>
        </>,
      )}

      {/* Live data section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        LIVE DATA
      </Text>
      {card(
        <>
          <Row label="Enable live data">
            <Switch
              value={settings.liveDataEnabled}
              onValueChange={setLiveDataEnabled}
              trackColor={{ false: colors.surfaceSecondary, true: colors.primary }}
              thumbColor={settings.liveDataEnabled ? colors.textOnPrimary : colors.textTertiary}
            />
          </Row>
          {!settings.liveDataEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.separator }]} />
              <View style={styles.warningRow}>
                <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                  Live train positions, crowd reports, and delay updates require
                  a server connection. Timetable data will still work offline.
                </Text>
              </View>
            </>
          )}
          {settings.liveDataEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: colors.separator }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text }]}>
                  Server URL
                </Text>
              </View>
              <View style={styles.serverInputRow}>
                <View style={styles.serverInputContainer}>
                  <TextInput
                    style={[
                      styles.serverInput,
                      {
                        color: colors.text,
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: radius.md,
                      },
                    ]}
                    value={serverUrlDraft}
                    onChangeText={(text) => {
                      setServerUrlDraft(text);
                      setServerSaved(false);
                    }}
                    onSubmitEditing={() => commitServerUrl(serverUrlDraft)}
                    placeholder={DEFAULT_SERVER_URL}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    returnKeyType="done"
                  />
                  <Pressable
                    onPress={() => commitServerUrl(serverUrlDraft)}
                    style={({ pressed }) => [
                      styles.saveButton,
                      {
                        backgroundColor: serverSaved ? colors.primary : colors.surfaceSecondary,
                        borderRadius: radius.md,
                      },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={serverSaved ? colors.textOnPrimary : colors.textSecondary}
                    />
                  </Pressable>
                </View>
                {serverUrlDraft !== DEFAULT_SERVER_URL && (
                  <Pressable
                    onPress={() => {
                      setServerUrlDraft(DEFAULT_SERVER_URL);
                      commitServerUrl(DEFAULT_SERVER_URL);
                    }}
                    style={({ pressed }) => pressed ? { opacity: 0.6 } : undefined}
                  >
                    <Text style={[styles.resetText, { color: colors.primary }]}>
                      Reset to default
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </>,
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
          {isGitHubDistribution() && (
            <>
              <View
                style={[styles.divider, { backgroundColor: colors.separator }]}
              />
              {update ? (
                <Row
                  label={`Update to ${update.release.tag_name}`}
                  onPress={() => Linking.openURL(update.downloadUrl)}
                  showChevron
                />
              ) : (
                <Row
                  label="Check for app update"
                  onPress={checkNow}
                  showChevron={!checkingUpdate}
                >
                  {checkingUpdate && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </Row>
              )}
            </>
          )}
        </>,
      )}

      {/* Legal section */}
      <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
        LEGAL
      </Text>
      {card(
        <>
          <Row
            label="Privacy policy"
            onPress={() => Linking.openURL('https://rushhour.kat.cx/privacy')}
            showChevron
          />
          <View
            style={[styles.divider, { backgroundColor: colors.separator }]}
          />
          <Row
            label="Open source licenses"
            onPress={() => ReactNativeLegal.launchLicenseListScreen('Open Source Licenses')}
            showChevron
          />
          <View
            style={[styles.divider, { backgroundColor: colors.separator }]}
          />
          <Row
            label="Source"
            onPress={() => Linking.openURL('https://git.sr.ht/~sphericalkat/rush-hour')}
            showChevron
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
  segmented: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentedItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  segmentedLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  warningRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  serverInputRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  serverInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serverInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    padding: 10,
  },
  resetText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
  },
});

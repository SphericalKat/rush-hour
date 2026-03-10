import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import type { AppUpdate } from '../hooks/useAppUpdate';
import { Text } from './Text';

interface UpdateBannerProps {
  update: AppUpdate;
  onDismiss: () => void;
}

export function UpdateBanner({ update, onDismiss }: UpdateBannerProps) {
  const { colors, radius } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.primaryMuted,
          borderRadius: radius.md,
          borderColor: colors.primary + '40',
        },
      ]}
    >
      <Pressable
        style={styles.body}
        onPress={() => Linking.openURL(update.downloadUrl)}
      >
        <Ionicons name="download-outline" size={18} color={colors.primary} />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: colors.text }]}>
            {update.release.tag_name} available
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tap to download from GitHub
          </Text>
        </View>
      </Pressable>
      <Pressable onPress={onDismiss} hitSlop={8} style={styles.close}>
        <Ionicons name="close" size={16} color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  close: {
    padding: 10,
  },
});

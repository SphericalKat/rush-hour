import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme } from '../hooks/useTheme';
import type { SavedRoute } from '../hooks/useRouteHistory';

interface Props {
  route: SavedRoute;
  onPress: () => void;
  onLongPress?: () => void;
}

export const SavedRouteCard = React.memo(function SavedRouteCard({ route, onPress, onLongPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${route.sourceName} to ${route.destName}`}
      android_ripple={{ color: colors.textTertiary + '30', borderless: false, foreground: true }}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.row}>
        <Ionicons
          name={route.isFavorite ? 'heart' : 'time-outline'}
          size={16}
          color={route.isFavorite ? colors.danger : colors.textTertiary}
        />
        <Text style={[styles.route, { color: colors.text }]} numberOfLines={1}>
          {route.sourceName}
          <Text style={{ color: colors.textTertiary }}>{' \u2192 '}</Text>
          {route.destName}
        </Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    margin: 4
  },
  route: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
});

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../src/components/EmptyState';
import { LineChip } from '../../src/components/LineChip';
import { useFavorites, type FavoriteTrain } from '../../src/hooks/useFavorites';
import { useTheme } from '../../src/hooks/useTheme';

export default function FavoritesScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  const router = useRouter();
  const { favorites, toggle } = useFavorites();

  const showRemoveMenu = React.useCallback((item: FavoriteTrain) => {
    const action = () => toggle(item);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Remove from Favorites'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        idx => { if (idx === 1) action(); },
      );
    } else {
      Alert.alert(
        `${item.number} ${item.origin} \u2192 ${item.destination}`,
        undefined,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: action },
        ],
      );
    }
  }, [toggle]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? colors.surface : colors.primary,
            paddingTop: insets.top + 8,
          },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? colors.text : '#FFFFFF' }]}>
          Favorites
        </Text>
      </View>

      <FlatList
        data={favorites}
        keyExtractor={f => `${f.number}-${f.line}`}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        ListEmptyComponent={
          <EmptyState
            icon="❤️"
            title="No favorites yet"
            subtitle="Long-press a departure or tap the heart on a train to save it here."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/train/[number]',
                params: {
                  number: item.number,
                  origin: item.origin,
                  destination: item.destination,
                  line: item.line,
                },
              })
            }
            onLongPress={() => showRemoveMenu(item)}
            style={[styles.card, { backgroundColor: colors.surface }]}
          >
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <Text style={[styles.trainNumber, { color: colors.text }]}>
                  {item.number}
                </Text>
                <LineChip shortName={item.line} size="sm" />
              </View>
              <Text style={[styles.route, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.origin}
                <Text style={{ color: colors.textTertiary }}>{' \u2192 '}</Text>
                {item.destination}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trainNumber: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  route: {
    fontSize: 13,
    fontWeight: '500',
  },
});

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DepartureCard } from '../../src/components/DepartureCard';
import { EmptyState } from '../../src/components/EmptyState';
import type { Departure } from '../../src/api/types';
import { useFavorites, type FavoriteTrain } from '../../src/hooks/useFavorites';
import { useLiveTrains } from '../../src/hooks/useLiveTrains';
import { useTheme } from '../../src/hooks/useTheme';

function favToDeparture(fav: FavoriteTrain): Departure {
  return {
    number: fav.number,
    code: '',
    is_ac: fav.is_ac ?? false,
    is_fast: fav.is_fast ?? false,
    direction: '',
    line: fav.line,
    line_name: '',
    departure: fav.departure ?? -1,
    station: '',
    origin: fav.origin,
    destination: fav.destination,
    platform: '',
    runs_on: '',
    note: '',
  };
}

export default function FavoritesScreen() {
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  const router = useRouter();
  const { favorites, toggle } = useFavorites();
  const liveTrains = useLiveTrains();

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 8 }}
        ListEmptyComponent={
          <EmptyState
            icon="❤️"
            title="No favorites yet"
            subtitle="Long-press a departure or tap the heart on a train to save it here."
          />
        }
        renderItem={({ item }) => (
          <DepartureCard
            item={favToDeparture(item)}
            liveStatus={liveTrains[item.number]}
            hideCountdown
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
          />
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
});

import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/components/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionMenu, type ActionMenuItem } from '../../src/components/ActionMenu';
import { DepartureCard } from '../../src/components/DepartureCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SavedRouteCard } from '../../src/components/SavedRouteCard';
import type { Departure } from '../../src/api/types';
import { useFavorites, type FavoriteTrain } from '../../src/hooks/useFavorites';
import { useRouteHistory, setPendingRoute, type SavedRoute } from '../../src/hooks/useRouteHistory';
import { useLiveTrains } from '../../src/hooks/useLiveTrains';
import { useTheme } from '../../src/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function hapticLongPress() {
  if (Platform.OS === 'android') {
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press);
  } else {
    hapticLongPress();
  }
}

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
  const { favoriteRoutes, removeFavorite: removeRouteFav } = useRouteHistory();
  const liveTrains = useLiveTrains();

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuTitle, setMenuTitle] = useState<string | undefined>();
  const [menuItems, setMenuItems] = useState<ActionMenuItem[]>([]);

  const showRemoveMenu = React.useCallback((item: FavoriteTrain) => {
    hapticLongPress();
    setMenuTitle(`${item.number} ${item.origin} \u2192 ${item.destination}`);
    setMenuItems([{
      label: 'Remove from Favorites',
      icon: 'heart-dislike-outline',
      destructive: true,
      onPress: () => toggle(item),
    }]);
    setMenuVisible(true);
  }, [toggle]);

  const showRouteRemoveMenu = React.useCallback((item: SavedRoute) => {
    hapticLongPress();
    setMenuTitle(`${item.sourceName} \u2192 ${item.destName}`);
    setMenuItems([{
      label: 'Remove from Favorites',
      icon: 'heart-dislike-outline',
      destructive: true,
      onPress: () => removeRouteFav(item.sourceId, item.destId),
    }]);
    setMenuVisible(true);
  }, [removeRouteFav]);

  const hasAnything = favorites.length > 0 || favoriteRoutes.length > 0;

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

      {!hasAnything ? (
        <EmptyState
          icon="❤️"
          title="No favorites yet"
          subtitle="Long-press a departure or tap the heart icon to save trains and routes here."
        />
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16, paddingTop: 8 }}
          ListHeaderComponent={
            <>
              {favoriteRoutes.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                      Routes
                    </Text>
                  </View>
                  {favoriteRoutes.map(r => (
                    <SavedRouteCard
                      key={`${r.sourceId}-${r.destId}`}
                      route={r}
                      onPress={() => {
                        setPendingRoute({ sourceId: r.sourceId, sourceName: r.sourceName, destId: r.destId, destName: r.destName });
                        router.replace('/(tabs)');
                      }}
                      onLongPress={() => showRouteRemoveMenu(r)}
                    />
                  ))}
                </>
              )}
              {favorites.length > 0 && (
                <>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>
                      Trains
                    </Text>
                  </View>
                  {favorites.map(item => (
                    <DepartureCard
                      key={`${item.number}-${item.line}`}
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
                  ))}
                </>
              )}
            </>
          }
        />
      )}

      <ActionMenu
        visible={menuVisible}
        title={menuTitle}
        items={menuItems}
        onClose={() => setMenuVisible(false)}
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 6,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

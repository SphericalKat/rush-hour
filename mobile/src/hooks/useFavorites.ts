import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rush_hour_favorites';

export interface FavoriteTrain {
  number: string;
  line: string;
  origin: string;
  destination: string;
  is_fast?: boolean;
  is_ac?: boolean;
  departure?: number; // minutes from midnight
}

let memoryCache: FavoriteTrain[] | null = null;

async function loadFavorites(): Promise<FavoriteTrain[]> {
  if (memoryCache) return memoryCache;
  try {
    const raw = Platform.OS === 'web'
      ? null
      : await SecureStore.getItemAsync(STORAGE_KEY);
    memoryCache = raw ? JSON.parse(raw) : [];
  } catch {
    memoryCache = [];
  }
  return memoryCache!;
}

async function saveFavorites(favs: FavoriteTrain[]) {
  memoryCache = favs;
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(favs));
  }
}

// global listeners so multiple hook instances stay in sync
const listeners = new Set<(favs: FavoriteTrain[]) => void>();

function notify(favs: FavoriteTrain[]) {
  listeners.forEach(fn => fn(favs));
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteTrain[]>(memoryCache ?? []);

  useEffect(() => {
    loadFavorites().then(setFavorites);
    listeners.add(setFavorites);
    return () => { listeners.delete(setFavorites); };
  }, []);

  const isFavorite = useCallback(
    (trainNumber: string, line: string) =>
      favorites.some(f => f.number === trainNumber && f.line === line),
    [favorites],
  );

  const toggle = useCallback(
    async (train: FavoriteTrain) => {
      const favs = await loadFavorites();
      const idx = favs.findIndex(f => f.number === train.number && f.line === train.line);
      const next = idx >= 0
        ? favs.filter((_, i) => i !== idx)
        : [...favs, train];
      await saveFavorites(next);
      notify(next);
    },
    [],
  );

  return { favorites, isFavorite, toggle };
}

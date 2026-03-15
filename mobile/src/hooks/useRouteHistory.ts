import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const STORAGE_KEY = 'rush_hour_route_history';

export interface SavedRoute {
  sourceId: number;
  sourceName: string;
  destId: number;
  destName: string;
  count: number;
  lastSearched: number; // unix ms
  isFavorite: boolean;
}

let memoryCache: SavedRoute[] | null = null;

async function load(): Promise<SavedRoute[]> {
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

async function save(routes: SavedRoute[]) {
  memoryCache = routes;
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(routes));
  }
}

const listeners = new Set<(routes: SavedRoute[]) => void>();

function notify(routes: SavedRoute[]) {
  listeners.forEach(fn => fn(routes));
}

// Pending route selection from other tabs (e.g. favorites -> home)
type PendingRoute = { sourceId: number; sourceName: string; destId: number; destName: string } | null;
const pendingListeners = new Set<(r: PendingRoute) => void>();
let pendingRoute: PendingRoute = null;

export function setPendingRoute(r: PendingRoute) {
  pendingRoute = r;
  pendingListeners.forEach(fn => fn(r));
}

export function usePendingRoute() {
  const [route, setRoute] = useState<PendingRoute>(pendingRoute);

  useEffect(() => {
    pendingListeners.add(setRoute);
    return () => { pendingListeners.delete(setRoute); };
  }, []);

  const consume = useCallback(() => {
    pendingRoute = null;
    // Don't notify others, just clear it
  }, []);

  return { pendingRoute: route, consumePendingRoute: consume };
}

export function useRouteHistory() {
  const [routes, setRoutes] = useState<SavedRoute[]>(memoryCache ?? []);

  useEffect(() => {
    load().then(setRoutes);
    listeners.add(setRoutes);
    return () => { listeners.delete(setRoutes); };
  }, []);

  const record = useCallback(
    async (sourceId: number, sourceName: string, destId: number, destName: string) => {
      const all = await load();
      const idx = all.findIndex(r => r.sourceId === sourceId && r.destId === destId);
      let next: SavedRoute[];
      if (idx >= 0) {
        next = [...all];
        next[idx] = { ...next[idx], count: next[idx].count + 1, lastSearched: Date.now(), sourceName, destName };
      } else {
        next = [...all, { sourceId, sourceName, destId, destName, count: 1, lastSearched: Date.now(), isFavorite: false }];
      }
      await save(next);
      notify(next);
    },
    [],
  );

  const toggleFavorite = useCallback(
    async (sourceId: number, destId: number) => {
      const all = await load();
      const idx = all.findIndex(r => r.sourceId === sourceId && r.destId === destId);
      if (idx < 0) return;
      const next = [...all];
      next[idx] = { ...next[idx], isFavorite: !next[idx].isFavorite };
      await save(next);
      notify(next);
    },
    [],
  );

  // Add a route as favorite even if it hasn't been searched yet
  const addFavorite = useCallback(
    async (sourceId: number, sourceName: string, destId: number, destName: string) => {
      const all = await load();
      const idx = all.findIndex(r => r.sourceId === sourceId && r.destId === destId);
      let next: SavedRoute[];
      if (idx >= 0) {
        next = [...all];
        next[idx] = { ...next[idx], isFavorite: true };
      } else {
        next = [...all, { sourceId, sourceName, destId, destName, count: 0, lastSearched: Date.now(), isFavorite: true }];
      }
      await save(next);
      notify(next);
    },
    [],
  );

  const removeFavorite = useCallback(
    async (sourceId: number, destId: number) => {
      const all = await load();
      const idx = all.findIndex(r => r.sourceId === sourceId && r.destId === destId);
      if (idx < 0) return;
      const next = [...all];
      // If never searched organically, remove entirely; otherwise just unfavorite
      if (next[idx].count === 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], isFavorite: false };
      }
      await save(next);
      notify(next);
    },
    [],
  );

  const isRouteFavorite = useCallback(
    (sourceId: number, destId: number) =>
      routes.some(r => r.sourceId === sourceId && r.destId === destId && r.isFavorite),
    [routes],
  );

  // Top routes: favorites first, then by search count
  const topRoutes = routes
    .filter(r => r.isFavorite || r.count >= 1)
    .sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      return b.count - a.count;
    })
    .slice(0, 10);

  const favoriteRoutes = routes.filter(r => r.isFavorite);

  return { routes, topRoutes, favoriteRoutes, record, toggleFavorite, addFavorite, removeFavorite, isRouteFavorite };
}

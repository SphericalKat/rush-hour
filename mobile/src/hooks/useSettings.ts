import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'rush_hour_settings';

export type ColorMode = 'auto' | 'light' | 'dark';

interface Settings {
  dynamicColors: boolean;
  colorMode: ColorMode;
}

const defaults: Settings = { dynamicColors: true, colorMode: 'auto' };

let cache: Settings | null = null;

async function load(): Promise<Settings> {
  if (cache) return cache;
  try {
    const raw = Platform.OS === 'web'
      ? null
      : await SecureStore.getItemAsync(KEY);
    cache = raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults };
  } catch {
    cache = { ...defaults };
  }
  return cache!;
}

async function save(s: Settings) {
  cache = s;
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(KEY, JSON.stringify(s));
  }
  notify(s);
}

const listeners = new Set<(s: Settings) => void>();

function notify(s: Settings) {
  listeners.forEach(fn => fn(s));
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(cache ?? defaults);

  useEffect(() => {
    load().then(setSettings);
    listeners.add(setSettings);
    return () => { listeners.delete(setSettings); };
  }, []);

  const setDynamicColors = async (enabled: boolean) => {
    const current = await load();
    await save({ ...current, dynamicColors: enabled });
  };

  const setColorMode = async (mode: ColorMode) => {
    const current = await load();
    await save({ ...current, colorMode: mode });
  };

  return { settings, setDynamicColors, setColorMode };
}

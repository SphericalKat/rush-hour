import { DEFAULT_SERVER_URL } from '../hooks/useSettings';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SETTINGS_KEY = 'rush_hour_settings';

async function getServerUrl(): Promise<string> {
  try {
    const raw = Platform.OS === 'web'
      ? null
      : await SecureStore.getItemAsync(SETTINGS_KEY);
    if (raw) {
      const settings = JSON.parse(raw);
      if (settings.serverUrl) return settings.serverUrl;
    }
  } catch {}
  return process.env['EXPO_PUBLIC_API_URL'] ?? DEFAULT_SERVER_URL;
}

export function getWsUrl(baseUrl: string): string {
  return baseUrl.replace(/^http/, 'ws') + '/ws';
}

export async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const baseUrl = await getServerUrl();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}
